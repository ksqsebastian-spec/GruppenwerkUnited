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
        // Schwarz – primärer CTA im Ollama Design System
        default:
          'bg-[#000000] text-white hover:bg-[#262626] rounded-full',

        // Helles Grau – sekundärer Button
        secondary:
          'bg-[#e5e5e5] text-[#262626] hover:bg-[#d4d4d4] rounded-full',

        // Schwarz – invertierte Variante (identisch mit default)
        dark:
          'bg-[#000000] text-white hover:bg-[#262626] rounded-full',

        // Destructive – Rot für Fehlerzustände
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full',

        // Outline – Border mit weißem Hintergrund
        outline:
          'border border-[#d4d4d4] bg-white text-[#404040] hover:bg-[#f5f5f5] rounded-full',

        // Ghost – kein Hintergrund, nur Hover-Fläche
        ghost:
          'text-[#262626] hover:bg-[#e5e5e5] rounded-full',

        // Link – Unterstreichung
        link:
          'text-[#000000] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 text-sm',
        sm:      'h-8 px-3 text-xs',
        lg:      'h-10 px-6 text-sm',
        icon:    'h-9 w-9 rounded-full',
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
