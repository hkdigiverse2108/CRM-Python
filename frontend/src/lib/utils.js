import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusColor(status) {
  const normalized = status?.toLowerCase().replace('-', ' ') || '';
  const colors = {
    'active': 'badge-success',
    'won': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
    'converted': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
    'paid': 'badge-success',
    'approved': 'badge-success',
    'connected': 'badge-success',
    'delivered': 'badge-success',
    'completed': 'badge-success',
    'resolved': 'badge-success',
    'open': 'badge-info',
    'new': 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-200 dark:border-sky-800',
    'new lead': 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-200 dark:border-sky-800',
    'contacted': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800',
    'follow up': 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
    'negotiation': 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200 dark:border-purple-800',
    'hot lead': 'bg-rose-105 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800',
    'proposal sent': 'bg-teal-100 text-teal-850 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-200 dark:border-teal-800',
    'in-progress': 'badge-info',
    'processing': 'badge-info',
    'pending': 'badge-warning',
    'overdue': 'badge-danger',
    'lost': 'badge-danger',
    'rejected': 'badge-danger',
    'cancelled': 'badge-danger',
    'high': 'badge-danger',
    'medium': 'badge-warning',
    'low': 'badge-info',
    'draft': 'badge-neutral',
    'inactive': 'badge-neutral',
    'not-connected': 'badge-neutral',
    'not connected': 'badge-neutral',
    'connection failed': 'badge-danger',
    'pending verification': 'badge-warning',
  };
  return colors[normalized] || colors[status?.toLowerCase()] || 'badge-neutral';
}

export function generateId() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}
