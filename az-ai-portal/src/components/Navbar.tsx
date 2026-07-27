'use client';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { getUser } from '@/lib/store';

const FLAGS: Record<string, string> = { en: '🇺🇸', es: '🇲🇽', fr: '🇫🇷' };
const NAMES: Record<string, string> = { en: 'English', es: 'Español', fr: 'Français' };

export default function Navbar() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [langOpen, setLangOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string } | null>(null);

  useEffect(() => {
    const sync = () => setUser(getUser());
    sync();
    window.addEventListener('azaz-auth', sync);
    return () => window.removeEventListener('azaz-auth', sync);
  }, []);

  const switchLang = (l: string) => {
    setLangOpen(false);
    router.replace(pathname, { locale: l });
  };

  const links: [string, string][] = [
    ['/', t('home')], ['/about', t('about')], ['/services', t('services')],
    ['/book', t('book')], ['/appointments', t('appts')], ['/contact', t('contact')], ['/faq', t('faq')],
  ];

  return (
    <header className="nav">
      <div className="wrap nav-in">
        <Link href="/" className="logo"><span className="mk"><img src="/logo-icon.png" alt="AZ AI Geeks logo" width={71} height={38} /></span> AZ AI Geeks</Link>

        <nav className={`nav-links ${menuOpen ? 'open' : ''}`}>
          {links.map(([href, label]) => (
            <Link key={href} href={href} className={pathname === href ? 'active' : ''} onClick={() => setMenuOpen(false)}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="nav-right">
          <div className="lang" onMouseLeave={() => setLangOpen(false)}>
            <button className="lang-btn" onClick={() => setLangOpen((o) => !o)}>
              {FLAGS[locale]} {locale.toUpperCase()} ▾
            </button>
            {langOpen && (
              <div className="lang-menu">
                {routing.locales.map((l) => (
                  <button key={l} onClick={() => switchLang(l)}>{FLAGS[l]} {NAMES[l]}</button>
                ))}
              </div>
            )}
          </div>
          <Link href={user ? '/appointments' : '/login'} className="btn btn-ghost btn-sm">
            {user ? user.name.split(' ')[0] : t('login')}
          </Link>
          <button className="burger" onClick={() => setMenuOpen((o) => !o)}>☰</button>
        </div>
      </div>
    </header>
  );
}
