'use client';
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { motion } from 'motion/react';
import { Heart, Footprints } from 'lucide-react';
import { format } from 'date-fns';

type HealthData = {
  heart_rate: number;
  steps: number;
  timestamp: number;
};

export default function Dashboard() {
  const [data, setData] = useState<HealthData[]>([]);
  const [currentHR, setCurrentHR] = useState<number>(0);
  const [currentSteps, setCurrentSteps] = useState<number>(0);
  const [bgUrl, setBgUrl] = useState<string>('');
  const [bgBlur, setBgBlur] = useState<string>('backdrop-blur-md');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Allow custom background URL from environment variables, fallback to a cool dark abstract background
    setBgUrl(process.env.NEXT_PUBLIC_BACKGROUND_IMAGE_URL || 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop');
    setBgBlur(process.env.NEXT_PUBLIC_BACKGROUND_BLUR || 'backdrop-blur-md');
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      try {
        const payload: HealthData = JSON.parse(event.data);
        setCurrentHR(payload.heart_rate);
        setCurrentSteps(payload.steps);
        
        setData(prev => {
          const newData = [...prev, payload];
          // Keep last 100 data points for the chart
          if (newData.length > 100) {
            return newData.slice(newData.length - 100);
          }
          return newData;
        });
      } catch (err) {
        console.error('Error parsing WS message', err);
      }
    };
    
    return () => {
      ws.close();
    };
  }, []);

  // Format data for Recharts
  const chartData = data.map(d => ({
    time: format(new Date(d.timestamp), 'HH:mm:ss'),
    heartRate: d.heart_rate,
    steps: d.steps
  }));

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen text-white font-sans selection:bg-rose-500 selection:text-white">
      {/* Background Image with Acrylic Blur */}
      <div 
        className="fixed inset-0 z-[-1] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgUrl})` }}
      >
        <div className={`absolute inset-0 bg-black/40 ${bgBlur}`} />
      </div>

      <main className="max-w-7xl mx-auto px-6">
        {/* First Screen: Exact 100vh Fit */}
        <div className="min-h-screen flex flex-col">
          {/* Minimalist Header */}
          <header className="flex-none pt-12 pb-8 flex justify-center">
            <h1 className="text-xl md:text-2xl font-light tracking-widest text-white/70 uppercase">
              Tori的实时状态
            </h1>
          </header>

          {/* First Screen: Real-time Central Displays */}
          <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-16 md:gap-32">
          
          {/* Heart Rate Section */}
          <div className="flex flex-col items-center justify-center">
            <motion.div
              animate={{ 
                scale: [1, 1.15, 1],
              }}
              transition={{ 
                repeat: Infinity,
                duration: currentHR > 0 ? 60 / currentHR : 1, // dynamically adjust beating speed
                ease: "easeInOut"
              }}
              className="relative flex items-center justify-center w-40 h-40 md:w-48 md:h-48 rounded-full bg-rose-500/10 shadow-[0_0_80px_rgba(244,63,94,0.3)] mb-6 md:mb-8"
            >
              <div className="absolute inset-0 rounded-full border border-rose-500/30 animate-ping opacity-20" style={{ animationDuration: '3s' }} />
              <Heart className="w-20 h-20 md:w-24 md:h-24 text-rose-500 fill-rose-500" />
            </motion.div>
            
            <div className="flex items-baseline space-x-2">
              <span className="text-6xl md:text-7xl font-bold tracking-tighter">
                {currentHR.toFixed(0)}
              </span>
              <span className="text-xl md:text-2xl font-light text-white/50 uppercase tracking-widest">BPM</span>
            </div>
          </div>

          {/* Steps Section */}
          <div className="flex flex-col items-center justify-center">
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotateZ: [-5, 5, -5]
              }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: "easeInOut"
              }}
              className="flex items-center justify-center w-40 h-40 md:w-48 md:h-48 mb-6 md:mb-8 text-emerald-400"
            >
              <Footprints className="w-20 h-20 md:w-24 md:h-24" />
            </motion.div>
            
            <div className="flex items-baseline space-x-2">
              <span className="text-6xl md:text-7xl font-bold tracking-tight">
                {currentSteps.toFixed(0)}
              </span>
              <span className="text-xl md:text-2xl font-light text-white/50 uppercase tracking-widest">Steps</span>
            </div>
          </div>
          
        </div>

        {/* Scroll down prompt */}
        <div className="flex-none pb-12 flex justify-center">
          <motion.div 
            animate={{ y: [0, 10, 0] }} 
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-[1px] h-16 bg-gradient-to-b from-white/50 to-transparent"
          />
        </div>
      </div>

      {/* Second Screen: Statistics & Charts */}
      <div className="py-24 space-y-16">
          <h2 className="text-3xl font-light tracking-wide text-white/80 border-b border-white/10 pb-4">
            趋势统计 (Trends)
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Heart Rate Chart */}
            <div className="bg-black/20 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl">
              <div className="flex items-center space-x-3 mb-8">
                <Heart className="w-6 h-6 text-rose-500" />
                <h3 className="text-lg font-medium text-white/70">实时心率折线图</h3>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="time" 
                      stroke="rgba(255,255,255,0.3)" 
                      fontSize={12} 
                      tickMargin={10} 
                      minTickGap={30}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.3)" 
                      fontSize={12} 
                      domain={['auto', 'auto']}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        backdropFilter: 'blur(10px)'
                      }}
                      itemStyle={{ color: '#f43f5e' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="heartRate" 
                      stroke="#f43f5e" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorHr)" 
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Steps Chart */}
            <div className="bg-black/20 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl">
              <div className="flex items-center space-x-3 mb-8">
                <Footprints className="w-6 h-6 text-emerald-400" />
                <h3 className="text-lg font-medium text-white/70">实时步数记录</h3>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="time" 
                      stroke="rgba(255,255,255,0.3)" 
                      fontSize={12} 
                      tickMargin={10} 
                      minTickGap={30}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.3)" 
                      fontSize={12} 
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        backdropFilter: 'blur(10px)'
                      }}
                      itemStyle={{ color: '#34d399' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="steps" 
                      stroke="#34d399" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorSteps)" 
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
}
