import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-verse-slate">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-4 py-3 rounded-md text-sm text-white',
            'bg-verse-elevated border border-verse-elevated',
            'placeholder:text-verse-muted',
            'focus:outline-none focus:border-verse-magenta focus:ring-1 focus:ring-verse-magenta',
            'transition-colors duration-150',
            error && 'border-verse-error focus:border-verse-error focus:ring-verse-error',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-verse-error">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-verse-muted">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
