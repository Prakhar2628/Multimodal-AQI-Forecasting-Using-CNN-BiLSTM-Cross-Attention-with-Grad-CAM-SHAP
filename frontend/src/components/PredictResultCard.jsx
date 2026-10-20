import { useMemo } from "react";
import "../styles/result-card.css";

const SEVERITY = [
  { key: "Good", color: "#22c55e", range: "0–50" },
  { key: "Satisfactory", color: "#84cc16", range: "51–100" },
  { key: "Moderate", color: "#eab308", range: "101–200" },
  { key: "Poor", color: "#f97316", range: "201–300" },
  { key: "Very Poor", color: "#ef4444", range: "301–400" },
  { key: "Severe", color: "#991b1b", range: "401–500+" },
];

export default function PredictResultCard({ result }) {
  // result: { predicted_category, confidence, all_probabilities, health_advisory, weather }
  const bandIndex = useMemo(
    () => SEVERITY.findIndex((s) => s.key === result.predicted_category),
    [result.predicted_category]
  );
  
  // fallback if not found
  const index = bandIndex === -1 ? 0 : bandIndex;
  const bandColor = SEVERITY[index]?.color ?? "#4CAF6D";
  const hazeBlur = 2 + index * 3; // thicker haze for worse categories, 2px..17px

  return (
    <div
      className="result-card"
      style={{
        "--band-color": bandColor,
        "--haze-blur": `${hazeBlur}px`,
      }}
    >
      <div className="result-card__scrim" aria-hidden="true" />

      <div className="result-card__header">
        <span className="result-card__eyebrow">Predicted category</span>
        <h2 className="result-card__category">{result.predicted_category}</h2>
        <span className="result-card__confidence">
          {(result.confidence * 100).toFixed(1)}% confidence
        </span>
      </div>

      <div className="haze-scale" role="img" aria-label={`AQI severity: ${result.predicted_category}`}>
        {SEVERITY.map((band, i) => (
          <div
            key={band.key}
            className={`haze-scale__segment ${i === index ? "is-active" : ""}`}
            style={{ background: band.color }}
          />
        ))}
        <div
          className="haze-scale__marker"
          style={{ left: `${((index + 0.5) / SEVERITY.length) * 100}%` }}
        />
      </div>

      {result.health_advisory && (
        <dl className="result-card__advisory">
          <div>
            <dt>Outdoor exercise</dt>
            <dd>{result.health_advisory.outdoor_exercise}</dd>
          </div>
          <div>
            <dt>Mask guidance</dt>
            <dd>{result.health_advisory.mask}</dd>
          </div>
          <div>
            <dt>Children</dt>
            <dd>{result.health_advisory.children}</dd>
          </div>
        </dl>
      )}

      {result.weather && (
        <p className="result-card__weather-note">
          {result.weather.description} · {result.weather.temperature_c}°C ·{" "}
          {result.weather.humidity_pct}% humidity
        </p>
      )}
    </div>
  );
}
