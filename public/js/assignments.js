// public/js/assignments.js

let currentAssignmentParams = {
  page: 1,
  limit: 10,
  deviceName: '',
  deptName: '',
  status: 'active'
};

let departmentsLoaded = false;

$(document).ready(function () {
  initSelect2();
  bindAssignmentEvents();

  loadDepartments();
  loadDeviceAssignments(currentAssignmentParams);
});

function bindAssignmentEvents() {
  $('#resetDeviceAssignmentFilter').off('click').on('click', function () {
    $('#filterDeviceAssignmentForm')[0].reset();

    currentAssignmentParams = {
      page: 1,
      limit: 10,
      deviceName: '',
      deptName: '',
      status: 'active'
    };

    loadDeviceAssignments(currentAssignmentParams);
  });

  $('#filterDeviceAssignmentForm').off('submit').on('submit', function (e) {
    e.preventDefault();

    const formData = Object.fromEntries(new FormData(this));

    currentAssignmentParams = {
      ...currentAssignmentParams,
      ...formData,
      page: 1,
      limit: currentAssignmentParams.limit || 10
    };

    loadDeviceAssignments(currentAssignmentParams);
  });

  $('#btnOpenCreateAssignmentModal')
    .off('click')
    .on('click', openCreateAssignmentModal);

  $('#createDeviceAssignmentForm')
    .off('submit')
    .on('submit', submitCreateAssignment);

  $('#editDeviceAssignmentForm')
    .off('submit')
    .on('submit', submitEditAssignment);
}

function initSelect2() {
  if (!$.fn.select2) return;

  $('#editDeptDropdown').select2({
    dropdownParent: $('#editDeviceAssignmentModal'),
    width: '100%',
    placeholder: 'Chọn phòng ban...',
    allowClear: true
  });

  $('#createDeptDropdown').select2({
    dropdownParent: $('#createDeviceAssignmentModal'),
    width: '100%',
    placeholder: 'Chọn phòng ban...',
    allowClear: true
  });
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
  return xhr.responseJSON?.message || fallback;
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

function showAssignmentLoading() {
  $('#assignmentTableBody').html(`
    <tr>
      <td colspan="7" class="text-center py-4">
        <div class="spinner-border" role="status"></div>
        <div class="mt-2">Đang tải dữ liệu...</div>
      </td>
    </tr>
  `);
}

function showAssignmentError(message) {
  $('#assignmentTableBody').html(`
    <tr>
      <td colspan="7" class="text-center text-danger py-4">
        ${escapeHtml(message)}
      </td>
    </tr>
  `);
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

function loadDepartments() {
  if (departmentsLoaded) return Promise.resolve();

  return $.get('/assignments/departments/ajax')
    .then(function (res) {
      const departments = getListFromResponse(res, 'departments');

      const createDropdown = $('#createDeptDropdown');
      const editDropdown = $('#editDeptDropdown');

      const placeholder = '<option value="">-- Chọn phòng ban --</option>';

      const options = departments
        .map((d) => `
          <option value="${escapeHtml(d.id)}">
            ${escapeHtml(d.name || d.deptName || '')}
          </option>
        `)
        .join('');

      createDropdown.empty().append(placeholder + options);
      editDropdown.empty().append(placeholder + options);

      departmentsLoaded = true;
    })
    .catch((xhr) => {
      console.error('Lỗi load phòng ban:', xhr);
      showError(getErrorMessage(xhr, 'Lỗi khi tải danh sách phòng ban'));
    });
}

function loadDeviceAssignments(params = {}) {
  currentAssignmentParams = {
    ...currentAssignmentParams,
    ...params
  };

  showAssignmentLoading();

  $.get('/assignments/ajax', currentAssignmentParams)
    .done(function (res) {
      const assignments = getListFromResponse(res, 'assignments');
      const pagination = getPaginationFromResponse(res, currentAssignmentParams);

      renderAssignmentTable(assignments, pagination);
      renderAssignmentPagination(pagination);

      currentAssignmentParams.page = pagination.page;
      currentAssignmentParams.limit = pagination.limit;
    })
    .fail(function (xhr) {
      console.error('Lỗi load assignments:', xhr);

      showAssignmentError(
        getErrorMessage(xhr, 'Lỗi khi tải danh sách gán thiết bị')
      );

      renderAssignmentPagination({
        page: 1,
        limit: currentAssignmentParams.limit,
        totalItems: 0,
        totalPages: 1
      });
    });
}

function renderAssignmentTable(assignments, pagination) {
  const tbody = $('#assignmentTableBody');
  tbody.empty();

  if (!Array.isArray(assignments) || assignments.length === 0) {
    tbody.append(`
      <tr>
        <td colspan="7" class="text-center text-muted">
          Không có dữ liệu
        </td>
      </tr>
    `);
    return;
  }

  assignments.forEach((item, index) => {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 10;
    const rowNumber = (page - 1) * limit + index + 1;

    const startDate = item.startDate ? String(item.startDate).slice(0, 10) : '';
    const endDate = item.endDate ? String(item.endDate).slice(0, 10) : '';

    const encodedItem = encodeURIComponent(JSON.stringify(item));

    const repairBadge = item.isUnderRepair
      ? '<span class="text-danger ms-2">(Đang sửa)</span>'
      : '';

    const endDateHtml = endDate
      ? escapeHtml(endDate)
      : '<span class="badge bg-success">Đang sử dụng</span>';

    const revokeButton = !item.endDate
      ? `<button class="btn btn-sm btn-outline-warning" onclick="revokeAssignment(${item.id})">Thu hồi</button>`
      : '';

    const row = `
      <tr>
        <td>${rowNumber}</td>

        <td>
          <strong>
            ${escapeHtml(item.deviceCode || '')} - ${escapeHtml(item.deviceName || 'N/A')}
          </strong>
          <br>
          <small class="text-muted">
            Loại: ${escapeHtml(item.deviceType || 'N/A')} ${repairBadge}
          </small>
        </td>

        <td>${escapeHtml(item.deptName || 'N/A')}</td>

        <td>${escapeHtml(startDate)}</td>

        <td>${endDateHtml}</td>

        <td>
          <small>${escapeHtml(item.note || '')}</small>
        </td>

        <td>
          <div class="btn-group">
            <button
              class="btn btn-sm btn-outline-primary"
              onclick="openEditAssignmentModalFromEncoded('${encodedItem}')"
            >
              Sửa
            </button>

            ${revokeButton}

            <button
              class="btn btn-sm btn-outline-danger"
              onclick="deleteAssignment(${item.id})"
            >
              Xóa
            </button>
          </div>
        </td>
      </tr>
    `;

    tbody.append(row);
  });
}

function renderAssignmentPagination(pagination) {
  if (window.AppPagination?.render) {
    window.AppPagination.render({
      containerSelector: '#assignmentPagination',
      pagination,
      windowSize: 10,
      onPageChange: changePage
    });

    return;
  }

  const page = Number(pagination.page) || 1;
  const totalPages = Number(pagination.totalPages) || 1;

  $('#assignmentPagination').html(`
    <div class="d-flex flex-wrap justify-content-center gap-2">
      <button
        class="btn btn-sm btn-outline-primary"
        ${page <= 1 ? 'disabled' : ''}
        onclick="changePage(${page - 1})"
      >
        ‹
      </button>

      <span class="align-self-center">
        Trang ${page} / ${totalPages}
      </span>

      <button
        class="btn btn-sm btn-outline-primary"
        ${page >= totalPages ? 'disabled' : ''}
        onclick="changePage(${page + 1})"
      >
        ›
      </button>
    </div>
  `);
}

function changePage(page) {
  const targetPage = Number(page);

  if (!targetPage || targetPage < 1) return;

  currentAssignmentParams.page = targetPage;
  loadDeviceAssignments(currentAssignmentParams);
}

async function openCreateAssignmentModal() {
  try {
    $('#createDeviceAssignmentForm')[0].reset();
    $('#createDeptDropdown').val('').trigger('change');

    await loadDepartments();

    const res = await $.get('/assignments/available-devices');
    const devices = getListFromResponse(res, 'devices');

    const dropdown = $('#createDeviceDropdown');
    dropdown.empty().append('<option value="">-- Chọn thiết bị --</option>');

    devices.forEach((d) => {
      dropdown.append(`
        <option value="${escapeHtml(d.id)}">
          ${escapeHtml(d.deviceCode || '')} - ${escapeHtml(d.deviceName || '')}
        </option>
      `);
    });

    toggleModal('#createDeviceAssignmentModal', 'open');
  } catch (err) {
    console.error('Lỗi khi chuẩn bị modal:', err);
    showError('Lỗi khi chuẩn bị form gán thiết bị');
  }
}

function openEditAssignmentModalFromEncoded(encodedItem) {
  const item = JSON.parse(decodeURIComponent(encodedItem));
  openEditAssignmentModal(item);
}

async function openEditAssignmentModal(item) {
  try {
    $('#editDeviceAssignmentForm')[0].reset();

    $('#editAssignmentId').val(item.id);
    $('#editStartDate').val(item.startDate ? String(item.startDate).slice(0, 10) : '');
    $('#editEndDate').val(item.endDate ? String(item.endDate).slice(0, 10) : '');
    $('#editNote').val(item.note || '');

    await loadDepartments();

    toggleModal('#editDeviceAssignmentModal', 'open');

    setTimeout(() => {
      const deptId = item.deptId || item.departmentId || '';
      $('#editDeptDropdown').val(deptId).trigger('change');
    }, 150);
  } catch (error) {
    console.error('Lỗi khi mở modal sửa:', error);
    showError('Lỗi khi mở form sửa');
  }
}

function submitCreateAssignment(e) {
  e.preventDefault();

  const payload = {
    deviceId: $('#createDeviceDropdown').val(),
    deptId: $('#createDeptDropdown').val(),
    startDate: $('#createStartDate').val(),
    note: $('#createNote').val()
  };

  if (!payload.deviceId || !payload.deptId || !payload.startDate) {
    showError('Vui lòng chọn thiết bị, phòng ban và ngày bắt đầu');
    return;
  }

  $.post('/assignments', payload)
    .done((res) => {
      toggleModal('#createDeviceAssignmentModal', 'close');
      showSuccess(res.message || 'Đã gán thiết bị cho phòng ban');
      loadDeviceAssignments(currentAssignmentParams);
    })
    .fail((xhr) => {
      showError(getErrorMessage(xhr, 'Không thể gán thiết bị'));
    });
}

function submitEditAssignment(e) {
  e.preventDefault();

  const id = $('#editAssignmentId').val();

  const payload = {
    deptId: $('#editDeptDropdown').val(),
    startDate: $('#editStartDate').val(),
    endDate: $('#editEndDate').val(),
    note: $('#editNote').val()
  };

  if (!payload.deptId || !payload.startDate) {
    showError('Vui lòng chọn phòng ban và ngày bắt đầu');
    return;
  }

  $.ajax({
    url: `/assignments/${id}`,
    method: 'PUT',
    data: payload
  })
    .done((res) => {
      toggleModal('#editDeviceAssignmentModal', 'close');
      showSuccess(res.message || 'Đã cập nhật lịch sử gán');
      loadDeviceAssignments(currentAssignmentParams);
    })
    .fail((xhr) => {
      showError(getErrorMessage(xhr, 'Không thể cập nhật'));
    });
}

function revokeAssignment(id) {
  if (typeof Swal === 'undefined') {
    if (!confirm('Thu hồi thiết bị này?')) return;

    $.ajax({
      url: `/assignments/${id}/revoke`,
      method: 'PUT'
    }).done(() => loadDeviceAssignments(currentAssignmentParams));

    return;
  }

  Swal.fire({
    title: 'Thu hồi thiết bị?',
    text: 'Thiết bị sẽ được đánh dấu là đã thu hồi.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Thu hồi',
    cancelButtonText: 'Hủy'
  }).then((result) => {
    if (!result.isConfirmed) return;

    $.ajax({
      url: `/assignments/${id}/revoke`,
      method: 'PUT'
    })
      .done((res) => {
        showSuccess(res.message || 'Đã thu hồi thiết bị');
        loadDeviceAssignments(currentAssignmentParams);
      })
      .fail((xhr) => {
        showError(getErrorMessage(xhr, 'Không thể thu hồi thiết bị'));
      });
  });
}

function deleteAssignment(id) {
  if (typeof Swal === 'undefined') {
    if (!confirm('Xóa bản ghi gán thiết bị này?')) return;

    $.ajax({
      url: `/assignments/${id}`,
      method: 'DELETE'
    }).done(() => loadDeviceAssignments(currentAssignmentParams));

    return;
  }

  Swal.fire({
    title: 'Xóa bản ghi?',
    text: 'Bản ghi gán thiết bị sẽ bị xóa.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Xóa',
    cancelButtonText: 'Hủy',
    confirmButtonColor: '#d33'
  }).then((result) => {
    if (!result.isConfirmed) return;

    $.ajax({
      url: `/assignments/${id}`,
      method: 'DELETE'
    })
      .done((res) => {
        showSuccess(res.message || 'Đã xóa bản ghi');
        loadDeviceAssignments(currentAssignmentParams);
      })
      .fail((xhr) => {
        showError(getErrorMessage(xhr, 'Không thể xóa bản ghi'));
      });
  });
}