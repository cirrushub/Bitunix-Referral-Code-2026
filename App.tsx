
import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navigation from './components/Navigation';
import FeatureGrid from './components/FeatureGrid';
import { fetchMarketingContent } from './services/geminiService';
import { MarketingContent } from './types';
import { trackEvent } from './lib/analytics';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';

const PriceTicker: React.FC<{ symbol: string; basePrice: number }> = ({ symbol, basePrice }) => {
  const [price, setPrice] = useState(basePrice);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const [trend, setTrend] = useState<'up' | 'down'>('up');

  useEffect(() => {
    // Simulating faster "live" updates
    const interval = setInterval(() => {
      const volatility = 0.0008; // 0.08% max move
      const change = (Math.random() - 0.5) * (basePrice * volatility);
      const newPrice = price + change;
      
      const moveDirection = newPrice > price ? 'up' : 'down';
      setTrend(moveDirection);
      setFlash(moveDirection);
      setPrice(newPrice);
      
      const timeout = setTimeout(() => setFlash(null), 600);
      return () => clearTimeout(timeout);
    }, 800 + Math.random() * 1200);

    return () => clearInterval(interval);
  }, [price, basePrice]);

  const percentChange = ((price - basePrice) / basePrice * 100).toFixed(2);
  const isUp = price >= basePrice;

  return (
    <div className={`flex flex-col p-4 rounded-2xl border transition-all duration-500 bg-slate-900/40 ${
      flash === 'up' ? 'border-green-500/40 bg-green-500/5 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 
      flash === 'down' ? 'border-red-500/40 bg-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 
      'border-slate-800/60'
    }`}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{symbol}</span>
        </div>
        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${isUp ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
          {isUp ? '↑' : '↓'} {Math.abs(parseFloat(percentChange))}%
        </span>
      </div>
      <div className={`text-xl font-mono font-bold tracking-tight transition-colors duration-300 ${
        flash === 'up' ? 'text-green-400' : flash === 'down' ? 'text-red-400' : 'text-white'
      }`}>
        ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
  );
};

const WithdrawalModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'input' | 'processing' | 'success'>('input');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (step === 'processing') {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setStep('success'), 500);
            return 100;
          }
          return prev + 2;
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [step]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 fade-in duration-300">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {step === 'input' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                ⚡
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">Simulate Instant Withdrawal</h3>
              <p className="text-slate-400 text-sm mt-2">Experience our industry-leading execution speed.</p>
            </div>
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Network Selection</label>
                <div className="flex items-center gap-3 text-white font-bold">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Mainnet Optimized (Default)
                </div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Simulated Amount</label>
                <div className="text-2xl font-black text-white">5,000.00 USDT</div>
              </div>
            </div>
            <button 
              onClick={() => setStep('processing')}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-600/20"
            >
              Start Execution
            </button>
          </div>
        )}

        {step === 'processing' && (
          <div className="text-center py-8 space-y-8">
            <div className="relative w-24 h-24 mx-auto">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-slate-800"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (progress / 100) * 251.2}
                  className="text-blue-500 transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-black text-white">
                {progress}%
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Bypassing Bottlenecks...</h3>
              <p className="text-slate-400 text-sm">Automated risk verification in progress.</p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-4 space-y-6">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-4xl text-green-500 mx-auto animate-bounce">
              ✓
            </div>
            <div>
              <h3 className="text-2xl font-black text-white">Execution Complete</h3>
              <p className="text-slate-400 text-sm mt-2 font-medium">Funds successfully transferred to the simulated wallet in <span className="text-blue-400 font-bold">1.4s</span>.</p>
            </div>
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-left">
              <div className="flex justify-between mb-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</span>
                <span className="text-[10px] font-black text-green-500 uppercase">Confirmed</span>
              </div>
              <div className="text-[10px] font-mono text-slate-500 break-all leading-tight">
                TXID: 0x72a...8c91f...f32b
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black transition-all"
            >
              Back to Exchange
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const TradingViewWidget: React.FC = () => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (container.current) {
      container.current.innerHTML = '';
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = JSON.stringify({
        "autosize": true,
        "symbol": "BINANCE:BTCUSDT",
        "interval": "60",
        "timezone": "Etc/UTC",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "enable_publishing": false,
        "allow_symbol_change": true,
        "calendar": false,
        "support_host": "https://www.tradingview.com",
        "backgroundColor": "rgba(2, 6, 23, 1)",
        "gridLineColor": "rgba(30, 41, 59, 0.5)",
        "hide_top_toolbar": false,
        "save_image": false,
        "container_id": "tradingview_chart_container"
      });
      container.current.appendChild(script);
    }
  }, []);

  return (
    <div className="w-full h-[500px] md:h-[650px] rounded-[32px] overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl shadow-blue-900/10">
      <div id="tradingview_chart_container" className="h-full w-full" ref={container}></div>
    </div>
  );
};

const HomePage: React.FC = () => {
  const [content, setContent] = useState<MarketingContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const REG_LINK = "https://bitunix.com/register?vipCode=BITUNIXBONUS&utm_source=3rdparty&utm_medium=github";

  useEffect(() => {
    const loadContent = async () => {
      try {
        const data = await fetchMarketingContent();
        setContent(data);
      } catch (error) {
        console.error("Failed to fetch marketing data:", error);
        setContent({
          headline: "Maximum 200x Leverage",
          subheadline: "Bitunix: The Fastest Growing Platform for Professional Traders.",
          rankClaim: "Ranked 7th on Global Trust Index",
          trustFactor: "Independently verified security and withdrawal speed that leads the industry.",
          features: [
            { 
              title: "Maximum 200x Leverage", 
              description: "Amplify your trading potential with industry-leading leverage across 150+ perpetual contract pairs.", 
              icon: "rocket", 
              badge: "HIGH YIELD",
              tooltip: "Leverage up to 200x is available on select perpetual contract pairs. Higher leverage carries higher risk."
            },
            { title: "Rapid-Fire Withdrawals", description: "Access your funds without the wait through our optimized automated withdrawal system for near-instant liquidity.", icon: "bolt", badge: "INSTANT" },
            { title: "Futures Grid Trading", description: "Automate your strategy 24/7 with professional-grade grid bots designed for volatile markets.", icon: "bot", badge: "NEW" },
            { title: "Top-Tier Security", description: "Join a platform ranked among the world's most trusted exchanges for transparency and asset protection.", icon: "shield", badge: "GLOBAL" }
          ]
        });
      } finally {
        setLoading(false);
      }
    };
    loadContent();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-blue-400 font-medium animate-pulse tracking-widest text-xs uppercase">Initializing Bitunix Pro...</p>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <header className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-30">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] bg-blue-600/10 blur-[180px] rounded-full"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-widest mb-10 animate-float">
               🛡️ {content?.rankClaim || "Ranked 7th Globally"}
            </div>
            
            <h1 className="text-6xl md:text-9xl font-black tracking-tighter mb-8 leading-[0.95] text-white">
              <span className="gradient-text">TRADE</span><br />SMARTER.
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-400 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
              {content?.subheadline}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <a 
                href={REG_LINK}
                className="w-full sm:w-auto px-16 py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-[24px] font-black text-xl transition-all transform hover:scale-105 shadow-2xl shadow-blue-600/40 active:scale-95"
              >
                Get Started
              </a>
              <div className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">Institutional Grade Trading</div>
            </div>
          </div>
        </div>
      </header>

      {/* Feature Grid Section */}
      {content && <FeatureGrid features={content.features} />}

      {/* Trading View & Live Ticker Section */}
      <section id="trading" className="py-24 bg-slate-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-12 mb-16">
            <div className="max-w-xl">
              <h2 className="text-5xl md:text-6xl font-black mb-6 text-white tracking-tighter">Live Markets</h2>
              <p className="text-slate-400 text-lg leading-relaxed font-medium">
                Stay ahead of the curve with real-time volatility monitoring. 
                Our high-frequency trading engine updates prices every 20ms for absolute precision.
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto">
              <PriceTicker symbol="BTC/USDT" basePrice={68422.50} />
              <PriceTicker symbol="ETH/USDT" basePrice={2645.12} />
              <PriceTicker symbol="SOL/USDT" basePrice={142.85} />
              <PriceTicker symbol="BNB/USDT" basePrice={592.40} />
              <PriceTicker symbol="XRP/USDT" basePrice={0.58} />
              <PriceTicker symbol="DOGE/USDT" basePrice={0.14} />
            </div>
          </div>
          
          <TradingViewWidget />
          
          <div className="mt-12 flex flex-wrap justify-center gap-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Live Connectivity: Active
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800">
              API Status: 100% Uptime
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800">
              Avg. Latency: 12ms
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Stats */}
      <section id="ranking" className="py-24 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10">
              <h2 className="text-5xl md:text-6xl font-black leading-tight text-white tracking-tighter">Global <br /><span className="text-blue-500">Infrastructure</span></h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-8 rounded-[32px] bg-slate-900/40 border border-slate-800/60 flex items-start gap-6 hover:border-blue-500/30 transition-all group">
                  <div className="w-12 h-12 flex-shrink-0 bg-blue-600/10 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-500">
                    ⚡
                  </div>
                  <div>
                    <div className="text-4xl font-black text-white mb-1 tracking-tighter">0.02s</div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Execution Speed</p>
                  </div>
                </div>
                
                <div className="p-8 rounded-[32px] bg-slate-900/40 border border-slate-800/60 flex items-start gap-6 hover:border-blue-500/30 transition-all group">
                  <div className="w-12 h-12 flex-shrink-0 bg-blue-600/10 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-500">
                    🛡️
                  </div>
                  <div>
                    <div className="text-4xl font-black text-white mb-1 tracking-tighter">100%</div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Asset Reserves</p>
                  </div>
                </div>
              </div>

              <p className="text-slate-400 text-lg leading-relaxed font-medium">
                Bitunix utilizes multi-signature cold wallets and hardware security modules (HSM) to protect user assets. Our system is built to handle over 100,000 orders per second.
              </p>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-blue-600/10 blur-[120px] rounded-full"></div>
              <div 
                onClick={() => setIsModalOpen(true)}
                className="relative bg-slate-900/40 backdrop-blur-3xl border border-slate-800 p-12 rounded-[48px] shadow-2xl cursor-pointer group hover:border-blue-500/50 transition-all duration-500"
              >
                 <div className="space-y-8">
                    <div className="flex justify-between items-center text-white">
                      <span className="font-black text-xl tracking-tight">Withdrawal Engine</span>
                      <span className="px-4 py-1.5 bg-green-500/10 text-green-500 text-[10px] font-black rounded-full uppercase tracking-widest border border-green-500/20">Active</span>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <span>Verification</span>
                        <span>100% Complete</span>
                      </div>
                      <div className="h-4 bg-slate-800/50 rounded-full overflow-hidden p-1">
                        <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full w-full shadow-[0_0_20px_rgba(37,99,235,0.5)] group-hover:shadow-[0_0_30px_rgba(37,99,235,0.8)] transition-shadow"></div>
                      </div>
                    </div>
                    <div className="p-6 bg-slate-950/50 rounded-3xl border border-slate-800 group-hover:bg-slate-950/80 transition-colors">
                      <p className="text-slate-400 text-sm leading-relaxed italic font-medium">
                        "Unrivaled speed. My 200x trade was executed instantly and withdrawal hit my wallet in under 2 minutes."
                      </p>
                      <div className="mt-4 flex justify-between items-center">
                        <div className="text-xs font-black text-blue-500 uppercase tracking-widest">— Verified Pro Trader</div>
                        <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                          Click to test engine
                          <svg className="w-3 h-3 animate-bounce-x" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                      </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WithdrawalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* CTA Final */}
      <section className="py-40 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-600">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 to-blue-700 opacity-90"></div>
           <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter">JOIN THE ELITE.</h2>
          <p className="text-blue-50 text-xl md:text-2xl mb-14 font-medium opacity-90 leading-relaxed">Exclusive VIP benefits including reduced fees and trading bonuses for new registrations via GitHub.</p>
          <a 
            href={REG_LINK}
            className="inline-block px-20 py-8 bg-white text-blue-600 hover:bg-slate-50 rounded-[32px] font-black text-3xl transition-all transform hover:scale-105 shadow-[0_20px_80px_rgba(255,255,255,0.3)] active:scale-95"
          >
            Register Now
          </a>
        </div>
      </section>

    </>
  );
};

const App: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen selection:bg-blue-500/30">
      <Navigation />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
      </Routes>
      <footer className="py-20 bg-slate-950 border-t border-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white text-xl italic shadow-lg shadow-blue-600/20">B</div>
            <span className="text-2xl font-black tracking-tighter text-white uppercase">BITUNIX</span>
          </div>
          <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] text-center md:text-left">
            © {new Date().getFullYear()} Bitunix Global Limited. High Risk. Professional Use Only.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
