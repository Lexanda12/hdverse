import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { apiClient } from '../lib/api';
import { ROUTES } from '../lib/routes';
import Button from '../components/ui/Button';

export default function OtpPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Send OTP on load if user is not verified
  useEffect(() => {
    let active = true;
    const triggerSend = async () => {
      try {
        await apiClient.post('/auth/send-otp');
      } catch (err: any) {
        if (active) {
          setError(err.response?.data?.error?.message || 'Failed to send verification code.');
        }
      }
    };
    
    if (user && !user.phoneVerified) {
      triggerSend();
    }
    
    return () => {
      active = false;
    };
  }, [user]);

  // Countdown timer
  useEffect(() => {
    if (resendCountdown === 0) return;
    const timer = setTimeout(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const handleInputChange = (value: string, index: number) => {
    // Keep only numbers
    const cleanValue = value.replace(/[^0-9]/g, '').slice(-1);
    if (!cleanValue && value !== '') return;

    const newDigits = [...digits];
    newDigits[index] = cleanValue;
    setDigits(newDigits);
    setError('');

    // Auto-advance
    if (cleanValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all filled
    if (newDigits.every(d => d !== '') && cleanValue) {
      verifyOtp(newDigits.join(''));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const newDigits = [...digits];
      
      if (!digits[index] && index > 0) {
        // Empty box backspace: delete previous digit and focus it
        newDigits[index - 1] = '';
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      } else {
        // Content backspace: delete current digit
        newDigits[index] = '';
        setDigits(newDigits);
      }
      setError('');
    }
  };

  const verifyOtp = async (code: string) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await apiClient.post('/auth/verify-otp', { otp: code });
      
      if (res.data.success) {
        // Update store state
        const currentStore = useAuthStore.getState();
        if (currentStore.user) {
          useAuthStore.setState({
            user: {
              ...currentStore.user,
              phoneVerified: true,
              kycStatus: 'VERIFIED',
            },
          });
        }
        navigate(ROUTES.DASHBOARD);
      } else {
        setError(res.data.message || 'Incorrect verification code. Please check and try again.');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || 'Verification failed. Please check the code and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0) return;
    setIsLoading(true);
    setError('');
    try {
      await apiClient.post('/auth/send-otp');
      setResendCountdown(60);
      setDigits(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to resend code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-verse-ink flex items-center justify-center min-h-screen relative overflow-hidden font-body px-4">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-verse-magenta/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-verse-teal/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[400px] bg-verse-charcoal rounded-lg border border-white/5 p-8 relative z-10 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="font-display text-[28px] font-bold text-white mb-2 leading-tight">
            Verify your number
          </h2>
          <p className="text-sm text-verse-slate">
            We sent a 6-digit code to your phone
          </p>
        </div>

        <div className="flex justify-between gap-2 mb-6">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`w-[48px] h-[56px] text-center text-xl font-bold font-display rounded-md bg-verse-elevated border transition-all duration-150 focus:outline-none ${
                error
                  ? 'border-verse-error text-verse-error focus:ring-1 focus:ring-verse-error focus:border-verse-error'
                  : 'border-white/5 text-white focus:border-verse-magenta focus:ring-1 focus:ring-verse-magenta focus:shadow-[0_0_10px_rgba(201,3,208,0.2)]'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-verse-error text-center mb-6">{error}</p>
        )}

        <div className="flex flex-col gap-4">
          <Button
            variant="primary"
            className="w-full"
            loading={isLoading}
            onClick={() => verifyOtp(digits.join(''))}
            disabled={digits.some(d => d === '')}
          >
            Verify Code
          </Button>

          <Button
            variant="ghost"
            className="text-xs py-2 text-verse-muted disabled:opacity-40 hover:text-white"
            onClick={handleResend}
            disabled={resendCountdown > 0 || isLoading}
          >
            {resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : 'Resend code'}
          </Button>
        </div>
      </div>
    </div>
  );
}
