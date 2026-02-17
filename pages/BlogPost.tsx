import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { fetchArticleList, fetchArticleContent, type ArticleFile } from '../lib/github-api';
import { parseFrontmatter } from '../lib/frontmatter';
import { trackEvent, updateSEO } from '../lib/analytics';

const AUTHOR = 'AlphaOnChain';
const REFERRAL_CODE = 'BITUNIXBONUS';
const REGISTER_URL = `https://bitunix.com/register?inviteCode=ab9nr3&vipCode=${REFERRAL_CODE}&utm_source=3rdparty&utm_medium=blog-article`;

function estimateReadingTime(text: string): number {
  const words = text.replace(/<[^>]*>/g, '').replace(/[#*\[\]()!`>|_~-]/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

const CTAWidget = ({ position = 'inline' }: { position?: string }) => (
  <div className="not-prose my-8 md:my-12 p-8 md:p-10 bg-slate-900/40 border border-slate-800/60 rounded-[32px] text-center">
    <h3 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight">Ready to Start Trading?</h3>
    <p className="text-slate-400 font-medium mb-6 md:mb-8 text-sm md:text-base">
      Use referral code <span className="text-blue-400 font-bold">{REFERRAL_CODE}</span> for up to 7,700 USDT bonus.
    </p>
    <a
      href={REGISTER_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent('blog_cta_click', { cta_position: position })}
      className="inline-flex items-center gap-2 px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-[24px] font-bold text-lg transition-all transform hover:scale-105 shadow-2xl shadow-blue-600/40 active:scale-95"
    >
      Claim Your Bonus
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
    </a>
  </div>
);

function processMarkdownContent(md: string): string {
  let processed = md;

  processed = processed.replace(/<\/?(header|main|section|footer|nav|aside)[^>]*>\s*/gi, '\n');
  processed = processed.replace(/<figure[^>]*>[\s\S]*?<\/figure>/gi, '\n\n');
  processed = processed.replace(/!\[[^\]]*\]\([^)]+\)/g, '');
  processed = processed.replace(/<div[^>]*>\s*\[([^\]]+)\]\(([^)]+)\)\s*<\/div>/gi, '\n\n[$1]($2)\n\n');

  processed = processed.replace(/<table[\s\S]*?<\/table>/gi, (table) => {
    return table
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  });

  processed = processed.replace(/(<\/(?:div|figure|table|p)>)([A-Za-z#*\[`_])/gi, '$1\n\n$2');
  processed = processed.replace(/^[^\n]+\n=+[ \t]*\n?/m, '');
  processed = processed.replace(/^#\s+[^\n]+\n*/m, '');

  processed = processed.replace(/^([^\n]+)\n-{2,}\s*$/gm, (_match, titleLine) => {
    const trimmed = titleLine.trim();
    if (!trimmed || /^[-=|`]/.test(trimmed)) return _match;
    return `## ${trimmed}`;
  });

  processed = processed.replace(/^(#{1,6}\s+.*)$/gm, (line) => {
    return line.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  });

  processed = processed.replace(/([^\n])\n(#{1,6}\s)/g, '$1\n\n$2');
  processed = processed.replace(/\n{3,}/g, '\n\n');

  return processed.trim();
}

const markdownComponents = {
  img: () => null,
  a: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  ),
};

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<ArticleFile | null>(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError('');

    fetchArticleList()
      .then((articles) => {
        const found = articles.find((a) => a.slug === decodeURIComponent(slug));
        if (!found) {
          setError('Article not found');
          setLoading(false);
          return;
        }
        setArticle(found);
        return fetchArticleContent(found.path);
      })
      .then((raw) => {
        if (!raw) return;
        const { frontmatter, content: md } = parseFrontmatter(raw);
        setTitle((frontmatter.title as string) || article?.title || '');
        setDate((frontmatter.date as string) || '');
        setCategories((frontmatter.categories as string[]) || []);
        setContent(md);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (title) {
      const desc = `Read "${title}" — crypto insights and trading guides. Use referral code BITUNIXBONUS for up to 7,700 USDT bonus on Bitunix.`;
      updateSEO({
        title: `${title} — Bitunix Blog`,
        description: desc.slice(0, 160),
        path: `/blog/${slug}`,
      });
      trackEvent('article_view', {
        article_title: title,
        article_slug: slug || '',
        article_categories: categories.join(', '),
      });
    }
  }, [title, slug, categories]);

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-24 px-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-6 text-slate-400 font-medium">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-32 pb-24 px-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-300 text-xl mb-6 font-bold">{error}</p>
          <Link to="/blog" className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-2 font-bold">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            Back to Articles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 md:pt-32 pb-20 md:pb-24 px-4 md:px-6">
      <article className="max-w-3xl mx-auto">
        {/* Back link */}
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-400 transition-colors mb-8 md:mb-12 text-[10px] font-black uppercase tracking-[0.3em]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
          Articles
        </Link>

        {/* Title */}
        <h1 className="text-3xl md:text-5xl font-black mb-6 md:mb-8 leading-tight tracking-tighter text-white">{title || article?.title}</h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 md:gap-6 mb-8 md:mb-12 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-800/60 pb-6 md:pb-8">
          <span className="flex items-center gap-2 text-slate-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {AUTHOR}
          </span>
          {date && (
            <span className="flex items-center gap-2 text-slate-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {date}
            </span>
          )}
          {content && (
            <span className="flex items-center gap-2 text-slate-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {estimateReadingTime(content)} min read
            </span>
          )}
          {categories.map((cat) => (
            <span
              key={cat}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400"
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Markdown content */}
        <div className="prose prose-invert prose-base md:prose-lg prose-blog max-w-none prose-headings:font-black prose-headings:tracking-tight prose-p:font-medium prose-p:leading-relaxed prose-p:text-slate-400 prose-li:font-medium prose-li:text-slate-400">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={markdownComponents}>
            {processMarkdownContent(content)}
          </ReactMarkdown>
        </div>

        {/* CTA */}
        <div className="mt-20 border-t border-slate-800/60 pt-4">
          <CTAWidget position="bottom" />
        </div>

        {/* Back to blog */}
        <div className="mt-12 text-center">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-400 transition-colors text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            All Articles
          </Link>
        </div>
      </article>
    </div>
  );
}
