import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-md',
        'transition-all duration-150 focus:outline-none',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary' && [
          'text-white',
          'bg-gradient-to-r from-verse-magenta to-verse-magenta-deep',
          'hover:from-verse-magenta-mid hover:to-verse-magenta-deep',
          'focus:ring-2 focus:ring-verse-magenta focus:ring-offset-2 focus:ring-offset-verse-ink',
        ],
        variant === 'secondary' && [
          'text-white bg-verse-elevated border border-verse-elevated',
          'hover:border-verse-magenta hover:text-verse-magenta',
          'focus:ring-2 focus:ring-verse-magenta focus:ring-offset-2 focus:ring-offset-verse-ink',
        ],
        variant === 'ghost' && [
          'text-verse-slate hover:text-white hover:bg-verse-elevated',
        ],
        size === 'sm' && 'text-xs px-3 py-2',
        size === 'md' && 'text-sm px-4 py-2.5',
        size === 'lg' && 'text-base px-6 py-3 w-full',
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4z"
            />
          </svg>
          Processing...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
