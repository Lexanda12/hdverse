import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { ROUTES } from '../../lib/routes';

export default function Navbar() {
  const { isAuthenticated, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate(ROUTES.LOGIN);
  };

  return (
    <nav className="border-b border-verse-elevated bg-verse-charcoal">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.HOME}
          className="font-display font-bold text-xl text-verse-magenta tracking-wider hover:opacity-80 transition-opacity"
        >
          HD VERSE
        </Link>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link
                to={ROUTES.UPLOAD}
                className="text-sm bg-verse-magenta hover:bg-verse-magenta-mid text-white px-4 py-2 rounded-md transition-colors font-medium"
              >
                + Protect Work
              </Link>
              <Link
                to={ROUTES.DASHBOARD}
                className="text-sm text-verse-slate hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to={ROUTES.ALERTS}
                className="text-sm text-verse-slate hover:text-white transition-colors"
              >
                Alerts
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-verse-muted hover:text-white transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to={ROUTES.PRICING}
                className="text-sm text-verse-slate hover:text-white transition-colors"
              >
                Pricing
              </Link>
              <Link
                to={ROUTES.LOGIN}
                className="text-sm text-verse-slate hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to={ROUTES.REGISTER}
                className="text-sm bg-verse-magenta hover:bg-verse-magenta-mid text-white px-4 py-2 rounded-md transition-colors font-medium"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
