
import React from 'react';
import { useInView } from 'react-intersection-observer';
import { FeatureData } from '../types';

interface FeatureCardProps {
  feature: FeatureData;
  index: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ feature, index }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const getIcon = (idx: number) => {
    switch(idx) {
      case 0: return '🚀';
      case 1: return '⚡';
      case 2: return '🤖';
      case 3: return '🛡️';
      default: return '📊';
    }
  };

  return (
    <div 
      ref={ref}
      style={{ transitionDelay: `${index * 100}ms` }}
      className={`relative p-8 rounded-[32px] bg-slate-900/40 border border-slate-800/50 hover:border-blue-500/30 transition-all duration-1000 group overflow-visible ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
    >
      {/* Tooltip implementation */}
      {feature.tooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-64 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-50">
          <div className="bg-slate-800 border border-slate-700 p-3 rounded-2xl shadow-2xl text-[11px] leading-relaxed text-slate-200 font-medium">
            {feature.tooltip}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 border-r border-b border-slate-700 rotate-45 -mt-1.5"></div>
          </div>
        </div>
      )}

      {/* Icon Container with pop-in animation */}
      <div className={`w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-3xl mb-6 transition-all duration-500 group-hover:scale-110 ${
        inView ? 'animate-icon-pop opacity-100' : 'opacity-0'
      }`} style={{ animationDelay: `${(index * 150) + 300}ms` }}>
        {getIcon(index)}
      </div>

      {/* Title & Badge */}
      <div className="flex flex-col gap-3 mb-4">
        <h3 className="text-xl md:text-2xl font-bold leading-tight text-white">
          {feature.title}
        </h3>
        {feature.badge && (
          <div className="flex-shrink-0">
            <span className="inline-flex items-center justify-center h-6 px-3 rounded-full bg-blue-600 text-[9px] font-black uppercase tracking-wider text-white whitespace-nowrap shadow-lg shadow-blue-600/20">
              {feature.badge}
            </span>
          </div>
        )}
      </div>

      <p className="text-slate-400 text-sm leading-relaxed mb-4">
        {feature.description}
      </p>
      
      {/* Decorative Subtle Gradient */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-600/5 blur-3xl rounded-full group-hover:bg-blue-600/10 transition-colors pointer-events-none"></div>
    </div>
  );
};

interface FeatureGridProps {
  features: FeatureData[];
}

const FeatureGrid: React.FC<FeatureGridProps> = ({ features }) => {
  return (
    <section id="features" className="py-24 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-white">Professional Trading Ecosystem</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">Four core pillars of the Bitunix experience, engineered for performance.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <FeatureCard key={idx} feature={feature} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;
