'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Check, FilePlus2, Pencil, Send, Trash2 } from 'lucide-react';
import { BLOG_POSTS_KEY, BlogPost, makeBlogSlug, normalizeBlogPosts } from '../lib/blog-posts';

const emptyPost = { title: '', excerpt: '', content: '', keyword: '', category: 'Trail guide', image: '', published: false };

export function AdminBlogEditor() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [draft, setDraft] = useState(emptyPost);
  const [editingId, setEditingId] = useState('');
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    try { setPosts(normalizeBlogPosts(JSON.parse(localStorage.getItem(BLOG_POSTS_KEY) || '[]'))); }
    catch { setPosts([]); }
    setReady(true);
  }, []);

  const savePosts = (next: BlogPost[]) => {
    setPosts(next);
    localStorage.setItem(BLOG_POSTS_KEY, JSON.stringify(next));
    setMessage('Saved in this browser.');
    window.setTimeout(() => setMessage(''), 2800);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.title.trim() || !draft.content.trim()) return;
    const now = new Date().toISOString();
    const existing = posts.find(post => post.id === editingId);
    const post: BlogPost = { ...draft, title: draft.title.trim(), slug: makeBlogSlug(draft.title), excerpt: draft.excerpt.trim() || draft.content.trim().slice(0, 180), content: draft.content.trim(), keyword: draft.keyword.trim(), category: draft.category.trim() || 'Trail guide', image: draft.image.trim(), id: existing?.id || `${makeBlogSlug(draft.title)}-${Date.now()}`, updatedAt: now };
    savePosts([post, ...posts.filter(item => item.id !== post.id)]);
    setDraft(emptyPost);
    setEditingId('');
  };

  const edit = (post: BlogPost) => {
    setDraft({ title: post.title, excerpt: post.excerpt, content: post.content, keyword: post.keyword, category: post.category, image: post.image, published: post.published });
    setEditingId(post.id);
    document.getElementById('admin-blog-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!ready) return <section className="card pad admin-blog-panel">Loading blog editor…</section>;
  return <section className="card pad admin-blog-panel" id="admin-blog-editor">
    <div className="row admin-blog-heading"><div><span className="eyebrow">Content studio</span><h2>Write a trekking blog</h2><p className="muted">Draft daily trail guides, publish them to the blog on this device, or save them to finish later.</p></div><FilePlus2 size={25}/></div>
    <div className="notice admin-storage-note">Blog posts are saved in this browser for this demo. Shared publishing across visitors needs authenticated admin access and a persistent server database.</div>
    <form className="admin-blog-form" onSubmit={submit}>
      <label>Post title<input className="field" required maxLength={120} value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} placeholder="e.g. A spring guide to Dayara Bugyal"/></label>
      <label>Excerpt<input className="field" maxLength={280} value={draft.excerpt} onChange={event => setDraft({ ...draft, excerpt: event.target.value })} placeholder="A clear summary for readers and search previews"/></label>
      <div className="admin-blog-fields"><label>Primary keyword<input className="field" value={draft.keyword} onChange={event => setDraft({ ...draft, keyword: event.target.value })} placeholder="e.g. Dayara Bugyal trek"/></label><label>Category<input className="field" value={draft.category} onChange={event => setDraft({ ...draft, category: event.target.value })} placeholder="Trail guide"/></label></div>
      <label>Cover image URL<input className="field" type="url" value={draft.image} onChange={event => setDraft({ ...draft, image: event.target.value })} placeholder="https://… (optional)"/></label>
      <label>Article body<textarea className="field admin-blog-body" required value={draft.content} onChange={event => setDraft({ ...draft, content: event.target.value })} placeholder="Write useful, original trail information. Use a new paragraph for each section."/></label>
      <label className="admin-publish-toggle"><input type="checkbox" checked={draft.published} onChange={event => setDraft({ ...draft, published: event.target.checked })}/><span><b>Publish this post</b><small>Published posts appear in the Trek Blog section.</small></span></label>
      <div className="admin-row-actions"><button className="btn btn-dark" type="submit">{draft.published ? <Send size={16}/> : <FilePlus2 size={16}/>} {editingId ? 'Save post' : draft.published ? 'Publish post' : 'Save draft'}</button>{editingId && <button className="btn btn-outline" type="button" onClick={() => { setEditingId(''); setDraft(emptyPost); }}>Cancel edit</button>}{message && <span className="admin-save-message" role="status"><Check size={16}/> {message}</span>}</div>
    </form>
    <div className="admin-blog-list"><h3>Your posts <span className="tag">{posts.length}</span></h3>{posts.length ? posts.map(post => <article className="admin-blog-row" key={post.id}><div><span className={`tag ${post.published ? 'admin-published' : ''}`}>{post.published ? 'Published' : 'Draft'}</span><b>{post.title}</b><small>{post.category} · {new Date(post.updatedAt).toLocaleDateString('en-IN')}</small></div><div className="admin-row-actions"><button className="icon-button" aria-label={`Edit ${post.title}`} onClick={() => edit(post)}><Pencil size={17}/></button><button className="icon-button" aria-label={`${post.published ? 'Unpublish' : 'Publish'} ${post.title}`} onClick={() => savePosts(posts.map(item => item.id === post.id ? { ...item, published: !item.published, updatedAt: new Date().toISOString() } : item))}>{post.published ? <FilePlus2 size={17}/> : <Send size={17}/>}</button><button className="icon-button" aria-label={`Delete ${post.title}`} onClick={() => savePosts(posts.filter(item => item.id !== post.id))}><Trash2 size={17}/></button></div></article>) : <p className="muted">No posts yet. Write your first trekking guide above.</p>}</div>
  </section>;
}
