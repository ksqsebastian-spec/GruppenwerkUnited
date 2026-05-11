import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Basis: inline-flex, kein outline, korrekte Disabled-States
  'inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Terracotta – primärer CTA, die einzige Chromfarbe im System
        default:
          'bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shadow-[#c96442_0px_0px_0px_0px,#c96442_0px_0px_0px_1px]',

        // Warm Sand – der Arbeits-Button, warm und funktional
        secondary:
          'bg-warm-sand text-charcoal-warm hover:bg-[#dddbd0] rounded-lg shadow-ring-warm',

        // Dark Charcoal – invertierte Variante auf hellem Untergrund
        dark:
          'bg-dark-surface text-ivory hover:bg-near-black rounded-lg shadow-ring-dark',

        // Destructive – warmes Rot
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg',

        // Outline – Border Cream Rand, Parchment-Hintergrund
        outline:
          'border border-border-cream bg-background text-foreground hover:bg-warm-sand hover:border-warm-sand rounded-lg',

        // Ghost – kein Hintergrund, nur Hover-Fläche
        ghost:
          'text-foreground hover:bg-warm-sand hover:text-charcoal-warm rounded-lg',

        // Link – Terracotta-Unterstreichung
        link:
          'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 text-sm',
        sm:      'h-8 px-3 text-xs rounded-lg',
        lg:      'h-10 px-6 text-sm rounded-xl',
        icon:    'h-9 w-9 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
