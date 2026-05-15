// public/js/repairs.js

const REPAIR_STATUS = ['opened', 'in-progress', 'completed', 'canceled'];

let currentRepairParams = {
  page: 1,
  limit: 10,
  deviceKeyword: '',
  hardwareKeyword: '',
  status: 'opened'
};

$(document).ready(function () {
  bindRepairEvents();
  loadRepairs(currentRepairParams);
});

function bindRepairEvents() {
  $('#createRepairForm')
    .off('submit')
    .on('submit', submitCreateRepair);

  $('#editRepairForm')
    .off('submit')
    .on('submit', submitEditRepair);

  $('#filterRepairForm')
    .off('submit')
    .on('submit', function (e) {
      e.preventDefault();

      const formData = Object.fromEntries(new FormData(this));

      currentRepairParams = {
        ...currentRepairParams,
        ...formData,
        page: 1,
        limit: currentRepairParams.limit || 10
      };

      loadRepairs(currentRepairParams);
    });

  $('#btnResetRepairFilter')
    .off('click')
    .on('click', function () {
      currentRepairParams = {
        page: 1,
        limit: 10,
        deviceKeyword: '',
        hardwareKeyword: '',
        status: 'opened'
      };

      $('#filterRepairForm')[0].reset();

      loadRepairs(currentRepairParams);
    });

  $('#btnOpenCreateRepairModal')
    .off('click')
    .on('click', openCreateRepairModal);
}

function getListFromResponse(res, legacyKey) {
  if (Array.isArray(res?.[legacyKey])) return res[legacyKey];
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res)) return res;

  return [];
}

function getEntityFromResponse(res) {
  if (res?.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
    return res.data;
  }

  return res;
}

function getPaginationFromResponse(res, fallbackParams = {}) {
  if (window.AppPagination?.normalizeFromResponse) {
    return window.AppPagination.normalizeFromResponse(res, fallbackParams);
  }

  if (res?.meta?.pagination) return res.meta.pagination;
  if (res?.pagination) return res.pagination;

  const page = Number(res?.currentPage) || Number(fallbackParams.page) || 1;
  const limit = Number(fallbackParams.limit) || 10;
  const totalItems = Number(res?.total) || 0;
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

function showRepairAlert(message, type = 'success') {
  const alertHtml = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      <strong>Lưu ý:</strong> ${escapeHtml(message)}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;

  $('#repairAlertContainer').html(alertHtml);

  setTimeout(() => {
    $('.alert').alert('close');
  }, 5000);
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

  showRepairAlert(message, 'success');
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

  showRepairAlert(message, 'danger');
}

function matchByText(params, data) {
  if ($.trim(params.term) === '') return data;
  if (typeof data.text === 'undefined') return null;

  const term = params.term.toLowerCase();
  const text = data.text.toLowerCase();

  return text.includes(term) ? data : null;
}

function showRepairLoading() {
  $('#repairTableBody').html(`
    <tr>
      <td colspan="11" class="text-center py-4">
        <div class="spinner-border" role="status"></div>
        <div class="mt-2">Đang tải dữ liệu...</div>
      </td>
    </tr>
  `);
}

function renderStatus(status) {
  const map = {
    opened: '<span class="badge bg-primary">Mới tiếp nhận</span>',
    'in-progress': '<span class="badge bg-warning text-dark">Đang sửa</span>',
    completed: '<span class="badge bg-success">Hoàn tất</span>',
    canceled: '<span class="badge bg-secondary">Hủy bỏ</span>'
  };

  return map[status] || escapeHtml(status || '');
}

function loadCreateDropdowns() {
  const deviceDropdown = $('#createRepairDeviceDropdown');
  const hwDropdown = $('#createRepairHardwareDropdown');
  const receiverDropdown = $('#createRepairReceiverDropdown');

  deviceDropdown.empty();
  hwDropdown.empty();
  receiverDropdown.empty();

  if ($.fn.select2) {
    try {
      deviceDropdown.select2('destroy');
      hwDropdown.select2('destroy');
      receiverDropdown.select2('destroy');
    } catch (_) {}
  }

  $.get('/repairs/dropdown/devices')
    .done(function (res) {
      const devices = getListFromResponse(res, 'devices');

      deviceDropdown.append('<option value="">-- Chọn thiết bị --</option>');

      devices.forEach((d) => {
        const code = d.code || d.deviceCode || '';
        const name = d.name || d.deviceName || '';
        const type = d.deviceType || '';

        const label = `${code} - ${name} ${type ? `(${type})` : ''}`;

        deviceDropdown.append(`
          <option value="${escapeHtml(d.id)}">
            ${escapeHtml(label)}
          </option>
        `);
      });

      if ($.fn.select2) {
        deviceDropdown.select2({
          dropdownParent: $('#repairCreateModal'),
          width: '100%',
          placeholder: 'Chọn thiết bị...',
          allowClear: true,
          matcher: matchByText
        });
      }
    })
    .fail((xhr) => {
      showError(getErrorMessage(xhr, 'Lỗi khi tải danh sách thiết bị'));
    });

  deviceDropdown.off('change').on('change', function () {
    loadHardwareForCreate($(this).val());
  });

  $.get('/repairs/dropdown/users')
    .done(function (res) {
      const users = getListFromResponse(res, 'users');

      receiverDropdown.append('<option value="">-- Chọn người nhận --</option>');

      users.forEach((u) => {
        const label = `${u.code || ''} - ${u.name || ''} (${u.deptName || 'Không rõ'})`;

        receiverDropdown.append(`
          <option value="${escapeHtml(u.id)}">
            ${escapeHtml(label)}
          </option>
        `);
      });

      if ($.fn.select2) {
        receiverDropdown.select2({
          dropdownParent: $('#repairCreateModal'),
          width: '100%',
          matcher: matchByText,
          placeholder: 'Chọn người nhận...',
          allowClear: true
        });
      }
    })
    .fail((xhr) => {
      showError(getErrorMessage(xhr, 'Lỗi khi tải danh sách người nhận'));
    });
}

function loadHardwareForCreate(deviceId) {
  const hwDropdown = $('#createRepairHardwareDropdown');

  hwDropdown.empty();

  if (!deviceId) return;

  if ($.fn.select2) {
    try {
      hwDropdown.select2('destroy');
    } catch (_) {}
  }

  $.get('/repairs/dropdown/hardware-units', {
    deviceId,
    currentRepairId: 0
  })
    .done(function (res) {
      const units = getListFromResponse(res, 'units');

      units.forEach((hw) => {
        const label = `${hw.code || ''} - ${hw.hardwareName || ''} - ${hw.serialNumber || ''}`;
        const disabled = hw.isLocked
          ? 'disabled style="color:gray;" title="🔒 Đã ghi nhận sửa"'
          : '';

        hwDropdown.append(`
          <option value="${escapeHtml(hw.id)}" ${disabled}>
            ${escapeHtml(label)}
          </option>
        `);
      });

      if ($.fn.select2) {
        hwDropdown.select2({
          dropdownParent: $('#repairCreateModal'),
          width: '100%',
          multiple: true,
          placeholder: 'Chọn phần cứng chưa được sửa...',
          matcher: matchByText
        });
      }
    })
    .fail((xhr) => {
      showError(getErrorMessage(xhr, 'Lỗi khi tải danh sách phần cứng'));
    });
}

function loadEditDropdowns(data) {
  const hwDropdown = $('#editRepairHardwareDropdown');
  const receiverDropdown = $('#editRepairReceiverDropdown');

  hwDropdown.empty();
  receiverDropdown.empty();

  if ($.fn.select2) {
    try {
      hwDropdown.select2('destroy');
      receiverDropdown.select2('destroy');
    } catch (_) {}
  }

  $.get('/repairs/dropdown/hardware-units', {
    deviceId: data.deviceId,
    currentRepairId: data.id
  })
    .done(function (res) {
      const units = getListFromResponse(res, 'units');

      units.forEach((hw) => {
        const label = `${hw.code || ''} - ${hw.hardwareName || ''} - ${hw.serialNumber || ''}`;
        const selected = String(hw.id) === String(data.hardwareUnitId) ? 'selected' : '';
        const disabled = hw.isLocked && String(hw.id) !== String(data.hardwareUnitId)
          ? 'disabled style="color:gray;" title="🔒 Đã ghi nhận sửa"'
          : '';

        hwDropdown.append(`
          <option value="${escapeHtml(hw.id)}" ${selected} ${disabled}>
            ${escapeHtml(label)}
          </option>
        `);
      });

      if ($.fn.select2) {
        hwDropdown.select2({
          dropdownParent: $('#repairEditModal'),
          width: '100%',
          multiple: false,
          placeholder: 'Chọn phần cứng...',
          matcher: matchByText,
          allowClear: true
        });
      }
    })
    .fail((xhr) => {
      showError(getErrorMessage(xhr, 'Lỗi khi tải phần cứng sửa chữa'));
    });

  $.get('/repairs/dropdown/users')
    .done(function (res) {
      const users = getListFromResponse(res, 'users');

      receiverDropdown.append('<option value="">-- Chọn người nhận --</option>');

      users.forEach((u) => {
        const label = `${u.code || ''} - ${u.name || ''} (${u.deptName || 'Không rõ'})`;

        receiverDropdown.append(`
          <option value="${escapeHtml(u.id)}">
            ${escapeHtml(label)}
          </option>
        `);
      });

      if ($.fn.select2) {
        receiverDropdown.select2({
          dropdownParent: $('#repairEditModal'),
          width: '100%',
          matcher: matchByText,
          placeholder: 'Chọn người nhận...',
          allowClear: true
        });
      }

      const receiverId = data.userResolveId ?? data.receiverId ?? null;
      receiverDropdown.val(receiverId).trigger('change');
    })
    .fail((xhr) => {
      showError(getErrorMessage(xhr, 'Lỗi khi tải danh sách người nhận'));
    });
}

function openCreateRepairModal() {
  $('#createRepairForm')[0].reset();
  $('#createRepairHardwareDropdown').empty();
  $('#createRepairStatusDropdown').val('opened');

  loadCreateDropdowns();

  toggleModal('#repairCreateModal', 'open');
}

async function openEditRepairModal(id) {
  $('#editRepairForm')[0].reset();
  $('#editRepairHardwareDropdown').empty();
  $('#editRepairReceiverDropdown').empty();

  let repair;

  try {
    const res = await $.get(`/repairs/${id}`);
    repair = getEntityFromResponse(res);
  } catch (xhr) {
    showError(getErrorMessage(xhr, 'Không thể tải dữ liệu phiếu sửa chữa'));
    return;
  }

  $('#editRepairId').val(id);
  $('#editRepairDeviceId').val(repair.deviceId);
  $('#editRepairDeviceInfo').val(`${repair.deviceCode || ''} - ${repair.deviceName || ''}`);
  $('#editRepairSenderText').val(repair.userCreateName || '');
  $('#editRepairBrokenDate').val(repair.brokenDate ? String(repair.brokenDate).slice(0, 10) : '');
  $('#editRepairRepairDate').val(repair.repairDate ? String(repair.repairDate).slice(0, 10) : '');
  $('#editRepairStatusDropdown').val(repair.status || 'opened');
  $('#editRepairNote').val(repair.note || '');

  loadEditDropdowns(repair);

  toggleModal('#repairEditModal', 'open');
}

function deleteRepair(id, status = null) {
  if (status && status !== 'opened') {
    showError('Chỉ được xóa phiếu ở trạng thái "Mới tiếp nhận".');
    return;
  }

  if (typeof Swal === 'undefined') {
    if (!confirm('Xóa phiếu sửa chữa này?')) return;

    $.ajax({
      url: `/repairs/${id}`,
      method: 'DELETE'
    })
      .done(() => loadRepairs(currentRepairParams))
      .fail((xhr) => showError(getErrorMessage(xhr, 'Không thể xóa phiếu sửa chữa')));

    return;
  }

  Swal.fire({
    title: 'Bạn có chắc?',
    text: 'Phiếu sửa chữa này sẽ bị xóa vĩnh viễn!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Xóa',
    cancelButtonText: 'Hủy',
    confirmButtonColor: '#d33'
  }).then((result) => {
    if (!result.isConfirmed) return;

    $.ajax({
      url: `/repairs/${id}`,
      method: 'DELETE'
    })
      .done((res) => {
        showSuccess(res.message || 'Đã xóa phiếu sửa chữa');
        loadRepairs(currentRepairParams);
      })
      .fail((xhr) => {
        showError(getErrorMessage(xhr, 'Không thể xóa phiếu sửa chữa'));
      });
  });
}

function loadRepairs(params = {}) {
  currentRepairParams = {
    ...currentRepairParams,
    ...params
  };

  showRepairLoading();

  $.get('/repairs/ajax', currentRepairParams)
    .done(function (res) {
      const repairs = getListFromResponse(res, 'repairs');
      const pagination = getPaginationFromResponse(res, currentRepairParams);

      renderRepairTable(repairs, pagination);
      renderRepairPagination(pagination);

      currentRepairParams.page = pagination.page;
      currentRepairParams.limit = pagination.limit;
    })
    .fail((xhr) => {
      $('#repairTableBody').html(`
        <tr>
          <td colspan="11" class="text-center text-danger py-4">
            ${escapeHtml(getErrorMessage(xhr, 'Lỗi khi tải danh sách phiếu sửa chữa'))}
          </td>
        </tr>
      `);

      renderRepairPagination({
        page: 1,
        limit: currentRepairParams.limit,
        totalItems: 0,
        totalPages: 1
      });
    });
}

function renderRepairTable(repairs, pagination) {
  const tbody = $('#repairTableBody');
  tbody.empty();

  if (!Array.isArray(repairs) || repairs.length === 0) {
    tbody.append(`
      <tr>
        <td colspan="11" class="text-center text-muted">
          Không có dữ liệu
        </td>
      </tr>
    `);
    return;
  }

  repairs.forEach((r) => {
    const canDelete = r.status === 'opened';

    const row = `
      <tr>
        <td>${escapeHtml(r.deviceCode || '')} - ${escapeHtml(r.deviceName || '')}</td>
        <td>${escapeHtml(r.deviceType || '')}</td>
        <td>${escapeHtml(r.hardwareName || '')} ${r.serialNumber ? `(${escapeHtml(r.serialNumber)})` : ''}</td>
        <td>${escapeHtml(r.deptName || '')}</td>
        <td>${escapeHtml(r.senderName || r.userCreateName || '')}</td>
        <td>${escapeHtml(r.brokenDate ? String(r.brokenDate).slice(0, 10) : '')}</td>
        <td>${escapeHtml(r.receiverName || '')}</td>
        <td>${escapeHtml(r.repairDate ? String(r.repairDate).slice(0, 10) : '')}</td>
        <td>${renderStatus(r.status)}</td>
        <td>${escapeHtml(r.note || '')}</td>
        <td class="text-nowrap">
          <button
            class="btn btn-sm btn-warning me-1"
            onclick="openEditRepairModal(${r.id})"
          >
            ✏️
          </button>

          <button
            class="btn btn-sm btn-danger"
            ${canDelete ? '' : 'disabled'}
            onclick="deleteRepair(${r.id}, '${escapeHtml(r.status || '')}')"
            title="${canDelete ? 'Xóa phiếu' : 'Chỉ được xóa phiếu mới tiếp nhận'}"
          >
            ❌
          </button>
        </td>
      </tr>
    `;

    tbody.append(row);
  });
}

function changeRepairPage(page) {
  const targetPage = Number(page);

  if (!targetPage || targetPage < 1) return;

  currentRepairParams.page = targetPage;
  loadRepairs(currentRepairParams);
}

function renderRepairPagination(pagination) {
  if (window.AppPagination?.render) {
    window.AppPagination.render({
      containerSelector: '#repairPagination',
      pagination,
      windowSize: 10,
      onPageChange: changeRepairPage
    });

    return;
  }

  const page = Number(pagination.page) || 1;
  const totalPages = Number(pagination.totalPages) || 1;

  $('#repairPagination').html(`
    <div class="d-flex flex-wrap justify-content-center gap-2">
      <button
        class="btn btn-sm btn-outline-primary"
        ${page <= 1 ? 'disabled' : ''}
        onclick="changeRepairPage(${page - 1})"
      >
        ‹
      </button>

      <span class="align-self-center">
        Trang ${page} / ${totalPages}
      </span>

      <button
        class="btn btn-sm btn-outline-primary"
        ${page >= totalPages ? 'disabled' : ''}
        onclick="changeRepairPage(${page + 1})"
      >
        ›
      </button>
    </div>
  `);
}

function submitCreateRepair(e) {
  e.preventDefault();

  const payload = {
    deviceId: $('#createRepairDeviceDropdown').val(),
    hardwareUnitIds: $('#createRepairHardwareDropdown').val(),
    brokenDate: $('#createRepairBrokenDate').val(),
    repairDate: $('#createRepairRepairDate').val() || null,
    status: $('#createRepairStatusDropdown').val(),
    note: $('#createRepairNote').val(),
    userCreateName: $('#createRepairSenderText').val() || null,
    userResolveId: $('#createRepairReceiverDropdown').val() || null
  };

  if (!payload.deviceId || !payload.brokenDate || !payload.status) {
    showError('Vui lòng nhập đầy đủ thông tin bắt buộc.');
    return;
  }

  if (['completed', 'canceled'].includes(payload.status) && !payload.repairDate) {
    showError('Trạng thái đã hoàn tất hoặc hủy cần có ngày sửa.');
    return;
  }

  $.post('/repairs', payload)
    .done((res) => {
      toggleModal('#repairCreateModal', 'close');
      showSuccess(res.message || 'Đã tạo phiếu sửa chữa');
      loadRepairs(currentRepairParams);
    })
    .fail((xhr) => {
      showError(getErrorMessage(xhr, 'Không thể tạo phiếu sửa chữa'));
    });
}

function submitEditRepair(e) {
  e.preventDefault();

  const id = $('#editRepairId').val();

  const hwVal = $('#editRepairHardwareDropdown').val();
  const hardwareUnitId = Array.isArray(hwVal)
    ? (hwVal[0] || null)
    : (hwVal || null);

  const payload = {
    deviceId: $('#editRepairDeviceId').val(),
    brokenDate: $('#editRepairBrokenDate').val(),
    repairDate: $('#editRepairRepairDate').val() || null,
    status: $('#editRepairStatusDropdown').val(),
    note: $('#editRepairNote').val(),
    hardwareUnitId,
    userCreateName: $('#editRepairSenderText').val() || null,
    userResolveId: $('#editRepairReceiverDropdown').val() || null
  };

  if (!payload.deviceId || !payload.brokenDate || !payload.status) {
    showError('Vui lòng nhập đầy đủ thông tin bắt buộc.');
    return;
  }

  if (['completed', 'canceled'].includes(payload.status) && !payload.repairDate) {
    showError('Trạng thái đã hoàn tất hoặc hủy cần có ngày sửa.');
    return;
  }

  $.ajax({
    url: `/repairs/${id}`,
    method: 'PUT',
    data: payload
  })
    .done((res) => {
      toggleModal('#repairEditModal', 'close');
      showSuccess(res.message || 'Đã cập nhật phiếu sửa chữa');
      loadRepairs(currentRepairParams);
    })
    .fail((xhr) => {
      showError(getErrorMessage(xhr, 'Không thể cập nhật phiếu sửa chữa'));
    });
}