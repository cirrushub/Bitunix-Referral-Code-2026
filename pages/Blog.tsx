import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchArticleList, fetchArticleContent, type ArticleFile } from '../lib/github-api';
import { parseFrontmatter } from '../lib/frontmatter';
import { trackEvent, updateSEO } from '../lib/analytics';
import { rewriteUtmParams } from '../lib/rewrite-utm';

const PER_PAGE = 24;
const ENRICHED_CACHE_KEY = 'blog_articles_enriched';
const ENRICHED_CACHE_TTL = 10 * 60 * 1000;

const REGISTER_LINK = "https://bitunix.com/register?vipCode=BITUNIXBONUS&utm_source=3rdparty&utm_medium=blog-page";

function extractExcerpt(raw: string, maxLen = 120): string {
  const { content } = parseFrontmatter(rewriteUtmParams(raw));
  let text = content
    .replace(/^[^\n]+\n=+\s*\n?/m, '')
    .replace(/^#\s+[^\n]+\n*/m, '')
    .replace(/<figure[^>]*>.*?<\/figure>/gi, '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[#*`>|~_]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();

  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 20);
  const first = (paragraphs[0] || '').replace(/\s+/g, ' ').trim();
  if (first.length <= maxLen) return first;
  return first.slice(0, maxLen).replace(/\s\S*$/, '') + '...';
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffWeeks < 5) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
}

async function fetchEnrichedArticles(): Promise<ArticleFile[]> {
  const cached = sessionStorage.getItem(ENRICHED_CACHE_KEY);
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < ENRICHED_CACHE_TTL) return data;
    } catch {}
  }

  const articles = await fetchArticleList();
  const batchSize = 20;

  for (let i = 0; i < articles.length; i += batchSize) {
    await Promise.all(
      articles.slice(i, i + batchSize).map(async (article) => {
        try {
          const raw = await fetchArticleContent(article.path);
          const { frontmatter } = parseFrontmatter(raw);
          article.date = (frontmatter.date as string) || '';
          article.excerpt = extractExcerpt(raw);
        } catch {
          article.date = '';
          article.excerpt = '';
        }
      })
    );
  }

  const today = new Date().toISOString().split('T')[0];
  articles.sort((a, b) => {
    const dateA = a.date || today;
    const dateB = b.date || today;
    const cmp = dateB.localeCompare(dateA);
    if (cmp !== 0) return cmp;
    return a.title.localeCompare(b.title);
  });

  sessionStorage.setItem(
    ENRICHED_CACHE_KEY,
    JSON.stringify({ data: articles, timestamp: Date.now() })
  );

  return articles;
}

function ArticleCard({ article }: { article: ArticleFile }) {
  const relative = article.date ? timeAgo(article.date) : '';

  return (
    <Link
      to={`/blog/${encodeURIComponent(article.slug)}`}
      className="group block p-8 bg-slate-900/40 border border-slate-800/60 rounded-[32px] hover:border-blue-500/30 transition-all duration-500"
      onClick={() => trackEvent('article_click', { article_title: article.title, article_slug: article.slug })}
    >
      <h2 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors leading-snug mb-2 tracking-tight">
        {article.title}
      </h2>
      {relative && (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">
          {relative}
        </span>
      )}
      {article.excerpt && (
        <p className="text-sm text-slate-400 leading-relaxed font-medium line-clamp-2">{article.excerpt}</p>
      )}
    </Link>
  );
}

export default function Blog() {
  const [articles, setArticles] = useState<ArticleFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [visible, setVisible] = useState(PER_PAGE);

  useEffect(() => {
    updateSEO({
      title: 'Crypto Blog — Bitunix Referral Code 2026',
      description: 'Latest crypto insights, trading guides, and market analysis. Use referral code BITUNIXBONUS for up to 7,700 USDT bonus.',
      path: '/blog',
    });
    trackEvent('page_view', { page_title: 'Blog', page_path: '/blog' });
    fetchEnrichedArticles()
      .then(setArticles)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return articles;
    const q = search.toLowerCase();
    return articles.filter((a) => a.title.toLowerCase().includes(q));
  }, [articles, search]);

  const shown = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  useEffect(() => {
    setVisible(PER_PAGE);
  }, [search]);

  return (
    <div className="min-h-screen pt-32 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8">
            Knowledge Base
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 text-white">
            Crypto <span className="gradient-text">Articles</span>
          </h1>
          <p className="text-slate-400 text-lg font-medium max-w-xl mx-auto">
            Latest insights, guides, and analysis from the crypto world.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-16">
          <div className="relative">
            <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => {
                const val = e.target.value;
                setSearch(val);
                if (val.length >= 3) {
                  trackEvent('blog_search', { search_term: val });
                }
              }}
              className="w-full pl-14 pr-6 py-4 bg-slate-900/40 border border-slate-800/60 rounded-full text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors font-medium"
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-6 text-slate-400 font-medium">Loading articles...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-20">
            <p className="text-slate-300 mb-2 font-medium">Failed to load articles</p>
            <p className="text-slate-500 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Articles Grid */}
        {!loading && !error && (
          <>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8">
              {filtered.length} article{filtered.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shown.map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16">
                <p className="text-slate-500 font-medium">No articles match your search.</p>
              </div>
            )}

            {hasMore && (
              <div className="text-center mt-16">
                <button
                  onClick={() => {
                    setVisible((v) => v + PER_PAGE);
                    trackEvent('blog_load_more', { new_visible: visible + PER_PAGE });
                  }}
                  className="px-12 py-4 bg-slate-900/40 border border-slate-800/60 hover:border-blue-500/30 text-white rounded-full font-bold text-lg transition-all transform hover:scale-[1.02]"
                >
                  Load More ({filtered.length - visible} remaining)
                </button>
              </div>
            )}
          </>
        )}

        {/* Blog CTA */}
        <div className="mt-20 text-center border-t border-slate-800/60 pt-20">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">Ready to start trading?</h2>
          <p className="text-slate-400 font-medium mb-8 max-w-md mx-auto">
            Use code <span className="text-blue-400 font-bold">BITUNIXBONUS</span> for up to 7,700 USDT bonus.
          </p>
          <a
            href={REGISTER_LINK}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('blog_cta_click', { cta_position: 'blog-listing' })}
            className="inline-block px-16 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-[24px] font-black text-xl transition-all transform hover:scale-105 shadow-2xl shadow-blue-600/40 active:scale-95"
          >
            Claim Your Bonus
          </a>
        </div>
      </div>
    </div>
  );
}
