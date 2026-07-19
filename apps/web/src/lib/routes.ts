export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  UPLOAD: '/upload',
  WORK: '/works/:workId',
  CERTIFICATE: '/certificate/:workId',
  ALERTS: '/alerts',
  PRICING: '/pricing',
  VERIFY: '/verify/:certificateId',
  OTP: '/verify-phone',
  SPLIT_SHEET: '/works/:workId/split-sheet',
  WALLET: '/wallet',
  DISTRIBUTE: '/works/:workId/distribute',
} as const;


