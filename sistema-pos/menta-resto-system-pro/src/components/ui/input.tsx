import * as React from "react"

import { cn } from "@/lib/utils"

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'border border-gray-300 rounded-xl px-4 py-2 bg-white text-gray-800 focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none transition-all duration-200',
        'hover:border-secondary focus:shadow-neon-blue',
        className
      )}
      {...props}
    />
  );
}
