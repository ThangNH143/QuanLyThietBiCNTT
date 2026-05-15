// public/js/deviceHardwareUnits.js

let currentDeviceHardwareParams = {
  page: 1,
  limit: 10,
  deviceName: '',
  hardwareKeyword: ''
};

$(document).ready(function () {
  bindDeviceHardwareEvents();
  loadDeviceHardwareUnits(currentDeviceHardwareParams);
});

function bindDeviceHardwareEvents() {
  $('#btnOpenCreateModal')
    .off('click')
    .on('click', openCreateModal);

  $('#filterDeviceHardwareForm')
    .off('submit')
    .on('submit', function (e) {
      e.preventDefault();

      const formData = Object.fromEntries(new FormData(this));

      currentDeviceHardwareParams = {
        ...currentDeviceHardwareParams,
        ...formData,
        page: 1,
        limit: currentDeviceHardwareParams.limit || 10
      };

      loadDeviceHardwareUnits(currentDeviceHardwareParams);
    });

  $('#resetDeviceHardwareFilter')
    .off('click')
    .on('click', function () {
      $('#filterDeviceHardwareForm')[0].reset();

      currentDeviceHardwareParams = {
        page: 1,
        limit: 10,
        deviceName: '',
        hardwareKeyword: ''
      };

      loadDeviceHardwareUnits(currentDeviceHardwareParams);
    });

  $('#createDeviceHardwareForm')
    .off('submit')
    .on('submit', submitCreateDeviceHardware);

  $('#editDeviceHardwareForm')
    .off('submit')
    .on('submit', submitEditDeviceHardware);
}

function getListFromResponse(res, legacyKey) {
  if (Array.isArray(res?.[legacyKey])) return res[legacyKey];
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res)) return res;

  return [];
}

function getPaginationFromResponse(res, fallbackParams = {}) {
  if (window.AppPagination?.normalizeFromResponse) {
    return window.AppPagination.normalizeFromResponse(res, fallbackParams);
  }

  if (res?.meta?.pagination) return res.meta.pagination;
  if (res?.pagination) return res.pagination;

  const page = Number(res?.currentPage) || Number(fallbackParams.page) || 1;
  const limit = Number(fallbackParams.limit) || 10;
  const totalItems =
    Number(res?.totalItems) ||
    Number(res?.totalRecords) ||
    Number(res?.total) ||
    0;

  const totalPages = Math.max(Math.ceil(totalItems / limit), 1);

  return {
    page,
    limit,
    totalItems,
    totalPages
  };
}

function getErrorMessage(xhr, fallback = 'Có lỗi xảy ra') {
  return xhr.responseJSON?.message || xhr.responseJSON?.error || fallback;
}

function escapeHtml(value) {
  if (value === null || value === undefined) return '';

  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function toggleModal(modalSelector, action = 'open') {
  document.activeElement?.blur();

  if (typeof bootstrap !== 'undefined') {
    const modalEl = document.querySelector(modalSelector);
    if (!modalEl) return;

    let modalInstance = bootstrap.Modal.getInstance(modalEl);

    if (!modalInstance) {
      modalInstance = new bootstrap.Modal(modalEl);
    }

    if (action === 'open') {
      modalInstance.show();
    } else {
      modalInstance.hide();

      setTimeout(() => {
        $('body').css('overflow', 'auto').removeClass('modal-open');
        $('.modal-backdrop').remove();
      }, 300);
    }

    return;
  }

  if (action === 'open') {
    $(modalSelector).modal('show');
  } else {
    $(modalSelector).modal('hide');
  }
}

function showSuccess(message) {
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      icon: 'success',
      title: 'Thành công',
      text: message,
      timer: 1500,
      showConfirmButton: false
    });
    return;
  }

  alert(message);
}

function showError(message) {
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      icon: 'error',
      title: 'Lỗi',
      text: message
    });
    return;
  }

  alert(message);
}

function showDeviceHardwareLoading() {
  $('#deviceHardwareTable').html(`
    <tr>
      <td colspan="3" class="text-center py-4">
        <div class="spinner-border" role="status"></div>
        <div class="mt-2">Đang tải dữ liệu...</div>
      </td>
    </tr>
  `);
}

function renderHardwareOption(hw, selectedIds = []) {
  const hwId = Number(hw.id);
  const selected = selectedIds.map(Number).includes(hwId) ? 'selected' : '';
  const disabled = hw.isUnderRepair ? 'disabled' : '';
  const style = hw.isUnderRepair ? 'style="color:red;"' : '';

  const label = `${hw.hardwareName || hw.name || ''} - ${hw.serialNumber || ''}`;

  return `
    <option value="${escapeHtml(hw.id)}" ${selected} ${disabled} ${style}>
      ${escapeHtml(label)}
    </option>
  `;
}

function loadDeviceHardwareUnits(params = {}) {
  currentDeviceHardwareParams = {
    ...currentDeviceHardwareParams,
    ...params
  };

  showDeviceHardwareLoading();

  $.get('/device-hardware/ajax', currentDeviceHardwareParams)
    .done(function (res) {
      const devices = getListFromResponse(res, 'devices');
      const pagination = getPaginationFromResponse(res, currentDeviceHardwareParams);

      renderDeviceHardwareTable(devices);
      renderDeviceHardwarePagination(pagination);

      currentDeviceHardwareParams.page = pagination.page;
      currentDeviceHardwareParams.limit = pagination.limit;
    })
    .fail(function (xhr) {
      $('#deviceHardwareTable').html(`
        <tr>
          <td colspan="3" class="text-center text-danger py-4">
            ${escapeHtml(getErrorMessage(xhr, 'Lỗi khi tải danh sách phân bổ phần cứng'))}
          </td>
        </tr>
      `);

      renderDeviceHardwarePagination({
        page: 1,
        limit: currentDeviceHardwareParams.limit,
        totalItems: 0,
        totalPages: 1
      });
    });
}

function renderDeviceHardwareTable(devices) {
  const tbody = $('#deviceHardwareTable');
  tbody.empty();

  if (!Array.isArray(devices) || devices.length === 0) {
    tbody.append(`
      <tr>
        <td colspan="3" class="text-center text-muted">
          Không có dữ liệu
        </td>
      </tr>
    `);
    return;
  }

  const rows = devices.map((item) => {
    const hardwareBadges = (item.hardwareUnits || [])
      .map((hw) => {
        const color = hw.isUnderRepair ? 'color:red;' : '';
        const title = `Serial: ${hw.serialNumber || ''}`;

        return `
          <span
            class="badge text-bg-secondary me-2 mb-1"
            style="${color}"
            title="${escapeHtml(title)}"
          >
            ${escapeHtml(hw.hardwareName || '')}

            <button
              type="button"
              class="btn-close btn-close-white btn-sm ms-1"
              onclick="detachHardware(${hw.id}, ${item.deviceId})"
            ></button>
          </span>
        `;
      })
      .join('');

    return `
      <tr>
        <td>
          ${escapeHtml(item.deviceCode || '')} -
          ${escapeHtml(item.deviceName || '')}
          (${escapeHtml(item.deviceType || '')})
        </td>

        <td>
          ${hardwareBadges || '<span class="text-muted">Chưa có phần cứng</span>'}
        </td>

        <td>
          <button
            class="btn btn-sm btn-warning"
            onclick="openEditModal(${item.deviceId})"
          >
            ⚙️ Sửa
          </button>
        </td>
      </tr>
    `;
  }).join('');

  tbody.html(rows);
}

function renderDeviceHardwarePagination(pagination) {
  if (window.AppPagination?.render) {
    window.AppPagination.render({
      containerSelector: '#deviceHardwarePagination',
      pagination,
      windowSize: 10,
      onPageChange: changeDeviceHardwarePage
    });

    return;
  }

  const page = Number(pagination.page) || 1;
  const totalPages = Number(pagination.totalPages) || 1;

  $('#deviceHardwarePagination').html(`
    <div class="d-flex flex-wrap justify-content-center gap-2">
      <button
        class="btn btn-sm btn-outline-primary"
        ${page <= 1 ? 'disabled' : ''}
        onclick="changeDeviceHardwarePage(${page - 1})"
      >
        ‹
      </button>

      <span class="align-self-center">
        Trang ${page} / ${totalPages}
      </span>

      <button
        class="btn btn-sm btn-outline-primary"
        ${page >= totalPages ? 'disabled' : ''}
        onclick="changeDeviceHardwarePage(${page + 1})"
      >
        ›
      </button>
    </div>
  `);
}

function changeDeviceHardwarePage(page) {
  const targetPage = Number(page);

  if (!targetPage || targetPage < 1) return;

  currentDeviceHardwareParams.page = targetPage;
  loadDeviceHardwareUnits(currentDeviceHardwareParams);
}

/* =========================
   MODALS: CREATE / EDIT
========================= */

function destroySelect2IfNeeded(selector) {
  if (!$.fn.select2) return;

  try {
    if ($(selector).hasClass('select2-hidden-accessible')) {
      $(selector).select2('destroy');
    }
  } catch (_) {}
}

function initSelect2(selector, options = {}) {
  if (!$.fn.select2) return;

  $(selector).select2({
    width: '100%',
    ...options
  });
}

function openCreateModal() {
  const deviceDropdown = $('#createDeviceDropdown');
  const hwDropdown = $('#createHardwareUnitsDropdown');

  destroySelect2IfNeeded('#createDeviceDropdown');
  destroySelect2IfNeeded('#createHardwareUnitsDropdown');

  deviceDropdown.empty();
  hwDropdown.empty();

  $.get('/device-hardware/devices/ungrouped')
    .done(function (res) {
      const devices = getListFromResponse(res, 'devices');

      deviceDropdown.append('<option value="">-- Chọn thiết bị --</option>');

      devices.forEach((d) => {
        const label = `${d.code || d.deviceCode || ''} - ${d.name || d.deviceName || ''} (${d.deviceType || ''})`;

        deviceDropdown.append(`
          <option value="${escapeHtml(d.id)}">
            ${escapeHtml(label)}
          </option>
        `);
      });

      initSelect2('#createDeviceDropdown', {
        dropdownParent: $('#createDeviceHardwareModal'),
        placeholder: 'Chọn thiết bị...',
        allowClear: true
      });
    })
    .fail((xhr) => {
      showError(getErrorMessage(xhr, 'Lỗi khi tải danh sách thiết bị'));
    });

  $.get('/device-hardware/hardware-units/create')
    .done(function (res) {
      const units = getListFromResponse(res, 'units');

      units.forEach((hw) => {
        hwDropdown.append(renderHardwareOption(hw, []));
      });

      initSelect2('#createHardwareUnitsDropdown', {
        dropdownParent: $('#createDeviceHardwareModal'),
        multiple: true,
        placeholder: 'Tìm phần cứng theo tên hoặc serial...',
        allowClear: true,
        matcher: matchHardwareOption
      });
    })
    .fail((xhr) => {
      showError(getErrorMessage(xhr, 'Lỗi khi tải danh sách phần cứng'));
    });

  toggleModal('#createDeviceHardwareModal', 'open');
}

function openEditModal(deviceId) {
  const deviceDropdown = $('#editDeviceDropdown');
  const hwDropdown = $('#editHardwareUnitsDropdown');

  destroySelect2IfNeeded('#editDeviceDropdown');
  destroySelect2IfNeeded('#editHardwareUnitsDropdown');

  deviceDropdown.empty();
  hwDropdown.empty();

  $.get(`/device-hardware/${deviceId}/assigned`)
    .done(function (res) {
      const assigned = getListFromResponse(res, 'assigned');
      const assignedIds = assigned.map((hw) => Number(hw.id));

      $.get('/device-hardware/devices/ungrouped', { includeId: deviceId })
        .done(function (devRes) {
          const devices = getListFromResponse(devRes, 'devices');

          devices.forEach((d) => {
            const label = `${d.code || d.deviceCode || ''} - ${d.name || d.deviceName || ''} (${d.deviceType || ''})`;

            deviceDropdown.append(`
              <option value="${escapeHtml(d.id)}">
                ${escapeHtml(label)}
              </option>
            `);
          });

          deviceDropdown.val(String(deviceId)).trigger('change');

          initSelect2('#editDeviceDropdown', {
            dropdownParent: $('#editDeviceHardwareModal')
          });
        });

      $.get('/device-hardware/hardware-units/edit', {
        deviceId,
        includeIds: assignedIds.join(',')
      })
        .done(function (unitRes) {
          const units = getListFromResponse(unitRes, 'units');

          units.forEach((hw) => {
            hwDropdown.append(renderHardwareOption(hw, assignedIds));
          });

          initSelect2('#editHardwareUnitsDropdown', {
            dropdownParent: $('#editDeviceHardwareModal'),
            multiple: true,
            placeholder: 'Chọn phần cứng...',
            allowClear: true,
            matcher: matchHardwareOption
          });
        });
    })
    .fail((xhr) => {
      showError(getErrorMessage(xhr, 'Lỗi khi tải thông tin phần cứng đã gán'));
    });

  toggleModal('#editDeviceHardwareModal', 'open');
}

function matchHardwareOption(params, data) {
  if ($.trim(params.term) === '') return data;
  if (typeof data.text === 'undefined') return null;

  const term = params.term.toLowerCase();
  const text = data.text.toLowerCase();

  return text.includes(term) ? data : null;
}

/* =========================
   ACTIONS
========================= */

function detachHardware(hardwareUnitId, deviceId) {
  if (typeof Swal === 'undefined') {
    if (!confirm('Gỡ phần cứng này khỏi thiết bị?')) return;

    $.ajax({
      url: `/device-hardware/${deviceId}/detach/${hardwareUnitId}`,
      method: 'DELETE'
    })
      .done(() => loadDeviceHardwareUnits(currentDeviceHardwareParams))
      .fail((xhr) => showError(getErrorMessage(xhr, 'Không thể gỡ phần cứng')));

    return;
  }

  Swal.fire({
    title: 'Gỡ phần cứng?',
    text: 'Phần cứng này sẽ được gỡ khỏi thiết bị.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Gỡ',
    cancelButtonText: 'Hủy'
  }).then((result) => {
    if (!result.isConfirmed) return;

    $.ajax({
      url: `/device-hardware/${deviceId}/detach/${hardwareUnitId}`,
      method: 'DELETE'
    })
      .done((res) => {
        showSuccess(res.message || 'Đã gỡ phần cứng khỏi thiết bị');
        loadDeviceHardwareUnits(currentDeviceHardwareParams);
      })
      .fail((xhr) => {
        showError(getErrorMessage(xhr, 'Không thể gỡ phần cứng'));
      });
  });
}

function submitCreateDeviceHardware(e) {
  e.preventDefault();

  const deviceId = $('#createDeviceDropdown').val();
  const hardwareUnitIds = $('#createHardwareUnitsDropdown').val() || [];

  if (!deviceId) {
    showError('Vui lòng chọn thiết bị');
    return;
  }

  if (!hardwareUnitIds.length) {
    showError('Vui lòng chọn ít nhất một phần cứng');
    return;
  }

  $.ajax({
    url: `/device-hardware/${deviceId}/update`,
    method: 'PUT',
    data: { hardwareUnitIds }
  })
    .done((res) => {
      toggleModal('#createDeviceHardwareModal', 'close');
      showSuccess(res.message || 'Đã gán phần cứng cho thiết bị');
      loadDeviceHardwareUnits(currentDeviceHardwareParams);
    })
    .fail((xhr) => {
      showError(getErrorMessage(xhr, 'Không thể gán phần cứng'));
    });
}

function submitEditDeviceHardware(e) {
  e.preventDefault();

  const deviceId = $('#editDeviceDropdown').val();
  const hardwareUnitIds = $('#editHardwareUnitsDropdown').val() || [];

  if (!deviceId) {
    showError('Không xác định được thiết bị cần cập nhật');
    return;
  }

  $.ajax({
    url: `/device-hardware/${deviceId}/update`,
    method: 'PUT',
    data: { hardwareUnitIds }
  })
    .done((res) => {
      toggleModal('#editDeviceHardwareModal', 'close');
      showSuccess(res.message || 'Đã cập nhật phần cứng cho thiết bị');
      loadDeviceHardwareUnits(currentDeviceHardwareParams);
    })
    .fail((xhr) => {
      showError(getErrorMessage(xhr, 'Không thể cập nhật phần cứng'));
    });
}