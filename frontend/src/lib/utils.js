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
  const colors = {
    'active': 'badge-success',
    'won': 'badge-success',
    'paid': 'badge-success',
    'approved': 'badge-success',
    'connected': 'badge-success',
    'delivered': 'badge-success',
    'completed': 'badge-success',
    'resolved': 'badge-success',
    'open': 'badge-info',
    'new': 'badge-info',
    'in-progress': 'badge-info',
    'processing': 'badge-info',
    'pending': 'badge-warning',
    'negotiation': 'badge-warning',
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
  return colors[status?.toLowerCase()] || 'badge-neutral';
}

export function generateId() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}
