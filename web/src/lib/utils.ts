import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const f = (input: string, init: RequestInit = {}) => {
  const hit = () => fetch(input.startsWith('http') ? input
    : `${import.meta.env.VITE_API_URL}${input}`, {
      ...init,
      headers: {
        ...init.headers || {}
      }
    })
  return hit()
}
