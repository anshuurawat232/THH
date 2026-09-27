'use client';

import { useEffect, useState } from 'react';
import { BLOG_POSTS_KEY, BlogPost, normalizeBlogPosts } from '../lib/blog-posts';

export function PublishedBlogPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  useEffect(() => {
    try { setPosts(normalizeBlogPosts(JSON.parse(localStorage.getItem(BLOG_POSTS_KEY) || '[]')).filter(post => post.published)); }
    catch { setPosts([]); }
  }, []);
  if (!posts.length) return null;
  return <section className="blog-section admin-published-posts" aria-labelledby="recent-blog-heading"><span className="eyebrow">Fresh from the trail</span><h2 id="recent-blog-heading">Latest Himalayan trekking stories</h2><p>New field notes and guides from The Himalayan Hikes.</p><div className="blog-route-grid">{posts.map(post => <article className="blog-route published-blog-card" key={post.id}>{post.image && <img src={post.image} alt="" loading="lazy"/>}<span className="tag">{post.category}</span><h3>{post.title}</h3><p>{post.excerpt}</p><details><summary>Read article</summary><div className="published-blog-copy">{post.content.split(/\n\s*\n/).map((paragraph, index) => <p key={`${post.id}-${index}`}>{paragraph}</p>)}</div></details></article>)}</div></section>;
}
