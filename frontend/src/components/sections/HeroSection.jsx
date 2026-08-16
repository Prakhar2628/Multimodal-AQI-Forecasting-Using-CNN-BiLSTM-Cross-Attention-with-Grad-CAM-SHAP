import { motion } from 'framer-motion';
import { Globe, Activity, Thermometer, Droplets, Wind, Zap } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] mix-blend-screen" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] mix-blend-screen" />

      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10">

        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <div className="inline-block px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium tracking-wide">
            Next Generation AI Dashboard
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            Multimodal <br />
            <span className="text-gradient">Air Quality</span> <br />
            Intelligence Platform
          </h1>

          <p className="text-xl text-gray-400 max-w-xl leading-relaxed">
            Predict air quality using satellite imagery, weather, pollution sensors, traffic density and deep learning models.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <button className="btn-primary">
              Get Started
            </button>
            <button className="btn-secondary">
              Live Demo
            </button>
          </div>
        </motion.div>

        {/* Right Content - Futuristic Multimodal AI Hologram Core */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative h-[600px] flex items-center justify-center"
        >
          {/* Radar Sweep Arc Beam */}
          <div className="absolute w-[440px] h-[440px] rounded-full border border-primary/20 bg-[conic-gradient(from_0deg,transparent_0_300deg,rgba(0,229,176,0.25)_360deg)] animate-[spin_6s_linear_infinite] pointer-events-none" />

          {/* Outer Tech HUD Ring with tick marks */}
          <div className="absolute w-[480px] h-[480px] rounded-full border border-white/10 border-dashed animate-[spin_35s_linear_infinite]" />
          <div className="absolute w-[380px] h-[380px] rounded-full border border-primary/30 animate-[spin_20s_linear_infinite_reverse]" />
          <div className="absolute w-[300px] h-[300px] rounded-full border border-secondary/40 border-dashed animate-[spin_12s_linear_infinite]" />

          {/* Central AI Neural Core */}
          <motion.div
            animate={{
              boxShadow: [
                '0 0 50px rgba(0,229,176,0.3), inset 0 0 30px rgba(0,229,176,0.2)',
                '0 0 90px rgba(0,229,176,0.6), inset 0 0 50px rgba(0,229,176,0.4)',
                '0 0 50px rgba(0,229,176,0.3), inset 0 0 30px rgba(0,229,176,0.2)'
              ],
              rotate: [0, 360]
            }}
            transition={{
              boxShadow: { duration: 3, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 40, repeat: Infinity, ease: "linear" }
            }}
            className="w-72 h-72 rounded-full bg-gradient-to-br from-primary/20 via-background/80 to-secondary/20 border-2 border-primary/50 flex flex-col items-center justify-center backdrop-blur-xl relative z-10 p-6 text-center shadow-2xl"
          >
            {/* Core Holographic Target Lines */}
            <div className="absolute inset-2 rounded-full border border-primary/30 border-t-primary animate-[spin_4s_linear_infinite]" />
            <div className="absolute inset-5 rounded-full border border-secondary/30 border-b-secondary animate-[spin_8s_linear_infinite_reverse]" />

            <div className="relative z-20 space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,229,176,0.4)]">
                <Zap className="w-6 h-6 text-primary animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase block">
                  MULTIMODAL FUSION
                </span>
                <span className="text-xl font-bold text-white font-heading tracking-tight block">
                  CNN × LSTM
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-[10px] font-mono text-primary font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                NEURAL ENGINE ACTIVE
              </div>
            </div>
          </motion.div>

          {/* Floating Telemetry Data Cards */}
          <FloatingCard
            icon={<Activity />}
            label="AQI Index"
            value="42"
            sub="Good"
            className="top-6 left-4"
            delay={0}
          />
          <FloatingCard
            icon={<Thermometer />}
            label="Temperature"
            value="24°C"
            className="top-1/4 -right-4"
            delay={1}
          />
          <FloatingCard
            icon={<Droplets />}
            label="Humidity"
            value="45%"
            className="bottom-1/4 -left-4"
            delay={2}
          />
          <FloatingCard
            icon={<Wind />}
            label="PM2.5 Sensor"
            value="12 µg/m³"
            className="bottom-6 right-4"
            delay={1.5}
          />
          <FloatingCard
            icon={<Zap />}
            label="Model Confidence"
            value="98.5%"
            className="top-2 right-1/4"
            delay={0.5}
          />
        </motion.div>
      </div>
    </section>
  );
}

function FloatingCard({ icon, label, value, sub, className, delay }) {
  return (
    <motion.div
      animate={{
        y: [0, -15, 0],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
        delay: delay
      }}
      className={`absolute z-20 glass-card p-3 flex items-center gap-3 ${className}`}
    >
      <div className="p-2 bg-background/50 rounded-lg text-primary">
        {icon}
      </div>
      <div>
        <div className="text-xs text-gray-400">{label}</div>
        <div className="font-bold text-white flex items-baseline gap-2">
          {value}
          {sub && <span className="text-[10px] text-primary">{sub}</span>}
        </div>
      </div>
    </motion.div>
  );
}
