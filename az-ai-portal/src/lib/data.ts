// ─────────────────────────────────────────────────────────────────────
// Shared business data — services, staff, FAQ, and the AI knowledge base.
// In production this comes from PostgreSQL (see prisma/schema.prisma) and a
// vector store for RAG. Here it is static so the demo runs with no backend.
// ─────────────────────────────────────────────────────────────────────

export type Locale = 'en' | 'es' | 'fr';

export interface Service { id: string; name: string; dur: string; price: string; desc: string; }
export interface Staff { id: string; name: string; }

export const SERVICES: Record<Locale, Service[]> = {
  en: [
    { id: 'strategy', name: 'Free Strategy Call', dur: '15 min', price: 'Free', desc: "Map your goals and see if we're a fit. Zero pressure." },
    { id: 'website', name: 'Website Build Consultation', dur: '30 min', price: '$0 deposit', desc: 'Plan a conversion-engineered website for your business.' },
    { id: 'ai', name: 'AI Receptionist Setup', dur: '45 min', price: 'From $1,050', desc: 'Wire an AI receptionist into your business phone line.' },
    { id: 'growth', name: 'Growth Review', dur: '30 min', price: 'Included', desc: "Monthly check-in — what's working and what we're adjusting." },
  ],
  es: [
    { id: 'strategy', name: 'Llamada de Estrategia Gratis', dur: '15 min', price: 'Gratis', desc: 'Definimos tus metas y vemos si encajamos. Sin presión.' },
    { id: 'website', name: 'Consulta de Sitio Web', dur: '30 min', price: '$0 depósito', desc: 'Planeamos un sitio web enfocado en conversión.' },
    { id: 'ai', name: 'Configuración de Recepcionista IA', dur: '45 min', price: 'Desde $1,050', desc: 'Conectamos una recepcionista de IA a tu línea telefónica.' },
    { id: 'growth', name: 'Revisión de Crecimiento', dur: '30 min', price: 'Incluido', desc: 'Revisión mensual — qué funciona y qué ajustamos.' },
  ],
  fr: [
    { id: 'strategy', name: 'Appel Stratégie Gratuit', dur: '15 min', price: 'Gratuit', desc: "Définissons vos objectifs et voyons si on s'accorde. Sans pression." },
    { id: 'website', name: 'Consultation Site Web', dur: '30 min', price: "0 $ d'acompte", desc: 'Planifions un site orienté conversion pour votre entreprise.' },
    { id: 'ai', name: 'Installation Réceptionniste IA', dur: '45 min', price: 'Dès 1 050 $', desc: 'Connectons une réceptionniste IA à votre ligne téléphonique.' },
    { id: 'growth', name: 'Bilan de Croissance', dur: '30 min', price: 'Inclus', desc: "Bilan mensuel — ce qui marche et ce qu'on ajuste." },
  ],
};

export const STAFF: Record<Locale, Staff[]> = {
  en: [{ id: 'any', name: 'No preference' }, { id: 'alex', name: 'Alex — Strategist' }, { id: 'sam', name: 'Sam — Build Lead' }, { id: 'jordan', name: 'Jordan — AI Engineer' }],
  es: [{ id: 'any', name: 'Sin preferencia' }, { id: 'alex', name: 'Alex — Estratega' }, { id: 'sam', name: 'Sam — Líder de Desarrollo' }, { id: 'jordan', name: 'Jordan — Ingeniero IA' }],
  fr: [{ id: 'any', name: 'Sans préférence' }, { id: 'alex', name: 'Alex — Stratège' }, { id: 'sam', name: 'Sam — Chef de projet' }, { id: 'jordan', name: 'Jordan — Ingénieur IA' }],
};

export const FAQ: Record<Locale, [string, string][]> = {
  en: [
    ['What is the AI assistant?', 'An intelligent assistant that answers questions, books, reschedules, and cancels appointments 24/7 — by chat or voice — and hands off to a human when needed.'],
    ['Can I really book by voice?', 'Yes. Tap the microphone, speak naturally, and the assistant guides you through booking with a human-like voice.'],
    ['Which languages are supported?', 'English, Spanish, and French across the whole site, forms, chat, and voice — switch instantly, no reload.'],
    ['Do I need an account?', 'You can browse and chat freely. An account is only needed to view and manage your appointments.'],
    ['How do reminders work?', 'Confirmations and reminders are sent by email and SMS so you never miss a booking.'],
    ['Is my data safe?', 'Yes. The AI answers only from a verified knowledge base and never sells your data. See our Privacy Policy.'],
  ],
  es: [
    ['¿Qué es el asistente de IA?', 'Un asistente inteligente que responde preguntas, reserva, reprograma y cancela citas 24/7 — por chat o voz — y transfiere a un humano cuando hace falta.'],
    ['¿De verdad puedo reservar por voz?', 'Sí. Toca el micrófono, habla con naturalidad y el asistente te guía con una voz humana.'],
    ['¿Qué idiomas están disponibles?', 'Inglés, español y francés en todo el sitio, formularios, chat y voz — cambia al instante, sin recargar.'],
    ['¿Necesito una cuenta?', 'Puedes navegar y chatear libremente. Solo necesitas cuenta para ver y gestionar tus citas.'],
    ['¿Cómo funcionan los recordatorios?', 'Las confirmaciones y recordatorios se envían por correo y SMS para que no olvides tu cita.'],
    ['¿Mis datos están seguros?', 'Sí. La IA responde solo desde una base verificada y nunca vende tus datos. Consulta la Política de Privacidad.'],
  ],
  fr: [
    ["Qu'est-ce que l'assistant IA ?", "Un assistant intelligent qui répond aux questions, réserve, reporte et annule des rendez-vous 24/7 — par chat ou voix — et transfère à un humain si besoin."],
    ['Puis-je vraiment réserver par la voix ?', "Oui. Touchez le micro, parlez naturellement, et l'assistant vous guide avec une voix humaine."],
    ['Quelles langues sont prises en charge ?', 'Anglais, espagnol et français sur tout le site, formulaires, chat et voix — changez instantanément, sans recharger.'],
    ['Ai-je besoin d\'un compte ?', "Vous pouvez naviguer et discuter librement. Un compte n'est requis que pour gérer vos rendez-vous."],
    ['Comment fonctionnent les rappels ?', 'Confirmations et rappels sont envoyés par e-mail et SMS pour ne rien oublier.'],
    ['Mes données sont-elles protégées ?', "Oui. L'IA répond uniquement depuis une base vérifiée et ne vend jamais vos données. Voir la Politique de Confidentialité."],
  ],
};

// AI knowledge base — the ONLY source the assistant may answer facts from.
export const KB: Record<Locale, Record<string, string>> = {
  en: {
    hours: "We're available 24/7 through this portal and the AI assistant. Our human team works Mon–Fri, 9am–6pm.",
    price: 'Starter Site is $500 one-time, Growth Engine is $1,050 setup + $300/mo, and Full Domination is $10,000. The strategy call is free.',
    services: 'We offer four bookable services: a Free Strategy Call, Website Build Consultation, AI Receptionist Setup, and a monthly Growth Review. Want me to start a booking?',
    location: 'We work with businesses remotely across the US — everything happens by call and screen-share.',
    contact: 'You can email hello@azaigeeks.com, use this chat, or the voice assistant. Want me to book a call instead?',
    human: "I'll connect you with a human team member — email hello@azaigeeks.com and they'll reply shortly. Anything I can help with in the meantime?",
    fallback: "I can help with our services, pricing, hours, and booking or changing appointments. Could you rephrase that? You can also type 'book' to start a booking.",
  },
  es: {
    hours: 'Estamos disponibles 24/7 por este portal y el asistente de IA. Nuestro equipo humano trabaja de lunes a viernes, 9am–6pm.',
    price: 'El Sitio Starter cuesta $500 único pago, Growth Engine $1,050 de instalación + $300/mes, y Full Domination $10,000. La llamada de estrategia es gratis.',
    services: 'Ofrecemos cuatro servicios: Llamada de Estrategia Gratis, Consulta de Sitio Web, Configuración de Recepcionista IA y Revisión de Crecimiento mensual. ¿Empiezo una reserva?',
    location: 'Trabajamos de forma remota con negocios en todo EE. UU. — todo se hace por llamada y pantalla compartida.',
    contact: 'Escríbenos a hello@azaigeeks.com, usa este chat o el asistente de voz. ¿Prefieres que agende una llamada?',
    human: 'Te conecto con una persona del equipo — escribe a hello@azaigeeks.com y responderán pronto. ¿Algo más mientras tanto?',
    fallback: "Puedo ayudarte con servicios, precios, horarios y reservar o cambiar citas. ¿Puedes reformularlo? También puedes escribir 'reservar' para empezar.",
  },
  fr: {
    hours: 'Nous sommes disponibles 24/7 via ce portail et l\'assistant IA. Notre équipe humaine travaille du lundi au vendredi, 9h–18h.',
    price: "Le Site Starter est à 500 $ unique, Growth Engine à 1 050 $ d'installation + 300 $/mois, et Full Domination à 10 000 $. L'appel stratégie est gratuit.",
    services: 'Nous proposons quatre services : Appel Stratégie Gratuit, Consultation Site Web, Installation Réceptionniste IA et Bilan de Croissance mensuel. Je lance une réservation ?',
    location: 'Nous travaillons à distance avec des entreprises partout aux États-Unis — tout se fait par appel et partage d\'écran.',
    contact: 'Écrivez à hello@azaigeeks.com, utilisez ce chat ou l\'assistant vocal. Voulez-vous que je réserve un appel ?',
    human: 'Je vous mets en relation avec un humain — écrivez à hello@azaigeeks.com et ils répondront vite. Puis-je aider en attendant ?',
    fallback: "Je peux aider avec nos services, tarifs, horaires et la réservation ou modification de rendez-vous. Pouvez-vous reformuler ? Tapez aussi 'réserver' pour commencer.",
  },
};

// Intent keyword matching (per language + English fallback).
export const INTENTS: { k: string; w: Record<Locale, string[]> }[] = [
  { k: 'hours', w: { en: ['hour', 'open', 'time', 'available', 'when'], es: ['horario', 'hora', 'abren', 'abierto', 'disponible', 'cuando'], fr: ['heure', 'ouvert', 'horaire', 'disponible', 'quand'] } },
  { k: 'price', w: { en: ['price', 'cost', 'how much', 'fee', 'pricing', '$'], es: ['precio', 'costo', 'cuánto', 'cuanto', 'tarifa', 'cuesta'], fr: ['prix', 'coût', 'cout', 'combien', 'tarif'] } },
  { k: 'services', w: { en: ['service', 'offer', 'what do you', 'help with', 'do you do'], es: ['servicio', 'ofrecen', 'qué hacen', 'que hacen', 'ayudan'], fr: ['service', 'proposez', 'offrez', 'faites-vous', 'aide'] } },
  { k: 'location', w: { en: ['where', 'location', 'address', 'area', 'near'], es: ['dónde', 'donde', 'ubicación', 'dirección', 'zona'], fr: ['où', 'adresse', 'lieu', 'zone', 'région'] } },
  { k: 'contact', w: { en: ['contact', 'email', 'phone', 'reach', 'call you'], es: ['contacto', 'correo', 'teléfono', 'telefono', 'llamar'], fr: ['contact', 'email', 'téléphone', 'telephone', 'joindre'] } },
  { k: 'human', w: { en: ['human', 'person', 'agent', 'representative', 'real person', 'someone'], es: ['humano', 'persona', 'agente', 'representante', 'alguien'], fr: ['humain', 'personne', 'agent', 'représentant', "quelqu'un"] } },
];

export const BOOK_WORDS: Record<Locale, string[]> = { en: ['book', 'appointment', 'schedule', 'reserve'], es: ['reservar', 'cita', 'agendar', 'agenda'], fr: ['réserver', 'reserver', 'rendez-vous', 'rdv', 'planifier'] };
export const CANCEL_WORDS: Record<Locale, string[]> = { en: ['cancel'], es: ['cancelar'], fr: ['annuler'] };
export const RESCHED_WORDS: Record<Locale, string[]> = { en: ['reschedule', 'change', 'move'], es: ['reprogramar', 'cambiar', 'mover'], fr: ['reporter', 'changer', 'déplacer', 'modifier'] };

// Core grounded engine — shared by the API route and the client fallback.
export type AiIntent = 'book' | 'cancel' | 'reschedule' | 'answer';
export interface AiResult { intent: AiIntent; text: string; }

function has(text: string, words: string[]) {
  const t = text.toLowerCase();
  return words.some((w) => t.includes(w));
}

export function groundedRespond(input: string, locale: Locale): AiResult {
  const kb = KB[locale];
  const low = input.toLowerCase();
  if (has(low, BOOK_WORDS[locale]) || has(low, BOOK_WORDS.en)) {
    return { intent: 'book', text: locale === 'es' ? '¡Perfecto! Abriendo la reserva… 📅' : locale === 'fr' ? "Parfait ! J'ouvre la réservation… 📅" : 'Great! Opening the booking flow for you… 📅' };
  }
  if (has(low, CANCEL_WORDS[locale]) || has(low, CANCEL_WORDS.en)) {
    return { intent: 'cancel', text: locale === 'es' ? 'Claro, te llevo a Mis Citas para cancelar. 🗑' : locale === 'fr' ? 'Bien sûr, je vous emmène à Mes RDV pour annuler. 🗑' : 'Sure — taking you to My Appointments to cancel. 🗑' };
  }
  if (has(low, RESCHED_WORDS[locale])) {
    return { intent: 'reschedule', text: locale === 'es' ? 'Vamos a Mis Citas para reprogramar. 🔄' : locale === 'fr' ? 'Allons à Mes RDV pour reporter. 🔄' : "Let's head to My Appointments to reschedule. 🔄" };
  }
  for (const it of INTENTS) {
    if (has(low, it.w[locale]) || has(low, it.w.en)) return { intent: 'answer', text: kb[it.k] };
  }
  return { intent: 'answer', text: kb.fallback };
}
