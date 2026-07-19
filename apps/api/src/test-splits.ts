import axios from 'axios';
import { prisma } from './lib/prisma';

const API = 'http://localhost:3001';
let accessToken = '';
let workId = '';

async function test() {
  console.log('--- STARTING SPLIT SHEETS E2E FLOW TEST ---\n');

  // 1. Register + login + KYC verify
  const email = `split-test-${Date.now()}@hdverse.com`;
  const reg = await axios.post(`${API}/api/auth/register`, {
    fullName: 'Uploader Producer',
    email,
    password: 'TestPass123!',
    phone: `+23480${Math.floor(Math.random()*90000000+10000000)}`,
  });
  console.log('1. Register:', reg.status);

  const login = await axios.post(`${API}/api/auth/login`, {
    email, password: 'TestPass123!',
  }, { withCredentials: true });
  accessToken = login.data.data.accessToken;
  console.log('2. Login:', login.status);

  await axios.post(`${API}/api/auth/send-otp`,
    {}, { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  await axios.post(`${API}/api/auth/verify-otp`,
    { otp: '123456' },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  console.log('3. KYC verified');

  // 2. Create work
  const workRes = await axios.post(
    `${API}/api/works/upload/initiate`,
    {
      fileName: 'split-beat.mp3',
      mimeType: 'audio/mpeg',
      fileSizeBytes: 1024 * 1024 * 5,
      title: 'Vibrant Lagos',
      artistName: 'Uploader Producer',
    },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  workId = workRes.data.data.workId;
  console.log('4. Work created:', workId);

  // 3. Initiate payment
  const payRes = await axios.post(
    `${API}/api/payments/initiate`,
    { workId },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  console.log('5. Payment initiated reference:', payRes.data.data.reference);

  // 4. Simulate webhook to release certificate
  const webhookPayload = {
    event: 'charge.success',
    data: {
      reference: payRes.data.data.reference,
      status: 'success',
      amount: 300000,
      currency: 'NGN',
      metadata: {
        workId,
        userId: 'test',
        paymentType: 'CERTIFICATE',
        workTitle: 'Vibrant Lagos',
      },
      customer: { email },
      paid_at: new Date().toISOString(),
    },
  };

  await axios.post(
    `${API}/api/payments/webhook`,
    webhookPayload,
    { headers: { 'x-paystack-signature': 'test-sig' } }
  );
  console.log('6. Webhook simulated');

  // Wait 3 seconds for certificate release
  await new Promise(r => setTimeout(r, 3000));

  // 5. Verify certificate released
  const certRes = await axios.get(
    `${API}/api/certificates/work/${workId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  console.log('7. Verified work is certified:', certRes.data.data.certificateNumber);

  // 6. Create Split Sheet
  console.log('\n--- CREATING SPLIT SHEET ---');
  const splitRes = await axios.post(
    `${API}/api/split-sheets`,
    {
      workId,
      entries: [
        {
          collaboratorName: 'Producer B',
          collaboratorEmail: 'b@test.com',
          percentage: 40,
        },
        {
          collaboratorName: 'Producer C',
          collaboratorEmail: 'c@test.com',
          percentage: 60,
        },
      ],
    },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  console.log('8. Split sheet POST response status:', splitRes.status);
  console.log('   Split sheet status:', splitRes.data.data.status);

  // 7. Get Split Sheet
  const getRes = await axios.get(
    `${API}/api/split-sheets/work/${workId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  console.log('9. GET Split sheet returned entries count:', getRes.data.data.entries.length);
  const tokenB = getRes.data.data.entries[0].confirmationToken;
  const tokenC = getRes.data.data.entries[1].confirmationToken;
  console.log('   Entry 1 Token:', tokenB);
  console.log('   Entry 2 Token:', tokenC);

  // 8. Confirm entry 1
  console.log('\n--- CONFIRMING COLLABORATORS ---');
  const confirmB = await axios.post(
    `${API}/api/split-sheets/confirm/${tokenB}`,
    { action: 'confirm' }
  );
  console.log('10. Confirm collaborator B response:', confirmB.data.data);

  // 9. Confirm entry 2
  const confirmC = await axios.post(
    `${API}/api/split-sheets/confirm/${tokenC}`,
    { action: 'confirm' }
  );
  console.log('11. Confirm collaborator C response:', confirmC.data.data);

  // 10. GET Split Sheet again to verify locked state
  console.log('\n--- VERIFYING LOCKED STATE ---');
  const lockedRes = await axios.get(
    `${API}/api/split-sheets/work/${workId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  console.log('12. Locked Split Sheet status:', lockedRes.data.data.status);
  console.log('    Immutable Hash:', lockedRes.data.data.lockedHash);

  // 11. Check distribution eligibility
  const eligibleRes = await axios.get(
    `${API}/api/split-sheets/work/${workId}/distribution-check`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  console.log('13. Distribution eligibility check:', eligibleRes.data.data);

  // 12. Try confirming again
  console.log('\n--- TESTING ERROR BOUNDARIES ---');
  try {
    await axios.post(
      `${API}/api/split-sheets/confirm/${tokenB}`,
      { action: 'confirm' }
    );
  } catch (error: any) {
    console.log('14. Confirming locked split sheet expected failure:', {
      status: error.response?.status,
      data: error.response?.data,
    });
  }

  console.log('\n--- TEST COMPLETE ---');
}

test().catch(console.error);
