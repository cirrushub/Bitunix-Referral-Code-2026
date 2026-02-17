export interface Frontmatter {
  title?: string;
  date?: string;
  categories?: string[];
  [key: string]: unknown;
}

export function parseFrontmatter(raw: string): { frontmatter: Frontmatter; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, content: raw };

  const yaml = match[1];
  const content = match[2];
  const frontmatter: Frontmatter = {};

  for (const line of yaml.split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (value.startsWith('[') && value.endsWith(']')) {
      frontmatter[key] = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''));
    } else {
      frontmatter[key] = value;
    }
  }

  if (typeof frontmatter.categories === 'string') {
    frontmatter.categories = [frontmatter.categories];
  }

  return { frontmatter, content };
}
