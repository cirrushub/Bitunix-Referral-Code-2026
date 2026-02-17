
import React from 'react';
import { Link } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';

const Navigation: React.FC = () => {
  const REG_LINK = "https://bitunix.com/register?vipCode=BITUNIXBONUS&utm_source=3rdparty&utm_medium=github-article";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white italic">B</div>
              <span className="text-xl font-bold tracking-tight">BITUNIX</span>
            </Link>
            <Link to="/blog" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Blog
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#ranking" className="hover:text-white transition-colors">Trust</a>
            <a href="#trading" className="hover:text-white transition-colors">Trading</a>
          </div>
          <div>
            <a
              href={REG_LINK}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('cta_click', { button_label: 'nav_get_started', destination_url: REG_LINK })}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-sm font-semibold transition-all shadow-lg shadow-blue-900/20"
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
