import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function ChartsSection() {
  const timelineData = [
    { time: '00:00', aqi: 45, pm25: 12 },
    { time: '04:00', aqi: 38, pm25: 10 },
    { time: '08:00', aqi: 65, pm25: 25 },
    { time: '12:00', aqi: 85, pm25: 35 },
    { time: '16:00', aqi: 72, pm25: 28 },
    { time: '20:00', aqi: 55, pm25: 18 },
  ];

  const historicalData = [
    { day: 'Mon', value: 42 },
    { day: 'Tue', value: 58 },
    { day: 'Wed', value: 75 },
    { day: 'Thu', value: 65 },
    { day: 'Fri', value: 48 },
    { day: 'Sat', value: 35 },
    { day: 'Sun', value: 40 },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/90 backdrop-blur-md border border-white/10 p-3 rounded-lg shadow-xl">
          <p className="text-white font-medium mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm flex items-center gap-2" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <section className="py-24 relative z-10" id="analytics">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Advanced <span className="text-gradient">Analytics</span>
          </h2>
          <p className="text-gray-400 max-w-xl">
            Dive deep into historical trends and real-time fluctuations with our interactive, high-performance charting tools.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Main Chart - Spans 2 columns */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2 glass-card p-6"
          >
            <h3 className="text-lg font-bold text-white mb-6">24h AQI Timeline</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00E5B0" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00E5B0" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="time" stroke="#666" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
                  <YAxis stroke="#666" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="aqi" name="AQI" stroke="#00E5B0" strokeWidth={3} fillOpacity={1} fill="url(#colorAqi)" />
                  <Line type="monotone" dataKey="pm25" name="PM2.5" stroke="#00FFC6" strokeWidth={2} dot={{ r: 4, fill: '#00FFC6', strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Secondary Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 flex flex-col"
          >
            <h3 className="text-lg font-bold text-white mb-6">Weekly Average</h3>
            <div className="flex-1 w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historicalData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="day" stroke="#666" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
                  <YAxis stroke="#666" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Avg AQI" fill="#00E5B0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
