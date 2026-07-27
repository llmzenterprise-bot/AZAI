'use client';

export function showToast(text: string, type: 'ok' | 'err' | '' = '') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('azaz-toast', { detail: { text, type } }));
}
