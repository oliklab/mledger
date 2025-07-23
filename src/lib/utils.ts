import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateRandomString(length = 8, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
  let result = '';
  const charsetLength = charset.length;

  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charsetLength));
  }

  return result;
}

export function FormatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'USD', currencyDisplay: 'narrowSymbol' }).format(amount);
}

export function FormatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-IE', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function IsThisMonth(dateString: string): boolean {
  const now = new Date();
  // Use Date.UTC() to specify the date components in universal time
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return dateString >= startOfMonth.toISOString().slice(0, 10)
}

export const IsThisWeek = (dateString: string): boolean => {
  const purchaseDate = new Date(dateString);
  const now = new Date();

  // Find the date of the most recent Sunday
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  startOfWeek.setHours(0, 0, 0, 0); // Set to the beginning of Sunday

  // Find the date of the upcoming Saturday
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999); // Set to the end of Saturday

  return purchaseDate >= startOfWeek && purchaseDate <= endOfWeek;
};