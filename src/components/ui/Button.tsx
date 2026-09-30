import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white border-transparent shadow-sm shadow-orange-500/20 focus:ring-orange-500/30',
  secondary:
    'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 border-slate-200/70 shadow-2xs focus:ring-slate-300/40',
  outline:
    'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs hover:border-slate-300 focus:ring-slate-200',
  danger:
    'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white border-transparent shadow-sm shadow-red-500/20 focus:ring-red-500/30',
  ghost:
    'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-600 hover:text-slate-900 border-transparent focus:ring-slate-200',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
  md: 'px-4 py-2 text-xs font-bold rounded-xl gap-2',
  lg: 'px-5 py-2.5 text-sm font-bold rounded-xl gap-2.5',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      iconLeft,
      iconRight,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={`
          relative inline-flex items-center justify-center font-bold tracking-tight
          border transition-all duration-150 select-none outline-none
          active:scale-[0.98] focus:ring-2 focus:ring-offset-1
          disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin shrink-0 text-current" />
        )}
        {!isLoading && iconLeft && (
          <span className="shrink-0 flex items-center">{iconLeft}</span>
        )}
        {children && <span>{children}</span>}
        {!isLoading && iconRight && (
          <span className="shrink-0 flex items-center">{iconRight}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
