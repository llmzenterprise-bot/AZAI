'use client';
// ─────────────────────────────────────────────────────────────────────
// DEMO persistence via localStorage. In production these are replaced by
// Auth.js sessions + the /api/appointments endpoints backed by PostgreSQL.
// ─────────────────────────────────────────────────────────────────────

export interface User { name: string; email: string; }
export interface Appointment {
  id: string; user: string; serviceId: string; serviceName: string;
  staff: string; date: string; time: string;
}

const K = { user: 'azaz_user', appts: 'azaz_appts', accounts: 'azaz_accounts' };
const isBrowser = () => typeof window !== 'undefined';

export function getUser(): User | null {
  if (!isBrowser()) return null;
  try { return JSON.parse(localStorage.getItem(K.user) || 'null'); } catch { return null; }
}
export function setUser(u: User | null) {
  if (!isBrowser()) return;
  if (u) localStorage.setItem(K.user, JSON.stringify(u));
  else localStorage.removeItem(K.user);
  window.dispatchEvent(new Event('azaz-auth'));
}

interface Account { name: string; pw: string; }
function accounts(): Record<string, Account> {
  if (!isBrowser()) return {};
  try { return JSON.parse(localStorage.getItem(K.accounts) || '{}'); } catch { return {}; }
}
export function register(name: string, email: string, pw: string): User {
  const accs = accounts();
  accs[email.toLowerCase()] = { name, pw };
  localStorage.setItem(K.accounts, JSON.stringify(accs));
  const u = { name, email: email.toLowerCase() };
  setUser(u);
  return u;
}
export function login(email: string, pw: string): User | null {
  const accs = accounts();
  const e = email.toLowerCase();
  if (accs[e] && accs[e].pw === pw) {
    const u = { name: accs[e].name, email: e };
    setUser(u);
    return u;
  }
  return null;
}

export function getAppts(): Appointment[] {
  if (!isBrowser()) return [];
  try { return JSON.parse(localStorage.getItem(K.appts) || '[]'); } catch { return []; }
}
export function setAppts(a: Appointment[]) {
  if (!isBrowser()) return;
  localStorage.setItem(K.appts, JSON.stringify(a));
  window.dispatchEvent(new Event('azaz-appts'));
}
