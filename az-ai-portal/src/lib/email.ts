// ─────────────────────────────────────────────────────────────────────
// Transactional email via Resend's REST API (no SDK dependency).
//
// Required env vars:
//   RESEND_API_KEY   — from resend.com dashboard
//   EMAIL_FROM       — e.g. "AZ AI Geeks <hello@azaigeeks.com>"
//                      the domain part MUST be verified in Resend first
//                      (DNS records added at the registrar), or sends fail.
// ─────────────────────────────────────────────────────────────────────

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'AZ AI Geeks <hello@azaigeeks.com>';
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY not configured' };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from, to: [input.to], subject: input.subject, html: input.html }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { ok: false, error: `Resend error: ${res.status} ${text}` };
  }
  return { ok: true };
}

export function bookingConfirmationEmail(opts: {
  name: string; serviceName: string; staffName: string; dateLabel: string; time: string; locale: string;
}) {
  const copy: Record<string, { subject: string; heading: string; body: string; footer: string }> = {
    en: {
      subject: `Confirmed: ${opts.serviceName} on ${opts.dateLabel}`,
      heading: "You're booked! 🎉",
      body: `Hi ${opts.name}, your appointment is confirmed:<br><br>
        <b>${opts.serviceName}</b><br>${opts.dateLabel} at ${opts.time}<br>With ${opts.staffName}`,
      footer: 'Need to reschedule or cancel? Just reply to this email or visit your account.',
    },
    es: {
      subject: `Confirmado: ${opts.serviceName} el ${opts.dateLabel}`,
      heading: '¡Estás reservado! 🎉',
      body: `Hola ${opts.name}, tu cita está confirmada:<br><br>
        <b>${opts.serviceName}</b><br>${opts.dateLabel} a las ${opts.time}<br>Con ${opts.staffName}`,
      footer: '¿Necesitas reprogramar o cancelar? Responde este correo o visita tu cuenta.',
    },
    fr: {
      subject: `Confirmé : ${opts.serviceName} le ${opts.dateLabel}`,
      heading: "C'est réservé ! 🎉",
      body: `Bonjour ${opts.name}, votre rendez-vous est confirmé :<br><br>
        <b>${opts.serviceName}</b><br>${opts.dateLabel} à ${opts.time}<br>Avec ${opts.staffName}`,
      footer: 'Besoin de reporter ou annuler ? Répondez à cet e-mail ou visitez votre compte.',
    },
  };
  const c = copy[opts.locale] || copy.en;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="color:#6d4dff">${c.heading}</h2>
      <p style="font-size:16px;line-height:1.6;color:#171528">${c.body}</p>
      <p style="font-size:13px;color:#6a6785;margin-top:24px">${c.footer}</p>
      <p style="font-size:13px;color:#6a6785">AZ AI Geeks · hello@azaigeeks.com</p>
    </div>`;
  return { subject: c.subject, html };
}
