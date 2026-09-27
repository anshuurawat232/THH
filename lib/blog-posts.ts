export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  keyword: string;
  category: string;
  image: string;
  published: boolean;
  updatedAt: string;
};

export const BLOG_POSTS_KEY = 'the-himalayan-hikes-blog-posts';

export function makeBlogSlug(title: string) {
  return title.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

export function normalizeBlogPosts(value: unknown): BlogPost[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is BlogPost => Boolean(item && typeof item === 'object' && typeof item.title === 'string' && typeof item.content === 'string')).map(item => ({
    id: String(item.id || makeBlogSlug(item.title)), title: item.title.slice(0, 120), slug: makeBlogSlug(item.slug || item.title),
    excerpt: String(item.excerpt || '').slice(0, 280), content: String(item.content || '').slice(0, 12000),
    keyword: String(item.keyword || '').slice(0, 100), category: String(item.category || 'Trail guide').slice(0, 50),
    image: String(item.image || ''), published: Boolean(item.published), updatedAt: String(item.updatedAt || ''),
  }));
}
