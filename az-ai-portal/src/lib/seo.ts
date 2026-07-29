import type { Metadata } from 'next';
import type { Locale } from '@/lib/data';

export const SITE_URL = 'https://app.azaigeeks.com';

type PageKey = 'home' | 'about' | 'services' | 'faq' | 'contact';

const PATHS: Record<PageKey, string> = {
  home: '',
  about: '/about',
  services: '/services',
  faq: '/faq',
  contact: '/contact',
};

const OG_LOCALE: Record<Locale, string> = { en: 'en_US', es: 'es_ES', fr: 'fr_FR' };

const COPY: Record<PageKey, Record<Locale, { title: string; description: string }>> = {
  home: {
    en: {
      title: 'AZ AI Geeks — AI Booking Portal | Chat & Voice Appointments 24/7',
      description: 'Meet your 24/7 AI assistant. Ask a question, get matched to the right service, and book an appointment — by text or voice, in English, Spanish, or French. No hold music, ever.',
    },
    es: {
      title: 'AZ AI Geeks — Portal de Reservas con IA | Citas por Chat y Voz 24/7',
      description: 'Conoce a tu asistente de IA 24/7. Haz una pregunta, te conecta con el servicio ideal y reserva una cita — por texto o voz, en español, inglés o francés.',
    },
    fr: {
      title: 'AZ AI Geeks — Portail de Réservation IA | Rendez-vous par Chat et Voix 24/7',
      description: 'Découvrez votre assistant IA 24/7. Posez une question, trouvez le bon service et réservez un rendez-vous — par texte ou voix, en français, anglais ou espagnol.',
    },
  },
  about: {
    en: {
      title: 'About Us — Human Service, AI Speed | AZ AI Geeks',
      description: 'AZ AI Geeks builds conversion-focused websites and AI receptionists for local businesses. This portal is how your customers reach you, any hour of any day.',
    },
    es: {
      title: 'Nosotros — Servicio Humano, Velocidad de IA | AZ AI Geeks',
      description: 'AZ AI Geeks crea sitios web enfocados en conversión y recepcionistas de IA para negocios locales. Este portal es como tus clientes te contactan, a cualquier hora.',
    },
    fr: {
      title: 'À Propos — Service Humain, Vitesse IA | AZ AI Geeks',
      description: 'AZ AI Geeks crée des sites orientés conversion et des réceptionnistes IA pour les entreprises locales. Ce portail est la façon dont vos clients vous contactent, à toute heure.',
    },
  },
  services: {
    en: {
      title: 'Services — Book the Right Fit | AZ AI Geeks',
      description: 'Free Strategy Call, Website Build Consultation, AI Receptionist Setup, and a monthly Growth Review — see durations and pricing, and book online in seconds.',
    },
    es: {
      title: 'Servicios — Reserva la Opción Ideal | AZ AI Geeks',
      description: 'Llamada de Estrategia Gratis, Consulta de Sitio Web, Configuración de Recepcionista IA y Revisión de Crecimiento mensual — reserva en línea en segundos.',
    },
    fr: {
      title: 'Services — Réservez le Bon Service | AZ AI Geeks',
      description: 'Appel Stratégie Gratuit, Consultation Site Web, Installation Réceptionniste IA et Bilan de Croissance mensuel — réservez en ligne en quelques secondes.',
    },
  },
  faq: {
    en: {
      title: 'FAQ — Questions, Answered | AZ AI Geeks',
      description: 'Answers about our AI assistant, voice booking, supported languages, accounts, appointment reminders, and data privacy.',
    },
    es: {
      title: 'Preguntas Frecuentes — Resueltas | AZ AI Geeks',
      description: 'Respuestas sobre nuestro asistente de IA, reservas por voz, idiomas disponibles, cuentas, recordatorios de citas y privacidad de datos.',
    },
    fr: {
      title: 'FAQ — Questions, Réponses | AZ AI Geeks',
      description: 'Réponses sur notre assistant IA, la réservation vocale, les langues prises en charge, les comptes, les rappels de rendez-vous et la confidentialité des données.',
    },
  },
  contact: {
    en: {
      title: 'Contact Us | AZ AI Geeks',
      description: 'Send a message, or use the chat and voice assistant for an instant reply. Email hello@azaigeeks.com.',
    },
    es: {
      title: 'Contáctanos | AZ AI Geeks',
      description: 'Envía un mensaje o usa el asistente de chat y voz para una respuesta inmediata. Correo: hello@azaigeeks.com.',
    },
    fr: {
      title: 'Contactez-Nous | AZ AI Geeks',
      description: "Envoyez un message ou utilisez l'assistant chat et voix pour une réponse immédiate. E-mail : hello@azaigeeks.com.",
    },
  },
};

export function seoAlternates(locale: Locale, path: string) {
  return {
    canonical: `${SITE_URL}/${locale}${path}`,
    languages: {
      en: `${SITE_URL}/en${path}`,
      es: `${SITE_URL}/es${path}`,
      fr: `${SITE_URL}/fr${path}`,
      'x-default': `${SITE_URL}/en${path}`,
    },
  };
}

export function pageMetadata(key: PageKey, locale: Locale): Metadata {
  const copy = COPY[key][locale];
  const path = PATHS[key];
  const url = `${SITE_URL}/${locale}${path}`;
  return {
    title: copy.title,
    description: copy.description,
    alternates: seoAlternates(locale, path),
    openGraph: {
      title: copy.title,
      description: copy.description,
      url,
      images: ['/logo-full.png'],
      locale: OG_LOCALE[locale],
    },
    twitter: {
      card: 'summary_large_image',
      title: copy.title,
      description: copy.description,
      images: ['/logo-full.png'],
    },
  };
}

export { PATHS as SEO_PATHS };
