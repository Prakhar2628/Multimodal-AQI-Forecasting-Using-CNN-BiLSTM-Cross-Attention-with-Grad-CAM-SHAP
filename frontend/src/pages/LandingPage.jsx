import HeroSection from '../components/sections/HeroSection';
import FeaturesSection from '../components/sections/FeaturesSection';
import PredictionSection from '../components/sections/PredictionSection';
import ChartsSection from '../components/sections/ChartsSection';
import ModelPerformanceSection from '../components/sections/ModelPerformanceSection';
import Footer from '../components/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-white selection:bg-primary/30 pt-[70px]">
      <main>
        <HeroSection />
        <FeaturesSection />
        <PredictionSection />
        <ChartsSection />
        <ModelPerformanceSection />
      </main>

      <Footer />
    </div>
  );
}
