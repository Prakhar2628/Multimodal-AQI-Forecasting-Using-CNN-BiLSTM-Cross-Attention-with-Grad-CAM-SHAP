"""
model_service.py

Loads the trained AQI multimodal model + its artifacts once at startup,
and exposes two prediction paths:

  - predict_image_only(image_bytes)
        Use when you have a photo but no (or insufficient) sensor history.
        The model was explicitly trained with modality dropout (35% of
        training steps had timeseries zeroed out), so this is a genuinely
        supported inference mode, not a hack — image-only test accuracy
        was 79.7%.

  - predict_full(image_bytes, pollutant_history)
        Use when you have >= SEQ_LEN + 7 days of daily pollutant readings
        for the relevant city/station, so the same rolling/lag features
        used in training can be reconstructed. Falls back to image-only
        behavior automatically if history is too short.

Drop this file into backend/app/services/model_service.py and point
ARTIFACTS_DIR at wherever you copied the four files from
aqi_model_artifacts/ (aqi_multimodal_model.keras, scaler.pkl,
label_encoder.pkl, class_mapping.json).
"""

import io
import json
import os
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd
import tensorflow as tf
from PIL import Image
from tensorflow.keras import layers
from tensorflow.keras.applications.efficientnet import preprocess_input as effnet_preprocess
from tensorflow.keras.saving import register_keras_serializable

# ---------------------------------------------------------------------------
# Custom layers — MUST be defined/imported before load_model() runs, or Keras
# can't resolve them from the registry even though they were registered with
# @register_keras_serializable at save time. Copied verbatim from the
# training notebook — do not let these drift out of sync with training.
# ---------------------------------------------------------------------------

@register_keras_serializable(package="AQIModel")
class AttentionPool(layers.Layer):
    def __init__(self, units, **kwargs):
        super().__init__(**kwargs)
        self.units = units
        self.score_dense = layers.Dense(units, activation="tanh")
        self.score_out = layers.Dense(1)

    def call(self, x):
        scores = self.score_out(self.score_dense(x))
        weights = tf.nn.softmax(scores, axis=1)
        context = tf.reduce_sum(weights * x, axis=1)
        return context, weights

    def get_config(self):
        config = super().get_config()
        config.update({"units": self.units})
        return config


@register_keras_serializable(package="AQIModel")
class CrossAttentionFusion(layers.Layer):
    def __init__(self, dim=256, num_heads=4, **kwargs):
        super().__init__(**kwargs)
        self.dim = dim
        self.num_heads = num_heads
        self.mha = layers.MultiHeadAttention(num_heads=num_heads, key_dim=dim // num_heads)
        self.norm = layers.LayerNormalization()

    def call(self, img_feat, ts_feat):
        img_seq = tf.expand_dims(img_feat, axis=1)
        ts_seq = tf.expand_dims(ts_feat, axis=1)
        attn_out = self.mha(query=img_seq, key=ts_seq, value=ts_seq)
        fused = self.norm(attn_out[:, 0, :] + img_feat + ts_feat)
        return fused

    def get_config(self):
        config = super().get_config()
        config.update({"dim": self.dim, "num_heads": self.num_heads})
        return config


# ---------------------------------------------------------------------------
# Config — MUST match the values used at training time exactly.
# ---------------------------------------------------------------------------

IMG_SIZE = 128
SEQ_LEN = 14
POLLUTANT_COLS = ["pm25", "pm10", "no2", "so2", "co", "o3"]
# Order matters — must match TS_FEATURE_COLS from the training notebook
# (pollutants, then per-pollutant rolling/lag/diff, then cyclical time features).
ENGINEERED_SUFFIXES = ["_roll_mean_7", "_roll_std_7", "_lag_1", "_lag_7", "_diff_1"]
TIME_FEATURE_COLS = ["month_sin", "month_cos", "dow_sin", "dow_cos", "is_weekend"]

HEALTH_RISK_MAP = {
    "Good": {"risk": "Minimal", "asthma_risk": "Low", "outdoor_exercise": "Safe",
             "mask": "Not required", "children": "No restrictions"},
    "Satisfactory": {"risk": "Low", "asthma_risk": "Low-Moderate", "outdoor_exercise": "Generally safe",
                      "mask": "Not required", "children": "No restrictions"},
    "Moderate": {"risk": "Moderate", "asthma_risk": "Moderate", "outdoor_exercise": "Reduce prolonged exertion",
                 "mask": "Optional for sensitive groups", "children": "Limit prolonged outdoor play"},
    "Poor": {"risk": "High", "asthma_risk": "High", "outdoor_exercise": "Avoid prolonged/heavy exertion",
             "mask": "N95 recommended outdoors", "children": "Limit outdoor activity"},
    "Very Poor": {"risk": "Very High", "asthma_risk": "Very High", "outdoor_exercise": "Avoid outdoor exercise",
                  "mask": "N95 strongly recommended", "children": "Stay indoors where possible"},
    "Severe": {"risk": "Severe / Emergency", "asthma_risk": "Extreme", "outdoor_exercise": "Avoid",
               "mask": "N95 mandatory outdoors", "children": "Stay indoors"},
}


class AQIModelService:
    """Singleton-style service — instantiate once at app startup and reuse."""

    def __init__(self, artifacts_dir: str):
        artifacts_dir = Path(artifacts_dir)

        model_path = artifacts_dir / "aqi_multimodal_model.keras"
        scaler_path = artifacts_dir / "scaler.pkl"
        label_encoder_path = artifacts_dir / "label_encoder.pkl"
        class_mapping_path = artifacts_dir / "class_mapping.json"

        for p in [model_path, scaler_path, label_encoder_path]:
            if not p.exists():
                raise FileNotFoundError(f"Missing required artifact: {p}")

        # compile=False: we only need forward inference, and skipping compile
        # avoids having to also re-register the custom focal loss function.
        self.model = tf.keras.models.load_model(model_path, compile=False)
        self.scaler = joblib.load(scaler_path)
        self.label_encoder = joblib.load(label_encoder_path)

        if class_mapping_path.exists():
            with open(class_mapping_path) as f:
                self.class_mapping = json.load(f)
        else:
            self.class_mapping = {i: c for i, c in enumerate(self.label_encoder.classes_)}

        self.ts_feature_cols = self._expected_feature_cols()
        n_expected = self.model.input_shape[1][-1]  # ts_input branch feature dim
        if len(self.ts_feature_cols) != n_expected:
            raise ValueError(
                f"Feature column count mismatch: built {len(self.ts_feature_cols)} columns "
                f"but model expects {n_expected}. Check ENGINEERED_SUFFIXES / POLLUTANT_COLS "
                f"against the training notebook's final TS_FEATURE_COLS."
            )

    @staticmethod
    def _expected_feature_cols():
        cols = list(POLLUTANT_COLS)
        for p in POLLUTANT_COLS:
            for suf in ENGINEERED_SUFFIXES:
                cols.append(f"{p}{suf}")
        cols += TIME_FEATURE_COLS
        return cols

    # -- image preprocessing -------------------------------------------------

    def _load_image(self, image_bytes: bytes) -> np.ndarray:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize((IMG_SIZE, IMG_SIZE))
        arr = np.asarray(img).astype(np.float32)
        return effnet_preprocess(arr)[None, ...]  # add batch dim

    # -- feature engineering for a real pollutant history --------------------

    def _build_ts_window(self, pollutant_history: pd.DataFrame) -> Optional[np.ndarray]:
        """
        pollutant_history: DataFrame with columns ['date'] + POLLUTANT_COLS,
        one row per day, sorted ascending, for a SINGLE city/station.
        Needs >= SEQ_LEN + 7 rows so lag_7 / roll_mean_7 are valid for the
        entire final SEQ_LEN-day window (matches how training built windows).

        Returns shape (1, SEQ_LEN, n_features) scaled, or None if there
        isn't enough history — caller should fall back to image-only.
        """
        df = pollutant_history.copy().sort_values("date").reset_index(drop=True)
        if len(df) < SEQ_LEN + 7:
            return None

        for c in POLLUTANT_COLS:
            df[f"{c}_roll_mean_7"] = df[c].rolling(7, min_periods=1).mean()
            df[f"{c}_roll_std_7"] = df[c].rolling(7, min_periods=1).std().fillna(0)
            df[f"{c}_lag_1"] = df[c].shift(1).fillna(df[c])
            df[f"{c}_lag_7"] = df[c].shift(7).fillna(df[c])
            df[f"{c}_diff_1"] = df[c].diff().fillna(0)

        df["date"] = pd.to_datetime(df["date"])
        df["day_of_week"] = df["date"].dt.dayofweek
        df["month"] = df["date"].dt.month
        df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)
        df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12)
        df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12)
        df["dow_sin"] = np.sin(2 * np.pi * df["day_of_week"] / 7)
        df["dow_cos"] = np.cos(2 * np.pi * df["day_of_week"] / 7)

        window = df.iloc[-SEQ_LEN:][self.ts_feature_cols].values  # (SEQ_LEN, n_features)
        window_scaled = self.scaler.transform(window)
        return window_scaled[None, ...].astype(np.float32)

    # -- prediction ------------------------------------------------------------

    def _format_result(self, probs: np.ndarray) -> dict:
        class_idx = int(np.argmax(probs))
        category = str(self.class_mapping.get(class_idx, self.class_mapping.get(str(class_idx))))
        confidence = float(probs[class_idx])
        return {
            "aqi_category": category,
            "confidence": round(confidence, 4),
            "probabilities": {
                str(self.class_mapping.get(i, self.class_mapping.get(str(i)))): round(float(p), 4)
                for i, p in enumerate(probs)
            },
            **HEALTH_RISK_MAP.get(category, HEALTH_RISK_MAP["Moderate"]),
        }

    def predict_image_only(self, image_bytes: bytes) -> dict:
        img_input = self._load_image(image_bytes)
        ts_input = np.zeros((1, SEQ_LEN, len(self.ts_feature_cols)), dtype=np.float32)
        probs = self.model.predict([img_input, ts_input], verbose=0)[0]
        result = self._format_result(probs)
        result["mode"] = "image_only"
        return result

    def predict_full(self, image_bytes: bytes, pollutant_history: pd.DataFrame) -> dict:
        img_input = self._load_image(image_bytes)
        ts_input = self._build_ts_window(pollutant_history)
        if ts_input is None:
            result = self.predict_image_only(image_bytes)
            result["mode"] = "image_only_fallback"
            result["note"] = (
                f"Fell back to image-only: need >= {SEQ_LEN + 7} days of history, "
                f"got {len(pollutant_history)}."
            )
            return result
        probs = self.model.predict([img_input, ts_input], verbose=0)[0]
        result = self._format_result(probs)
        result["mode"] = "multimodal"
        return result
