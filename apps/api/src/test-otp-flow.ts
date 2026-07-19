import { prisma } from './lib/prisma';
import { redis } from './lib/redis';

async function runOtpTests() {
  console.log('--- STARTING SMILE IDENTITY OTP VERIFICATION TESTS ---');

  const testEmail = `otp-test-${Date.now()}@hdverse.com`;
  const testPhone = `+234803${Math.floor(1000000 + Math.random() * 9000000)}`;

  console.log(`Test user email: ${testEmail}`);
  console.log(`Test user phone: ${testPhone}`);

  // ── Step 1: Register User ──────────────────────────────────────────────────
  const regRes = await fetch('http://localhost:3001/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'TestPassword123!',
      fullName: 'OTP Tester',
      phone: testPhone
    })
  });
  
  const regData = (await regRes.json()) as any;
  console.log('1. Registration status:', regRes.status);
  console.log('   User created ID:', regData.data?.user?.id);
  const userId = regData.data?.user?.id;

  if (!userId) {
    console.error('Registration failed, aborting tests.');
    return;
  }

  // ── Step 2: Login User ──────────────────────────────────────────────────────
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'TestPassword123!'
    })
  });

  const loginData = (await loginRes.json()) as any;
  const accessToken = loginData.data?.accessToken;
  console.log('2. Login status:', loginRes.status);
  console.log('   Access Token retrieved:', !!accessToken);

  if (!accessToken) {
    console.error('Login failed, aborting tests.');
    return;
  }

  // Helper header generator
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  };

  // ── Step 3: Send OTP (First Request) ────────────────────────────────────────
  const sendRes = await fetch('http://localhost:3001/api/auth/send-otp', {
    method: 'POST',
    headers: authHeaders
  });

  const sendData = (await sendRes.json()) as any;
  console.log('3. First Send OTP status:', sendRes.status);
  console.log('   Response data:', sendData);

  // ── Step 4: Resend Cooldown Test ───────────────────────────────────────────
  const sendRes2 = await fetch('http://localhost:3001/api/auth/send-otp', {
    method: 'POST',
    headers: authHeaders
  });

  const sendData2 = (await sendRes2.json()) as any;
  console.log('4. Second Send OTP (immediate) status:', sendRes2.status);
  console.log('   Cooldown error code:', sendData2.error?.code);
  console.log('   Cooldown error message:', sendData2.error?.message);

  // ── Step 5: Verify OTP with Incorrect Code ──────────────────────────────────
  const verifyRes = await fetch('http://localhost:3001/api/auth/verify-otp', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ otp: '000000' })
  });

  const verifyData = (await verifyRes.json()) as any;
  console.log('5. Verify OTP with incorrect code status:', verifyRes.status);
  console.log('   Response data:', verifyData);

  // ── Step 6: Verify OTP Rate Limit / Attempts Limit ────────────────────────
  // We already did 1 attempt. Let's do 3 more attempts to trigger rate limit (max attempts = 3).
  console.log('6. Triggering Too Many Attempts (Attempt 2)...');
  await fetch('http://localhost:3001/api/auth/verify-otp', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ otp: '000000' })
  });

  console.log('   Triggering Too Many Attempts (Attempt 3)...');
  await fetch('http://localhost:3001/api/auth/verify-otp', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ otp: '000000' })
  });

  console.log('   Triggering Too Many Attempts (Attempt 4)...');
  const verifyResAttempts = await fetch('http://localhost:3001/api/auth/verify-otp', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ otp: '000000' })
  });

  const verifyAttemptsData = (await verifyResAttempts.json()) as any;
  console.log('   Verify OTP attempt 4 status:', verifyResAttempts.status);
  console.log('   Attempts error code:', verifyAttemptsData.error?.code);
  console.log('   Attempts error message:', verifyAttemptsData.error?.message);

  // ── Step 7: Clear Cooldown and Attempts using Redis (bypass sleep) ─────────
  console.log('7. Bypassing cooldown and resetting attempts via Redis directly...');
  await redis.del(`otp:cooldown:${userId}`);
  await redis.del(`otp:attempts:${userId}`);
  await redis.del(`otp:job:${userId}`);

  // ── Step 8: Send OTP again ─────────────────────────────────────────────────
  const sendRes3 = await fetch('http://localhost:3001/api/auth/send-otp', {
    method: 'POST',
    headers: authHeaders
  });
  console.log('8. Send OTP (after reset) status:', sendRes3.status);

  // ── Step 9: Verify OTP with Correct Code ──────────────────────────────────
  const verifyRes2 = await fetch('http://localhost:3001/api/auth/verify-otp', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ otp: '123456' })
  });

  const verifyData2 = (await verifyRes2.json()) as any;
  console.log('9. Verify OTP with correct code status:', verifyRes2.status);
  console.log('   Response data:', verifyData2);

  // ── Step 10: Check DB Record ────────────────────────────────────────────────
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { phoneVerified: true, kycStatus: true, kycTier: true }
  });
  console.log('10. DB User State check:');
  console.log('    phoneVerified:', dbUser?.phoneVerified);
  console.log('    kycStatus:', dbUser?.kycStatus);
  console.log('    kycTier:', dbUser?.kycTier);

  // ── Step 11: Send OTP for Already Verified User ────────────────────────────
  const sendRes4 = await fetch('http://localhost:3001/api/auth/send-otp', {
    method: 'POST',
    headers: authHeaders
  });

  const sendData4 = (await sendRes4.json()) as any;
  console.log('11. Send OTP for verified user status:', sendRes4.status);
  console.log('    Error code:', sendData4.error?.code);
  console.log('    Error message:', sendData4.error?.message);
}

runOtpTests()
  .then(async () => {
    await prisma.$disconnect();
    await redis.disconnect();
    console.log('--- TEST RUN COMPLETED ---');
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Test script crashed:', err);
    await prisma.$disconnect();
    await redis.disconnect();
    process.exit(1);
  });
