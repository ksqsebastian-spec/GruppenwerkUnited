import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        // Terracotta – primäres Badge
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        // Warm Sand – neutrales Badge
        secondary:
          'border-transparent bg-warm-sand text-charcoal-warm hover:bg-[#dddbd0]',
        // Error Crimson
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        // Outline – nur Rand, kein Fill
        outline:
          'border-border-cream text-foreground bg-transparent',
        // Status-Varianten mit warmen Tönen
        success:
          'border-transparent bg-green-100 text-green-800 hover:bg-green-200',
        warning:
          'border-transparent bg-amber-100 text-amber-800 hover:bg-amber-200',
        danger:
          'border-transparent bg-red-100 text-red-800 hover:bg-red-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  children?: React.ReactNode
}

function Badge({ className, variant, children, ...props }: BadgeProps): React.JSX.Element {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
