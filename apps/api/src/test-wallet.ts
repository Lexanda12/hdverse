import axios from 'axios';

const API = 'http://localhost:3001';

async function test() {
  console.log('--- WALLET MODULE TEST ---\n');

  // Setup: register + KYC + work + payment
  const email = `wallet-test-${Date.now()}@hdverse.com`;

  const reg = await axios.post(`${API}/api/auth/register`, {
    fullName: 'Wallet Test User',
    email,
    password: 'TestPass123!',
    phone: `+23480${Math.floor(Math.random()*90000000+10000000)}`,
  });
  console.log('1. Register:', reg.status);

  const login = await axios.post(`${API}/api/auth/login`, {
    email, password: 'TestPass123!',
  });
  const token = login.data.data.accessToken;
  const headers = { Authorization: `Bearer ${token}` };
  console.log('2. Login:', login.status);

  await axios.post(`${API}/api/auth/send-otp`, {}, { headers });
  await axios.post(
    `${API}/api/auth/verify-otp`, 
    { otp: '123456' }, 
    { headers }
  );
  console.log('3. KYC verified');

  // Create work
  const workRes = await axios.post(
    `${API}/api/works/upload/initiate`,
    {
      fileName: 'wallet-test.mp3',
      mimeType: 'audio/mpeg',
      fileSizeBytes: 5242880,
      title: 'Wallet Test Track',
      artistName: 'Wallet Test User',
    },
    { headers }
  );
  const workId = workRes.data.data.workId;
  console.log('4. Work created:', workId);

  // Initiate + simulate payment
  const payRes = await axios.post(
    `${API}/api/payments/initiate`,
    { workId },
    { headers }
  );
  const reference = payRes.data.data.reference;
  console.log('5. Payment reference:', reference);

  // Simulate webhook
  await axios.post(`${API}/api/payments/webhook`, {
    event: 'charge.success',
    data: {
      reference,
      status: 'success',
      amount: 300000,
      currency: 'NGN',
      metadata: { workId, userId: 'test', 
                  paymentType: 'CERTIFICATE',
                  workTitle: 'Wallet Test Track' },
      customer: { email },
      paid_at: new Date().toISOString(),
    },
  }, { headers: { 'x-paystack-signature': 'test-sig' } });
  console.log('6. Payment webhook simulated');

  await new Promise(r => setTimeout(r, 3000));

  // Check wallet balance
  const walletRes = await axios.get(
    `${API}/api/wallet`,
    { headers }
  );
  console.log('\n7. Wallet balance:');
  console.log('   NGN:', walletRes.data.data.balance);
  console.log('   Transactions:', 
    walletRes.data.data.transactions.length);

  // Get bank list
  const banksRes = await axios.get(
    `${API}/api/wallet/banks`,
    { headers }
  );
  console.log('\n8. Banks available:', 
    banksRes.data.data.length);
  console.log('   First bank:', banksRes.data.data[0]?.name);

  // Try payout below minimum
  try {
    await axios.post(
      `${API}/api/wallet/payout`,
      {
        amount: 500,
        bankCode: '058',
        accountNumber: '0123456789',
        accountName: 'Test User',
      },
      { headers }
    );
  } catch (e: any) {
    console.log('\n9. Below minimum payout blocked:',
      e.response?.data?.error?.message);
  }

  // Try valid payout amount 
  // (will fail on account verification in test mode — expected)
  try {
    const payoutRes = await axios.post(
      `${API}/api/wallet/payout`,
      {
        amount: 1500,
        bankCode: '058',
        accountNumber: '0123456789',
        accountName: 'Test User',
      },
      { headers }
    );
    console.log('\n10. Payout initiated:', 
      payoutRes.data.data);
  } catch (e: any) {
    console.log('\n10. Payout (expected test mode error):',
      e.response?.data?.error?.message);
  }

  console.log('\n--- WALLET TEST COMPLETE ---');
}

test().catch(console.error);
