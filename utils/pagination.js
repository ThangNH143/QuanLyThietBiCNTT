// utils/pagination.js

export function normalizePagination(query, defaultLimit = 10) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.max(parseInt(query.limit, 10) || defaultLimit, 1);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function buildPagination(totalItems, page, limit) {
  const total = Number(totalItems) || 0;
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  return { page, limit, totalItems: total, totalPages };
}
