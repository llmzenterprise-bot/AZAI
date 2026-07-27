'use client';
import { useEffect, useState } from 'react';

export default function Toaster() {
  const [state, setState] = useState<{ text: string; type: string; show: boolean }>({ text: '', type: '', show: false });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const handler = (e: Event) => {
      const { text, type } = (e as CustomEvent).detail;
      setState({ text, type, show: true });
      clearTimeout(timer);
      timer = setTimeout(() => setState((s) => ({ ...s, show: false })), 2600);
    };
    window.addEventListener('azaz-toast', handler);
    return () => { window.removeEventListener('azaz-toast', handler); clearTimeout(timer); };
  }, []);

  return <div className={`toast ${state.show ? 'show' : ''} ${state.type}`}>{state.text}</div>;
}
