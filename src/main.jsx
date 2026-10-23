import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';
import {
  Search, Plus, Film, Tv, Sparkles, BookOpen, Gamepad2, LayoutDashboard,
  LibraryBig, SlidersHorizontal, Star, Upload, Download, Pencil, Trash2,
  X, Check, Cloud, CloudOff, LogIn, LogOut, LoaderCircle, Bookmark, Clapperboard
} from 'lucide-react';
import './styles.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
console.log("Supabase URL:", supabaseUrl);
console.log("Supabase key loaded:", Boolean(supabaseKey));
const supabase = supabaseUrl && supabaseKey && !supabaseUrl.includes('YOUR_PROJECT')
  ? createClient(supabaseUrl, supabaseKey) : null;

const TYPES = ['Movie', 'TV/Web Series', 'Anime', 'Book', 'Manga', 'Game'];
const STATUSES = ['To Watch', 'Watching', 'Completed', 'On Hold', 'Dropped', 'Wishlist', 'Playing', 'Reading'];
const EMPTY = { title:'', item_type:'Movie', year:'', genres:'', platform:'', status:'To Watch', rating:'', poster_url:'', synopsis:'', notes:'' };
const SEED = [
  {id:'demo-1', title:'The Terminal List', item_type:'TV/Web Series', year:2022, genres:['Action','Thriller'], platform:'Prime Video', status:'To Watch', rating:null, poster_url:'', synopsis:'A Navy SEAL investigates a conspiracy after his entire platoon is ambushed.', notes:'Demo item — replace or delete it.'},
  {id:'demo-2', title:'I Parry Everything', item_type:'Anime', year:2024, genres:['Action','Fantasy'], platform:'', status:'To Watch', rating:null, poster_url:'', synopsis:'', notes:'Demo item — replace or delete it.'},
  {id:'demo-3', title:'Person of Interest', item_type:'TV/Web Series', year:2011, genres:['Crime','Drama','Sci-Fi'], platform:'', status:'Watching', rating:8, poster_url:'', synopsis:'', notes:'Demo item — replace or delete it.'},
  {id:'demo-4', title:'The Sorcerer’s Apprentice', item_type:'Movie', year:2010, genres:['Fantasy','Adventure'], platform:'', status:'Completed', rating:7.5, poster_url:'', synopsis:'', notes:'Demo item — replace or delete it.'}
];

function App() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState(SEED);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [cloudMode, setCloudMode] = useState(Boolean(supabase));
  const [authOpen, setAuthOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [genreFilter, setGenreFilter] = useState('All');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState('Library');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!supabase) { setLoading(false); setCloudMode(false); return; }
    supabase.auth.getSession().then(({data}) => setUser(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !user) { if (!user) { setItems(SEED); setLoading(false); } return; }
    let alive = true;
    setLoading(true);
    supabase.from('library_items').select('*').order('created_at', {ascending:false})
      .then(({data,error}) => {
        if (!alive) return;
        if (error) setMessage('Could not load cloud library: ' + error.message);
        else setItems(data || []);
        setLoading(false);
      });
    return () => { alive = false; };
  }, [user]);

  const genres = useMemo(() => ['All', ...new Set(items.flatMap(i => i.genres || []).filter(Boolean).sort())], [items]);
  const platforms = useMemo(() => ['All', ...new Set(items.map(i => i.platform).filter(Boolean).sort())], [items]);
  const filtered = useMemo(() => {
    let list = items.filter(i => {
      const hay = [i.title, i.synopsis, i.notes, i.platform, ...(i.genres || [])].join(' ').toLowerCase();
      return (!query || hay.includes(query.toLowerCase()))
        && (typeFilter === 'All' || i.item_type === typeFilter)
        && (statusFilter === 'All' || i.status === statusFilter)
        && (genreFilter === 'All' || (i.genres || []).includes(genreFilter))
        && (platformFilter === 'All' || i.platform === platformFilter)
        && (page !== 'Dashboard' || true);
    });
    if (sort === 'title') list.sort((a,b)=>a.title.localeCompare(b.title));
    else if (sort === 'rating') list.sort((a,b)=>(Number(b.rating)||0)-(Number(a.rating)||0));
    else if (sort === 'year') list.sort((a,b)=>(Number(b.year)||0)-(Number(a.year)||0));
    return list;
  }, [items, query, typeFilter, statusFilter, genreFilter, platformFilter, sort, page]);

  const stats = useMemo(() => ({
    total: items.length,
    completed: items.filter(i => ['Completed'].includes(i.status)).length,
    progress: items.filter(i => ['Watching','Reading','Playing'].includes(i.status)).length,
    planned: items.filter(i => ['To Watch','Wishlist'].includes(i.status)).length,
    rated: items.filter(i => i.rating !== null && i.rating !== '' && Number(i.rating)>0),
    byType: TYPES.map(t => ({type:t, count:items.filter(i=>i.item_type===t).length})),
    byGenre: Object.entries(items.flatMap(i=>i.genres||[]).reduce((acc,g)=>(acc[g]=(acc[g]||0)+1,acc),{})).sort((a,b)=>b[1]-a[1]).slice(0,6)
  }), [items]);

  async function signIn(e) {
    e.preventDefault(); setAuthMessage('');
    if (!supabase) { setAuthMessage('Cloud is not configured yet. Follow README setup instructions first.'); return; }
    const {error} = await supabase.auth.signInWithPassword({email:authEmail,password:authPassword});
    if (error) setAuthMessage(error.message);
  }
  async function signUp(e) {
    e.preventDefault(); setAuthMessage('');
    if (!supabase) { setAuthMessage('Cloud is not configured yet. Follow README setup instructions first.'); return; }
    const {error} = await supabase.auth.signUp({email:authEmail,password:authPassword});
    setAuthMessage(error ? error.message : 'Account created. Check your email if confirmation is enabled, then sign in.');
  }
  async function logout() { await supabase?.auth.signOut(); setUser(null); setAuthOpen(false); }
  function openAdd() { setEditing(null); setForm(EMPTY); setModal(true); }
  function openEdit(item) {
    setEditing(item);
    setForm({...EMPTY, ...item, year:item.year ?? '', rating:item.rating ?? '', genres:(item.genres||[]).join(', ')});
    setModal(true);
  }
  async function saveItem(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true); setMessage('');
    const payload = {
      title:form.title.trim(), item_type:form.item_type, year:form.year ? Number(form.year) : null,
      genres:form.genres.split(',').map(x=>x.trim()).filter(Boolean), platform:form.platform.trim(),
      status:form.status, rating:form.rating === '' ? null : Number(form.rating),
      poster_url:form.poster_url.trim(), synopsis:form.synopsis.trim(), notes:form.notes.trim()
    };
    if (supabase && user) {
      const request = editing
        ? supabase.from('library_items').update({...payload, updated_at:new Date().toISOString()}).eq('id',editing.id).select().single()
        : supabase.from('library_items').insert({...payload,user_id:user.id}).select().single();
      const {data,error} = await request;
      if (error) setMessage('Save failed: ' + error.message);
      else setItems(prev => editing ? prev.map(x=>x.id===editing.id?data:x) : [data,...prev]);
    } else {
      const newItem = {...payload, id:editing?.id || crypto.randomUUID(), created_at:editing?.created_at || new Date().toISOString()};
      setItems(prev => editing ? prev.map(x=>x.id===editing.id?newItem:x) : [newItem,...prev]);
      setMessage('Saved in this browser session. Connect Supabase to sync across devices.');
    }
    setSaving(false); setModal(false);
  }
  async function deleteItem(item) {
    if (!confirm(`Delete "${item.title}" from your library?`)) return;
    if (supabase && user && !String(item.id).startsWith('demo-')) {
      const {error} = await supabase.from('library_items').delete().eq('id',item.id);
      if (error) { setMessage('Delete failed: '+error.message); return; }
    }
    setItems(prev=>prev.filter(x=>x.id!==item.id));
  }
  function importFile(file) {
    if (!file) return;
    Papa.parse(file, {header:true, skipEmptyLines:true, complete: async ({data,errors}) => {
      if (errors.length) setMessage(`Import completed with ${errors.length} parsing warning(s).`);
      const normalized = data.filter(r=>r.title || r.Title).map(r=>{
        const get=(...keys)=>{for(const k of keys) if(r[k]!==undefined && r[k]!== '') return r[k]; return '';};
        const type = get('item_type','type','Type','Category') || 'Movie';
        return {
          title:String(get('title','Title','name','Name')).trim(),
          item_type:TYPES.includes(type)?type:'Movie',
          year:get('year','Year') ? Number(get('year','Year')) : null,
          genres:String(get('genres','Genres','genre','Genre')).split(/[;,]/).map(x=>x.trim()).filter(Boolean),
          platform:String(get('platform','Platform','service','Service')),
          status:STATUSES.includes(get('status','Status'))?get('status','Status'):'To Watch',
          rating:get('rating','Rating') ? Number(get('rating','Rating')) : null,
          poster_url:String(get('poster_url','Poster URL','poster')),
          synopsis:String(get('synopsis','Synopsis','description')),
          notes:String(get('notes','Notes'))
        };
      }).filter(x=>x.title);
      if (!normalized.length) { setMessage('No titles found. Make sure your CSV has a title column.'); return; }
      if (supabase && user) {
        const {data:created,error}=await supabase.from('library_items').insert(normalized.map(x=>({...x,user_id:user.id}))).select();
        if (error) { setMessage('Import failed: '+error.message); return; }
        setItems(prev=>[...(created||[]),...prev]);
      } else setItems(prev=>[...normalized.map(x=>({...x,id:crypto.randomUUID()})),...prev]);
      setMessage(`Imported ${normalized.length} title(s).`);
    }});
  }
  function exportCsv() {
    const csv = Papa.unparse(items.map(i=>({
      title:i.title, item_type:i.item_type, year:i.year||'', genres:(i.genres||[]).join(', '), platform:i.platform||'',
      status:i.status, rating:i.rating??'', poster_url:i.poster_url||'', synopsis:i.synopsis||'', notes:i.notes||''
    })));
    const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='screen-vault-library.csv'; a.click(); URL.revokeObjectURL(url);
  }
  const typeIcon = (type, size=17) => {
    const props={size,strokeWidth:1.8};
    if(type==='Movie') return <Film {...props}/>;
    if(type==='TV/Web Series') return <Tv {...props}/>;
    if(type==='Anime') return <Sparkles {...props}/>;
    if(type==='Book'||type==='Manga') return <BookOpen {...props}/>;
    return <Gamepad2 {...props}/>;
  };

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Clapperboard size={23}/></div><div><div className="brand-name">SCREEN <span>VAULT</span></div><div className="brand-tag">YOUR STORY COLLECTION</div></div></div>
      <div className="side-label">WORKSPACE</div>
      <button className={`nav-item ${page==='Dashboard'?'active':''}`} onClick={()=>setPage('Dashboard')}><LayoutDashboard size={18}/> Dashboard</button>
      <button className={`nav-item ${page==='Library'?'active':''}`} onClick={()=>setPage('Library')}><LibraryBig size={18}/> My Library <span className="nav-count">{items.length}</span></button>
      <div className="side-label space-top">COLLECTIONS</div>
      {TYPES.map(t=><button key={t} className={`nav-item ${typeFilter===t?'active':''}`} onClick={()=>{setTypeFilter(typeFilter===t?'All':t);setPage('Library')}}>{typeIcon(t)} {t==='TV/Web Series'?'Series':t==='Movie'?'Movies':t==='Anime'?'Anime':t==='Book'?'Books':t==='Manga'?'Manga':'Games'}</button>)}
      <div className="sidebar-bottom">
        <div className="sync-card"><div className="sync-icon">{user?<Cloud size={18}/>:<CloudOff size={18}/>}</div><div><strong>{user?'Cloud sync active':'Local preview'}</strong><p>{user?'Synced to your account':'Set up Supabase for multi-device sync'}</p></div></div>
        {user ? <button className="nav-item" onClick={logout}><LogOut size={17}/> Sign out</button> : <button className="nav-item" onClick={()=>setAuthOpen(true)}><LogIn size={17}/> Connect cloud account</button>}
        <div className="profile-mini"><div className="avatar">SV</div><div><strong>{user?.email || 'Your Screen Vault'}</strong><span>{user?'Personal library':'Private collection'}</span></div></div>
      </div>
    </aside>

    <main className="main">
      <header className="topbar"><div className="breadcrumb">LIBRARY <span>/</span> <b>{page.toUpperCase()}</b></div><div className="top-actions"><div className="cloud-pill">{user?<><span className="online-dot"/> CLOUD SYNC</>:<> <span className="offline-dot"/> LOCAL PREVIEW</>}</div><button className="button button-gold" onClick={openAdd}><Plus size={17}/> Add title</button></div></header>
      <div className="content">
        <section className="welcome-row"><div><div className="eyebrow"><span/> YOUR PERSONAL ARCHIVE</div><h1>{page==='Dashboard'?'Your stories, at a glance.':'Every story. One collection.'}</h1><p className="subtitle">{page==='Dashboard'?'A snapshot of the worlds you have explored and the ones still waiting.':'Movies, series, anime, books, manga and games — collected in one place.'}</p></div><div className="welcome-emblem"><Clapperboard size={38}/><span>EST. YOURS</span></div></section>
        <section className="stat-grid">
          <Stat label="TOTAL TITLES" value={stats.total} icon={<LibraryBig/>} hint="In your collection"/>
          <Stat label="COMPLETED" value={stats.completed} icon={<Check/>} hint="Stories finished"/>
          <Stat label="IN PROGRESS" value={stats.progress} icon={<Bookmark/>} hint="Currently exploring"/>
          <Stat label="ON YOUR LIST" value={stats.planned} icon={<Star/>} hint="Waiting for you"/>
        </section>
        {page==='Dashboard' ? <div className="dashboard-grid">
          <section className="panel"><div className="panel-head"><div><h2>Collection breakdown</h2><p>Titles by format</p></div><SlidersHorizontal size={18}/></div>
            <div className="breakdown">{stats.byType.map(row=><div className="break-row" key={row.type}><div className="break-label">{typeIcon(row.type,16)}<span>{row.type}</span></div><div className="bar-track"><div className="bar-fill" style={{width:`${stats.total?row.count/stats.total*100:0}%`}}/></div><strong>{row.count}</strong></div>)}</div>
          </section>
          <section className="panel"><div className="panel-head"><div><h2>Your top genres</h2><p>Based on your saved titles</p></div><Sparkles size={18}/></div>
            {stats.byGenre.length ? <div className="genre-cloud">{stats.byGenre.map(([g,n])=><button className="genre-chip" key={g} onClick={()=>{setGenreFilter(g);setPage('Library')}}>{g}<span>{n}</span></button>)}</div>:<div className="empty-small">Add genres to your titles to see your trends.</div>}
            <div className="rating-summary"><div className="rating-big">{stats.rated.length? (stats.rated.reduce((s,i)=>s+Number(i.rating),0)/stats.rated.length).toFixed(1):'—'}</div><div><div className="gold-stars"><Star size={14} fill="currentColor"/> YOUR AVERAGE RATING</div><p>{stats.rated.length} rated title(s)</p></div></div>
          </section>
        </div> : <>
          <section className="toolbar">
            <div className="search-wrap"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search titles, genres, notes..." aria-label="Search library"/>{query&&<button className="icon-button" onClick={()=>setQuery('')}><X size={15}/></button>}</div>
            <div className="filter-wrap"><SlidersHorizontal size={16}/><span>FILTER</span>
              <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} aria-label="Filter by type"><option>All</option>{TYPES.map(t=><option key={t}>{t}</option>)}</select>
              <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} aria-label="Filter by status"><option>All</option>{STATUSES.map(s=><option key={s}>{s}</option>)}</select>
              <select value={genreFilter} onChange={e=>setGenreFilter(e.target.value)} aria-label="Filter by genre">{genres.map(g=><option key={g}>{g}</option>)}</select>
              <select value={platformFilter} onChange={e=>setPlatformFilter(e.target.value)} aria-label="Filter by platform">{platforms.map(p=><option key={p}>{p}</option>)}</select>
              <select value={sort} onChange={e=>setSort(e.target.value)} aria-label="Sort library"><option value="recent">Recently added</option><option value="title">Title A–Z</option><option value="rating">Highest rated</option><option value="year">Newest year</option></select>
            </div>
          </section>
          <div className="results-row"><div><strong>{filtered.length}</strong> titles <span>in view</span></div><div className="utility-actions"><label className="button button-outline upload-button"><Upload size={15}/> Import CSV<input type="file" accept=".csv,text/csv" onChange={e=>{importFile(e.target.files?.[0]);e.target.value=''}}/></label><button className="button button-outline" onClick={exportCsv}><Download size={15}/> Export</button></div></div>
          {message&&<div className="notice" role="status">{message}<button onClick={()=>setMessage('')}><X size={14}/></button></div>}
          {loading ? <div className="loading"><LoaderCircle className="spin" size={26}/> Loading your library…</div> : filtered.length ? <div className="poster-grid">{filtered.map(item=><article className="poster-card" key={item.id}>
            <div className="poster-art" onClick={()=>openEdit(item)} role="button" tabIndex={0} onKeyDown={e=>e.key==='Enter'&&openEdit(item)}>
              {item.poster_url ? <img src={item.poster_url} alt={`${item.title} poster`} onError={e=>{e.currentTarget.style.display='none'}}/> : <div className="poster-placeholder"><div className="poster-watermark">{typeIcon(item.item_type,38)}</div><span className="poster-type">{item.item_type}</span><strong>{item.title}</strong><span className="poster-bottom">SCREEN VAULT</span></div>}
              <span className={`status-badge status-${(item.status||'To Watch').toLowerCase().replaceAll(' ','-')}`}>{item.status}</span>
              <div className="card-actions"><button title="Edit title" onClick={e=>{e.stopPropagation();openEdit(item)}}><Pencil size={14}/></button><button title="Delete title" onClick={e=>{e.stopPropagation();deleteItem(item)}}><Trash2 size={14}/></button></div>
            </div>
            <div className="card-info"><div className="card-kicker">{typeIcon(item.item_type,13)} {item.item_type}{item.year?` · ${item.year}`:''}</div><h3 title={item.title}>{item.title}</h3><div className="card-meta">{(item.genres||[]).slice(0,2).map(g=><span key={g}>{g}</span>)}{item.platform&&<span className="platform">{item.platform}</span>}</div>
              <div className="card-footer"><span className="rating"><Star size={13} fill={item.rating?'currentColor':'none'}/>{item.rating?Number(item.rating).toFixed(1):'Not rated'}</span><button className="edit-link" onClick={()=>openEdit(item)}>Details <span>↗</span></button></div>
            </div>
          </article>)}</div> : <div className="empty-state"><div className="empty-icon"><LibraryBig size={30}/></div><h2>{items.length?'No titles match your filters':'Your vault is waiting.'}</h2><p>{items.length?'Try changing your search or filters.':'Add your first title or import a CSV to begin building your personal collection.'}</p><div className="empty-actions"><button className="button button-gold" onClick={openAdd}><Plus size={16}/> Add your first title</button><label className="button button-outline upload-button"><Upload size={15}/> Import CSV<input type="file" accept=".csv,text/csv" onChange={e=>{importFile(e.target.files?.[0]);e.target.value=''}}/></label></div></div>}
        </>}
        <footer className="footer"><span>SCREEN VAULT <b>✦</b> YOUR PERSONAL ARCHIVE</span><span>{user?'Synced securely with your account':'Preview mode · Connect cloud to sync across devices'}</span></footer>
      </div>
    </main>

    {modal&&<div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setModal(false)}><form className="edit-modal" onSubmit={saveItem}>
      <div className="modal-head"><div><div className="eyebrow"><span/> LIBRARY ENTRY</div><h2>{editing?'Edit title':'Add to your vault'}</h2><p>Keep the details you want to remember.</p></div><button type="button" className="icon-button close-button" onClick={()=>setModal(false)}><X/></button></div>
      <div className="form-grid">
        <label className="full">Title *<input required autoFocus value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Interstellar"/></label>
        <label>Format<select value={form.item_type} onChange={e=>setForm({...form,item_type:e.target.value,status:e.target.value==='Game'?'Playing':e.target.value==='Book'||e.target.value==='Manga'?'Reading':'To Watch'})}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></label>
        <label>Release year<input type="number" min="1800" max="2100" value={form.year} onChange={e=>setForm({...form,year:e.target.value})} placeholder="2026"/></label>
        <label className="full">Genres <span className="muted">(comma-separated)</span><input value={form.genres} onChange={e=>setForm({...form,genres:e.target.value})} placeholder="Sci-Fi, Adventure, Drama"/></label>
        <label>Platform / service<input value={form.platform} onChange={e=>setForm({...form,platform:e.target.value})} placeholder="Netflix, Prime Video, Steam…"/></label>
        <label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></label>
        <label>Rating <span className="muted">(0–10)</span><input type="number" min="0" max="10" step="0.5" value={form.rating} onChange={e=>setForm({...form,rating:e.target.value})} placeholder="8.5"/></label>
        <label>Poster image URL<input type="url" value={form.poster_url} onChange={e=>setForm({...form,poster_url:e.target.value})} placeholder="https://…"/></label>
        <label className="full">Synopsis<textarea rows="2" value={form.synopsis} onChange={e=>setForm({...form,synopsis:e.target.value})} placeholder="A short description…"/></label>
        <label className="full">Personal notes<textarea rows="3" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Where you found it, who recommended it, what to remember…"/></label>
      </div>
      <div className="modal-footer"><span className="muted">* Required field</span><div><button type="button" className="button button-outline" onClick={()=>setModal(false)}>Cancel</button><button className="button button-gold" disabled={saving}>{saving?<LoaderCircle className="spin" size={16}/>:<Check size={16}/>} {saving?'Saving…':'Save title'}</button></div></div>
    </form></div>}

    {authOpen&&<div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setAuthOpen(false)}><form className="auth-modal" onSubmit={signIn}>
      <button type="button" className="icon-button auth-close" onClick={()=>setAuthOpen(false)}><X/></button><div className="brand-mark large"><Cloud size={25}/></div><div className="eyebrow centered"><span/> YOUR LIBRARY, EVERYWHERE</div><h2>Connect your vault</h2><p>Sign in or create an account to sync your titles across devices.</p>
      <label>Email address<input type="email" required value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="you@example.com"/></label><label>Password<input type="password" minLength="6" required value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder="At least 6 characters"/></label>
      {authMessage&&<div className="auth-message">{authMessage}</div>}<button className="button button-gold auth-submit"><LogIn size={16}/> Sign in</button><button type="button" className="auth-signup" onClick={signUp}>New here? Create an account</button>
      {!supabase&&<p className="setup-warning">Cloud setup is not complete yet. Configure your Supabase keys and database using README.md.</p>}
    </form></div>}
  </div>;
}

function Stat({label,value,icon,hint}) {
  return <div className="stat-card"><div className="stat-top"><span>{label}</span><div className="stat-icon">{React.cloneElement(icon,{size:18,strokeWidth:1.8})}</div></div><div className="stat-value">{value}</div><div className="stat-hint">{hint}</div></div>;
}

createRoot(document.getElementById('root')).render(<App/>);
