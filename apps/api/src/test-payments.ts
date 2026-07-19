import axios from 'axios';

const API = 'http://localhost:3001';
let accessToken = '';
let workId = '';

async function test() {
  console.log('--- PAYSTACK PAYMENT FLOW TEST ---\n');

  // 1. Register + verify
  const email = `pay-test-${Date.now()}@hdverse.com`;
  const reg = await axios.post(`${API}/api/auth/register`, {
    fullName: 'Test Producer',
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

  // Verify OTP (sandbox)
  await axios.post(`${API}/api/auth/send-otp`,
    {}, { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  await axios.post(`${API}/api/auth/verify-otp`,
    { otp: '123456' },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  console.log('3. KYC verified');

  // 2. Create a work
  const workRes = await axios.post(
    `${API}/api/works/upload/initiate`,
    {
      fileName: 'test-beat.mp3',
      mimeType: 'audio/mpeg',
      fileSizeBytes: 5242880,
      title: 'Lagos at Midnight',
      artistName: 'Test Producer',
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
  console.log('5. Payment initiated:');
  console.log('   Reference:', payRes.data.data.reference);
  console.log('   Amount (kobo):', payRes.data.data.amount);
  console.log('   Auth URL:', payRes.data.data.authorizationUrl);
  console.log('   → Open this URL in browser to complete test payment');

  // 4. Simulate webhook (test mode)
  console.log('\n6. Simulating Paystack webhook...');
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
        workTitle: 'Lagos at Midnight',
      },
      customer: { email },
      paid_at: new Date().toISOString(),
    },
  };

  const webhookRes = await axios.post(
    `${API}/api/payments/webhook`,
    webhookPayload,
    { headers: { 'x-paystack-signature': 'test-sig' } }
  );
  console.log('   Webhook response:', webhookRes.data);

  // Wait for pipeline
  await new Promise(r => setTimeout(r, 5000));

  // 5. Check certificate
  try {
    const certRes = await axios.get(
      `${API}/api/certificates/work/${workId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    console.log('\n7. Certificate issued ✅');
    console.log('   Number:', certRes.data.data.certificateNumber);
    console.log('   Verification:', certRes.data.data.verificationUrl);
  } catch (e: any) {
    console.log('\n7. Certificate:', e.response?.data);
  }

  console.log('\n--- TEST COMPLETE ---');
}

test().catch(console.error);
