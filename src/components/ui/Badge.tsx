import React from 'react';

export type BadgeVariant = 'emerald' | 'orange' | 'red' | 'gray' | 'sky' | 'amber';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  pulse?: boolean;
}

const variantStyles: Record<BadgeVariant, { badge: string; dot: string }> = {
  emerald: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    dot: 'bg-emerald-500',
  },
  orange: {
    badge: 'bg-orange-50 text-orange-700 border-orange-200/60',
    dot: 'bg-orange-500',
  },
  red: {
    badge: 'bg-red-50 text-red-700 border-red-200/60',
    dot: 'bg-red-500',
  },
  gray: {
    badge: 'bg-slate-100 text-slate-700 border-slate-200/70',
    dot: 'bg-slate-500',
  },
  sky: {
    badge: 'bg-sky-50 text-sky-700 border-sky-200/60',
    dot: 'bg-sky-500',
  },
  amber: {
    badge: 'bg-amber-50 text-amber-800 border-amber-200/60',
    dot: 'bg-amber-500',
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-[10px] px-2 py-0.5 gap-1.5',
  md: 'text-[11px] px-2.5 py-1 gap-1.5',
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      children,
      variant = 'emerald',
      size = 'md',
      dot = true,
      pulse = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const config = variantStyles[variant];

    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center font-bold tracking-tight rounded-full border
          transition-colors duration-150 select-none
          ${config.badge}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {dot && (
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            {pulse && (
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dot}`}
              />
            )}
            <span
              className={`relative inline-flex rounded-full h-1.5 w-1.5 ${config.dot}`}
            />
          </span>
        )}
        <span>{children}</span>
      </span>
    );
  }
);

Badge.displayName = 'Badge';
