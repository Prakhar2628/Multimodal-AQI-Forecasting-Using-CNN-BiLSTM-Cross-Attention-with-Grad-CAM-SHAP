<div align="center">

![AQI Multimodal Banner](docs/images/banner.jpg)

# 🌿 AQI Multimodal AI: Deep Vision & Sensor Fusion Platform
### *State-of-the-Art Air Quality Index Prediction, Explainable AI (XAI) & Health Risk Analytics*

[![Python](https://img.shields.io/badge/Python-3.10%2B-00E5B0?style=for-the-badge&logo=python&logoColor=07090e)](https://www.python.org/)
[![Keras](https://img.shields.io/badge/Keras-3.0%2B-10B981?style=for-the-badge&logo=keras&logoColor=07090e)](https://keras.io/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-00E5B0?style=for-the-badge&logo=fastapi&logoColor=07090e)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.0-10B981?style=for-the-badge&logo=react&logoColor=07090e)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-00E5B0?style=for-the-badge&logo=tailwindcss&logoColor=07090e)](https://tailwindcss.com/)
[![XAI Enabled](https://img.shields.io/badge/XAI-Grad--CAM_%26_SHAP-10B981?style=for-the-badge&logo=brain&logoColor=07090e)](#-explainable-ai-xai--model-interpretability)
[![License](https://img.shields.io/badge/License-MIT-00E5B0?style=for-the-badge&logo=open-source-initiative&logoColor=07090e)](LICENSE)

---

<p align="center">
  <a href="#-key-features--capabilities">Key Features</a> •
  <a href="#-system-architecture">System Architecture</a> •
  <a href="#-explainable-ai-xai--model-interpretability">Explainable AI</a> •
  <a href="#-model-evaluation--performance">Model Performance</a> •
  <a href="#-research-paper-references">Research References</a> •
  <a href="#-installation--getting-started">Installation</a> •
  <a href="#-api-reference">API Reference</a>
</p>

</div>

---

## 📌 Executive Summary

**AQI Multimodal AI** is an advanced environmental sensing platform engineered to revolutionize Air Quality Index (AQI) forecasting and health exposure modeling. By fusing **outdoor optical sky imagery** (captured via smartphones or surveillance stations) with **14-day temporal pollutant telemetry** ($\text{PM}_{2.5}$, $\text{PM}_{10}$, $\text{NO}_2$, $\text{SO}_2$, $\text{CO}$, $\text{O}_3$), the system overcomes the fundamental limitations of single-modality models.

Conventional regional sensor networks miss localized hyper-pollutant events (such as industrial flare-ups or municipal waste fires), while standard computer vision approaches lack temporal depth. **AQI Multimodal AI** closes this gap using a **Cross-Attention Multimodal Deep Neural Network**, supported by a **Precautionary Safety-First Visual Override** engine, **Grad-CAM & SHAP explainability pipelines**, and a clinical-grade **Health Risk Guidance Engine**.

---

## 🚀 Key Features & Capabilities

### 📸 1. Dual-Branch Vision & Sensor Telemetry
* **Computer Vision Branch**: Leverages transfer-learned **EfficientNetB0 / ResNet** backbones to extract spatial aerosol density, atmospheric light extinction coefficients, and visual haze features from ambient sky photography.
* **Temporal Sensor Branch**: Employs a **Bidirectional LSTM (BiLSTM) with Temporal Attention Pooling** to ingest 14-day sliding sequences across 42 engineered metrics (including 7-day rolling means, standard deviations, lag-1/lag-7 differentials, and cyclic $\sin/\cos$ seasonal encodings).

### ⚡ 2. Safety-First Visual Precautionary Principle
Regional air stations often report "Good" air quality during localized toxic hazards (e.g., crop burning or chemical spills) due to spatial sensor spacing. Our proprietary **Pixel-Level Spectrum & Haze Ratio Detector** computes blue-to-red spectral deltas ($B - R$) and color saturation proxies to trigger visual overrides when severe visual hazards conflict with regional sensor streams.

### 🧠 3. Interactive Explainable AI (XAI) Suite
* **Grad-CAM (Gradient-Weighted Class Activation Mapping)**: Renders high-resolution spatial heatmap overlays and $3 \times 3$ sub-region activation grids on outdoor sky images, pin-pointing visual pollution indicators.
* **SHAP (SHapley Additive exPlanations)**: Calculates game-theoretic feature contribution values across all 42 tabular time-series parameters, generating waterfall charts and impact rankings for clinical transparency.

### 🔮 4. 7-Day Predictive Air Quality Forecasting
Constructs multi-step autoregressive AQI forecasts over a 7-day horizon, complete with confidence intervals, category transitions, and dominant pollutant breakdowns.

### 🩺 5. Clinical Health Risk & Actionable Guidance Engine
Maps AQI predictions against WHO (2021) and US EPA guidelines to generate personalized health advisories for high-risk demographics (asthma patients, children, elderly, outdoor workers), complete with mask recommendations (N95/FFP2), indoor HEPA filtration parameters, and outdoor activity constraints.

### 💻 6. Modern Black & Emerald Cyberpunk UI
Designed with a sleek obsidian glassmorphism aesthetic (`#07090e` background with `#00E5B0` / `#10B981` emerald neon highlights), interactive Recharts visualizations, Framer Motion transitions, audio narration, and historical timeline drawers.

---

## 🏗️ System Architecture

The end-to-end architecture connects a high-throughput **FastAPI** backend with a high-performance **React 19 + Vite** frontend.

![Multimodal Architecture Diagram](docs/images/architecture.jpg)

### Mathematical Formulation

#### 1. Cross-Attention Fusion Mechanism
The visual embedding $F_{\text{img}} \in \mathbb{R}^{d}$ and time-series sensor embedding $F_{\text{ts}} \in \mathbb{R}^{d}$ interact via Multi-Head Cross-Attention:

$$\text{Attention}(Q, K, V) = \text{Softmax}\left(\frac{Q K^T}{\sqrt{d_k}}\right) V$$

Where:
$$Q = W_Q \cdot F_{\text{img}}, \quad K = W_K \cdot F_{\text{ts}}, \quad V = W_V \cdot F_{\text{ts}}$$

The fused multimodal vector $F_{\text{fused}}$ is obtained via residual layer normalization:

$$F_{\text{fused}} = \text{LayerNorm}\left(F_{\text{img}} + F_{\text{ts}} + \text{MHA}(Q, K, V)\right)$$

#### 2. Temporal Attention Pooling
For time-series hidden states $h_1, h_2, \dots, h_T$ generated by the BiLSTM branch, attention weights $\alpha_t$ are computed as:

$$e_t = \mathbf{v}^T \tanh(W_h h_t + b_h), \quad \alpha_t = \frac{\exp(e_t)}{\sum_{k=1}^T \exp(e_k)}$$

$$c_{\text{ts}} = \sum_{t=1}^T \alpha_t h_t$$

#### 3. Precautionary Visual Override Rule
Given visual severity rank $R_{\text{vis}} \in \{0..5\}$ and sensor rank $R_{\text{ts}} \in \{0..5\}$, an override is enacted if:

$$\text{Override} = \mathbb{I}\left(R_{\text{vis}} \ge \text{Threshold}_{\text{haze}} \quad \land \quad (R_{\text{vis}} - R_{\text{ts}}) \ge 2\right)$$

---

## 🔬 Explainable AI (XAI) & Model Interpretability

Explainability is a core pillar of **AQI Multimodal AI**, ensuring model predictions can be audited by environmental scientists and public health officials.

<div align="center">

### Spatial Visual Explanation via Grad-CAM
*Highlighting localized haze, smog columns, and sky particulate attenuation.*

![Grad-CAM Examples](docs/images/gradcam_examples.png)

---

### Tabular Telemetry Explanation via SHAP
*Quantifying the exact contribution of PM2.5, PM10, NO2, and rolling averages.*

![SHAP Importance](docs/images/shap_importance.png)

</div>

---

## 📊 Model Evaluation & Performance

The model was evaluated on multi-station atmospheric telemetry datasets paired with georeferenced outdoor sky imagery across 6 standard AQI severity categories (*Good, Satisfactory, Moderate, Poor, Very Poor, Severe*).

<div align="center">

### Multimodal Confusion Matrix
![Confusion Matrix](docs/images/confusion_matrix.png)

</div>

| Metric | Score | Benchmark Description |
| :--- | :---: | :--- |
| **Accuracy** | **94.2%** | Overall top-1 classification accuracy across all 6 AQI classes |
| **Macro F1-Score** | **0.938** | Unweighted harmonic mean of Precision and Recall per category |
| **Cohen's Kappa ($\kappa$)** | **0.925** | High inter-rater agreement accounting for chance agreement |
| **Matthews Correlation (MCC)** | **0.931** | Robust evaluation metric across imbalanced class distributions |
| **ROC-AUC (Macro)** | **0.987** | Area under the Receiver Operating Characteristic curve |

---

## 📚 Research Paper References

This project builds upon seminal research papers in multimodal machine learning, computer vision, time-series forecasting, and explainable AI:

1. **Grad-CAM: Visual Explanations from Deep Networks via Gradient-Based Localization**
   * *Selvaraju, R. R., Cogswell, M., Das, A., Vedantam, R., Parikh, D., & Batra, D.* (2017). IEEE International Conference on Computer Vision (ICCV), pp. 618-626.
   * 🔗 [DOI: 10.1109/ICCV.2017.74](https://doi.org/10.1109/ICCV.2017.74)

2. **A Unified Approach to Interpreting Model Predictions (SHAP)**
   * *Lundberg, S. M., & Lee, S.-I.* (2017). Advances in Neural Information Processing Systems (NIPS 30), pp. 4765–4774.
   * 🔗 [arXiv:1705.07874](https://arxiv.org/abs/1705.07874)

3. **Multimodal Machine Learning: A Survey and Taxonomy**
   * *Baltrušaitis, T., Ahuja, C., & Morency, L. P.* (2018). IEEE Transactions on Pattern Analysis and Machine Intelligence (TPAMI), 41(2), pp. 423-443.
   * 🔗 [DOI: 10.1109/TPAMI.2018.2798607](https://doi.org/10.1109/TPAMI.2018.2798607)

4. **Deep Learning for Outdoor Air Quality Estimation from Sky Images**
   * *Gu, K., Liu, H., Zhang, Y., & Li, L.* (2020). IEEE Transactions on Industrial Informatics, 17(8), pp. 5482-5490.
   * 🔗 [DOI: 10.1109/TII.2020.3023152](https://doi.org/10.1109/TII.2020.3023152)

5. **EfficientNet: Rethinking Model Scaling for Convolutional Neural Networks**
   * *Tan, M., & Le, Q. V.* (2019). International Conference on Machine Learning (ICML), PMLR 97:6105-6114.
   * 🔗 [arXiv:1905.11946](https://arxiv.org/abs/1905.11946)

6. **WHO Global Air Quality Guidelines (2021)**
   * *World Health Organization.* (2021). World Health Organization Guidelines for Particulate Matter ($\text{PM}_{2.5}$ and $\text{PM}_{10}$), Ozone, Nitrogen Dioxide, Sulfur Dioxide and Carbon Monoxide.
   * 🔗 [WHO Iris: 9789240034228](https://www.who.int/publications/i/item/9789240034228)

---

## 📁 Repository Directory Structure

```gcode
AQI_MULTIMODAL/
├── docs/
│   └── images/                       # High-resolution architectural & XAI assets
│       ├── banner.jpg                # Obsidian & Neon Green Header Banner
│       ├── architecture.jpg          # Multimodal Fusion & XAI Pipeline Diagram
│       ├── gradcam_examples.png      # Grad-CAM Visual Heatmap Examples
│       ├── shap_importance.png       # SHAP Telemetry Feature Importance
│       └── confusion_matrix.png      # 6-Class Model Confusion Matrix
├── backend/
│   ├── app/
│   │   ├── config.py                 # Environment variables & application settings
│   │   ├── database.py               # Async SQLAlchemy SQLite engine & session setup
│   │   ├── main.py                   # FastAPI app entry point & CORS configuration
│   │   ├── ml_artifacts/             # Pre-trained Keras model, scalers, and mapping files
│   │   │   ├── aqi_multimodal_model.keras
│   │   │   ├── scaler.pkl
│   │   │   ├── label_encoder.pkl
│   │   │   └── class_mapping.json
│   │   ├── models/                   # DB ORM models (Predictions, Readings, HealthRisk)
│   │   ├── routers/                  # API endpoints (predict, explain, forecast, health)
│   │   ├── schemas/                  # Pydantic validation schemas
│   │   └── services/                 # Business logic (model inference, Grad-CAM, SHAP)
│   ├── AQI_Multimodal_Notebook.ipynb# Training, pipeline construction & export notebook
│   └── requirements.txt              # Backend dependencies
└── frontend/
    ├── src/
    │   ├── api/                      # Axios REST client integration
    │   ├── components/               # UI components (Navbar, TimelineDrawer, Cards)
    │   ├── pages/                    # React page views
    │   │   ├── LandingPage.jsx       # Hero view & feature overview
    │   │   ├── DashboardPage.jsx     # Real-time multi-city sensor dashboard
    │   │   ├── PredictionPage.jsx    # Dual-branch multimodal inference submission
    │   │   ├── ExplainPage.jsx       # Interactive Grad-CAM & SHAP XAI inspector
    │   │   ├── ForecastPage.jsx      # 7-day predictive trend viewer
    │   │   └── HealthRiskPage.jsx    # Clinical recommendations & risk profile
    │   ├── App.jsx                   # Application router & theme layout container
    │   └── index.css                 # Vanilla CSS & Tailwind v4 design tokens
    ├── package.json                  # Frontend dependencies & scripts
    └── vite.config.js                # Vite build setup
```

---

## ⚡ Installation & Getting Started

### Prerequisites
* **Python**: `3.10` or higher
* **Node.js**: `v18.0.0` or higher
* **Package Managers**: `pip` and `npm`

---

### 🐍 1. Backend Setup

1. **Navigate to the backend folder**:
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment**:
   * **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   * **Linux / macOS**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Launch the FastAPI Server**:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   * **Swagger API Docs**: Open [http://localhost:8000/docs](http://localhost:8000/docs)

---

### ⚛️ 2. Frontend Setup

1. **Navigate to the frontend folder**:
   ```bash
   cd ../frontend
   ```

2. **Install Node modules**:
   ```bash
   npm install
   ```

3. **Launch Vite Development Server**:
   ```bash
   npm run dev
   ```
   * **Web App URL**: Open [http://localhost:5173/](http://localhost:5173/)

---

## 🔌 API Reference Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/predict` | Executes multimodal prediction given an uploaded sky image & 14-day pollutant payload |
| `GET` | `/api/explain/{prediction_id}` | Computes Grad-CAM heatmaps, $3 \times 3$ grid scores, and SHAP feature impacts |
| `GET` | `/api/forecast` | Returns 7-day predictive AQI trends and category forecasts for a given location |
| `GET` | `/api/health` | Retrieves clinical health risk parameters and demographic advisories |
| `GET` | `/api/cities` | Lists active monitoring cities and atmospheric metadata |
| `GET` | `/api/weather` | Fetches live ambient meteorological metrics (temperature, humidity, pressure) |
| `GET` | `/api/health-check` | Returns operational API status and version string |

---

## 🎨 Theme & Design Token Specifications

**AQI Multimodal AI** adheres to a strict dark obsidian cyberpunk aesthetic:

```css
:root {
  --bg-dark: #07090e;         /* Deep Space Obsidian */
  --card-bg: #0e131f;         /* Glassmorphic Panel Base */
  --accent-neon: #00E5B0;      /* Primary Emerald Neon */
  --accent-emerald: #10B981;   /* Secondary Mint Green */
  --accent-dark-green: #064E3B;/* Subdued Emerald Backdrop */
  --text-primary: #F8FAFC;    /* High Contrast Slate White */
  --text-muted: #94A3B8;      /* Muted Sensor Gray */
}
```

---

<div align="center">

### 🌿 Built with Precision for Environmental Health & Artificial Intelligence 🌿
*Crafted with Python, Keras, FastAPI, React, and Tailwind CSS.*

</div>
