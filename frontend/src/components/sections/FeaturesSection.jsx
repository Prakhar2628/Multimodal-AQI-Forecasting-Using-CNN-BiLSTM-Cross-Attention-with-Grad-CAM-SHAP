import { motion } from 'framer-motion';
import { Satellite, CloudRain, BrainCircuit, Activity, Map, FileText } from 'lucide-react';

export default function FeaturesSection() {
  const features = [
    {
      icon: <Satellite className="w-8 h-8 text-primary" />,
      title: "Satellite Image Analysis",
      description: "Extract atmospheric patterns and visual indicators from high-resolution satellite imagery."
    },
    {
      icon: <CloudRain className="w-8 h-8 text-secondary" />,
      title: "Weather Forecast Integration",
      description: "Combine meteorological data with pollution models for accurate temporal predictions."
    },
    {
      icon: <BrainCircuit className="w-8 h-8 text-primary" />,
      title: "Deep Learning Prediction",
      description: "State-of-the-art neural networks trained on decades of multimodal climate data."
    },
    {
      icon: <Activity className="w-8 h-8 text-secondary" />,
      title: "Live AQI Monitoring",
      description: "Real-time updates from global sensor networks mapped directly to your dashboard."
    },
    {
      icon: <Map className="w-8 h-8 text-primary" />,
      title: "Interactive Maps",
      description: "Geospatial visualization of pollution dispersion and localized risk zones."
    },
    {
      icon: <FileText className="w-8 h-8 text-secondary" />,
      title: "AI Generated Reports",
      description: "Automated, comprehensive analysis reports for stakeholders and policy makers."
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <section className="py-24 relative z-10" id="features">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Advanced <span className="text-gradient">Capabilities</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Harness the power of multiple data streams and artificial intelligence to understand and predict air quality with unprecedented accuracy.
          </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div 
              key={index} 
              variants={itemVariants}
              className="glass-card glass-card-hover p-8 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
              
              <div className="mb-6 inline-flex p-3 rounded-xl bg-background/50 border border-white/5 shadow-inner">
                {feature.icon}
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
