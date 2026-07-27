'use client';
import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { groundedRespond, type Locale } from '@/lib/data';

interface Msg { text: string; who: 'bot' | 'me'; }
const VOICE_LANG: Record<string, string> = { en: 'en-US', es: 'es-MX', fr: 'fr-FR' };

function getSR(): any {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export default function AssistantDock() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const router = useRouter();

  const [chatOpen, setChatOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState('');
  const [micLive, setMicLive] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const bodyRef = useRef<HTMLDivElement>(null);
  const recogRef = useRef<any>(null);

  // Open voice overlay from anywhere (e.g. hero button)
  useEffect(() => {
    const h = () => setVoiceOpen(true);
    window.addEventListener('azaz-open-voice', h);
    return () => window.removeEventListener('azaz-open-voice', h);
  }, []);

  useEffect(() => {
    if (chatOpen && msgs.length === 0) setMsgs([{ text: t('chat.greet'), who: 'bot' }]);
  }, [chatOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { bodyRef.current?.scrollTo(0, bodyRef.current.scrollHeight); }, [msgs, typing]);

  function speak(text: string) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g, ''));
    u.lang = VOICE_LANG[locale];
    const v = speechSynthesis.getVoices().find((x) => x.lang.startsWith(locale));
    if (v) u.voice = v;
    u.rate = 1.02;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }

  function routeIntent(intent: string) {
    if (intent === 'book') setTimeout(() => { setChatOpen(false); router.push('/book'); }, 700);
    if (intent === 'cancel' || intent === 'reschedule') setTimeout(() => { setChatOpen(false); router.push('/appointments'); }, 700);
  }

  async function send(text: string, fromVoice = false) {
    text = (text || '').trim();
    if (!text) return;
    if (!fromVoice) { setMsgs((m) => [...m, { text, who: 'me' }]); setInput(''); }
    setTyping(true);
    let result;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: text, locale }),
      });
      result = await res.json();
    } catch {
      result = groundedRespond(text, locale); // offline fallback
    }
    setTyping(false);
    setMsgs((m) => [...m, { text: result.text, who: 'bot' }]);
    routeIntent(result.intent);
    if (fromVoice || voiceOpen) { setTranscript('🤖 ' + result.text); speak(result.text); }
    return result;
  }

  // ---- Voice overlay recognition ----
  function toggleListen() {
    const SR = getSR();
    if (!SR) { setTranscript('⚠ ' + t('voice.unsupported')); return; }
    if (listening) { recogRef.current?.stop(); return; }
    const r = new SR();
    r.lang = VOICE_LANG[locale];
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (e: any) => {
      let txt = '';
      for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript;
      setTranscript(txt);
      if (e.results[e.results.length - 1].isFinal) send(txt, true);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recogRef.current = r;
    setListening(true);
    setTranscript(t('voice.tap'));
    try { r.start(); } catch { /* already started */ }
  }

  // ---- In-chat mic (speech → text into input) ----
  function chatMic() {
    const SR = getSR();
    if (!SR) { setTranscript(t('voice.unsupported')); return; }
    const r = new SR();
    r.lang = VOICE_LANG[locale];
    r.interimResults = false;
    setMicLive(true);
    r.onresult = (e: any) => { const txt = e.results[0][0].transcript; setInput(txt); send(txt); };
    r.onend = () => setMicLive(false);
    r.onerror = () => setMicLive(false);
    try { r.start(); } catch { setMicLive(false); }
  }

  function closeVoice() {
    setVoiceOpen(false);
    recogRef.current?.stop();
    if (typeof window !== 'undefined' && window.speechSynthesis) speechSynthesis.cancel();
  }

  const chips = [t('chat.chip1'), t('chat.chip2'), t('chat.chip3'), t('chat.chip4')];

  return (
    <>
      {!chatOpen && (
        <div className="fab-wrap">
          <button className="fab mic" title="Voice" onClick={() => setVoiceOpen(true)}>🎙</button>
          <button className="fab" title="Chat" onClick={() => setChatOpen(true)}>💬</button>
        </div>
      )}

      {chatOpen && (
        <div className="chat">
          <div className="chat-head">
            <div className="av">🤖</div>
            <div>
              <h4>{t('chat.title')}</h4>
              <div className="status">{t('chat.online')}</div>
            </div>
            <button className="x" onClick={() => setChatOpen(false)}>×</button>
          </div>
          <div className="chat-body" ref={bodyRef}>
            {msgs.map((m, i) => <div key={i} className={`msg ${m.who}`}>{m.text}</div>)}
            {typing && <div className="msg bot"><div className="typing"><span /><span /><span /></div></div>}
          </div>
          <div className="chips">
            {chips.map((c) => <button key={c} className="chip" onClick={() => send(c)}>{c}</button>)}
          </div>
          <div className="chat-in">
            <button className={`mic-btn ${micLive ? 'live' : ''}`} title="Speak" onClick={chatMic}>🎙</button>
            <input
              value={input}
              placeholder={t('chat.ph')}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(input); }}
            />
            <button onClick={() => send(input)}>➤</button>
          </div>
        </div>
      )}

      {voiceOpen && (
        <div className="voice-ov">
          <div className={`voice-orb ${listening ? 'listening' : ''}`} onClick={toggleListen}>🎙</div>
          <div className="transcript">{transcript || t('voice.tap')}</div>
          <div className="hint">{t('voice.hint')}</div>
          <div className="voice-ctrls">
            <button className="btn btn-ghost" onClick={toggleListen}>{listening ? t('voice.stop') : t('voice.listen')}</button>
            <button className="btn btn-primary" onClick={closeVoice}>{t('voice.close')}</button>
          </div>
        </div>
      )}
    </>
  );
}
