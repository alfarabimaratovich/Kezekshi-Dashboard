import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getWorkingDaysInMonth(year: number, month: number): number {
  // month is 1-12
  const date = new Date(year, month - 1, 1);
  const days = [];
  while (date.getMonth() === month - 1) {
    const day = date.getDay();
    // 0 is Sunday, 6 is Saturday. We want 1-5 (Mon-Fri)
    if (day !== 0 && day !== 6) {
      days.push(new Date(date));
    }
    date.setDate(date.getDate() + 1);
  }
  return days.length;
}
