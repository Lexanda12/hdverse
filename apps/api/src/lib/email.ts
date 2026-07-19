import sgMail from '@sendgrid/mail';
import { config } from '../shared/config/env';
import { logger } from '../shared/utils/logger';

sgMail.setApiKey(config.SENDGRID_API_KEY);

const FROM_EMAIL = config.AWS_SES_FROM_EMAIL;

export interface CertificateEmailData {
  recipientEmail: string;
  recipientName: string;
  workTitle: string;
  artistName: string;
  isrc: string;
  certificateNumber: string;
  verificationUrl: string;
  issuedAt: Date;
}

export interface DetectionAlertEmailData {
  recipientEmail: string;
  recipientName: string;
  workTitle: string;
  platform: string;
  detectedAt: Date;
  matchConfidence: string;
  sourceUrl?: string;
  verificationUrl: string;
}

export async function sendCertificateEmail(
  data: CertificateEmailData
): Promise<void> {
  const msg = {
    to: data.recipientEmail,
    from: { email: FROM_EMAIL, name: 'HD Verse' },
    subject: `Your certificate is ready — ${data.workTitle}`,
    html: buildCertificateEmailHtml(data),
    text: buildCertificateEmailText(data),
  };

  try {
    await sgMail.send(msg);
    logger.info(
      { to: data.recipientEmail, workTitle: data.workTitle },
      'Certificate email sent'
    );
  } catch (error) {
    logger.error({ error, to: data.recipientEmail }, 'Failed to send certificate email');
    throw error;
  }
}

export async function sendDetectionAlertEmail(
  data: DetectionAlertEmailData
): Promise<void> {
  const msg = {
    to: data.recipientEmail,
    from: { email: FROM_EMAIL, name: 'HD Verse' },
    subject: `⚠️ Your music was detected — ${data.workTitle}`,
    html: buildDetectionAlertEmailHtml(data),
    text: buildDetectionAlertEmailText(data),
  };

  try {
    await sgMail.send(msg);
    logger.info(
      { to: data.recipientEmail, workTitle: data.workTitle },
      'Detection alert email sent'
    );
  } catch (error) {
    logger.error({ error, to: data.recipientEmail }, 'Failed to send detection alert email');
    throw error;
  }
}

function buildCertificateEmailHtml(data: CertificateEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your HD Verse Certificate</title>
</head>
<body style="margin:0;padding:0;background:#1B1F34;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1B1F34;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#2B2D3A;border-radius:12px;overflow:hidden;max-width:600px;">
          
          <!-- Top bar -->
          <tr>
            <td style="background:linear-gradient(135deg,#C903D0,#650268);height:6px;"></td>
          </tr>
          
          <!-- Header -->
          <tr>
            <td style="padding:40px 40px 20px;text-align:center;">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#C903D0;letter-spacing:2px;">HD VERSE</h1>
              <p style="margin:6px 0 0;font-size:12px;color:#7A7F99;">Africa's Creative IP Infrastructure</p>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding:0 40px 30px;text-align:center;">
              <h2 style="margin:0;font-size:20px;color:#FFFFFF;">Your certificate is ready 🎵</h2>
              <p style="margin:10px 0 0;font-size:14px;color:#7A7F99;line-height:1.6;">
                Your ownership has been timestamped and recorded.<br>
                You now have proof that cannot be disputed.
              </p>
            </td>
          </tr>

          <!-- Details card -->
          <tr>
            <td style="padding:0 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#33374A;border-radius:8px;padding:24px;">
                <tr>
                  <td style="padding:0 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #1B1F34;">
                          <span style="font-size:10px;color:#7A7F99;text-transform:uppercase;">Work Title</span><br>
                          <span style="font-size:15px;color:#FFFFFF;font-weight:600;">${data.workTitle}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #1B1F34;">
                          <span style="font-size:10px;color:#7A7F99;text-transform:uppercase;">Artist</span><br>
                          <span style="font-size:15px;color:#FFFFFF;">${data.artistName}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #1B1F34;">
                          <span style="font-size:10px;color:#7A7F99;text-transform:uppercase;">ISRC</span><br>
                          <span style="font-size:14px;color:#3EFED0;font-family:monospace;">${data.isrc}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;">
                          <span style="font-size:10px;color:#7A7F99;text-transform:uppercase;">Certificate No.</span><br>
                          <span style="font-size:14px;color:#3EFED0;font-family:monospace;">${data.certificateNumber}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 40px 40px;text-align:center;">
              <a href="${data.verificationUrl}"
                 style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#C903D0,#650268);color:#FFFFFF;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">
                View &amp; Download Certificate
              </a>
              <p style="margin:16px 0 0;font-size:12px;color:#7A7F99;">
                Issued ${data.issuedAt.toDateString()}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;text-align:center;border-top:1px solid #33374A;">
              <p style="margin:0;font-size:11px;color:#7A7F99;">
                HD Verse &middot; myhdverse.com &middot; Africa's Creative IP Infrastructure
              </p>
            </td>
          </tr>

          <!-- Bottom bar -->
          <tr>
            <td style="background:linear-gradient(135deg,#C903D0,#650268);height:6px;"></td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildCertificateEmailText(data: CertificateEmailData): string {
  return `
HD VERSE — Certificate of Original Creation

Your certificate is ready for: ${data.workTitle}

Work Title: ${data.workTitle}
Artist: ${data.artistName}
ISRC: ${data.isrc}
Certificate No.: ${data.certificateNumber}
Issued: ${data.issuedAt.toDateString()}

View your certificate: ${data.verificationUrl}

HD Verse · Africa's Creative IP Infrastructure
myhdverse.com
  `.trim();
}

function buildDetectionAlertEmailHtml(data: DetectionAlertEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#1B1F34;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1B1F34;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#2B2D3A;border-radius:12px;overflow:hidden;max-width:600px;">
          <tr><td style="background:linear-gradient(135deg,#E97609,#C903D0);height:6px;"></td></tr>
          <tr>
            <td style="padding:40px 40px 20px;text-align:center;">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#C903D0;letter-spacing:2px;">HD VERSE</h1>
              <p style="margin:6px 0 0;font-size:12px;color:#7A7F99;">Detection Alert</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 30px;text-align:center;">
              <h2 style="margin:0;font-size:20px;color:#E97609;">⚠️ Your music was detected</h2>
              <p style="margin:10px 0 0;font-size:14px;color:#7A7F99;line-height:1.6;">
                We found a match for <strong style="color:#FFFFFF;">${data.workTitle}</strong><br>
                on <strong style="color:#FFFFFF;">${data.platform}</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#33374A;border-radius:8px;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 8px;font-size:10px;color:#7A7F99;text-transform:uppercase;">Platform</p>
                    <p style="margin:0 0 16px;font-size:15px;color:#FFFFFF;">${data.platform}</p>
                    <p style="margin:0 0 8px;font-size:10px;color:#7A7F99;text-transform:uppercase;">Detected At</p>
                    <p style="margin:0 0 16px;font-size:15px;color:#FFFFFF;">${data.detectedAt.toISOString()}</p>
                    <p style="margin:0 0 8px;font-size:10px;color:#7A7F99;text-transform:uppercase;">Match Confidence</p>
                    <p style="margin:0;font-size:15px;color:#E97609;">${data.matchConfidence}</p>
                    ${data.sourceUrl ? `
                    <p style="margin:16px 0 8px;font-size:10px;color:#7A7F99;text-transform:uppercase;">Source URL</p>
                    <p style="margin:0;"><a href="${data.sourceUrl}" style="color:#C903D0;font-size:13px;">${data.sourceUrl}</a></p>
                    ` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 40px;text-align:center;">
              <a href="${data.verificationUrl}"
                 style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#C903D0,#650268);color:#FFFFFF;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">
                View Your Certificate
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;text-align:center;border-top:1px solid #33374A;">
              <p style="margin:0;font-size:11px;color:#7A7F99;">HD Verse &middot; myhdverse.com</p>
            </td>
          </tr>
          <tr><td style="background:linear-gradient(135deg,#C903D0,#650268);height:6px;"></td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildDetectionAlertEmailText(data: DetectionAlertEmailData): string {
  return `
HD VERSE — Detection Alert

Your music was detected on ${data.platform}.

Work: ${data.workTitle}
Platform: ${data.platform}
Detected: ${data.detectedAt.toISOString()}
Confidence: ${data.matchConfidence}
${data.sourceUrl ? `Source: ${data.sourceUrl}` : ''}

View your certificate: ${data.verificationUrl}

HD Verse · myhdverse.com
  `.trim();
}

export interface SplitSheetConfirmationEmailParams {
  to: string;
  collaboratorName: string;
  uploaderName: string;
  workTitle: string;
  percentage: number;
  confirmUrl: string;
  declineUrl: string;
}

export async function sendSplitSheetConfirmationEmail(
  params: SplitSheetConfirmationEmailParams
): Promise<void> {
  const subject = `${params.uploaderName} added you to a split sheet on HD Verse`;

  const textBody = `
Hi ${params.collaboratorName},

${params.uploaderName} has registered "${params.workTitle}" on HD Verse and assigned you ${params.percentage}% of the ownership split.

Please confirm your share:

CONFIRM: ${params.confirmUrl}
DECLINE: ${params.declineUrl}

Once all collaborators confirm, the split sheet is permanently locked as proof of ownership.

This link expires in 7 days.

HD Verse — myhdverse.com
  `.trim();

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HD Verse Split Sheet Confirmation</title>
</head>
<body style="margin:0;padding:0;background:#1B1F34;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1B1F34;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#2B2D3A;border-radius:12px;overflow:hidden;max-width:600px;">
          <tr>
            <td style="background:linear-gradient(135deg,#C903D0,#650268);height:6px;"></td>
          </tr>
          <tr>
            <td style="padding:40px 40px 20px;text-align:center;">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#C903D0;letter-spacing:2px;">HD VERSE</h1>
              <p style="margin:6px 0 0;font-size:12px;color:#7A7F99;">Creative IP Infrastructure</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 30px;text-align:center;">
              <h2 style="margin:0;font-size:20px;color:#FFFFFF;">Split Sheet Confirmation Request</h2>
              <p style="margin:10px 0 0;font-size:14px;color:#7A7F99;line-height:1.6;">
                Hi ${params.collaboratorName},<br><br>
                <strong>${params.uploaderName}</strong> has registered the work <strong>"${params.workTitle}"</strong> on HD Verse and assigned you <strong>${params.percentage}%</strong> of the ownership split.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 40px;text-align:center;">
              <a href="${params.confirmUrl}"
                 style="display:inline-block;padding:14px 28px;background:#3EFED0;color:#1B1F34;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;margin-right:10px;">
                Confirm Share
              </a>
              <a href="${params.declineUrl}"
                 style="display:inline-block;padding:14px 28px;background:#E95353;color:#FFFFFF;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">
                Decline Share
              </a>
              <p style="margin:20px 0 0;font-size:12px;color:#7A7F99;">
                Once all collaborators confirm, the split sheet will be permanently locked. This link expires in 7 days.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;text-align:center;border-top:1px solid #33374A;">
              <p style="margin:0;font-size:11px;color:#7A7F99;">
                HD Verse &middot; myhdverse.com
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const msg = {
    to: params.to,
    from: { email: FROM_EMAIL, name: 'HD Verse' },
    subject,
    text: textBody,
    html: htmlBody,
  };

  try {
    await sgMail.send(msg);
    logger.info({ to: params.to, workTitle: params.workTitle }, 'Split sheet confirmation email sent');
  } catch (error) {
    logger.error({ error, to: params.to }, 'Failed to send split sheet confirmation email');
    throw error;
  }
}

