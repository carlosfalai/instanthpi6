import React from 'react';
import { cn } from '@/lib/utils';

interface EliteButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
    children: React.ReactNode;
}

export function EliteButton({ variant = 'primary', children, className, ...props }: EliteButtonProps) {
    const variants = {
        primary: 'bg-primary hover:bg-primary/90 text-primary-foreground neon-glow-primary',
        secondary: 'bg-secondary hover:bg-secondary/90 text-secondary-foreground neon-glow-secondary',
        ghost: 'bg-transparent hover:bg-white/5 text-foreground border border-white/10',
        destructive: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
    };

    return (
        <button
            className={cn(
                'px-6 py-3 rounded-xl font-bold tracking-wide transition-all',
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}
