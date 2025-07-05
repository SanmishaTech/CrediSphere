'use client'

import * as React from 'react';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input, InputProps } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, onChange, onBlur, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <div className="relative">
        {/* Input field */}
        <Input
          type={showPassword ? 'text' : 'password'}
          className={cn('hide-password-toggle pr-10', className)}
          ref={ref} // Forward the ref for react-hook-form
          onChange={onChange} // Pass onChange for react-hook-form
          onBlur={onBlur} // Pass onBlur for react-hook-form
          autoComplete="new-password" // Add autocomplete attribute
          {...props}
        />

        {/* Toggle button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => {
            setShowPassword((prev) => !prev); // Toggle the state
          }}
        >
          {showPassword ? (
            <EyeOffIcon className="h-4 w-4" aria-hidden="true" />
          ) : (
            <EyeIcon className="h-4 w-4" aria-hidden="true" />
          )}
          <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
        </Button>

        {/* Hides browser's default password toggles */}
        <style>{`
          .hide-password-toggle::-ms-reveal,
          .hide-password-toggle::-ms-clear {
            visibility: hidden;
            pointer-events: none;
            display: none;
          }
        `}</style>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };