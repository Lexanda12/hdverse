import puppeteer from 'puppeteer';
import QRCode from 'qrcode';
import { logger } from './logger';

export interface CertificateData {
  certificateNumber: string;
  workTitle: string;
  artistName: string;
  isrc: string;
  fileHash: string;
  timestampedAt: Date;
  verificationUrl: string;
  issuedAt: Date;
  coCreators?: string;
}

function formatDate(date: Date): string {
  return date.toUTCString();
}

function truncateHash(hash: string): string {
  if (hash.length <= 20) return hash;
  return hash.substring(0, 20) + '...';
}

async function generateQRDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    type: 'image/png',
    color: {
      dark: '#FFFFFF',
      light: '#00000000', // transparent background
    },
    margin: 1,
    width: 120,
  });
}

function buildCertificateHtml(
  data: CertificateData, 
  qrDataUrl: string
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HD Verse Certificate of Ownership</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700&family=Epilogue:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      width: 794px;
      height: 1123px;
      font-family: 'Epilogue', 'Inter', sans-serif;
      background: #1B1F34;
      overflow: hidden;
    }

    .certificate {
      width: 794px;
      height: 1123px;
      position: relative;
      background: #1B1F34;
      display: flex;
      flex-direction: column;
    }

    /* TOP SECTION — gradient brand surface */
    .cert-header {
      background: linear-gradient(
        135deg, 
        #C903D0 0%, 
        #A102A6 35%, 
        #650268 70%, 
        #140015 100%
      );
      padding: 48px 56px 40px;
      position: relative;
      overflow: hidden;
    }

    .cert-header::before {
      content: '';
      position: absolute;
      top: -60px;
      right: -60px;
      width: 300px;
      height: 300px;
      background: radial-gradient(
        circle, 
        rgba(255,255,255,0.08) 0%, 
        transparent 70%
      );
      border-radius: 50%;
    }

    .spark {
      display: inline-block;
      color: #FFFFFF;
      font-size: 20px;
      margin-right: 8px;
      opacity: 0.9;
    }

    .logo-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 32px;
    }

    .logo-text {
      font-family: 'Bricolage Grotesque', 'Manrope', sans-serif;
      font-size: 22px;
      font-weight: 700;
      color: #FFFFFF;
      letter-spacing: 0.05em;
    }

    .logo-tagline {
      font-family: 'Epilogue', sans-serif;
      font-size: 11px;
      color: rgba(255,255,255,0.7);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-top: 2px;
    }

    .cert-type-label {
      font-family: 'Epilogue', sans-serif;
      font-size: 11px;
      font-weight: 600;
      color: rgba(255,255,255,0.7);
      letter-spacing: 0.15em;
      text-transform: uppercase;
      margin-bottom: 12px;
    }

    .cert-divider-line {
      width: 48px;
      height: 2px;
      background: rgba(255,255,255,0.4);
      margin-bottom: 20px;
    }

    .cert-work-title {
      font-family: 'Bricolage Grotesque', 'Manrope', sans-serif;
      font-size: 36px;
      font-weight: 700;
      color: #FFFFFF;
      line-height: 1.15;
      margin-bottom: 8px;
      max-width: 560px;
      word-break: break-word;
    }

    .cert-artist {
      font-family: 'Epilogue', sans-serif;
      font-size: 16px;
      font-weight: 500;
      color: rgba(255,255,255,0.85);
    }

    /* MIDDLE SECTION — dark panel with metadata */
    .cert-body {
      flex: 1;
      background: #2B2D3A;
      margin: 0 32px;
      border-radius: 0 0 16px 16px;
      padding: 40px 40px 32px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .cert-statement {
      font-family: 'Epilogue', sans-serif;
      font-size: 13px;
      color: #D4D7E0;
      line-height: 1.6;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid rgba(212,215,224,0.1);
    }

    .cert-statement strong {
      color: #FFFFFF;
      font-weight: 600;
    }

    .metadata-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px 40px;
      margin-bottom: 32px;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .meta-label {
      font-family: 'Epilogue', sans-serif;
      font-size: 10px;
      font-weight: 600;
      color: #7A7F99;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .meta-value {
      font-family: 'Epilogue', sans-serif;
      font-size: 13px;
      font-weight: 500;
      color: #FFFFFF;
      word-break: break-all;
    }

    .meta-value.hash {
      font-family: 'Courier New', monospace;
      font-size: 11px;
      color: #D4D7E0;
    }

    .meta-value.isrc {
      font-family: 'Courier New', monospace;
      font-size: 14px;
      color: #3EFED0;
      font-weight: 600;
    }

    .meta-value.verified {
      color: #3EFED0;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .verified-dot {
      width: 8px;
      height: 8px;
      background: #3EFED0;
      border-radius: 50%;
      display: inline-block;
      flex-shrink: 0;
    }

    /* BOTTOM SECTION — QR + footer */
    .cert-footer {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      padding-top: 24px;
      border-top: 1px solid rgba(212,215,224,0.1);
    }

    .cert-footer-left {
      flex: 1;
    }

    .cert-number {
      font-family: 'Epilogue', sans-serif;
      font-size: 10px;
      color: #7A7F99;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .cert-number-value {
      font-family: 'Bricolage Grotesque', sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: #C903D0;
    }

    .cert-verify-text {
      font-family: 'Epilogue', sans-serif;
      font-size: 10px;
      color: #7A7F99;
      margin-top: 12px;
    }

    .cert-verify-url {
      font-family: 'Epilogue', sans-serif;
      font-size: 10px;
      color: #C903D0;
    }

    .qr-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }

    .qr-image {
      width: 96px;
      height: 96px;
      border: 2px solid rgba(201,3,208,0.3);
      border-radius: 8px;
      padding: 6px;
      background: rgba(201,3,208,0.05);
    }

    .qr-label {
      font-family: 'Epilogue', sans-serif;
      font-size: 9px;
      color: #7A7F99;
      text-align: center;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    /* PAGE BOTTOM STRIP */
    .cert-bottom-strip {
      background: linear-gradient(
        90deg, 
        #C903D0 0%, 
        #650268 50%, 
        #140015 100%
      );
      height: 6px;
      margin: 0 32px;
      border-radius: 0 0 8px 8px;
    }

    .cert-page-footer {
      padding: 16px 56px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .cert-page-footer-text {
      font-family: 'Epilogue', sans-serif;
      font-size: 10px;
      color: #7A7F99;
    }

    .ncc-badge {
      font-family: 'Epilogue', sans-serif;
      font-size: 10px;
      color: #7A7F99;
      text-align: right;
      max-width: 300px;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="certificate">

    <!-- HEADER — gradient brand surface -->
    <div class="cert-header">
      <div class="logo-row">
        <div>
          <div class="logo-text">
            <span class="spark">✦</span> HD VERSE
          </div>
          <div class="logo-tagline">Africa's Creative IP Infrastructure</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 10px; color: rgba(255,255,255,0.6); 
               font-family: Epilogue; letter-spacing: 0.06em;">
            ISSUED
          </div>
          <div style="font-size: 12px; color: #FFFFFF; 
               font-family: Epilogue; font-weight: 600;">
            ${formatDate(data.issuedAt)}
          </div>
        </div>
      </div>

      <div class="cert-type-label">Certificate of Ownership</div>
      <div class="cert-divider-line"></div>
      <div class="cert-work-title">${data.workTitle}</div>
      <div class="cert-artist">by ${data.artistName}${
        data.coCreators 
          ? ` <span style="opacity:0.7; font-size:13px;">
              · with ${data.coCreators}
             </span>` 
          : ''
      }</div>
    </div>

    <!-- BODY — dark metadata panel -->
    <div class="cert-body">
      <div>
        <div class="cert-statement">
          This certificate confirms that 
          <strong>${data.artistName}</strong> 
          registered the creative work 
          "<strong>${data.workTitle}</strong>" 
          with HD Verse on 
          <strong>${formatDate(data.issuedAt)}</strong>. 
          The file fingerprint, SHA-256 hash, and RFC 3161 
          timestamp below constitute verifiable, 
          timestamped proof of ownership compatible with 
          the Nigerian Copyright Commission framework.
        </div>

        <div class="metadata-grid">
          <div class="meta-item">
            <div class="meta-label">ISRC</div>
            <div class="meta-value isrc">${data.isrc}</div>
          </div>

          <div class="meta-item">
            <div class="meta-label">RFC 3161 Timestamp</div>
            <div class="meta-value verified">
              <span class="verified-dot"></span>
              Verified · ${formatDate(data.timestampedAt)}
            </div>
          </div>

          <div class="meta-item" 
               style="grid-column: 1 / -1;">
            <div class="meta-label">SHA-256 File Hash</div>
            <div class="meta-value hash">
              ${truncateHash(data.fileHash)}
            </div>
          </div>

          <div class="meta-item">
            <div class="meta-label">Certificate Number</div>
            <div class="meta-value" 
                 style="color: #C903D0; font-weight: 600;">
              ${data.certificateNumber}
            </div>
          </div>

          <div class="meta-item">
            <div class="meta-label">Registry</div>
            <div class="meta-value">HD Verse · myhdverse.com</div>
          </div>
        </div>
      </div>

      <!-- FOOTER inside body -->
      <div class="cert-footer">
        <div class="cert-footer-left">
          <div class="cert-number">Certificate</div>
          <div class="cert-number-value">${data.certificateNumber}</div>
          <div class="cert-verify-text">Verify at:</div>
          <div class="cert-verify-url">${data.verificationUrl}</div>
        </div>

        <div class="qr-container">
          <img 
            class="qr-image" 
            src="${qrDataUrl}" 
            alt="Verification QR Code"
          />
          <div class="qr-label">Scan to verify</div>
        </div>
      </div>
    </div>

    <!-- BOTTOM STRIP -->
    <div class="cert-bottom-strip"></div>

    <!-- PAGE FOOTER -->
    <div class="cert-page-footer">
      <div class="cert-page-footer-text">
        © HD Verse ${new Date().getFullYear()} · 
        myhdverse.com · hello@myhdverse.com
      </div>
      <div class="ncc-badge">
        Compatible with the Nigerian Copyright Commission 
        framework. This certificate is verifiable at 
        myhdverse.com/verify
      </div>
    </div>

  </div>
</body>
</html>`;
}

export async function generateCertificatePDF(
  data: CertificateData
): Promise<Buffer> {
  const qrDataUrl = await generateQRDataUrl(data.verificationUrl);
  const html = buildCertificateHtml(data, qrDataUrl);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH 
        || (process.platform === 'win32'
          ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
          : undefined),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
      ],
    });

    const page = await browser.newPage();

    // Load HTML — wait for fonts to load
    await page.setContent(html, { 
      waitUntil: 'networkidle0' as any,
      timeout: 30000 
    });

    // Wait for Google Fonts to render
    await new Promise(resolve => setTimeout(resolve, 1500));

    const pdf = await page.pdf({
      width: '794px',
      height: '1123px',
      printBackground: true,   // CRITICAL: renders gradients
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    logger.info(
      { certNumber: data.certificateNumber }, 
      'Certificate PDF generated via Puppeteer'
    );

    return Buffer.from(pdf);

  } catch (error: any) {
    logger.error({ err: error?.stack || error?.message || error }, 'Certificate PDF generation failed');
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}
