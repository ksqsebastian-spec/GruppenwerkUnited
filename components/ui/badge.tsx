import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        // Schwarz – primäres Badge im Ollama Design System
        default:
          'border-transparent bg-[#000000] text-white hover:bg-[#262626]',
        // Helles Grau – neutrales Badge
        secondary:
          'border-transparent bg-[#e5e5e5] text-[#262626] hover:bg-[#d4d4d4]',
        // Destructive – Rot für Fehler
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        // Outline – nur Rand, kein Fill
        outline:
          'border-[#e5e5e5] text-[#262626] bg-transparent',
        // Erfolg – Grauskaliert (kein Grün im Ollama System)
        success:
          'border-transparent bg-[#e5e5e5] text-[#262626] hover:bg-[#d4d4d4]',
        // Warnung – Grauskaliert
        warning:
          'border-transparent bg-[#e5e5e5] text-[#525252] hover:bg-[#d4d4d4]',
        // Gefahr – Roter Text auf hellem Grau
        danger:
          'border-transparent bg-[#f5f5f5] text-destructive hover:bg-[#e5e5e5]',
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
