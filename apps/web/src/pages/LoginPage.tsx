import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { apiClient } from '../lib/api';
import { ROUTES } from '../lib/routes';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!email) {
      setErrors({ email: 'Email is required' });
      return;
    }
    if (!password) {
      setErrors({ password: 'Password is required' });
      return;
    }

    setLoading(true);

    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);
      navigate(ROUTES.DASHBOARD);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: { message?: string; code?: string } } } };
      const code = apiErr.response?.data?.error?.code;
      if (code === 'INVALID_CREDENTIALS') {
        setErrors({ general: 'Incorrect email or password' });
      } else {
        setErrors({
          general:
            apiErr.response?.data?.error?.message ||
            'Login failed. Please try again.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-verse-charcoal rounded-xl border border-verse-elevated p-8 shadow-2xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="font-display text-2xl font-bold text-white">
          Welcome back
        </h1>
        <p className="text-verse-muted text-sm mt-2">
          Sign in to your HD Verse account
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {errors.general && (
          <div className="bg-verse-error/10 border border-verse-error/30 rounded-md px-4 py-3">
            <p className="text-sm text-verse-error">{errors.general}</p>
          </div>
        )}

        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
          }}
          error={errors.email}
          autoComplete="email"
          autoFocus
        />

        <Input
          label="Password"
          type="password"
          placeholder="Your password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password)
              setErrors((p) => ({ ...p, password: undefined }));
          }}
          error={errors.password}
          autoComplete="current-password"
        />

        <div className="mt-2">
          <Button type="submit" size="lg" loading={loading}>
            Sign In
          </Button>
        </div>

        <p className="text-center text-sm text-verse-muted">
          Don't have an account?{' '}
          <Link
            to={ROUTES.REGISTER}
            className="text-verse-magenta hover:text-verse-magenta-mid transition-colors"
          >
            Create one free
          </Link>
        </p>
      </form>

      {/* Trust signal */}
      <div className="mt-6 pt-6 border-t border-verse-elevated">
        <p className="text-center text-xs text-verse-muted">
          🔒 Africa's Creative IP Infrastructure
        </p>
      </div>
    </div>
  );
}
