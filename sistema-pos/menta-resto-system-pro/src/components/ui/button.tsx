import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

export const buttonVariants = cva(
  // Base style for all buttons
  'border border-gray-200 rounded-2xl bg-white text-black shadow-md px-6 py-2 font-semibold transition-colors duration-150 hover:border-red-500 focus:border-red-500 active:border-red-500 focus:outline-none focus:ring-0 disabled:opacity-60 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default: '',
        outline: 'bg-transparent border-gray-300',
        ghost: 'bg-transparent border-none shadow-none',
        link: 'bg-transparent border-none shadow-none underline text-blue-600 hover:text-blue-800',
      },
      size: {
        default: 'px-6 py-2',
        sm: 'px-3 py-1 text-sm',
        lg: 'px-8 py-3 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariants {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
