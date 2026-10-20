import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getPredictions } from "../api";

export default function Trends() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const SEVERITY_VALUES = {
    "Good": 1,
    "Satisfactory": 2,
    "Moderate": 3,
    "Poor": 4,
    "Very Poor": 5,
    "Severe": 6,
    "Unhealthy for Sensitive Groups": 3,
    "Unhealthy": 4,
    "Very Unhealthy": 5
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const result = await getPredictions(cityFilter, categoryFilter);
        // Format for Recharts
        const chartData = result.map(r => ({
          ...r,
          date: new Date(r.created_at).toLocaleDateString(),
          severityValue: SEVERITY_VALUES[r.predicted_category] || 0
        })).reverse(); // chronological order
        setData(chartData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [cityFilter, categoryFilter]);

  return (
    <div style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
      <h1 style={{ fontFamily: "var(--grotesk)" }}>Prediction Trends</h1>
      <p style={{ color: "color-mix(in srgb, var(--ink) 70%, var(--paper))", marginBottom: "2rem" }}>
        View historical AQI predictions across different cities and severities.
      </p>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
        <input 
          type="text" 
          placeholder="Filter by city..."
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          style={{ padding: "0.5rem", border: "1px solid var(--signal)", borderRadius: "4px", background: "var(--paper)", fontFamily: "var(--mono)" }}
        />
        <select 
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-[#0e131f] text-white border border-white/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#00E5B0] cursor-pointer"
        >
          <option value="" className="bg-[#0e131f] text-white py-2">All Categories</option>
          {Object.keys(SEVERITY_VALUES).map(cat => (
            <option key={cat} value={cat} className="bg-[#0e131f] text-white py-2">{cat}</option>
          ))}
        </select>
      </div>

      <div style={{ background: "var(--paper)", padding: "1.5rem", borderRadius: "4px", height: "400px", width: "100%" }}>
        {loading ? (
          <div style={{ color: "var(--ink)" }}>Loading chart data...</div>
        ) : data.length === 0 ? (
          <div style={{ color: "var(--ink)" }}>No predictions found for this filter.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="color-mix(in srgb, var(--ink) 10%, transparent)" />
              <XAxis dataKey="date" tick={{ fill: "var(--ink)", fontFamily: "var(--mono)", fontSize: 12 }} />
              <YAxis 
                domain={[0, 6]}
                ticks={[1, 2, 3, 4, 5, 6]} 
                tickFormatter={(val) => Object.keys(SEVERITY_VALUES).find(k => SEVERITY_VALUES[k] === val) || ""}
                tick={{ fill: "var(--ink)", fontFamily: "var(--mono)", fontSize: 10 }}
                width={120}
              />
              <Tooltip 
                contentStyle={{ background: "var(--ink)", color: "var(--paper)", border: "none", borderRadius: "4px", fontFamily: "var(--mono)" }}
                formatter={(val, name, props) => [props.payload.predicted_category, "Category"]}
              />
              <Line type="monotone" dataKey="severityValue" stroke="var(--signal)" strokeWidth={2} dot={{ r: 4, fill: "var(--signal)" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      
      <div style={{ marginTop: "3rem", background: "var(--paper)", padding: "1.5rem", borderRadius: "4px" }}>
        <h2 style={{ fontFamily: "var(--grotesk)", fontSize: "1.25rem", margin: "0 0 1rem", color: "var(--ink)" }}>Recent Records</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--body)", color: "var(--ink)" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid color-mix(in srgb, var(--ink) 20%, transparent)", textAlign: "left" }}>
              <th style={{ padding: "0.5rem" }}>Date</th>
              <th style={{ padding: "0.5rem" }}>City</th>
              <th style={{ padding: "0.5rem" }}>Category</th>
              <th style={{ padding: "0.5rem" }}>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {data.slice().reverse().map(item => (
              <tr key={item.id} style={{ borderBottom: "1px solid color-mix(in srgb, var(--ink) 10%, transparent)" }}>
                <td style={{ padding: "0.75rem 0.5rem", fontFamily: "var(--mono)", fontSize: "0.9rem" }}>{new Date(item.created_at).toLocaleString()}</td>
                <td style={{ padding: "0.75rem 0.5rem" }}>{item.city || "Unknown"}</td>
                <td style={{ padding: "0.75rem 0.5rem", fontWeight: "600" }}>{item.predicted_category}</td>
                <td style={{ padding: "0.75rem 0.5rem", fontFamily: "var(--mono)" }}>{(item.confidence * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
