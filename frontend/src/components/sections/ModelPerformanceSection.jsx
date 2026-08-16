import { motion } from 'framer-motion';
import { Target, CheckCircle2, AlertCircle, BarChart2 } from 'lucide-react';

export default function ModelPerformanceSection() {
  const metrics = [
    { label: "Accuracy", value: "94.8%", icon: <Target className="w-6 h-6 text-primary" /> },
    { label: "Precision", value: "92.5%", icon: <CheckCircle2 className="w-6 h-6 text-secondary" /> },
    { label: "Recall", value: "95.2%", icon: <AlertCircle className="w-6 h-6 text-primary" /> },
    { label: "F1 Score", value: "0.938", icon: <BarChart2 className="w-6 h-6 text-secondary" /> }
  ];

  return (
    <section className="py-24 relative z-10 bg-background/50 border-y border-white/5" id="models">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Unrivaled <span className="text-gradient">Model Performance</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Our ensemble deep learning models consistently outperform traditional meteorological forecasting methods.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-6 text-center group"
            >
              <div className="inline-flex p-3 rounded-xl bg-background/50 mb-4 group-hover:neon-glow transition-all">
                {metric.icon}
              </div>
              <div className="text-3xl font-bold text-white mb-1">{metric.value}</div>
              <div className="text-sm text-gray-400 uppercase tracking-wider">{metric.label}</div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
