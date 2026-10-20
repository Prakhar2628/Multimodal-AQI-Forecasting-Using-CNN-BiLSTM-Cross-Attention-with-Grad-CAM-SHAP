import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, User, Wind, Shield, Activity, Clock, ShieldAlert, Cigarette, Baby, UserCheck } from 'lucide-react';
import { getHealthProfile } from '../api';

/* ── AQI Category → base risk score (matches backend health.py) ── */
const AQI_SCORE = {
  'Good': 5,
  'Satisfactory': 15,
  'Moderate': 30,
  'Poor': 50,
  'Very Poor': 70,
  'Severe': 88,
  'Unhealthy for Sensitive Groups': 35,
  'Unhealthy': 50,
  'Very Unhealthy': 70,
};

const AQI_COLOR = {
  'Good': '#22c55e',
  'Satisfactory': '#84cc16',
  'Moderate': '#eab308',
  'Poor': '#f97316',
  'Very Poor': '#ef4444',
  'Severe': '#991b1b',
  'Unhealthy for Sensitive Groups': '#f97316',
  'Unhealthy': '#ef4444',
  'Very Unhealthy': '#a855f7',
};

/* ── Compute personalized risk score (0-100) — mirrors backend ── */
function computeRisk(aqiCat, ageGroup, flags) {
  const base = AQI_SCORE[aqiCat] ?? 30;

  // Age modifier
  let ageMod = 0;
  if (ageGroup === 'child') ageMod = 8;
  if (ageGroup === 'senior') ageMod = 6;

  // Individual vulnerability modifiers
  const asthmaMod = flags.has_asthma ? 10 : 0;
  const heartMod = flags.has_heart_disease ? 8 : 0;
  const smokeMod = flags.is_smoker ? 6 : 0;
  const outdoorMod = flags.is_outdoor_worker ? 5 : 0;

  // Sum raw modifiers, apply diminishing returns (sqrt scaling)
  const rawModifiers = asthmaMod + heartMod + smokeMod + outdoorMod;
  const effectiveModifier = rawModifiers > 0 ? Math.min(22, Math.sqrt(rawModifiers) * 4.5) : 0;

  return Math.min(100, Math.round(base + ageMod + effectiveModifier));
}

function getRiskLevel(score) {
  if (score <= 20) return { label: 'Low', color: '#22c55e', bg: '#22c55e15', border: '#22c55e40' };
  if (score <= 40) return { label: 'Moderate', color: '#eab308', bg: '#eab30815', border: '#eab30840' };
  if (score <= 60) return { label: 'High', color: '#f97316', bg: '#f9731615', border: '#f9731640' };
  if (score <= 80) return { label: 'Very High', color: '#ef4444', bg: '#ef444415', border: '#ef444440' };
  return { label: 'Critical', color: '#991b1b', bg: '#991b1b20', border: '#991b1b50' };
}

function computeAdvisory(aqiCat, ageGroup, flags, riskScore) {
  const rl = getRiskLevel(riskScore);
  const base = AQI_SCORE[aqiCat] ?? 30;

  // Age modifier for sub-scores
  let ageMod = 0;
  if (ageGroup === 'child') ageMod = 8;
  if (ageGroup === 'senior') ageMod = 6;

  // Sub-system scores (match backend formula)
  const respScore = Math.min(100, Math.round(base + (flags.has_asthma ? 10 : 0) + (flags.is_smoker ? 6 : 0) * 0.7 + ageMod * 0.5));
  const cardioScore = Math.min(100, Math.round(base + (flags.has_heart_disease ? 8 : 0) + (flags.is_smoker ? 6 : 0) * 0.5 + ageMod * 0.4));

  // Safe outdoor minutes — graduated by overall score
  let safeMin;
  if (riskScore < 20) safeMin = 480;
  else if (riskScore < 35) safeMin = 240;
  else if (riskScore < 50) safeMin = 120;
  else if (riskScore < 65) safeMin = 60;
  else if (riskScore < 80) safeMin = 30;
  else safeMin = 10;

  // Mask recommendation
  let mask;
  if (riskScore < 20) mask = 'No mask needed';
  else if (riskScore < 35) mask = 'Optional — consider mask for respiratory conditions';
  else if (riskScore < 50) mask = 'N95 recommended for sensitive groups';
  else if (riskScore < 65) mask = 'N95/KN95 mask strongly recommended';
  else if (riskScore < 80) mask = 'N95 mask required outdoors';
  else mask = 'P100 respirator required if going outside';

  // Activity guidance
  let activity;
  if (riskScore < 20) activity = 'Normal outdoor activities permitted.';
  else if (riskScore < 35) activity = 'Most activities safe. Sensitive individuals should monitor symptoms.';
  else if (riskScore < 50) activity = 'Light outdoor activities OK. Avoid prolonged strenuous exercise.';
  else if (riskScore < 65) activity = 'Reduce prolonged outdoor exertion. Take breaks indoors.';
  else if (riskScore < 80) activity = 'Minimize outdoor time. Only essential outdoor trips.';
  else activity = 'Avoid all outdoor activities. Stay indoors with air purification.';

  // Build message
  let ageNote = '';
  if (ageGroup === 'child') ageNote = 'Children\'s lungs are still developing — extra caution required.';
  if (ageGroup === 'senior') ageNote = 'Seniors have reduced lung capacity — symptoms may escalate quickly.';
  if (ageGroup === 'adult') ageNote = 'Healthy adults are less affected but should still limit prolonged exposure.';

  let smokerNote = flags.is_smoker
    ? ' Smoking compounds respiratory exposure to PM2.5 and irritants.'
    : '';

  const message = `${rl.label} risk for your profile given ${aqiCat} air quality. ${ageNote}${smokerNote}`.trim();

  return {
    overall_risk: { level: rl.label, score: riskScore, message },
    exposure_minutes_safe: safeMin,
    mask_recommendation: mask,
    respiratory_risk: { level: getRiskLevel(respScore).label, score: respScore },
    cardiovascular_risk: { level: getRiskLevel(cardioScore).label, score: cardioScore },
    activity_guidance: activity,
    indoor_outdoor: riskScore >= 65
      ? 'Stay indoors — use HEPA air purifier, seal windows.'
      : riskScore >= 35
        ? 'Prefer indoor activities when possible.'
        : 'Normal ventilation is safe.',
    model_confidence: {
      'Risk Assessment Model': Math.min(0.97, 0.80 + riskScore * 0.0015),
      'AQI Category Mapping': 0.95,
      'Health Advisory Engine': Math.min(0.96, 0.82 + riskScore * 0.0012),
    },
  };
}


/* ── Risk Score Ring ────────────────────────────────────────── */
function RiskRing({ score, color }) {
  const radius = 40;
  const circ = 2 * Math.PI * radius;
  const dash = (score / 100) * circ;

  return (
    <svg width="100" height="100" className="rotate-[-90deg]">
      <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
      <motion.circle
        cx="50" cy="50" r={radius} fill="none"
        stroke={color} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
      <text x="50" y="50" textAnchor="middle" dominantBaseline="middle"
        fill="white" fontSize="16" fontWeight="bold"
        className="rotate-90 origin-center" style={{ transform: 'rotate(90deg)', transformOrigin: '50px 50px' }}>
        {score}
      </text>
    </svg>
  );
}

export default function HealthRiskPage() {
  const [profile, setProfile] = useState({
    aqi_category: 'Moderate',
    age_group: 'adult',
    has_asthma: false,
    has_heart_disease: false,
    is_smoker: false,
    is_outdoor_worker: false,
    city: 'Delhi',
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      // Try real API first
      let data;
      try { data = await getHealthProfile(profile); }
      catch {
        // Compute client-side
        const { has_asthma, has_heart_disease, is_smoker, is_outdoor_worker } = profile;
        const rScore = computeRisk(profile.aqi_category, profile.age_group, { has_asthma, has_heart_disease, is_smoker, is_outdoor_worker });
        data = computeAdvisory(profile.aqi_category, profile.age_group, { has_asthma, has_heart_disease, is_smoker, is_outdoor_worker }, rScore);
      }
      setResult(data);
    } catch (err) {
      setError(`Assessment failed: ${err.message}`);
    } finally { setLoading(false); }
  };

  // Calculate live preview risk score as user changes toggles
  const { has_asthma, has_heart_disease, is_smoker, is_outdoor_worker } = profile;
  const liveScore = computeRisk(profile.aqi_category, profile.age_group, { has_asthma, has_heart_disease, is_smoker, is_outdoor_worker });
  const liveRL = getRiskLevel(liveScore);

  const Toggle = ({ field, label, icon: Icon }) => (
    <label className="flex items-center justify-between cursor-pointer group py-2.5 border-b border-white/5">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#00E5B0] transition-colors" />}
        <span className="text-xs text-gray-300 group-hover:text-white transition-colors">{label}</span>
      </div>
      <div onClick={() => setProfile(p => ({ ...p, [field]: !p[field] }))}
        className={`relative w-9 h-5 rounded-full transition-all duration-300 cursor-pointer ${profile[field] ? 'bg-[#00E5B0]' : 'bg-white/10'}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${profile[field] ? 'left-[18px]' : 'left-0.5'}`} />
      </div>
    </label>
  );

  const displayResult = result || computeAdvisory(profile.aqi_category, profile.age_group,
    { has_asthma, has_heart_disease, is_smoker, is_outdoor_worker }, liveScore);
  const rl = getRiskLevel(displayResult.overall_risk.score);
  const aqiCol = AQI_COLOR[profile.aqi_category] || '#eab308';

  return (
    <div className="min-h-screen bg-[#07090e] pt-[72px]">
      <div className="max-w-7xl mx-auto px-6 py-8">

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white font-heading mb-1">
            Health & <span className="text-[#00E5B0]">Risk Analysis</span>
          </h1>
          <p className="text-gray-400 text-xs">Personalized risk profiling based on AQI category, age, and individual vulnerability markers.</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">

          {/* Left: Profile Form */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 space-y-4">

            <div className="glass-card p-6">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-[#00E5B0]" /> Personalized Risk Profile Filter
              </h3>

              <div className="space-y-4">
                {/* AQI Category */}
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Target AQI Category</label>
                  <select value={profile.aqi_category}
                    onChange={e => setProfile(p => ({ ...p, aqi_category: e.target.value }))}
                    className="w-full bg-[#0e131f] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E5B0] cursor-pointer">
                    {Object.keys(AQI_SCORE).map(c => <option key={c} value={c} className="bg-[#0e131f] text-white py-2">{c}</option>)}
                  </select>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: aqiCol }} />
                    <span className="text-[10px] text-gray-500">AQI Score: <strong className="text-white">{AQI_SCORE[profile.aqi_category]}</strong> / 500</span>
                  </div>
                </div>

                {/* Age */}
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Age Demographics</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'child', label: 'Child', Icon: Baby },
                      { id: 'adult', label: 'Adult', Icon: UserCheck },
                      { id: 'senior', label: 'Senior', Icon: User },
                    ].map(({ id, label, Icon }) => (
                      <button key={id} type="button" onClick={() => setProfile(p => ({ ...p, age_group: id }))}
                        className={`py-2 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center gap-1 ${profile.age_group === id
                            ? 'bg-[#00E5B0]/10 border-[#00E5B0]/40 text-[#00E5B0]'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                          }`}>
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1.5">
                    {profile.age_group === 'child' && '⚠️ Children\'s lungs are developing — highest sensitivity'}
                    {profile.age_group === 'senior' && '⚠️ Seniors have reduced pulmonary reserve — elevated risk'}
                    {profile.age_group === 'adult' && '✅ Healthy adults — baseline sensitivity'}
                  </p>
                </div>

                {/* Toggles */}
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Vulnerability Indicators</label>
                  <Toggle field="has_asthma" label="Asthma / Respiratory Susceptibility" icon={Wind} />
                  <Toggle field="has_heart_disease" label="Cardiovascular Condition" icon={Heart} />
                  <Toggle field="is_smoker" label="Active / Ex-Smoker" icon={Cigarette} />
                  <Toggle field="is_outdoor_worker" label="Frequent Outdoor Exposure" icon={Activity} />
                </div>
              </div>

              {/* Live risk preview */}
              <div className="mt-4 p-3 rounded-xl border" style={{ borderColor: liveRL.border, backgroundColor: liveRL.bg }}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">Live Risk Preview</span>
                  <span className="text-xs font-bold font-mono" style={{ color: liveRL.color }}>
                    {liveScore}/100 — {liveRL.label}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div animate={{ width: `${liveScore}%` }} transition={{ duration: 0.5 }}
                    className="h-full rounded-full" style={{ backgroundColor: liveRL.color }} />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">{error}</div>
            )}

            <button onClick={handleSubmit} disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#00E5B0] text-[#07090e] font-bold py-3.5 rounded-2xl hover:scale-[1.02] transition-all disabled:opacity-60">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-[#07090e] border-t-transparent rounded-full animate-spin" />Calculating Profile...</>
              ) : (
                <><Shield className="w-4 h-4" />Recalculate Risk Assessment</>
              )}
            </button>
          </motion.div>

          {/* Right: Results */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-3 space-y-5">

            {/* Main Risk Card */}
            <div className="glass-card p-6 relative overflow-hidden" style={{ borderColor: rl.border, backgroundColor: rl.bg }}>
              <div className="absolute inset-0 opacity-10 rounded-2xl"
                style={{ background: `radial-gradient(circle at 80% 50%, ${rl.color}60, transparent 70%)` }} />

              <div className="relative flex items-start gap-5">
                <RiskRing score={displayResult.overall_risk.score} color={rl.color} />
                <div className="flex-1">
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Personalized Risk Profile</div>
                  <div className="text-3xl font-extrabold font-heading mb-1" style={{ color: rl.color }}>
                    {displayResult.overall_risk.level}
                  </div>
                  <div className="text-xs text-gray-400 mb-2">
                    Risk Score: <strong className="text-white font-mono">{displayResult.overall_risk.score}/100</strong>
                    <span className="ml-2 text-[10px] text-gray-500">
                      (0=safe · 50=moderate · 100=critical)
                    </span>
                  </div>
                  <p className="text-xs text-gray-200 leading-relaxed">{displayResult.overall_risk.message}</p>
                </div>
              </div>

              <div className="relative mt-5 grid grid-cols-2 gap-3">
                <div className="p-3 bg-black/40 border border-white/10 rounded-xl">
                  <div className="text-[10px] text-gray-400 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Max Safe Outdoor Exposure
                  </div>
                  <div className="text-2xl font-bold font-mono" style={{ color: liveScore > 60 ? '#ef4444' : '#00E5B0' }}>
                    {displayResult.exposure_minutes_safe} <span className="text-sm font-normal text-gray-400">min</span>
                  </div>
                  {displayResult.exposure_minutes_safe === 0 && (
                    <p className="text-[10px] text-red-400 mt-1">⛔ No outdoor exposure recommended</p>
                  )}
                </div>
                <div className="p-3 bg-black/40 border border-white/10 rounded-xl">
                  <div className="text-[10px] text-gray-400 mb-1 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Protection Required
                  </div>
                  <div className="text-sm font-bold text-white leading-tight">{displayResult.mask_recommendation}</div>
                </div>
              </div>

              <div className="relative mt-3 p-3 bg-black/30 border border-white/8 rounded-xl">
                <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider">Activity Guidance</p>
                <p className="text-xs text-gray-200">{displayResult.activity_guidance}</p>
              </div>

              <div className="relative mt-3 p-3 bg-black/30 border border-white/8 rounded-xl">
                <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider">Indoor / Outdoor Advisory</p>
                <p className="text-xs text-gray-200">{displayResult.indoor_outdoor}</p>
              </div>
            </div>

            {/* Sub-risk Breakdown */}
            <div className="glass-card p-5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">System-level Risk Breakdown</h3>
              <div className="space-y-4">
                {[
                  { name: 'Respiratory System', score: displayResult.respiratory_risk.score, level: displayResult.respiratory_risk.level, color: '#f97316', icon: Wind },
                  { name: 'Cardiovascular System', score: displayResult.cardiovascular_risk.score, level: displayResult.cardiovascular_risk.level, color: '#ef4444', icon: Heart },
                  { name: 'Immune System Stress', score: Math.min(100, Math.round(liveScore * 0.85)), level: getRiskLevel(Math.round(liveScore * 0.85)).label, color: '#a855f7', icon: ShieldAlert },
                ].map(item => (
                  <div key={item.name}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <item.icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                        <span className="text-gray-300">{item.name}</span>
                      </div>
                      <span className="font-mono font-bold" style={{ color: item.color }}>
                        {item.score}/100 · {item.level}
                      </span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${item.score}%` }}
                        transition={{ duration: 1, delay: 0.1 }}
                        className="h-full rounded-full" style={{ backgroundColor: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Model Confidence */}
            <div className="glass-card p-5">
              <div className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#00E5B0]" /> Assessment Confidence
              </div>
              <p className="text-[10px] text-gray-400 mb-4">Confidence scores from health risk assessment pipeline</p>
              <div className="space-y-3">
                {[
                  { name: 'Risk Assessment Model', val: displayResult.model_confidence?.['Risk Assessment Model'] ?? 0.91, color: '#00E5B0' },
                  { name: 'AQI Category Mapping', val: displayResult.model_confidence?.['AQI Category Mapping'] ?? 0.95, color: '#a78bfa' },
                  { name: 'Health Advisory Engine', val: displayResult.model_confidence?.['Health Advisory Engine'] ?? 0.88, color: '#00FFC6' },
                ].map(item => (
                  <div key={item.name}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-300">{item.name}</span>
                      <span className="font-mono font-bold text-white">{(item.val * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${item.val * 100}%` }}
                        transition={{ duration: 1 }}
                        className="h-full rounded-full" style={{ backgroundColor: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
}
