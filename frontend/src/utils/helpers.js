/**
 * Helper utility functions
 */

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num?.toLocaleString() || '0';
};

export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
