// ============================================
// Stream Haven V2 - Authentication & Session
// ============================================

// Theme definitions
const THEMES = {
  lavender: { accent: '#c4b5fd', hover: '#a78bfa', light: '#ede9fe', gradient1: '#1a1033', gradient2: '#2d1b69', lightBg1: '#f5f3ff', lightBg2: '#ede9fe' },
  rose:     { accent: '#fda4af', hover: '#fb7185', light: '#ffe4e6', gradient1: '#33101a', gradient2: '#6b1d2e', lightBg1: '#fff1f2', lightBg2: '#ffe4e6' },
  mint:     { accent: '#86efac', hover: '#4ade80', light: '#dcfce7', gradient1: '#0a2618', gradient2: '#14532d', lightBg1: '#f0fdf4', lightBg2: '#dcfce7' },
  sky:      { accent: '#7dd3fc', hover: '#38bdf8', light: '#e0f2fe', gradient1: '#0c1929', gradient2: '#0c4a6e', lightBg1: '#f0f9ff', lightBg2: '#e0f2fe' },
  peach:    { accent: '#fdba74', hover: '#fb923c', light: '#ffedd5', gradient1: '#331a0a', gradient2: '#7c2d12', lightBg1: '#fff7ed', lightBg2: '#ffedd5' },
  coral:    { accent: '#f9a8d4', hover: '#f472b6', light: '#fce7f3', gradient1: '#2d1024', gradient2: '#831843', lightBg1: '#fdf2f8', lightBg2: '#fce7f3' },
  lemon:    { accent: '#fde047', hover: '#facc15', light: '#fef9c3', gradient1: '#2d2505', gradient2: '#713f12', lightBg1: '#fefce8', lightBg2: '#fef9c3' },
  aqua:     { accent: '#5eead4', hover: '#2dd4bf', light: '#ccfbf1', gradient1: '#0a2926', gradient2: '#134e4a', lightBg1: '#f0fdfa', lightBg2: '#ccfbf1' }
};

function applyTheme(themeName, mode) {
  const theme = THEMES[themeName] || THEMES.lavender;
  const isDark = mode !== 'light';
  const root = document.documentElement;

  root.setAttribute('data-theme', themeName);
  root.setAttribute('data-mode', mode || 'dark');

  // Also set on body for anti-flicker CSS (body may not exist during early load)
  if (document.body) {
    document.body.setAttribute('data-theme', themeName);
    document.body.setAttribute('data-mode', mode || 'dark');
  }

  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--accent-hover', theme.hover);
  root.style.setProperty('--accent-light', theme.light);

  if (isDark) {
    root.style.setProperty('--bg-primary', '#0f0f1a');
    root.style.setProperty('--bg-secondary', '#1a1a2e');
    root.style.setProperty('--card-bg', 'rgba(30, 30, 50, 0.8)');
    root.style.setProperty('--sidebar-bg', 'rgba(15, 15, 30, 0.95)');
    root.style.setProperty('--text-primary', '#e2e8f0');
    root.style.setProperty('--text-secondary', '#94a3b8');
    root.style.setProperty('--shadow', 'rgba(0, 0, 0, 0.3)');
    root.style.setProperty('--bg-gradient-1', theme.gradient1);
    root.style.setProperty('--bg-gradient-2', theme.gradient2);
  } else {
    root.style.setProperty('--bg-primary', '#f8fafc');
    root.style.setProperty('--bg-secondary', '#f1f5f9');
    root.style.setProperty('--card-bg', 'rgba(255, 255, 255, 0.85)');
    root.style.setProperty('--sidebar-bg', 'rgba(255, 255, 255, 0.95)');
    root.style.setProperty('--text-primary', '#1e293b');
    root.style.setProperty('--text-secondary', '#64748b');
    root.style.setProperty('--shadow', 'rgba(0, 0, 0, 0.1)');
    root.style.setProperty('--bg-gradient-1', theme.lightBg1);
    root.style.setProperty('--bg-gradient-2', theme.lightBg2);
  }

  root.style.setProperty('--success', '#4ade80');
  root.style.setProperty('--danger', '#f87171');
  root.style.setProperty('--warning', '#fbbf24');
}

// Load theme from settings BEFORE page renders
async function loadThemeFromSettings() {
  try {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) return;

    const { data: settings } = await window.supabaseClient
      .from('user_settings')
      .select('pastel_theme, theme_mode')
      .eq('user_id', session.user.id)
      .single();

    if (settings) {
      applyTheme(settings.pastel_theme || 'lavender', settings.theme_mode || 'dark');
    } else {
      applyTheme('lavender', 'dark');
    }
  } catch (e) {
    applyTheme('lavender', 'dark');
  }
}

// Check authentication and load user data
async function checkAuth() {
  const isLoginPage = window.location.pathname.includes('login.html');

  try {
    const { data: { session }, error } = await window.supabaseClient.auth.getSession();

    if (error || !session) {
      if (!isLoginPage) {
        window.location.href = 'login.html';
      } else {
        document.body.setAttribute('data-theme', 'lavender');
        document.body.classList.add('data-loaded');
      }
      return;
    }

    if (isLoginPage) {
      window.location.href = 'index.html';
      return;
    }

    window.currentUser = session.user;
    await loadUserData();

  } catch (e) {
    console.error('Auth check failed:', e);
    if (!isLoginPage) window.location.href = 'login.html';
  }
}

// Load accounts, settings, and update display
async function loadUserData() {
  if (!window.currentUser) return;

  try {
    // Load accounts
    const { data: accounts } = await window.supabaseClient
      .from('accounts')
      .select('*')
      .eq('user_id', window.currentUser.id)
      .order('created_at', { ascending: true });

    window.userAccounts = accounts || [];

    // If trigger didn't create an account (e.g. email confirmation delay), create one now
    if (window.userAccounts.length === 0) {
      const { data: newAccount } = await window.supabaseClient
        .from('accounts')
        .insert({ user_id: window.currentUser.id, name: 'Main Account', color: '#7c3aed' })
        .select()
        .single();
      if (newAccount) window.userAccounts = [newAccount];
    }

    // Load settings
    let { data: settings } = await window.supabaseClient
      .from('user_settings')
      .select('*')
      .eq('user_id', window.currentUser.id)
      .single();

    // If no settings exist, create them
    if (!settings && window.userAccounts.length > 0) {
      const { data: newSettings } = await window.supabaseClient
        .from('user_settings')
        .insert({
          user_id: window.currentUser.id,
          current_account_id: window.userAccounts[0].id,
          pastel_theme: 'lavender',
          theme_mode: 'dark'
        })
        .select()
        .single();
      settings = newSettings;
    }

    window.userSettings = settings;

    // Determine current account
    if (settings && settings.current_account_id) {
      window.currentAccount = window.userAccounts.find(a => a.id === settings.current_account_id);
    }
    if (!window.currentAccount && window.userAccounts.length > 0) {
      window.currentAccount = window.userAccounts[0];
      // Update settings with first account
      await window.supabaseClient
        .from('user_settings')
        .update({ current_account_id: window.currentAccount.id })
        .eq('user_id', window.currentUser.id);
    }

    // Apply theme
    const themeName = settings?.pastel_theme || 'lavender';
    const themeMode = settings?.theme_mode || 'dark';
    applyTheme(themeName, themeMode);

    // Update display
    updateAccountDisplay();

    // Mark page as loaded (anti-flicker)
    document.body.classList.add('data-loaded');

    // Trigger page-specific loading
    if (typeof window.onDataLoaded === 'function') {
      window.onDataLoaded();
    }

  } catch (e) {
    console.error('Failed to load user data:', e);
    document.body.classList.add('data-loaded');
  }
}

// Update account name and email in nav
function updateAccountDisplay() {
  const accountNameEls = document.querySelectorAll('.account-name');
  const emailEl = document.getElementById('userEmail');

  accountNameEls.forEach(el => {
    el.textContent = window.currentAccount ? window.currentAccount.name : 'No Account';
  });

  if (emailEl && window.currentUser) {
    emailEl.textContent = window.currentUser.email;
  }
}

// Sign Up
async function signUp(name, email, password) {
  const { data, error } = await window.supabaseClient.auth.signUp({
    email: email,
    password: password,
    options: {
      data: { name: name }
    }
  });

  if (error) throw error;

  // Small delay to let trigger run
  await new Promise(r => setTimeout(r, 1000));

  return data;
}

// Sign In
async function signIn(email, password) {
  const { data, error } = await window.supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) throw error;
  return data;
}

// Log Out
async function logOut() {
  await window.supabaseClient.auth.signOut();
  window.location.href = 'login.html';
}

// Show notification toast
function showNotification(message, type = 'success') {
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();

  const notif = document.createElement('div');
  notif.className = `notification notification-${type}`;
  notif.textContent = message;
  document.body.appendChild(notif);

  setTimeout(() => notif.classList.add('show'), 10);
  setTimeout(() => {
    notif.classList.remove('show');
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

// Initialize on page load
loadThemeFromSettings();
document.addEventListener('DOMContentLoaded', checkAuth);
