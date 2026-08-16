import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getExplanationUrls, getStaticImageUrl } from "../api";

export default function Explain() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getExplanationUrls(id);
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) return <div style={{ padding: "2rem" }}>Loading explanations...</div>;
  if (error) return <div style={{ padding: "2rem", color: "#C2483D" }}>{error}</div>;

  return (
    <div style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
      <Link to="/" style={{ color: "color-mix(in srgb, var(--ink) 60%, transparent)", textDecoration: "none", fontFamily: "var(--mono)", fontSize: "0.85rem" }}>
        &larr; Back to Predict
      </Link>
      
      <h1 style={{ fontFamily: "var(--grotesk)", marginTop: "1.5rem" }}>Model Explanation</h1>
      <p style={{ color: "color-mix(in srgb, var(--ink) 70%, var(--paper))", marginBottom: "3rem" }}>
        Our multimodal model uses both the uploaded image and the 14-day pollutant timeseries. Here is how it weighed the features.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
        {/* Grad-CAM */}
        <div style={{ background: "var(--paper)", padding: "1.5rem", borderRadius: "4px" }}>
          <h2 style={{ fontFamily: "var(--grotesk)", fontSize: "1.25rem", margin: "0 0 0.5rem", color: "var(--ink)" }}>Spatial Attention (Grad-CAM)</h2>
          <p style={{ fontFamily: "var(--body)", fontSize: "0.9rem", color: "color-mix(in srgb, var(--ink) 70%, transparent)", marginBottom: "1.5rem" }}>
            Highlights the regions in the image that most heavily influenced the model's prediction. Warmer colors indicate higher importance.
          </p>
          {data?.gradcam_url && (
            <img 
              src={getStaticImageUrl(data.gradcam_url)} 
              alt="Grad-CAM heatmap" 
              style={{ width: "100%", borderRadius: "4px", border: "1px solid color-mix(in srgb, var(--ink) 12%, transparent)" }}
            />
          )}
        </div>

        {/* SHAP */}
        <div style={{ background: "var(--paper)", padding: "1.5rem", borderRadius: "4px" }}>
          <h2 style={{ fontFamily: "var(--grotesk)", fontSize: "1.25rem", margin: "0 0 0.5rem", color: "var(--ink)" }}>Timeseries Importance (SHAP)</h2>
          <p style={{ fontFamily: "var(--body)", fontSize: "0.9rem", color: "color-mix(in srgb, var(--ink) 70%, transparent)", marginBottom: "1.5rem" }}>
            A global summary of which pollutant features (PM2.5, NO2, etc.) generally drive the model's predictions across all categories.
          </p>
          {data?.shap_url && (
            <img 
              src={getStaticImageUrl(data.shap_url)} 
              alt="SHAP feature importance" 
              style={{ width: "100%", borderRadius: "4px", border: "1px solid color-mix(in srgb, var(--ink) 12%, transparent)", background: "#fff" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
