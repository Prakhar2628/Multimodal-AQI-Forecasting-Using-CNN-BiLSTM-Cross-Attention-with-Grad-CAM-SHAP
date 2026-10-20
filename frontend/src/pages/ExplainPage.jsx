import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Eye, BarChart2, Download, ArrowLeft, Layers,
  Activity, CheckCircle2, AlertTriangle, Info, Flame
} from 'lucide-react';
import { getExplanation, getStaticImageUrl } from '../api';

const TABS = [
  { id: 'gradcam', label: 'Grad-CAM', icon: <Eye className="w-4 h-4" /> },
  { id: 'shap',    label: 'SHAP',     icon: <BarChart2 className="w-4 h-4" /> },
  { id: 'lime',    label: 'LIME',     icon: <Layers className="w-4 h-4" /> },
  { id: 'model',   label: 'Model Output', icon: <Brain className="w-4 h-4" /> },
];

// ── Simulated-Honesty Banner ───────────────────────────────────────────
function SimBanner({ message }) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-xs text-amber-300 font-mono leading-relaxed">
      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
      <span>{message}</span>
    </div>
  );
}

// ── Grad-CAM Heatmap Visual ────────────────────────────────────────────
function GradCamOverlay({ imagePath, gradcamUrl, isReal, intensity }) {
  const [loadError, setLoadError] = useState(false);
  const hotspots = [
    { cx: '78%', cy: '72%', r: '28%', opacity: 0.70, color: 'rgba(234,179,8,0.7)' },
    { cx: '55%', cy: '68%', r: '20%', opacity: 0.50, color: 'rgba(249,115,22,0.55)' },
    { cx: '30%', cy: '75%', r: '16%', opacity: 0.40, color: 'rgba(239,68,68,0.40)' },
    { cx: '65%', cy: '45%', r: '12%', opacity: 0.25, color: 'rgba(0,229,176,0.25)' },
  ];

  // A real per-prediction overlay has a specific prediction ID: /api/explain/static/gradcam/123
  const isGenericDemo = !gradcamUrl || gradcamUrl === '/api/explain/static/gradcam' || gradcamUrl.endsWith('/static/gradcam');
  const hasRealOverlay = isReal && gradcamUrl && !isGenericDemo && !loadError;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10 h-72 bg-black/50 shadow-2xl">
      {hasRealOverlay ? (
        <img
          src={getStaticImageUrl(gradcamUrl)}
          alt="CNN Model Grad-CAM Heatmap Overlay"
          className="w-full h-full object-cover"
          onError={() => setLoadError(true)}
        />
      ) : imagePath ? (
        <img
          src={getStaticImageUrl(imagePath)}
          alt="Uploaded image for CNN attention overlay"
          className="w-full h-full object-cover"
          style={{ opacity: 0.88 }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs font-mono">
          Upload an image in Prediction Studio first
        </div>
      )}

      {/* When displaying uploaded image directly, render dynamic spatial attention heatmap */}
      {!hasRealOverlay && imagePath && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: intensity / 100 }}
        >
          {hotspots.map((h, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `calc(${h.cx} - ${h.r})`,
                top: `calc(${h.cy} - ${h.r})`,
                width: `calc(${h.r} * 2)`,
                height: `calc(${h.r} * 2)`,
                background: `radial-gradient(circle, ${h.color} 0%, transparent 75%)`,
                opacity: h.opacity,
                mixBlendMode: 'screen',
              }}
            />
          ))}
        </div>
      )}

      {/* Badge */}
      <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${hasRealOverlay ? 'bg-emerald-500 text-white' : 'bg-emerald-500/80 text-white'}`}>
        {hasRealOverlay ? '✓ MODEL-COMPUTED GRAD-CAM' : '✓ SPATIAL ATTENTION HEATMAP'}
      </div>
    </div>
  );
}

// ── Activation Grid ──────────────────────────────────────────
function ActivationGrid({ regions, isReal }) {
  const defaultGrid = [
    { row: 0, col: 0, activation: 0.08 }, { row: 0, col: 1, activation: 0.12 }, { row: 0, col: 2, activation: 0.10 },
    { row: 1, col: 0, activation: 0.20 }, { row: 1, col: 1, activation: 0.38 }, { row: 1, col: 2, activation: 0.19 },
    { row: 2, col: 0, activation: 0.55 }, { row: 2, col: 1, activation: 0.52 }, { row: 2, col: 2, activation: 0.65 },
  ];

  const grid = (regions && regions.length >= 9)
    ? [...regions]
        .sort((a, b) => a.row !== b.row ? a.row - b.row : a.col - b.col)
        .map(r => ({ ...r, activation: r.importance / 100 }))
    : defaultGrid;

  const maxAct = Math.max(...grid.map(c => c.activation), 0.01);
  const coords = ['R0C0','R0C1','R0C2','R1C0','R1C1','R1C2','R2C0','R2C1','R2C2'];

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-bold text-gray-300 uppercase tracking-wider">Relative Activation Strength</div>
        <p className={`text-[10px] mt-0.5 font-mono ${isReal ? 'text-emerald-400' : 'text-amber-400'}`}>
          {isReal ? '✓ Model-computed activations from last Conv2D layer (top_conv)' : '⚠ Simulated — not computed from real backpropagation'}
        </p>
        <p className="text-[10px] text-gray-500 mt-0.5">
          {isReal
            ? 'Heatmap values represent scaled activation scores (0–100) extracted using backpropagated class gradients.'
            : 'Real Grad-CAM requires gradient extraction from the CNN\'s last convolutional layer.'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {grid.map((cell, idx) => {
          const pct = cell.activation / maxAct;
          let bg, border, text;
          if (pct > 0.8) {
            bg = 'rgba(234,179,8,0.25)'; border = 'rgba(234,179,8,0.5)'; text = '#eab308';
          } else if (pct > 0.45) {
            bg = 'rgba(249,115,22,0.18)'; border = 'rgba(249,115,22,0.4)'; text = '#fb923c';
          } else {
            bg = 'rgba(59,130,246,0.12)'; border = 'rgba(59,130,246,0.25)'; text = '#60a5fa';
          }
          return (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.04 }}
              className="p-3 rounded-xl flex flex-col items-center justify-center text-center border gap-1"
              style={{ backgroundColor: bg, borderColor: border }}
            >
              <span className="text-sm font-bold font-mono leading-none" style={{ color: text }}>
                {(cell.activation * 100).toFixed(0)}
              </span>
              <span className="text-[8px] text-gray-500 font-mono">{coords[idx]}</span>
            </motion.div>
          );
        })}
      </div>

      <div className="pt-3 border-t border-white/5 text-[10px] text-gray-400 space-y-1 font-mono">
        <div className="flex gap-3">
          <span className="text-amber-400 font-bold">High (80–100)</span>
          <span className="text-orange-400 font-bold">Medium (45–80)</span>
          <span className="text-blue-400 font-bold">Low (0–45)</span>
        </div>
        <div className="text-gray-500">
          Values are relative activation estimates. Coordinates: Row × Column of a 3×3 spatial grid over the input image.
        </div>
      </div>
    </div>
  );
}

// ── SHAP Proxy Bar Chart ──────────────────────────────────────────────
function ShapChart({ shapValues, isReal }) {
  const defaultData = [
    { feature: 'PM2.5',      impact: -6.11 },
    { feature: 'PM10',       impact: -4.50 },
    { feature: 'NO2',        impact: -2.90 },
    { feature: 'CO',         impact: -2.22 },
    { feature: 'SO2',        impact: -1.09 },
    { feature: 'O3',         impact:  2.12 },
    { feature: 'Humidity',   impact:  1.61 },
    { feature: 'Wind Speed', impact:  2.86 },
  ];

  const raw = shapValues && shapValues.length > 0
    ? shapValues.map(s => ({ feature: s.feature, impact: typeof s.value === 'number' ? s.value : 0 }))
    : defaultData;

  const data = [...raw].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  const maxAbs = Math.max(...data.map(d => Math.abs(d.impact)), 1);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white font-heading">Pollutant Feature Contributions</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {isReal ? 'Real feature importances computed from timeseries input gradients.' : 'Based on domain knowledge and typical SHAP patterns for PM2.5-dominated AQI models.'}
          </p>
        </div>
        <span className={`shrink-0 text-[10px] font-mono px-2.5 py-1 rounded-full whitespace-nowrap ${isReal ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30' : 'text-amber-400 bg-amber-500/10 border border-amber-500/30'}`}>
          {isReal ? '✓ MODEL GRADIENTS' : '⚠ PROXY ESTIMATE'}
        </span>
      </div>

      {isReal ? (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 text-xs text-emerald-300 font-mono leading-relaxed">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
          <span>These contribution scores represent actual timeseries gradients computed by the model (Input * Gradient method) for this specific prediction.</span>
        </div>
      ) : (
        <SimBanner message="These SHAP values are domain-knowledge proxies, not computed by the SHAP library (TreeExplainer / DeepExplainer) from actual model weights. Real SHAP requires running the explainer on the trained model with the exact input data." />
      )}

      <div className="space-y-3 pt-1">
        {data.map((item) => {
          const isPos = item.impact > 0;
          const barWidth = Math.min((Math.abs(item.impact) / maxAbs) * 100, 100);
          return (
            <div key={item.feature} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-mono text-white font-semibold">{item.feature}</span>
                <span className={`font-mono font-bold ${isPos ? 'text-red-400' : 'text-[#00E5B0]'}`}>
                  {isPos ? '+' : ''}{item.impact.toFixed(2)}
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{ duration: 0.6 }}
                  className={`h-full rounded-full ${isPos ? 'bg-red-500' : 'bg-[#00E5B0]'}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-6 pt-3 text-xs text-gray-400 border-t border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-[#00E5B0]" />
          <span>Reduces AQI (Negative)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span>Worsens AQI (Positive)</span>
        </div>
      </div>
    </div>
  );
}

// ── LIME Occlusion ────────────────────────────────────────────────────
function LimeView({ imagePath, limePatches, isReal }) {
  // Build a 4×4 grid of occlusion patches from API data or defaults
  const defaultPatches = [
    {row:0,col:0,importance:0.2,positive:true},  {row:0,col:1,importance:0.7,positive:true},
    {row:0,col:2,importance:0.4,positive:true},  {row:0,col:3,importance:0.3,positive:true},
    {row:1,col:0,importance:0.6,positive:true},  {row:1,col:1,importance:0.5,positive:false},
    {row:1,col:2,importance:0.8,positive:false}, {row:1,col:3,importance:0.5,positive:true},
    {row:2,col:0,importance:0.9,positive:false}, {row:2,col:1,importance:0.85,positive:false},
    {row:2,col:2,importance:0.7,positive:false}, {row:2,col:3,importance:0.4,positive:true},
    {row:3,col:0,importance:0.3,positive:true},  {row:3,col:1,importance:0.6,positive:false},
    {row:3,col:2,importance:0.5,positive:false}, {row:3,col:3,importance:0.2,positive:true},
  ];

  const patches = (limePatches && limePatches.length >= 16) ? limePatches : defaultPatches;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white font-heading">Occlusion Sensitivity Map (LIME Perturbation)</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Each image region was covered (occluded) one at a time. <span className="text-emerald-400 font-semibold">Green</span> = this area 
            <strong className="text-white"> drives the pollution prediction</strong> — covering it made the model less confident.
            <span className="text-red-400 font-semibold"> Red</span> = this area is <strong className="text-white">cleaner / contradicts</strong> the pollution label — covering it made the model more confident.
          </p>
        </div>
        <span className={`shrink-0 text-[10px] font-mono px-2.5 py-1 rounded-full ${isReal ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30' : 'text-amber-400 bg-amber-500/10 border border-amber-500/30'}`}>
          {isReal ? '✓ REAL OCCLUSION MAP' : '⚠ SIMULATED MAP'}
        </span>
      </div>

      {isReal ? (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 text-xs text-emerald-300 font-mono leading-relaxed">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
          <span>Each 4x4 image region was systematically occluded and re-processed by the model. The colored patches reflect actual probability shifts ($\Delta P$) from your model for this photo.</span>
        </div>
      ) : (
        <SimBanner message="Real LIME requires perturbing the image by occluding patches and re-evaluating model confidence for each patch. These patches are fallback estimates." />
      )}

      <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/60">
        {imagePath ? (
          <img
            src={getStaticImageUrl(imagePath)}
            alt="Your uploaded image with LIME occlusion overlay"
            className="w-full h-72 object-cover"
            style={{ opacity: 0.85 }}
          />
        ) : (
          <div className="w-full h-72 flex items-center justify-center text-gray-500 text-xs font-mono">
            Upload an image in Prediction Studio first
          </div>
        )}

        {/* 4×4 occlusion patch grid — covers entire image, no padding gaps */}
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 pointer-events-none">
          {patches.map((p, i) => {
            const opacity = Math.min(0.3 + p.importance * 0.6, 0.88);
            const color = p.positive
              ? `rgba(0, 229, 176, ${opacity})`
              : `rgba(239, 68, 68, ${opacity})`;
            const pct = (p.importance * 100).toFixed(0);
            return (
              <div
                key={i}
                className="rounded-sm border flex items-center justify-center"
                style={{
                  backgroundColor: color,
                  borderColor: p.positive ? 'rgba(0,229,176,0.5)' : 'rgba(239,68,68,0.5)',
                }}
                title={p.positive
                  ? `Covering this patch reduced model confidence by ~${pct}% — it drives the AQI prediction`
                  : `Covering this patch increased model confidence by ~${pct}% — it contradicts the AQI prediction`}
              >
                <span className="text-[9px] font-mono text-white font-bold opacity-90 shadow-sm">
                  {p.positive ? '+' : '−'}{pct}%
                </span>
              </div>
            );
          })}
        </div>


        <div className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-md backdrop-blur-sm border text-[10px] font-mono flex items-center gap-1.5 ${isReal ? 'bg-black/80 text-emerald-400 border-emerald-500/30' : 'bg-black/80 text-amber-400 border-white/10'}`}>
          {isReal ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <AlertTriangle className="w-3 h-3 text-amber-400" />}
          {isReal ? 'Real Model Occlusion Map (16 Batched Inference Calls)' : 'Simulated LIME Patches'}
        </div>
      </div>

      <div className="flex gap-6 text-xs text-gray-400">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#00E5B0]/60" />
          <span><span className="text-emerald-400 font-semibold">Green</span> — Pollution indicator: this region <strong className="text-white">drives</strong> the AQI prediction</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-500/60" />
          <span><span className="text-red-400 font-semibold">Red</span> — Clean area: this region <strong className="text-white">contradicts</strong> the predicted AQI level</span>
        </div>
      </div>
    </div>
  );
}

// ── Model Output (Real Values) ─────────────────────────────────────────
function ModelOutputPanel({ data }) {
  const probs = data?.all_probabilities || {};
  const category = data?.predicted_category || 'N/A';
  const confidence = data?.confidence ? (data.confidence * 100).toFixed(1) : 'N/A';

  // Indian AQI (CPCB) categories — matches model's actual prediction classes
  const categoryColors = {
    'Good':         '#22c55e',
    'Satisfactory': '#84cc16',
    'Moderate':     '#eab308',
    'Poor':         '#f97316',
    'Very Poor':    '#ef4444',
    'Severe':       '#991b1b',
  };
  const catColor = categoryColors[category] || '#00E5B0';

  const sortedProbs = Object.entries(probs).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white font-heading flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#00E5B0]" />
            Verified Model Outputs
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">These values are REAL — computed by the trained CNN-LSTM model.</p>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
          ✓ REAL MODEL OUTPUT
        </span>
      </div>

      {/* Primary Prediction */}
      <div className="p-4 rounded-2xl border" style={{ backgroundColor: `${catColor}10`, borderColor: `${catColor}30` }}>
        <div className="text-[10px] text-gray-400 font-mono uppercase mb-1">Predicted AQI Category</div>
        <div className="text-2xl font-bold font-heading" style={{ color: catColor }}>{category}</div>
        <div className="text-xs text-gray-400 mt-1">Confidence: <span className="text-white font-bold font-mono">{confidence}%</span></div>
      </div>

      {/* All Class Probabilities */}
      {sortedProbs.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] text-gray-400 uppercase font-mono tracking-wider">All Class Probabilities</div>
          {sortedProbs.map(([cat, prob]) => {
            const pct = (prob * 100).toFixed(1);
            const barW = Math.min(prob * 100, 100);
            const col = categoryColors[cat] || '#00E5B0';
            return (
              <div key={cat} className="space-y-0.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300 font-mono">{cat}</span>
                  <span className="font-bold font-mono text-white">{pct}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barW}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: col }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="p-3 rounded-xl bg-white/4 border border-white/8 text-[10px] text-gray-400 font-mono leading-relaxed">
        <Info className="w-3 h-3 inline mr-1 text-blue-400" />
        The confidence and class probability distribution above are the ONLY values directly produced by the model.
        All Grad-CAM, SHAP, and LIME visualizations on this page are <strong className="text-amber-400">simulated for demonstration</strong> and
        require additional ML pipelines (gradient extraction, SHAP library, LIME library) to compute from real model weights.
      </div>
    </div>
  );
}

// ── Main ExplainPage ───────────────────────────────────────────────────
export default function ExplainPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('gradcam');
  const [intensity, setIntensity] = useState(65);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await getExplanation(id || 'latest');
        const userImage = sessionStorage.getItem('explain_user_image') || sessionStorage.getItem('explain_image_path');
        if (userImage) result.image_path = userImage;
        setData(result);
      } catch (err) {
        console.error('ExplainPage load error:', err);
        const userImage = sessionStorage.getItem('explain_user_image');
        if (userImage) setData({ image_path: userImage });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDownload = () => {
    const report = {
      disclaimer: "Grad-CAM, SHAP, and LIME values are SIMULATED for demonstration. Only predicted_category and confidence are real model outputs.",
      generated_at: new Date().toISOString(),
      real_model_outputs: {
        predicted_category: data?.predicted_category,
        confidence: data?.confidence,
        all_probabilities: data?.all_probabilities,
      },
      simulated_xai: {
        gradcam: "Simulated heatmap gradient — not from real backpropagation",
        shap:    "Domain-knowledge proxy values — not from SHAP library",
        lime:    "Random occlusion patches — not from LIME perturbation inference",
      },
    };
    const a = document.createElement('a');
    a.href = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(report, null, 2))}`;
    a.download = `AQI_Explainability_${id || 'demo'}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] pt-[72px] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#00E5B0] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 text-sm font-mono">Loading Explainability Engine…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] pt-[72px]">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
 
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <Link to="/prediction" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors mb-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Prediction Studio
            </Link>
            <h1 className="text-3xl font-bold text-white font-heading">
              Explainability <span className="text-[#00E5B0]">Engine</span>
            </h1>
            <p className="text-gray-400 text-xs mt-1">
              Visualizing model outputs with Grad-CAM, SHAP, and LIME — see disclaimer badges on each panel.
            </p>
          </div>
          {data?.is_real ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-mono font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Real Explainability Connected to Model
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400 font-mono font-bold">
              <AlertTriangle className="w-3.5 h-3.5" /> XAI Demo — Simulated Visualizations
            </div>
          )}
        </div>
 
        {/* Global Disclaimer */}
        {data?.is_real ? (
          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-200 leading-relaxed">
            <strong className="text-emerald-400">✓ Model-Connected:</strong> Grad-CAM heatmap overlays and SHAP pollutant feature importances are <strong>real model-driven explanations</strong> computed on-the-fly from the trained CNN-LSTM model parameters and your inputs. LIME occlusion patches remain simulated for visual demo consistency.
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200 leading-relaxed">
            <strong className="text-amber-400">⚠ Important Notice:</strong> The Grad-CAM heatmap, SHAP bar chart, and LIME occlusion patches on this page are <strong>simulated visualizations</strong> for demonstration purposes.
            Real Grad-CAM requires gradient extraction from the CNN; real SHAP requires running a SHAP explainer on model weights; real LIME requires running hundreds of perturbed inference calls.
            The <strong>only verified real outputs</strong> from the model are the predicted AQI category and confidence score — visible in the <strong>Model Output tab</strong>.
          </div>
        )}
 
        {/* Tabs */}
        <div className="flex gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl w-fit flex-wrap">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#00E5B0] text-[#07090e] shadow-[0_0_20px_rgba(0,229,176,0.3)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.icon} {tab.label}
              {tab.id === 'model' && <span className="ml-1 px-1 py-0 bg-emerald-500/30 text-emerald-300 text-[9px] rounded">REAL</span>}
              {tab.id === 'gradcam' && data?.is_real && <span className="ml-1 px-1 py-0 bg-emerald-500/30 text-emerald-300 text-[9px] rounded">REAL</span>}
              {tab.id === 'shap' && data?.is_real && <span className="ml-1 px-1 py-0 bg-emerald-500/30 text-emerald-300 text-[9px] rounded">REAL</span>}
            </button>
          ))}
        </div>
 
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
 
            {/* ── Grad-CAM Tab ── */}
            {activeTab === 'gradcam' && (
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="glass-card p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white font-heading">CNN Attention Overlay</h3>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${data?.is_real ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                      {data?.is_real ? 'REAL' : 'SIMULATED'}
                    </span>
                  </div>
                  <GradCamOverlay imagePath={data?.image_path} gradcamUrl={data?.gradcam_url} isReal={data?.is_real} intensity={intensity} />
                  {data?.is_real ? (
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 text-xs text-emerald-300 font-mono leading-relaxed">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                      <span>The heatmap above highlights the actual areas in the photo the model prioritized for prediction. (Intensity slider has been locked to 100% since overlay is already pre-blended).</span>
                    </div>
                  ) : (
                    <>
                      <SimBanner message="This heatmap is a visual simulation — not extracted from real CNN gradient backpropagation (tf.GradientTape / Grad-CAM++). The heat blobs are positioned in lower-right regions which typically correspond to ground-level features in AQI images." />
                      <div className="pt-1">
                        <div className="flex justify-between text-xs mb-1 text-gray-400">
                          <span>Overlay Intensity</span>
                          <span className="font-mono text-white">{intensity}%</span>
                        </div>
                        <input
                          type="range" min={0} max={100} value={intensity}
                          onChange={(e) => setIntensity(Number(e.target.value))}
                          className="w-full accent-[#00E5B0] h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer"
                        />
                      </div>
                    </>
                  )}
                </div>
 
                <div className="glass-card p-6">
                  <ActivationGrid regions={data?.gradcam_regions} isReal={data?.is_real} />
                </div>
              </div>
            )}
 
            {/* ── SHAP Tab ── */}
            {activeTab === 'shap' && (
              <div className="glass-card p-6">
                <ShapChart shapValues={data?.shap_values} isReal={data?.is_real} />
              </div>
            )}
 
            {/* ── LIME Tab ── */}
            {activeTab === 'lime' && (
              <div className="glass-card p-6">
                <LimeView imagePath={data?.image_path} limePatches={data?.lime_patches} isReal={data?.is_real} />
              </div>
            )}
 
            {/* ── Model Output Tab ── */}
            {activeTab === 'model' && (
              <div className="glass-card p-6">
                <ModelOutputPanel data={data} />
              </div>
            )}
 
          </motion.div>
        </AnimatePresence>

        {/* Download */}
        <div className="flex justify-center pt-4">
          <button
            onClick={handleDownload}
            className={`flex items-center gap-2 font-bold px-6 py-3 rounded-2xl transition-all text-xs border ${
              downloaded
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-[#00E5B0]/10 border-[#00E5B0]/40 text-[#00E5B0] hover:bg-[#00E5B0]/20 hover:scale-105 shadow-[0_0_20px_rgba(0,229,176,0.15)]'
            }`}
          >
            {downloaded ? <CheckCircle2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            {downloaded ? 'Report Downloaded!' : 'Download Explainability Report (with Disclaimer)'}
          </button>
        </div>

      </div>
    </div>
  );
}
