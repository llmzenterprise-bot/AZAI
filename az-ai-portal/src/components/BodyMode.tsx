'use client';
import { useEffect } from 'react';
import { usePathname } from '@/i18n/navigation';

// Marketing pages get the bold/dark treatment; app pages get the calm/light one.
const MARKETING = ['/', '/about', '/services', '/contact', '/faq', '/privacy', '/terms'];

export default function BodyMode() {
  const pathname = usePathname();
  useEffect(() => {
    const isApp = !MARKETING.includes(pathname);
    document.body.classList.toggle('app-mode', isApp);
  }, [pathname]);
  return null;
}
