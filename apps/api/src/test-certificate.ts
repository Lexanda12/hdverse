import { generateCertificatePDF } from './shared/utils/certificate-generator';
import fs from 'fs';
import path from 'path';

async function testCertificate() {
  console.log('Generating test certificate...');

  const testData = {
    certificateNumber: 'HDV-2026-00001',
    workTitle: 'Lagos at Midnight',
    artistName: 'Test Producer',
    isrc: 'NG-HDV-26-00001',
    fileHash: 'a3f9d271e8b4c520f1d6e7a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
    timestampedAt: new Date(),
    verificationUrl: 'https://myhdverse.com/verify/test-cert-001',
    issuedAt: new Date(),
    coCreators: undefined,
  };

  try {
    const pdfBuffer = await generateCertificatePDF(testData);
    
    const outputPath = path.join(process.cwd(), 'test-certificate.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    
    console.log(`✅ Certificate generated successfully`);
    console.log(`📄 Saved to: ${outputPath}`);
    console.log(`📦 File size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);
    console.log(`🔍 Open the PDF to verify the gradient design renders correctly`);
  } catch (error) {
    console.error('❌ Certificate generation failed:', error);
    process.exit(1);
  }
}

testCertificate();
