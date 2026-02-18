export interface ArticleFile {
  path: string;
  slug: string;
  title: string;
  date?: string;
  excerpt?: string;
}

interface GitHubTreeItem {
  path: string;
  mode: string;
  type: string;
  sha: string;
  size?: number;
  url: string;
}

const REPO_OWNER = 'OrderBookX';
const REPO_NAME = 'articles';
const BRANCH = 'main';
const CACHE_KEY = 'blog_article_list';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const contentCache = new Map<string, string>();

function slugFromFilename(filename: string): string {
  return filename.replace(/\.md$/i, '');
}

function titleFromFilename(filename: string): string {
  return filename
    .replace(/\.md$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/^(\w+)\s+\1\b/i, '$1');
}

export async function fetchArticleList(): Promise<ArticleFile[]> {
  const cached = sessionStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) {
        return data;
      }
    } catch {
      // Invalid cache
    }
  }

  const res = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${BRANCH}?recursive=1`
  );

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status}`);
  }

  const data = await res.json();
  const items: GitHubTreeItem[] = data.tree || [];

  const articles: ArticleFile[] = [];

  for (const item of items) {
    if (
      item.type === 'blob' &&
      item.path.endsWith('.md') &&
      !item.path.includes('/') &&
      item.path !== 'README.md'
    ) {
      const filename = item.path;
      articles.push({
        path: item.path,
        slug: slugFromFilename(filename),
        title: titleFromFilename(filename),
      });
    }
  }

  articles.sort((a, b) => a.title.localeCompare(b.title));

  sessionStorage.setItem(
    CACHE_KEY,
    JSON.stringify({ data: articles, timestamp: Date.now() })
  );

  return articles;
}

export async function fetchArticleContent(path: string): Promise<string> {
  if (contentCache.has(path)) {
    return contentCache.get(path)!;
  }

  const url = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${encodeURIComponent(path)}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch article: ${res.status}`);
  }

  const content = await res.text();
  contentCache.set(path, content);
  return content;
}
