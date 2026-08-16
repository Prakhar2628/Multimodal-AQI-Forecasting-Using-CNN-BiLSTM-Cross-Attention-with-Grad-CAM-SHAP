import { useState } from "react";
import { Link } from "react-router-dom";
import { predictAQI } from "../api";
import PredictResultCard from "../components/PredictResultCard";

export default function Predict() {
  const [image, setImage] = useState(null);
  const [city, setCity] = useState("Delhi");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      setError("Please select an image");
      return;
    }
    
    setError("");
    setLoading(true);
    
    try {
      // Mocking 14-day readings for the demo as requested in the prompt
      const mockReadings = Array(14).fill(0).map((_, i) => ({
        date: new Date(Date.now() - (13 - i) * 86400000).toISOString().split('T')[0],
        pm25: 45 + Math.random() * 20,
        pm10: 60 + Math.random() * 20,
        no2: 20 + Math.random() * 10,
        so2: 10 + Math.random() * 5,
        co: 1 + Math.random(),
        o3: 30 + Math.random() * 10
      }));

      const formData = new FormData();
      formData.append("image", image);
      formData.append("readings", JSON.stringify(mockReadings));
      formData.append("city", city);

      const data = await predictAQI(formData);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontFamily: "var(--grotesk)" }}>Predict AQI</h1>
      <p style={{ color: "color-mix(in srgb, var(--ink) 70%, var(--paper))" }}>
        Upload an environmental photo and use recent pollutant readings to predict the Air Quality Index.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", margin: "2rem 0" }}>
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontFamily: "var(--mono)", fontSize: "0.8rem" }}>City Name</label>
          <input 
            type="text" 
            value={city} 
            onChange={(e) => setCity(e.target.value)} 
            style={{ padding: "0.5rem", width: "100%", maxWidth: "300px", border: "1px solid var(--signal)", borderRadius: "4px", background: "var(--paper)" }}
          />
        </div>
        
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontFamily: "var(--mono)", fontSize: "0.8rem" }}>Environmental Photo</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={(e) => setImage(e.target.files[0])} 
            style={{ padding: "1rem", border: "1px dashed var(--signal)", width: "100%", borderRadius: "4px", background: "color-mix(in srgb, var(--paper) 10%, transparent)" }}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ padding: "0.75rem 1.5rem", background: "var(--signal)", color: "white", border: "none", borderRadius: "4px", fontWeight: "600", cursor: "pointer", width: "fit-content" }}
        >
          {loading ? "Analyzing..." : "Predict AQI"}
        </button>
      </form>

      {error && <div style={{ color: "#C2483D", padding: "1rem", background: "rgba(194, 72, 61, 0.1)", borderRadius: "4px" }}>{error}</div>}

      {result && (
        <div style={{ marginTop: "3rem" }}>
          <PredictResultCard result={result} />
          
          <div style={{ marginTop: "1rem", textAlign: "right" }}>
            <Link to={`/explain/${result.id}`} style={{ color: "var(--signal)", textDecoration: "none", fontFamily: "var(--mono)", fontSize: "0.9rem" }}>
              Why this result? &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
