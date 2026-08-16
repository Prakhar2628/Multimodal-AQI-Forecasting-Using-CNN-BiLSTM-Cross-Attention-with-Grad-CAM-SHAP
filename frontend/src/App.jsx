import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import TimelineDrawer from "./components/TimelineDrawer";
import OrbitalBackground from "./components/OrbitalBackground";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import PredictionPage from "./pages/PredictionPage";
import ForecastPage from "./pages/ForecastPage";
import HealthRiskPage from "./pages/HealthRiskPage";
import ExplainPage from "./pages/ExplainPage";
import { getPredictions } from "./api";

function App() {
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [predictions, setPredictions] = useState([]);

  useEffect(() => {
    getPredictions('', '', 0, 20)
      .then(res => setPredictions(Array.isArray(res) ? res : []))
      .catch(() => {});
  }, []);

  return (
    <Router>
      <div className="relative min-h-screen bg-[#07090e] text-slate-100 overflow-x-hidden selection:bg-[#00E5B0]/30 selection:text-[#00E5B0]">
        <OrbitalBackground />
        
        <Navbar
          onToggleTimeline={() => setTimelineOpen((prev) => !prev)}
          timelineOpen={timelineOpen}
        />
        <TimelineDrawer
          open={timelineOpen}
          onClose={() => setTimelineOpen(false)}
          predictions={predictions}
        />

        <main className="relative z-10">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/prediction" element={<PredictionPage />} />
            <Route path="/forecast" element={<ForecastPage />} />
            <Route path="/health" element={<HealthRiskPage />} />
            <Route path="/explain/:id" element={<ExplainPage />} />
            <Route path="/explain" element={<ExplainPage />} />
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
