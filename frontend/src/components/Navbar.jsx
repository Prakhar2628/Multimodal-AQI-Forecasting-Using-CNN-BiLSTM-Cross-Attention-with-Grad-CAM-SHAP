import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, LayoutDashboard, Activity, TrendingUp, Heart, Brain, Search, Clock, Menu, X, Wifi, WifiOff, CheckCircle2 } from 'lucide-react';
import { checkBackendHealth } from '../api';

const navLinks = [
  { name: 'Studio Overview', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { name: 'AQI Prediction', path: '/prediction', icon: <Activity className="w-4 h-4" /> },
  { name: 'Health & Risk', path: '/health', icon: <Heart className="w-4 h-4" /> },
  { name: '24H Simulator', path: '/forecast', icon: <TrendingUp className="w-4 h-4" /> },
  { name: 'Explainability Engine', path: '/explain', icon: <Brain className="w-4 h-4" /> },
];

const SEARCH_CITIES = ['Delhi', 'Mumbai', 'Bengaluru', 'Kolkata', 'Chennai', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Patna', 'Chandigarh'];

export default function Navbar({ onToggleTimeline, timelineOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      const ok = await checkBackendHealth();
      setIsConnected(ok);
    };
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const isActive = (path) => {
    if (path === '/explain') return location.pathname.startsWith('/explain');
    return location.pathname === path;
  };

  const filteredCities = SEARCH_CITIES.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSelectCitySearch = (city) => {
    setSearchQuery('');
    setSearchOpen(false);
    // Navigate to dashboard or prediction with selected city
    navigate(`/dashboard?city=${city}`);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-[#07090e]/85 backdrop-blur-2xl border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <div className="p-2 bg-[#00E5B0]/10 rounded-xl group-hover:bg-[#00E5B0]/20 transition-all border border-[#00E5B0]/30 shadow-[0_0_15px_rgba(0,229,176,0.2)]">
              <Leaf className="w-5 h-5 text-[#00E5B0]" />
            </div>
            <div>
              <span className="font-heading font-bold text-lg tracking-wider text-white flex items-center gap-1">
                AQI<span className="text-[#00E5B0]">.AI</span>
              </span>
              <span className="text-[10px] text-gray-400 block tracking-wider uppercase font-medium">Multimodal Studio</span>
            </div>
          </Link>

          {/* Working Global Navbar Search Dropdown */}
          <div className="hidden md:block relative w-64">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 focus-within:border-[#00E5B0]/50 transition-all">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search locations, reports..."
                value={searchQuery}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                className="bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none w-full"
              />
            </div>

            {/* Navbar Search Dropdown Popup */}
            {searchOpen && searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#07090e] border border-white/15 rounded-xl max-h-48 overflow-y-auto z-50 shadow-2xl p-1 backdrop-blur-2xl">
                {filteredCities.length > 0 ? (
                  filteredCities.map(c => (
                    <div
                      key={c}
                      onClick={() => handleSelectCitySearch(c)}
                      className="px-3 py-2 hover:bg-[#00E5B0]/15 hover:text-[#00E5B0] text-xs font-medium text-gray-200 rounded-lg cursor-pointer flex items-center justify-between"
                    >
                      <span>{c}</span>
                      <span className="text-[10px] text-gray-500 font-mono">View Telemetry</span>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-xs text-gray-500 text-center">No location found</div>
                )}
              </div>
            )}
          </div>

          {/* Nav Navigation Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                  isActive(link.path)
                    ? 'text-[#00E5B0] bg-[#00E5B0]/10 border border-[#00E5B0]/30 shadow-[0_0_15px_rgba(0,229,176,0.15)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.icon}
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right Action Icons & Status */}
          <div className="flex items-center gap-3">
            {/* Status indicator */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
              isConnected === null
                ? 'text-gray-400 border-gray-700 bg-gray-800/50'
                : isConnected
                ? 'text-[#00E5B0] border-[#00E5B0]/40 bg-[#00E5B0]/10'
                : 'text-red-400 border-red-500/40 bg-red-500/10'
            }`}>
              {isConnected === null ? (
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse" />
              ) : isConnected ? (
                <Wifi className="w-3.5 h-3.5" />
              ) : (
                <WifiOff className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{isConnected === null ? 'Connecting...' : isConnected ? 'Connected' : 'Offline'}</span>
            </div>

            {/* Timeline drawer toggle button */}
            {onToggleTimeline && (
              <button
                onClick={onToggleTimeline}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  timelineOpen
                    ? 'bg-[#00E5B0] text-[#07090e] border-[#00E5B0]'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:border-white/20'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Timeline</span>
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              className="lg:hidden p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white border border-white/10"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-[72px] left-0 right-0 z-40 bg-[#07090e]/95 backdrop-blur-2xl border-b border-white/10 p-4 flex flex-col gap-2 lg:hidden"
          >
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive(link.path) ? 'text-[#00E5B0] bg-[#00E5B0]/10 border border-[#00E5B0]/30' : 'text-gray-400 hover:text-white'
                }`}
              >
                {link.icon} {link.name}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
