// ============================================
// Stream Haven V2 - Application Logic
// ============================================

// --- Utility Functions ---
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function getTimeUntil(dateStr) {
  const now = new Date();
  const target = new Date(dateStr);
  const diff = target - now;
  if (diff <= 0) return 'Started!';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// --- Motivational Quotes ---
const QUOTES = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "Your content is a reflection of your passion. Keep creating!", author: "Stream Haven" },
  { text: "Every stream is a step closer to your goals.", author: "Stream Haven" },
  { text: "Consistency beats perfection. Show up and create.", author: "Stream Haven" }
];

// ============================================
// DASHBOARD
// ============================================
async function loadDashboard() {
  if (!window.currentUser || !window.currentAccount) return;
  const uid = window.currentUser.id;
  const aid = window.currentAccount.id;

  // Welcome message
  const welcomeEl = document.getElementById('welcomeMsg');
  if (welcomeEl) {
    const name = window.currentUser.user_metadata?.name || window.currentUser.email.split('@')[0];
    const hour = new Date().getHours();
    let greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    welcomeEl.textContent = `${greeting}, ${name}!`;
  }

  // Next stream
  const { data: nextStreams } = await window.supabaseClient
    .from('streams')
    .select('*')
    .eq('account_id', aid)
    .eq('user_id', uid)
    .eq('completed', false)
    .gte('date', new Date().toISOString())
    .order('date', { ascending: true })
    .limit(1);

  const heroEl = document.getElementById('heroContent');
  if (heroEl) {
    if (nextStreams && nextStreams.length > 0) {
      const s = nextStreams[0];
      heroEl.innerHTML = `
        <h2>Next Stream</h2>
        <div class="hero-subtitle">${escapeHtml(s.title)}</div>
        <div class="countdown">${getTimeUntil(s.date)}</div>
        <div class="countdown-label">${formatDateTime(s.date)}</div>`;
    } else {
      heroEl.innerHTML = `
        <h2>No Upcoming Streams</h2>
        <div class="hero-subtitle">Schedule your next stream to see a countdown here!</div>
        <div style="margin-top:1rem"><a href="planner.html" style="color:#0f0f1a;font-weight:600;text-decoration:underline">Schedule a Stream</a></div>`;
    }
  }

  // Growth stats
  const { data: stats } = await window.supabaseClient
    .from('growth_stats')
    .select('*')
    .eq('account_id', aid)
    .eq('user_id', uid)
    .order('date', { ascending: false })
    .limit(1);

  const statsEl = document.getElementById('statsGrid');
  if (statsEl) {
    const s = stats && stats[0] ? stats[0] : { twitch: 0, youtube: 0, tiktok: 0, instagram: 0 };
    statsEl.innerHTML = `
      <div class="stat-card"><div class="stat-icon">📺</div><div class="stat-value">${s.twitch}</div><div class="stat-label">Twitch</div></div>
      <div class="stat-card"><div class="stat-icon">▶️</div><div class="stat-value">${s.youtube}</div><div class="stat-label">YouTube</div></div>
      <div class="stat-card"><div class="stat-icon">🎵</div><div class="stat-value">${s.tiktok}</div><div class="stat-label">TikTok</div></div>
      <div class="stat-card"><div class="stat-icon">📸</div><div class="stat-value">${s.instagram}</div><div class="stat-label">Instagram</div></div>`;
  }

  // This week widget
  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7);

  const { data: weekStreams } = await window.supabaseClient
    .from('streams')
    .select('id')
    .eq('account_id', aid).eq('user_id', uid)
    .gte('date', weekStart.toISOString())
    .lt('date', weekEnd.toISOString());

  const { data: weekContent } = await window.supabaseClient
    .from('content_planner')
    .select('id')
    .eq('account_id', aid).eq('user_id', uid)
    .gte('date', weekStart.toISOString())
    .lt('date', weekEnd.toISOString());

  const weekEl = document.getElementById('weekWidget');
  if (weekEl) {
    weekEl.innerHTML = `
      <div style="font-size:2rem;font-weight:700;color:var(--accent)">${(weekStreams?.length || 0) + (weekContent?.length || 0)}</div>
      <div style="color:var(--text-secondary);font-size:0.85rem;margin-top:0.25rem">${weekStreams?.length || 0} streams · ${weekContent?.length || 0} content</div>`;
  }

  // Current goal widget
  const { data: goals } = await window.supabaseClient
    .from('goals')
    .select('*')
    .eq('account_id', aid).eq('user_id', uid)
    .order('created_at', { ascending: false })
    .limit(1);

  const goalEl = document.getElementById('goalWidget');
  if (goalEl) {
    if (goals && goals.length > 0) {
      const g = goals[0];
      const pct = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
      goalEl.innerHTML = `
        <div style="font-weight:600;margin-bottom:0.5rem">${escapeHtml(g.text)}</div>
        <div class="progress-container">
          <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
          <div class="progress-text"><span>${g.current} / ${g.target}</span><span>${pct}%</span></div>
        </div>`;
    } else {
      goalEl.innerHTML = `<div style="color:var(--text-secondary)">No goals yet. <a href="goals.html" style="color:var(--accent)">Add one!</a></div>`;
    }
  }

  // Recent ideas widget
  const { data: ideas } = await window.supabaseClient
    .from('ideas')
    .select('*')
    .eq('account_id', aid).eq('user_id', uid)
    .eq('used', false)
    .order('created_at', { ascending: false })
    .limit(3);

  const ideasEl = document.getElementById('ideasWidget');
  if (ideasEl) {
    if (ideas && ideas.length > 0) {
      ideasEl.innerHTML = ideas.map(i => `<div style="padding:0.4rem 0;border-bottom:1px solid rgba(255,255,255,0.05)">💡 ${escapeHtml(i.text)}</div>`).join('');
    } else {
      ideasEl.innerHTML = `<div style="color:var(--text-secondary)">No ideas yet. <a href="ideas.html" style="color:var(--accent)">Add some!</a></div>`;
    }
  }

  // Quote
  const quoteEl = document.getElementById('quoteCard');
  if (quoteEl) {
    const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    quoteEl.innerHTML = `<div class="quote-text">"${escapeHtml(q.text)}"</div><div class="quote-author">— ${escapeHtml(q.author)}</div>`;
  }
}

// ============================================
// STREAMS (Planner)
// ============================================
async function addStream() {
  if (!window.currentUser || !window.currentAccount) return;
  const title = document.getElementById('streamTitle').value.trim();
  const date = document.getElementById('streamDate').value;
  if (!title || !date) return showNotification('Please fill in all fields', 'error');

  try {
    const { error } = await window.supabaseClient.from('streams').insert({
      account_id: window.currentAccount.id,
      user_id: window.currentUser.id,
      title, date
    });
    if (error) throw error;
    document.getElementById('streamTitle').value = '';
    document.getElementById('streamDate').value = '';
    showNotification('Stream added!');
    loadStreams();
  } catch (e) {
    showNotification(e.message, 'error');
  }
}

async function loadStreams() {
  if (!window.currentUser || !window.currentAccount) return;
  const { data: streams } = await window.supabaseClient
    .from('streams')
    .select('*')
    .eq('account_id', window.currentAccount.id)
    .eq('user_id', window.currentUser.id)
    .order('date', { ascending: true });

  const list = document.getElementById('streamsList');
  if (!list) return;

  if (!streams || streams.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">📅</div><h3>No Streams Scheduled</h3><p>Add your first stream above!</p></div>`;
    return;
  }

  list.innerHTML = streams.map(s => `
    <div class="item-card ${s.completed ? 'completed' : ''}">
      <div class="item-info">
        <div class="item-title">${escapeHtml(s.title)}</div>
        <div class="item-meta">
          <span>📅 ${formatDateTime(s.date)}</span>
          <span>📺 ${escapeHtml(s.platform)}</span>
        </div>
      </div>
      <div class="item-actions">
        <button class="btn btn-sm ${s.completed ? 'btn-secondary' : 'btn-success'}" onclick="toggleStream('${s.id}', ${!s.completed})">
          ${s.completed ? 'Undo' : '✓ Done'}
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteStream('${s.id}')">Delete</button>
      </div>
    </div>`).join('');
}

async function toggleStream(id, completed) {
  try {
    await window.supabaseClient.from('streams').update({ completed }).eq('id', id);
    showNotification(completed ? 'Stream completed!' : 'Stream unmarked');
    loadStreams();
  } catch (e) { showNotification(e.message, 'error'); }
}

async function deleteStream(id) {
  if (!confirm('Delete this stream?')) return;
  try {
    await window.supabaseClient.from('streams').delete().eq('id', id);
    showNotification('Stream deleted');
    loadStreams();
  } catch (e) { showNotification(e.message, 'error'); }
}

// ============================================
// CONTENT PLANNER
// ============================================
async function addContent() {
  if (!window.currentUser || !window.currentAccount) return;
  const title = document.getElementById('contentTitle').value.trim();
  const type = document.getElementById('contentType').value;
  const date = document.getElementById('contentDate').value;
  const status = document.getElementById('contentStatus').value;
  if (!title || !date) return showNotification('Please fill in all fields', 'error');

  try {
    const { error } = await window.supabaseClient.from('content_planner').insert({
      account_id: window.currentAccount.id,
      user_id: window.currentUser.id,
      title, type, date, status
    });
    if (error) throw error;
    document.getElementById('contentTitle').value = '';
    document.getElementById('contentDate').value = '';
    showNotification('Content added!');
    loadContent();
  } catch (e) { showNotification(e.message, 'error'); }
}

async function loadContent() {
  if (!window.currentUser || !window.currentAccount) return;
  const { data: items } = await window.supabaseClient
    .from('content_planner')
    .select('*')
    .eq('account_id', window.currentAccount.id)
    .eq('user_id', window.currentUser.id)
    .order('date', { ascending: true });

  const list = document.getElementById('contentList');
  if (!list) return;

  if (!items || items.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><h3>No Content Planned</h3><p>Start planning your content above!</p></div>`;
    return;
  }

  list.innerHTML = items.map(c => `
    <div class="item-card">
      <div class="item-info">
        <div class="item-title">${escapeHtml(c.title)}</div>
        <div class="item-meta">
          <span class="type-badge">${escapeHtml(c.type)}</span>
          <span>📅 ${formatDate(c.date)}</span>
          <span class="status-badge status-${c.status}">${c.status}</span>
        </div>
      </div>
      <div class="item-actions">
        <select class="inline-input" style="width:auto" onchange="updateContentStatus('${c.id}', this.value)">
          <option value="idea" ${c.status === 'idea' ? 'selected' : ''}>Idea</option>
          <option value="planning" ${c.status === 'planning' ? 'selected' : ''}>Planning</option>
          <option value="recording" ${c.status === 'recording' ? 'selected' : ''}>Recording</option>
          <option value="editing" ${c.status === 'editing' ? 'selected' : ''}>Editing</option>
          <option value="published" ${c.status === 'published' ? 'selected' : ''}>Published</option>
        </select>
        <button class="btn btn-sm btn-danger" onclick="deleteContent('${c.id}')">Delete</button>
      </div>
    </div>`).join('');
}

async function updateContentStatus(id, status) {
  try {
    await window.supabaseClient.from('content_planner').update({ status }).eq('id', id);
    showNotification('Status updated!');
    loadContent();
  } catch (e) { showNotification(e.message, 'error'); }
}

async function deleteContent(id) {
  if (!confirm('Delete this content?')) return;
  try {
    await window.supabaseClient.from('content_planner').delete().eq('id', id);
    showNotification('Content deleted');
    loadContent();
  } catch (e) { showNotification(e.message, 'error'); }
}

// ============================================
// GOALS
// ============================================
async function addGoal() {
  if (!window.currentUser || !window.currentAccount) return;
  const text = document.getElementById('goalText').value.trim();
  const target = parseInt(document.getElementById('goalTarget').value);
  const current = parseInt(document.getElementById('goalCurrent').value) || 0;
  if (!text || !target || target <= 0) return showNotification('Please enter a goal and target', 'error');

  try {
    const { error } = await window.supabaseClient.from('goals').insert({
      account_id: window.currentAccount.id,
      user_id: window.currentUser.id,
      text, target, current
    });
    if (error) throw error;
    document.getElementById('goalText').value = '';
    document.getElementById('goalTarget').value = '';
    document.getElementById('goalCurrent').value = '0';
    showNotification('Goal added!');
    loadGoals();
  } catch (e) { showNotification(e.message, 'error'); }
}

async function loadGoals() {
  if (!window.currentUser || !window.currentAccount) return;
  const { data: goals } = await window.supabaseClient
    .from('goals')
    .select('*')
    .eq('account_id', window.currentAccount.id)
    .eq('user_id', window.currentUser.id)
    .order('created_at', { ascending: false });

  const list = document.getElementById('goalsList');
  if (!list) return;

  if (!goals || goals.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">🎯</div><h3>No Goals Yet</h3><p>Set your first goal above!</p></div>`;
    return;
  }

  list.innerHTML = goals.map(g => {
    const pct = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
    const isComplete = pct >= 100;
    return `
    <div class="item-card">
      <div class="item-info">
        <div class="item-title">${escapeHtml(g.text)}${isComplete ? '<span class="completion-badge">Complete!</span>' : ''}</div>
        <div class="progress-container">
          <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
          <div class="progress-text"><span>${g.current} / ${g.target}</span><span>${pct}%</span></div>
        </div>
      </div>
      <div class="item-actions">
        <input type="number" class="inline-input" value="${g.current}" min="0" max="${g.target}"
          onchange="updateGoalProgress('${g.id}', parseInt(this.value))" aria-label="Update progress">
        <button class="btn btn-sm btn-danger" onclick="deleteGoal('${g.id}')">Delete</button>
      </div>
    </div>`;
  }).join('');
}

async function updateGoalProgress(id, current) {
  try {
    await window.supabaseClient.from('goals').update({ current }).eq('id', id);
    showNotification('Progress updated!');
    loadGoals();
  } catch (e) { showNotification(e.message, 'error'); }
}

async function deleteGoal(id) {
  if (!confirm('Delete this goal?')) return;
  try {
    await window.supabaseClient.from('goals').delete().eq('id', id);
    showNotification('Goal deleted');
    loadGoals();
  } catch (e) { showNotification(e.message, 'error'); }
}

// ============================================
// SIMS/OLDENBURG GOALS
// ============================================
async function addSimsGoal() {
  if (!window.currentUser || !window.currentAccount) return;
  const text = document.getElementById('simsGoalText').value.trim();
  if (!text) return showNotification('Please enter a goal', 'error');

  try {
    const { error } = await window.supabaseClient.from('sims_goals').insert({
      account_id: window.currentAccount.id,
      user_id: window.currentUser.id,
      text
    });
    if (error) throw error;
    document.getElementById('simsGoalText').value = '';
    showNotification('Goal added!');
    loadSimsGoals();
  } catch (e) { showNotification(e.message, 'error'); }
}

async function loadSimsGoals() {
  if (!window.currentUser || !window.currentAccount) return;
  const { data: goals } = await window.supabaseClient
    .from('sims_goals')
    .select('*')
    .eq('account_id', window.currentAccount.id)
    .eq('user_id', window.currentUser.id)
    .order('created_at', { ascending: true });

  const list = document.getElementById('simsGoalsList');
  if (!list) return;

  if (!goals || goals.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">🎮</div><h3>No Game Goals Yet</h3><p>Add your first Oldenburg goal above!</p></div>`;
    return;
  }

  list.innerHTML = goals.map(g => `
    <div class="item-card ${g.completed ? 'completed' : ''}">
      <div class="item-info">
        <div class="item-title">${escapeHtml(g.text)}</div>
      </div>
      <div class="item-actions">
        <button class="btn btn-sm ${g.completed ? 'btn-secondary' : 'btn-success'}" onclick="toggleSimsGoal('${g.id}', ${!g.completed})">
          ${g.completed ? 'Undo' : '✓ Done'}
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteSimsGoal('${g.id}')">Delete</button>
      </div>
    </div>`).join('');
}

async function toggleSimsGoal(id, completed) {
  try {
    await window.supabaseClient.from('sims_goals').update({ completed }).eq('id', id);
    showNotification(completed ? 'Goal completed!' : 'Goal unmarked');
    loadSimsGoals();
  } catch (e) { showNotification(e.message, 'error'); }
}

async function deleteSimsGoal(id) {
  if (!confirm('Delete this goal?')) return;
  try {
    await window.supabaseClient.from('sims_goals').delete().eq('id', id);
    showNotification('Goal deleted');
    loadSimsGoals();
  } catch (e) { showNotification(e.message, 'error'); }
}

// ============================================
// IDEAS
// ============================================
async function addIdea() {
  if (!window.currentUser || !window.currentAccount) return;
  const text = document.getElementById('ideaText').value.trim();
  if (!text) return showNotification('Please enter an idea', 'error');

  try {
    const { error } = await window.supabaseClient.from('ideas').insert({
      account_id: window.currentAccount.id,
      user_id: window.currentUser.id,
      text
    });
    if (error) throw error;
    document.getElementById('ideaText').value = '';
    showNotification('Idea saved!');
    loadIdeas();
  } catch (e) { showNotification(e.message, 'error'); }
}

async function loadIdeas() {
  if (!window.currentUser || !window.currentAccount) return;
  const { data: ideas } = await window.supabaseClient
    .from('ideas')
    .select('*')
    .eq('account_id', window.currentAccount.id)
    .eq('user_id', window.currentUser.id)
    .order('created_at', { ascending: false });

  const list = document.getElementById('ideasList');
  if (!list) return;

  if (!ideas || ideas.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">💡</div><h3>No Ideas Yet</h3><p>Capture your creative ideas above!</p></div>`;
    return;
  }

  list.innerHTML = ideas.map(i => `
    <div class="item-card ${i.used ? 'completed' : ''}">
      <div class="item-info">
        <div class="item-title">${escapeHtml(i.text)}</div>
      </div>
      <div class="item-actions">
        <button class="btn btn-sm ${i.used ? 'btn-secondary' : 'btn-success'}" onclick="toggleIdea('${i.id}', ${!i.used})">
          ${i.used ? 'Unused' : '✓ Used'}
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteIdea('${i.id}')">Delete</button>
      </div>
    </div>`).join('');
}

async function toggleIdea(id, used) {
  try {
    await window.supabaseClient.from('ideas').update({ used }).eq('id', id);
    showNotification(used ? 'Marked as used' : 'Marked as unused');
    loadIdeas();
  } catch (e) { showNotification(e.message, 'error'); }
}

async function deleteIdea(id) {
  if (!confirm('Delete this idea?')) return;
  try {
    await window.supabaseClient.from('ideas').delete().eq('id', id);
    showNotification('Idea deleted');
    loadIdeas();
  } catch (e) { showNotification(e.message, 'error'); }
}

// ============================================
// GROWTH TRACKER
// ============================================
async function saveGrowthStats() {
  if (!window.currentUser || !window.currentAccount) return;
  const twitch = parseInt(document.getElementById('growthTwitch').value) || 0;
  const youtube = parseInt(document.getElementById('growthYoutube').value) || 0;
  const tiktok = parseInt(document.getElementById('growthTiktok').value) || 0;
  const instagram = parseInt(document.getElementById('growthInstagram').value) || 0;

  try {
    const { error } = await window.supabaseClient.from('growth_stats').insert({
      account_id: window.currentAccount.id,
      user_id: window.currentUser.id,
      twitch, youtube, tiktok, instagram
    });
    if (error) throw error;
    showNotification('Stats saved!');
    loadGrowthStats();
  } catch (e) { showNotification(e.message, 'error'); }
}

async function loadGrowthStats() {
  if (!window.currentUser || !window.currentAccount) return;
  const { data: stats } = await window.supabaseClient
    .from('growth_stats')
    .select('*')
    .eq('account_id', window.currentAccount.id)
    .eq('user_id', window.currentUser.id)
    .order('date', { ascending: false })
    .limit(1);

  const grid = document.getElementById('growthGrid');
  if (!grid) return;

  const s = stats && stats[0] ? stats[0] : { twitch: 0, youtube: 0, tiktok: 0, instagram: 0, date: null };

  grid.innerHTML = `
    <div class="growth-stat"><div class="platform-icon">📺</div><div class="platform-count">${s.twitch}</div><div class="platform-name">Twitch Followers</div></div>
    <div class="growth-stat"><div class="platform-icon">▶️</div><div class="platform-count">${s.youtube}</div><div class="platform-name">YouTube Subscribers</div></div>
    <div class="growth-stat"><div class="platform-icon">🎵</div><div class="platform-count">${s.tiktok}</div><div class="platform-name">TikTok Followers</div></div>
    <div class="growth-stat"><div class="platform-icon">📸</div><div class="platform-count">${s.instagram}</div><div class="platform-name">Instagram Followers</div></div>`;

  // Pre-fill inputs
  const twitchInput = document.getElementById('growthTwitch');
  if (twitchInput) {
    twitchInput.value = s.twitch;
    document.getElementById('growthYoutube').value = s.youtube;
    document.getElementById('growthTiktok').value = s.tiktok;
    document.getElementById('growthInstagram').value = s.instagram;
  }

  const dateEl = document.getElementById('lastUpdated');
  if (dateEl && s.date) {
    dateEl.textContent = 'Last updated: ' + formatDate(s.date);
  }
}

// ============================================
// QUICK LINKS
// ============================================
async function addLink() {
  if (!window.currentUser || !window.currentAccount) return;
  const name = document.getElementById('linkName').value.trim();
  const url = document.getElementById('linkUrl').value.trim();
  if (!name || !url) return showNotification('Please fill in all fields', 'error');

  try {
    new URL(url);
  } catch {
    return showNotification('Please enter a valid URL', 'error');
  }

  try {
    const { error } = await window.supabaseClient.from('quick_links').insert({
      account_id: window.currentAccount.id,
      user_id: window.currentUser.id,
      name, url
    });
    if (error) throw error;
    document.getElementById('linkName').value = '';
    document.getElementById('linkUrl').value = '';
    showNotification('Link saved!');
    loadLinks();
  } catch (e) { showNotification(e.message, 'error'); }
}

async function loadLinks() {
  if (!window.currentUser || !window.currentAccount) return;
  const { data: links } = await window.supabaseClient
    .from('quick_links')
    .select('*')
    .eq('account_id', window.currentAccount.id)
    .eq('user_id', window.currentUser.id)
    .order('created_at', { ascending: false });

  const list = document.getElementById('linksList');
  if (!list) return;

  if (!links || links.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">🔗</div><h3>No Links Saved</h3><p>Add your important links above!</p></div>`;
    return;
  }

  list.innerHTML = links.map(l => `
    <div class="link-card">
      <span class="link-name">${escapeHtml(l.name)}</span>
      <a href="${escapeHtml(l.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(l.url)}</a>
      <button class="btn btn-sm btn-danger" onclick="deleteLink('${l.id}')">Delete</button>
    </div>`).join('');
}

async function deleteLink(id) {
  if (!confirm('Delete this link?')) return;
  try {
    await window.supabaseClient.from('quick_links').delete().eq('id', id);
    showNotification('Link deleted');
    loadLinks();
  } catch (e) { showNotification(e.message, 'error'); }
}

// ============================================
// CALENDAR
// ============================================
let calendarYear, calendarMonth;

function initCalendar() {
  const now = new Date();
  calendarYear = now.getFullYear();
  calendarMonth = now.getMonth();
  loadCalendar();
}

function prevMonth() {
  calendarMonth--;
  if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
  loadCalendar();
}

function nextMonth() {
  calendarMonth++;
  if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
  loadCalendar();
}

async function loadCalendar() {
  if (!window.currentUser || !window.currentAccount) return;
  const uid = window.currentUser.id;
  const aid = window.currentAccount.id;

  // Update header
  const headerEl = document.getElementById('calendarMonth');
  if (headerEl) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    headerEl.textContent = `${monthNames[calendarMonth]} ${calendarYear}`;
  }

  // Get month date range
  const firstDay = new Date(calendarYear, calendarMonth, 1);
  const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
  const startDate = new Date(firstDay); startDate.setDate(1 - firstDay.getDay());
  const endDate = new Date(lastDay); endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
  endDate.setHours(23, 59, 59);

  // Fetch events
  const { data: streams } = await window.supabaseClient
    .from('streams')
    .select('title, date')
    .eq('account_id', aid).eq('user_id', uid)
    .gte('date', startDate.toISOString())
    .lte('date', endDate.toISOString());

  const { data: content } = await window.supabaseClient
    .from('content_planner')
    .select('title, date')
    .eq('account_id', aid).eq('user_id', uid)
    .gte('date', startDate.toISOString())
    .lte('date', endDate.toISOString());

  // Build event map
  const eventMap = {};
  (streams || []).forEach(s => {
    const key = new Date(s.date).toDateString();
    if (!eventMap[key]) eventMap[key] = [];
    eventMap[key].push({ title: s.title, type: 'stream' });
  });
  (content || []).forEach(c => {
    const key = new Date(c.date).toDateString();
    if (!eventMap[key]) eventMap[key] = [];
    eventMap[key].push({ title: c.title, type: 'content' });
  });

  // Render grid
  const grid = document.getElementById('calendarGrid');
  if (!grid) return;

  const today = new Date();
  const todayStr = today.toDateString();

  let html = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    .map(d => `<div class="calendar-day-header">${d}</div>`).join('');

  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    const dateStr = cursor.toDateString();
    const isToday = dateStr === todayStr;
    const isOtherMonth = cursor.getMonth() !== calendarMonth;
    const events = eventMap[dateStr] || [];

    html += `<div class="calendar-day ${isToday ? 'today' : ''} ${isOtherMonth ? 'other-month' : ''}">
      <div class="day-number">${cursor.getDate()}</div>
      ${events.map(e => `<div class="calendar-event ${e.type}-event" title="${escapeHtml(e.title)}">${escapeHtml(e.title)}</div>`).join('')}
    </div>`;

    cursor.setDate(cursor.getDate() + 1);
  }

  grid.innerHTML = html;
}

// ============================================
// THEMES
// ============================================
function loadThemesPage() {
  const currentTheme = window.userSettings?.pastel_theme || 'lavender';
  const currentMode = window.userSettings?.theme_mode || 'dark';

  // Highlight active theme
  document.querySelectorAll('.theme-preset').forEach(el => {
    el.classList.toggle('active', el.dataset.theme === currentTheme);
  });

  // Highlight active mode
  document.querySelectorAll('.mode-btn').forEach(el => {
    el.classList.toggle('active', el.dataset.mode === currentMode);
  });

  // Update current theme display
  const currentEl = document.getElementById('currentThemeDisplay');
  if (currentEl) {
    currentEl.textContent = `Current: ${currentTheme} (${currentMode} mode)`;
  }
}

async function setTheme(themeName) {
  if (!window.currentUser) return;
  const mode = window.userSettings?.theme_mode || 'dark';

  try {
    await window.supabaseClient
      .from('user_settings')
      .update({ pastel_theme: themeName, updated_at: new Date().toISOString() })
      .eq('user_id', window.currentUser.id);

    window.userSettings.pastel_theme = themeName;
    applyTheme(themeName, mode);
    loadThemesPage();
    showNotification(`Theme changed to ${themeName}!`);
  } catch (e) { showNotification(e.message, 'error'); }
}

async function setThemeMode(mode) {
  if (!window.currentUser) return;
  const theme = window.userSettings?.pastel_theme || 'lavender';

  try {
    await window.supabaseClient
      .from('user_settings')
      .update({ theme_mode: mode, updated_at: new Date().toISOString() })
      .eq('user_id', window.currentUser.id);

    window.userSettings.theme_mode = mode;
    applyTheme(theme, mode);
    loadThemesPage();
    showNotification(`${mode === 'dark' ? 'Dark' : 'Light'} mode activated!`);
  } catch (e) { showNotification(e.message, 'error'); }
}

// ============================================
// ACCOUNTS
// ============================================
async function createAccount() {
  if (!window.currentUser) return;
  const name = document.getElementById('accountName').value.trim();
  const color = document.getElementById('accountColor').value || '#7c3aed';
  if (!name) return showNotification('Please enter an account name', 'error');

  try {
    const { error } = await window.supabaseClient.from('accounts').insert({
      user_id: window.currentUser.id,
      name, color
    });
    if (error) throw error;
    document.getElementById('accountName').value = '';
    showNotification('Account created!');
    await loadUserData();
    loadAccountsList();
  } catch (e) { showNotification(e.message, 'error'); }
}

async function loadAccountsList() {
  const list = document.getElementById('accountsList');
  if (!list) return;

  if (!window.userAccounts || window.userAccounts.length === 0) {
    list.innerHTML = `<div class="empty-state"><h3>No Accounts</h3></div>`;
    return;
  }

  list.innerHTML = window.userAccounts.map(a => `
    <div class="account-card ${a.id === window.currentAccount?.id ? 'active-account' : ''}">
      <div class="account-color-dot" style="background:${escapeHtml(a.color)}"></div>
      <div class="account-info">
        <h3>${escapeHtml(a.name)}</h3>
        <p>${a.id === window.currentAccount?.id ? 'Active' : 'Inactive'}</p>
      </div>
      <div class="account-actions">
        ${a.id !== window.currentAccount?.id ? `<button class="btn btn-sm btn-primary" onclick="switchAccount('${a.id}')">Switch</button>` : '<span class="widget-badge">Active</span>'}
        ${window.userAccounts.length > 1 ? `<button class="btn btn-sm btn-danger" onclick="deleteAccount('${a.id}')">Delete</button>` : ''}
      </div>
    </div>`).join('');
}

async function switchAccount(accountId) {
  try {
    await window.supabaseClient
      .from('user_settings')
      .update({ current_account_id: accountId, updated_at: new Date().toISOString() })
      .eq('user_id', window.currentUser.id);

    window.currentAccount = window.userAccounts.find(a => a.id === accountId);
    if (window.userSettings) window.userSettings.current_account_id = accountId;
    updateAccountDisplay();
    loadAccountsList();
    showNotification('Switched account!');
  } catch (e) { showNotification(e.message, 'error'); }
}

async function deleteAccount(accountId) {
  if (window.userAccounts.length <= 1) return showNotification('You must have at least one account', 'error');
  if (!confirm('Delete this account? All associated data will be lost.')) return;

  try {
    await window.supabaseClient.from('accounts').delete().eq('id', accountId);
    showNotification('Account deleted');

    if (window.currentAccount?.id === accountId) {
      window.userAccounts = window.userAccounts.filter(a => a.id !== accountId);
      if (window.userAccounts.length > 0) {
        await switchAccount(window.userAccounts[0].id);
      }
    } else {
      await loadUserData();
    }
    loadAccountsList();
  } catch (e) { showNotification(e.message, 'error'); }
}

// ============================================
// SETTINGS
// ============================================
function loadSettingsPage() {
  const emailEl = document.getElementById('settingsEmail');
  if (emailEl && window.currentUser) emailEl.textContent = window.currentUser.email;

  const nameEl = document.getElementById('settingsName');
  if (nameEl && window.currentUser) {
    nameEl.textContent = window.currentUser.user_metadata?.name || 'Not set';
  }

  const modeToggle = document.getElementById('darkModeToggle');
  if (modeToggle) {
    modeToggle.checked = (window.userSettings?.theme_mode || 'dark') === 'dark';
  }
}

async function toggleDarkMode() {
  const toggle = document.getElementById('darkModeToggle');
  const mode = toggle.checked ? 'dark' : 'light';
  await setThemeMode(mode);
}

async function exportData() {
  if (!window.currentUser || !window.currentAccount) return;
  const uid = window.currentUser.id;
  const aid = window.currentAccount.id;

  try {
    const [streams, content, goals, simsGoals, ideas, links, growth] = await Promise.all([
      window.supabaseClient.from('streams').select('*').eq('account_id', aid).eq('user_id', uid),
      window.supabaseClient.from('content_planner').select('*').eq('account_id', aid).eq('user_id', uid),
      window.supabaseClient.from('goals').select('*').eq('account_id', aid).eq('user_id', uid),
      window.supabaseClient.from('sims_goals').select('*').eq('account_id', aid).eq('user_id', uid),
      window.supabaseClient.from('ideas').select('*').eq('account_id', aid).eq('user_id', uid),
      window.supabaseClient.from('quick_links').select('*').eq('account_id', aid).eq('user_id', uid),
      window.supabaseClient.from('growth_stats').select('*').eq('account_id', aid).eq('user_id', uid)
    ]);

    const exportObj = {
      exported_at: new Date().toISOString(),
      account: window.currentAccount.name,
      streams: streams.data,
      content_planner: content.data,
      goals: goals.data,
      sims_goals: simsGoals.data,
      ideas: ideas.data,
      quick_links: links.data,
      growth_stats: growth.data
    };

    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stream-haven-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Data exported!');
  } catch (e) { showNotification(e.message, 'error'); }
}

async function clearAllData() {
  if (!confirm('Are you sure you want to clear ALL data for this account?')) return;
  if (!confirm('This action CANNOT be undone. Are you absolutely sure?')) return;

  if (!window.currentUser || !window.currentAccount) return;
  const uid = window.currentUser.id;
  const aid = window.currentAccount.id;

  try {
    await Promise.all([
      window.supabaseClient.from('streams').delete().eq('account_id', aid).eq('user_id', uid),
      window.supabaseClient.from('content_planner').delete().eq('account_id', aid).eq('user_id', uid),
      window.supabaseClient.from('goals').delete().eq('account_id', aid).eq('user_id', uid),
      window.supabaseClient.from('sims_goals').delete().eq('account_id', aid).eq('user_id', uid),
      window.supabaseClient.from('ideas').delete().eq('account_id', aid).eq('user_id', uid),
      window.supabaseClient.from('quick_links').delete().eq('account_id', aid).eq('user_id', uid),
      window.supabaseClient.from('growth_stats').delete().eq('account_id', aid).eq('user_id', uid)
    ]);
    showNotification('All data cleared!');
  } catch (e) { showNotification(e.message, 'error'); }
}
