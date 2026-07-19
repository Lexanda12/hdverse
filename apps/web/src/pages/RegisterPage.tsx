import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { apiClient } from '../lib/api';
import { ROUTES } from '../lib/routes';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [form, setForm] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.fullName.trim() || form.fullName.length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!form.phone || !/^\+?[1-9]\d{9,14}$/.test(form.phone)) {
      newErrors.phone = 'Enter a valid phone number (e.g. +2348012345678)';
    }
    if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      newErrors.password = 'Must contain uppercase, lowercase, and a number';
    }
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      // Register
      await apiClient.post('/auth/register', {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });

      // Auto-login after registration
      const loginRes = await apiClient.post('/auth/login', {
        email: form.email,
        password: form.password,
      });

      const { user, accessToken, refreshToken } = loginRes.data.data;
      setAuth(user, accessToken, refreshToken);
      navigate(ROUTES.DASHBOARD);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: { message?: string; code?: string } } } };
      const message =
        apiErr.response?.data?.error?.message ||
        'Registration failed. Please try again.';
      const code = apiErr.response?.data?.error?.code;

      if (code === 'EMAIL_EXISTS') {
        setErrors({ email: 'This email is already registered' });
      } else if (code === 'PHONE_EXISTS') {
        setErrors({ phone: 'This phone number is already registered' });
      } else {
        setErrors({ general: message });
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
          Protect your music
        </h1>
        <p className="text-verse-muted text-sm mt-2">
          Create your HD Verse account
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
          label="Full Name"
          name="fullName"
          type="text"
          placeholder="Your full name"
          value={form.fullName}
          onChange={handleChange}
          error={errors.fullName}
          autoComplete="name"
        />

        <Input
          label="Email Address"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          autoComplete="email"
        />

        <Input
          label="Phone Number"
          name="phone"
          type="tel"
          placeholder="+2348012345678"
          value={form.phone}
          onChange={handleChange}
          error={errors.phone}
          hint="Include country code (e.g. +234 for Nigeria)"
          autoComplete="tel"
        />

        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="Min 8 characters"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          autoComplete="new-password"
        />

        <Input
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          placeholder="Repeat your password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        <div className="mt-2">
          <Button type="submit" size="lg" loading={loading}>
            Create Account
          </Button>
        </div>

        <p className="text-center text-sm text-verse-muted">
          Already have an account?{' '}
          <Link
            to={ROUTES.LOGIN}
            className="text-verse-magenta hover:text-verse-magenta-mid transition-colors"
          >
            Sign in
          </Link>
        </p>
      </form>

      {/* Trust signal */}
      <div className="mt-6 pt-6 border-t border-verse-elevated">
        <p className="text-center text-xs text-verse-muted">
          🔒 Your files are encrypted and never shared
        </p>
      </div>
    </div>
  );
}
