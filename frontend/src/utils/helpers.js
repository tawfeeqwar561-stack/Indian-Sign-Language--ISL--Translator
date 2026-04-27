/**
 * Utility helpers for the ISL frontend.
 */

export function formatTimestamp(ts) {
  if (!ts) return '';
  const date = typeof ts === 'number' ? new Date(ts * 1000) : new Date(ts);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatDate(ts) {
  if (!ts) return '';
  const date = typeof ts === 'number' ? new Date(ts * 1000) : new Date(ts);
  return date.toLocaleDateString();
}

export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function throttle(fn, limit) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function truncate(str, maxLen = 50) {
  if (!str || str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '…';
}