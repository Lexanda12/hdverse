import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';

export default function AuthShell() {
  return (
    <div className="min-h-screen bg-verse-ink flex flex-col">
      {/* Magenta accent top bar */}
      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #C903D0, #650268)' }} />

      <div className="flex justify-center pt-12 pb-8">
        <Link
          to="/"
          className="font-display font-bold text-2xl text-verse-magenta tracking-wider hover:opacity-80 transition-opacity"
        >
          HD VERSE
        </Link>
      </div>
      <div className="flex-1 flex items-start justify-center px-4">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
