import { motion, AnimatePresence } from 'framer-motion';
import { Clock, X, Image as ImageIcon, ChevronRight, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getStaticImageUrl } from '../api';

const AQI_COLORS = {
  'Good': '#22c55e',
  'Moderate': '#eab308',
  'Unhealthy for Sensitive Groups': '#f97316',
  'Unhealthy': '#ef4444',
  'Very Unhealthy': '#a855f7',
  'Severe': '#991b1b',
};

export default function TimelineDrawer({ open, onClose, predictions = [] }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-[72px] right-0 bottom-0 z-50 w-80 sm:w-96 bg-[#07090e]/95 backdrop-blur-2xl border-l border-white/10 p-6 overflow-y-auto flex flex-col"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[#00E5B0]/10 text-[#00E5B0]">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-heading">Prediction Timeline</h3>
                  <p className="text-xs text-gray-400">Multimodal imagery analysis log</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List or Empty State */}
            <div className="flex-1 space-y-4">
              {predictions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 my-auto">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                    <ImageIcon className="w-8 h-8 text-gray-500" />
                  </div>
                  <h4 className="text-sm font-medium text-white mb-1">No analysis history yet</h4>
                  <p className="text-xs text-gray-500">Upload an environment image to begin building your analysis timeline.</p>
                  <Link to="/prediction" onClick={onClose} className="mt-6">
                    <button className="bg-[#00E5B0] text-[#07090e] font-bold text-xs px-4 py-2 rounded-xl hover:scale-105 transition-all">
                      Start First Analysis
                    </button>
                  </Link>
                </div>
              ) : (
                predictions.map((p) => {
                  const catColor = AQI_COLORS[p.predicted_category] || '#00E5B0';
                  return (
                    <motion.div
                      key={p.id}
                      whileHover={{ scale: 1.02 }}
                      className="glass-card p-4 hover:border-[#00E5B0]/40 transition-all group relative"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0 relative">
                          {p.image_path ? (
                            <img
                              src={getStaticImageUrl(p.image_path)}
                              alt="Satellite Input"
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                              <ImageIcon className="w-6 h-6" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-white truncate">{p.city || 'Location'}</span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className="px-2 py-0.5 rounded-md text-[10px] font-bold border"
                              style={{ color: catColor, borderColor: `${catColor}40`, backgroundColor: `${catColor}15` }}
                            >
                              {p.predicted_category}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {(p.confidence * 100).toFixed(1)}%
                            </span>
                          </div>

                          <Link
                            to={`/explain/${p.id}`}
                            onClick={onClose}
                            className="inline-flex items-center gap-1 text-[11px] text-[#00E5B0] hover:underline font-medium"
                          >
                            Inspect Explainability <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
