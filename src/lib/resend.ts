import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface SendAlertEmailParams {
  toEmails: string[];
  userName: string;
  lastPingAt: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  statusUrl: string;
}

export async function sendEmergencyAlertEmail({
  toEmails,
  userName,
  lastPingAt,
  locationName,
  latitude,
  longitude,
  statusUrl
}: SendAlertEmailParams) {
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Toujours Vivant <alerte@resend.dev>';
  const formattedDate = new Date(lastPingAt).toLocaleString('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'medium',
    timeZone: 'Europe/Paris'
  });

  const mapsUrl = (latitude && longitude)
    ? `https://maps.google.com/?q=${latitude},${longitude}`
    : undefined;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <title>ALERTE : Pas de nouvelles de ${userName}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #090d16; color: #ffffff; padding: 20px; }
        .card { max-width: 600px; margin: 0 auto; background: #161f32; border: 2px solid #f43f5e; border-radius: 12px; padding: 24px; box-shadow: 0 10px 30px rgba(244, 63, 94, 0.3); }
        .badge { display: inline-block; background: #f43f5e; color: #ffffff; padding: 6px 14px; font-weight: bold; border-radius: 20px; font-size: 14px; text-transform: uppercase; }
        h1 { color: #f43f5e; margin-top: 15px; font-size: 24px; }
        p { font-size: 16px; line-height: 1.6; color: #cbd5e1; }
        .info-box { background: #0f172a; padding: 16px; border-radius: 8px; border-left: 4px solid #f43f5e; margin: 20px 0; }
        .btn { display: inline-block; background: #f43f5e; color: #ffffff; text-decoration: none; padding: 12px 24px; font-weight: bold; border-radius: 8px; margin-top: 15px; }
        .footer { font-size: 12px; color: #64748b; margin-top: 30px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <span class="badge">🔴 Alerte Déclenchée</span>
        <h1>Pas de nouvelles de ${userName}</h1>
        <p>Ce message d'alerte automatique vous est envoyé car <strong>${userName}</strong> n'a pas effectué de check-in (ping manuel ou mouvement détecté) depuis plus de 30 minutes.</p>
        
        <div class="info-box">
          <p><strong>Dernier check-in enregistré :</strong> ${formattedDate}</p>
          ${locationName ? `<p><strong>Dernière position connue :</strong> ${locationName}</p>` : ''}
          ${mapsUrl ? `<p><strong>Carte GPS :</strong> <a href="${mapsUrl}" style="color:#38bdf8;" target="_blank">Voir sur Google Maps (${latitude}, ${longitude})</a></p>` : ''}
        </div>

        <p>Veuillez essayer de contacter <strong>${userName}</strong> immédiatement pour vous assurer que tout va bien.</p>

        <a href="${statusUrl}" class="btn">Consulter la Page de Statut en Temps Réel</a>

        <div class="footer">
          Envoyé automatiquement par l'application <strong>Toujours Vivant</strong> (Dispositif d'Alerte & Check-in).
        </div>
      </div>
    </body>
    </html>
  `;

  if (!resend) {
    console.log(`[Resend Email Mock] Alert sent to ${toEmails.join(', ')} for ${userName}`);
    return { success: true, mock: true };
  }

  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to: toEmails,
      subject: `🚨 ALERTE IMPORTANTE : Pas de nouvelles de ${userName} (Toujours Vivant)`,
      html: htmlContent,
    });
    return { success: true, data };
  } catch (error) {
    console.error('Error sending Resend email alert:', error);
    return { success: false, error };
  }
}
