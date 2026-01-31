export interface Env {
  RESEND_API_KEY: string;
  ALLOWED_ORIGIN: string;
  EMAIL_TO: string;
  RATE_LIMIT_MAX: string;
  RATE_LIMIT_WINDOW: string;
  RATE_LIMIT: KVNamespace;
}

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  website?: string; // honeypot
}

interface ResponseBody {
  success: boolean;
  message?: string;
  error?: string;
  field?: string;
}

const SUBJECT_LABELS: Record<string, string> = {
  general: 'Informazioni generali',
  investment: 'Investimenti',
  partnership: 'Partnership',
  other: 'Altro',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function checkRateLimit(ip: string, env: Env): Promise<boolean> {
  const key = `rate:${ip}`;
  const current = await env.RATE_LIMIT.get(key);
  const count = current ? parseInt(current, 10) : 0;
  const max = parseInt(env.RATE_LIMIT_MAX, 10);

  if (count >= max) {
    return false; // Rate limited
  }

  // Increment counter
  const window = parseInt(env.RATE_LIMIT_WINDOW, 10);
  await env.RATE_LIMIT.put(key, String(count + 1), {
    expirationTtl: window,
  });

  return true;
}

function validateFormData(data: ContactFormData): ResponseBody | null {
  // Honeypot check
  if (data.website) {
    // Silently reject spam
    return null;
  }

  if (!data.name || data.name.trim().length === 0) {
    return { success: false, error: 'validation_error', message: 'Il nome è obbligatorio', field: 'name' };
  }

  if (data.name.length > 100) {
    return { success: false, error: 'validation_error', message: 'Il nome è troppo lungo', field: 'name' };
  }

  if (!data.email || !EMAIL_REGEX.test(data.email)) {
    return { success: false, error: 'validation_error', message: 'Email non valida', field: 'email' };
  }

  if (!data.subject || !SUBJECT_LABELS[data.subject]) {
    return { success: false, error: 'validation_error', message: 'Seleziona un argomento', field: 'subject' };
  }

  if (!data.message || data.message.trim().length === 0) {
    return { success: false, error: 'validation_error', message: 'Il messaggio è obbligatorio', field: 'message' };
  }

  if (data.message.length > 2000) {
    return { success: false, error: 'validation_error', message: 'Il messaggio è troppo lungo', field: 'message' };
  }

  return null; // Valid
}

function sanitize(str: string): string {
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .trim();
}

async function sendEmail(data: ContactFormData, env: Env): Promise<boolean> {
  const subjectLabel = SUBJECT_LABELS[data.subject] || data.subject;

  const htmlBody = `
    <h2>Nuovo messaggio dal sito Abitare Holding</h2>
    <table style="border-collapse: collapse; width: 100%;">
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Nome</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${sanitize(data.name)}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${sanitize(data.email)}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Telefono</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${data.phone ? sanitize(data.phone) : '-'}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Oggetto</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${subjectLabel}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Messaggio</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${sanitize(data.message).replace(/\n/g, '<br>')}</td>
      </tr>
    </table>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'Abitare Holding <noreply@abitarebene.it>',
      to: env.EMAIL_TO,
      reply_to: data.email,
      subject: `[Sito Web] ${subjectLabel} - ${data.name}`,
      html: htmlBody,
    }),
  });

  return response.ok;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only POST allowed
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'method_not_allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      // Rate limiting
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const allowed = await checkRateLimit(ip, env);

      if (!allowed) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'rate_limit',
            message: 'Troppi tentativi. Riprova tra qualche minuto.',
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Parse body
      const data: ContactFormData = await request.json();

      // Validate
      const validationError = validateFormData(data);

      // Honeypot triggered - silent success
      if (validationError === null && data.website) {
        return new Response(
          JSON.stringify({ success: true, message: 'Messaggio inviato con successo' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (validationError) {
        return new Response(
          JSON.stringify(validationError),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Send email
      const sent = await sendEmail(data, env);

      if (!sent) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'send_error',
            message: 'Si è verificato un errore. Prova a contattarci via WhatsApp.',
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Messaggio inviato con successo' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('Error processing request:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'server_error',
          message: 'Si è verificato un errore. Prova a contattarci via WhatsApp.',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  },
};
