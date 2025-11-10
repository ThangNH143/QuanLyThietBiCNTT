function sanitizeFilters(filters) {
  const safeFilters = {};

  safeFilters.code = filters.code?.trim() || '';
  safeFilters.name = filters.name?.trim() || '';
  safeFilters.deviceTypeId = Number(filters.deviceTypeId) || null;

  safeFilters.filter = ['active', 'inactive'].includes(filters.filter) ? filters.filter : 'all';

  // Validate date định dạng YYYY-MM-DD
  const isValidDate = (str) => /^\d{4}-\d{2}-\d{2}$/.test(str);
  safeFilters.startDate = isValidDate(filters.startDate) ? filters.startDate : null;
  safeFilters.endDate = isValidDate(filters.endDate) ? filters.endDate : null;
  safeFilters.page = Number(filters.page) > 0 ? parseInt(filters.page) : 1;
  safeFilters.limit = Number(filters.limit) > 0 ? parseInt(filters.limit) : 10;

  return safeFilters;
}

export default sanitizeFilters;