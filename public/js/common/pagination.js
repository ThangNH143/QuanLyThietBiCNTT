// public/js/common/pagination.js
// Shared pagination renderer for all modules.

window.AppPagination = {
  render({
    containerSelector,
    pagination,
    onPageChange,
    windowSize = 10
  }) {
    const container = $(containerSelector);
    container.empty();

    if (!pagination || typeof onPageChange !== 'function') return;

    const page = Number(pagination.page) || 1;
    const totalPages = Number(pagination.totalPages) || 1;

    if (totalPages <= 1) return;

    const safeWindowSize = Math.max(Number(windowSize) || 10, 3);
    const leftCount = Math.floor(safeWindowSize / 2);
    const rightCount = safeWindowSize - leftCount - 1;

    let start = Math.max(1, page - leftCount);
    let end = Math.min(totalPages, page + rightCount);

    const shown = end - start + 1;
    if (shown < safeWindowSize) {
      const need = safeWindowSize - shown;
      if (start === 1) {
        end = Math.min(totalPages, end + need);
      } else if (end === totalPages) {
        start = Math.max(1, start - need);
      }
    }

    const wrapper = $('<div class="d-flex flex-wrap justify-content-center align-items-center gap-2"></div>');

    const makeButton = (label, targetPage, options = {}) => {
      const disabled = Boolean(options.disabled);
      const active = Boolean(options.active);
      const buttonClass = active ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-outline-primary';

      const button = $(`
        <button type="button" class="${buttonClass}" ${disabled ? 'disabled' : ''}>
          ${label}
        </button>
      `);

      if (!disabled && !active) {
        button.on('click', () => onPageChange(Number(targetPage)));
      }

      return button;
    };

    const makeDots = () => $('<span class="px-1 text-muted">...</span>');

    wrapper.append(makeButton('‹', page - 1, { disabled: page <= 1 }));

    if (start > 1) {
      wrapper.append(makeButton('1', 1, { active: page === 1 }));
      if (start > 2) wrapper.append(makeDots());
    }

    for (let p = start; p <= end; p++) {
      wrapper.append(makeButton(String(p), p, { active: p === page }));
    }

    if (end < totalPages) {
      if (end < totalPages - 1) wrapper.append(makeDots());
      wrapper.append(makeButton(String(totalPages), totalPages, { active: page === totalPages }));
    }

    wrapper.append(makeButton('›', page + 1, { disabled: page >= totalPages }));

    container.append(wrapper);
  },

  normalizeFromResponse(res, fallbackParams = {}) {
    if (res?.meta?.pagination) return res.meta.pagination;
    if (res?.pagination) return res.pagination;

    const page = Number(res?.currentPage) || Number(fallbackParams.page) || 1;
    const limit = Number(fallbackParams.limit) || 10;
    const totalItems = Number(res?.totalItems ?? res?.totalRecords ?? res?.total) || 0;
    const totalPages = Number(res?.totalPages) || Math.max(Math.ceil(totalItems / limit), 1);

    return {
      page,
      limit,
      totalItems,
      totalPages
    };
  }
};

function getListFromResponse(res, legacyKey) {
  if (Array.isArray(res?.[legacyKey])) return res[legacyKey];
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res)) return res;
  return [];
}

function getPaginationFromResponse(res, fallbackParams = {}) {
  if (window.AppPagination) {
    return window.AppPagination.normalizeFromResponse(res, fallbackParams);
  }

  const page = Number(res?.currentPage) || Number(fallbackParams.page) || 1;
  const limit = Number(fallbackParams.limit) || 10;
  const totalItems = Number(res?.totalItems ?? res?.totalRecords ?? res?.total) || 0;
  const totalPages = Number(res?.totalPages) || Math.max(Math.ceil(totalItems / limit), 1);

  return { page, limit, totalItems, totalPages };
}
