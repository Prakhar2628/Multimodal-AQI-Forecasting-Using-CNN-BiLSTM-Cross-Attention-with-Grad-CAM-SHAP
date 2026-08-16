import { Globe, Mail, Share2, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-background/80 backdrop-blur-md py-12 relative z-10">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8">
        
        <div className="md:col-span-2">
          <span className="font-heading font-bold text-xl tracking-wider text-white mb-4 block">
            AQI <span className="text-[#00E5B0]">INTELLIGENCE</span>
          </span>
          <p className="text-gray-400 text-sm max-w-sm mb-6">
            Building the future of environmental monitoring with multimodal deep learning and real-time sensor networks.
          </p>
          <div className="flex gap-4">
            <SocialIcon icon={<Globe className="w-5 h-5" />} />
            <SocialIcon icon={<Mail className="w-5 h-5" />} />
            <SocialIcon icon={<Share2 className="w-5 h-5" />} />
            <SocialIcon icon={<ExternalLink className="w-5 h-5" />} />
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4">Platform</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><a href="/dashboard" className="hover:text-[#00E5B0] transition-colors">Dashboard</a></li>
            <li><a href="/prediction" className="hover:text-[#00E5B0] transition-colors">Prediction Engine</a></li>
            <li><a href="/forecast" className="hover:text-[#00E5B0] transition-colors">24H Forecast</a></li>
            <li><a href="/health" className="hover:text-[#00E5B0] transition-colors">Health Risk</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4">Legal</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><a href="#" className="hover:text-[#00E5B0] transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-[#00E5B0] transition-colors">Terms of Service</a></li>
            <li><a href="#" className="hover:text-[#00E5B0] transition-colors">Data Processing</a></li>
          </ul>
        </div>

      </div>
      <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-white/5 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} AQI Intelligence. All rights reserved.
      </div>
    </footer>
  );
}

function SocialIcon({ icon }) {
  return (
    <a href="#" className="p-2 glass-card text-gray-400 hover:text-[#00E5B0] transition-all">
      {icon}
    </a>
  );
}
