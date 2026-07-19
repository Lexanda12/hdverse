import { prisma } from './lib/prisma';
import { certificatePipelineQueue } from './jobs/registry';

async function runTests() {
  console.log('--- STARTING WORKS ENDPOINTS VERIFICATION ---');

  // Test 1: Log in to get accessToken
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@hdverse.com', password: 'Test1234!' })
  });
  const loginData = await loginRes.json() as any;
  const accessToken = loginData.data?.accessToken;
  console.log('1. Auth Token retrieved:', !!accessToken);

  if (!accessToken) {
    console.error('Cannot run works tests without authentication token');
    return;
  }

  // Test 2: Initiate upload (authenticated)
  const initiateRes = await fetch('http://localhost:3001/api/works/upload/initiate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      title: 'Test Beat',
      artistName: 'Test Producer',
      fileName: 'test-beat.mp3',
      mimeType: 'audio/mpeg',
      fileSizeBytes: 5242880
    })
  });
  const initiateStatus = initiateRes.status;
  const initiateData = await initiateRes.json() as any;
  console.log('2. Initiate Upload Status:', initiateStatus);
  console.log('   workId returned:', initiateData.data?.workId);
  const uploadUrl = initiateData.data?.uploadUrl;
  console.log('   uploadUrl starts correctly:', uploadUrl?.startsWith('https://'));
  console.log('   uploadUrl target URL:', uploadUrl);

  const workId = initiateData.data?.workId;

  // Test 3: Unauthenticated request rejection
  const unauthRes = await fetch('http://localhost:3001/api/works/upload/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Test Beat',
      artistName: 'Test Producer',
      fileName: 'test-beat.mp3',
      mimeType: 'audio/mpeg',
      fileSizeBytes: 5242880
    })
  });
  const unauthStatus = unauthRes.status;
  const unauthData = await unauthRes.json() as any;
  console.log('3. Unauthenticated Rejection Status:', unauthStatus);
  console.log('   Error Code:', unauthData.error?.code);

  // Test 4: Confirm upload
  const fileHash = 'a'.repeat(64);
  const confirmRes = await fetch(`http://localhost:3001/api/works/${workId}/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ fileHash })
  });
  const confirmStatus = confirmRes.status;
  const confirmData = await confirmRes.json() as any;
  console.log('4. Confirm Upload Status:', confirmStatus);
  console.log('   Confirm Status Msg:', confirmData.data?.status);

  // Test 5: List works
  const listRes = await fetch('http://localhost:3001/api/works', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const listStatus = listRes.status;
  const listData = await listRes.json() as any;
  console.log('5. List Works Status:', listStatus);
  console.log('   Works count:', listData.data?.works?.length);
  const matchedWork = listData.data?.works?.find((w: any) => w.id === workId);
  console.log('   Work found in list:', !!matchedWork);
  console.log('   Work status in list:', matchedWork?.status);

  // Test 6: Verify DB record
  const dbRecord = await prisma.work.findUnique({ where: { id: workId } });
  console.log('6. DB Work Status:', dbRecord?.status);
  console.log('   DB Work ISRC:', dbRecord?.isrc);
  console.log('   DB Work Hash:', dbRecord?.fileHash);

  // Test 7: Verify BullMQ enqueued job
  const jobs = await certificatePipelineQueue.getJobs(['waiting', 'active', 'delayed', 'completed', 'failed']);
  const enqueuedJob = jobs.find(j => j.data?.workId === workId);
  console.log('7. Enqueued job in BullMQ:', !!enqueuedJob);
  console.log('   Enqueued job name:', enqueuedJob?.name);
  console.log('   Enqueued job workId matches:', enqueuedJob?.data?.workId === workId);
}

runTests().then(() => process.exit(0)).catch(err => {
  console.error('Test run error:', err);
  process.exit(1);
});
