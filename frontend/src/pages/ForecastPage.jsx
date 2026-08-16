import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, Sliders, RefreshCw, Zap } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { getForecast } from '../api';

const LINE_COLORS = {
  co: '#38bdf8',
  no2: '#a78bfa',
  pm10: '#fb923c',
  pm25: '#f472b6',
  so2: '#00E5B0',
};

const DEFAULT_INPUT = {
  base_aqi: 82, base_pm25: 45, base_pm10: 75, base_no2: 30, base_o3: 38,
  pm25_modifier: 0, pm10_modifier: 0,
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#07090e]/95 backdrop-blur-xl border border-white/10 p-3 rounded-xl shadow-2xl">
      <p className="text-white font-bold text-xs mb-2 font-mono">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 text-[11px] py-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-400 font-mono uppercase">{p.dataKey}:</span>
          <span className="text-white font-bold font-mono">{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function ForecastPage() {
  const [inputs, setInputs] = useState(DEFAULT_INPUT);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const runForecast = async (params = inputs) => {
    setLoading(true);
    try {
      const result = await getForecast(params);
      setData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { runForecast(); }, []);

  const handleSliderChange = (key, val) => {
    const updated = { ...inputs, [key]: Number(val) };
    setInputs(updated);
    runForecast(updated);
  };

  return (
    <div className="min-h-screen bg-[#07090e] pt-[72px]">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white font-heading mb-1">
            24H Forecast <span className="text-[#00E5B0]">Engine</span>
          </h1>
          <p className="text-gray-400 text-xs">Projected 24-hour pollutant trajectory & counterfactual AI policy simulator.</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">

          {/* Controls Panel */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1 space-y-4">

            {/* Base sliders */}
            <div className="glass-card p-5">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#00E5B0]" /> Initial Inputs
              </h3>
              <div className="space-y-3.5">
                {[
                  { key: 'base_aqi', label: 'Base AQI', min: 0, max: 300 },
                  { key: 'base_pm25', label: 'PM2.5 (µg/m³)', min: 0, max: 200 },
                  { key: 'base_pm10', label: 'PM10 (µg/m³)', min: 0, max: 300 },
                  { key: 'base_no2', label: 'NO2 (µg/m³)', min: 0, max: 200 },
                ].map(({ key, label, min, max }) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">{label}</span>
                      <span className="text-white font-bold font-mono">{inputs[key]}</span>
                    </div>
                    <input
                      type="range" min={min} max={max} value={inputs[key]}
                      onChange={e => handleSliderChange(key, e.target.value)}
                      className="w-full accent-[#00E5B0] h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Counterfactual Simulator Card (Figure 4) */}
            <div className="glass-card p-5 border border-cyan-500/20 bg-cyan-500/5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#00FFC6]" /> Counterfactual What-If Simulator
                </h3>
              </div>
              <p className="text-[11px] text-gray-400 mb-4">Test predictive resilience against emission shifts.</p>

              <div className="space-y-4">
                {[
                  { key: 'pm25_modifier', label: 'PM2.5 Modification' },
                  { key: 'pm10_modifier', label: 'PM10 Modification' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-300 font-medium">{label}</span>
                      <span className={`font-mono font-bold ${inputs[key] > 0 ? 'text-red-400' : inputs[key] < 0 ? 'text-[#00E5B0]' : 'text-gray-400'}`}>
                        {inputs[key] > 0 ? '+' : ''}{inputs[key]}%
                      </span>
                    </div>
                    <input
                      type="range" min={-50} max={50} value={inputs[key]}
                      onChange={e => handleSliderChange(key, e.target.value)}
                      className="w-full accent-[#00FFC6] h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>

          </motion.div>

          {/* Main Chart Panel (Matching Figure 4) */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-3">

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white font-heading">24-Hour AI Simulation Forecast</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Projected trajectory based on current multi-modal input</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#00E5B0]/10 border border-[#00E5B0]/30 text-xs text-[#00E5B0] font-medium font-mono">
                  24H FORECAST ENGINE
                </div>
              </div>

              {loading ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-[#00E5B0] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : data ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.forecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="hour" tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} interval={2} />
                      <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend formatter={(v) => <span className="text-xs font-mono text-gray-300 uppercase">{v}</span>} />
                      {Object.entries(LINE_COLORS).map(([key, color]) => (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          stroke={color}
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ r: 5, fill: color, strokeWidth: 0 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : null}
            </div>

          </motion.div>

        </div>

      </div>
    </div>
  );
}
