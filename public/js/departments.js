let currentDepartmentParams = { page: 1, limit: 10 };
let reopenAfterSubmit = false;
const APP_BASE_PATH = typeof Base_Path !== 'undefined' ? Base_Path : '';

function safeHideModal(modalSelector) {
  document.activeElement?.blur();
  $(modalSelector).modal('hide');

  setTimeout(() => {
    $('body').css('overflow', 'auto').removeClass('modal-open');
    $('.modal-backdrop').remove();

    if (reopenAfterSubmit) {
      reopenAfterSubmit = false;
      $(modalSelector).modal('show');
    }
  }, 500);
}

function showDepartmentAlert(message, type = 'success') {
  const alertHtml = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      <strong>Lưu ý:</strong> ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
  $('#departmentAlertContainer').html(alertHtml);
  setTimeout(() => $('.alert').alert('close'), 5000);
}

function changeDepartmentPage(page) {
  const targetPage = Number(page);
  if (!targetPage || targetPage < 1) return;
  currentDepartmentParams.page = targetPage;
  loadDepartments(currentDepartmentParams);
}

function renderDepartmentPagination(pagination) {
  window.AppPagination.render({
    containerSelector: '#departmentPagination',
    pagination,
    windowSize: 10,
    onPageChange: changeDepartmentPage
  });
}

function loadDepartments(params = {}) {
  currentDepartmentParams = {
    ...currentDepartmentParams,
    ...params,
    page: parseInt(params.page ?? currentDepartmentParams.page, 10) || 1,
    limit: parseInt(params.limit ?? currentDepartmentParams.limit, 10) || 10
  };

  const query = $.param(currentDepartmentParams);

  $.get(APP_BASE_PATH + `/departments/ajax?${query}`, function (res) {
    const departments = getListFromResponse(res, 'departments');
    const rows = departments.length
      ? departments.map((d) => `
        <tr>
          <td><input value="${d.code || ''}" id="dept-code-${d.id}" class="form-control form-control-sm"></td>
          <td><input value="${d.name || ''}" id="dept-name-${d.id}" class="form-control form-control-sm"></td>
          <td><input value="${d.note || ''}" id="dept-note-${d.id}" class="form-control form-control-sm"></td>
          <td>
            <button class="btn btn-sm btn-warning" onclick="updateDepartment(${d.id})">✏️</button>
            <button class="btn btn-sm btn-secondary" onclick="toggleDepartment(${d.id})">${d.isInactive ? '🔄 Kích hoạt' : '🔄 Tạm ngưng'}</button>
            <button class="btn btn-sm btn-danger" onclick="deleteDepartment(${d.id})">❌</button>
          </td>
        </tr>
      `).join('')
      : '<tr><td colspan="4" class="text-center text-muted">Không có dữ liệu phòng ban</td></tr>';

    $('#departmentTable').html(`
      <div class="table-responsive">
        <table class="table table-bordered table-striped align-middle">
          <thead><tr><th>Mã</th><th>Tên</th><th>Ghi chú</th><th>Thao tác</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `);

    const pagination = getPaginationFromResponse(res, currentDepartmentParams);
    currentDepartmentParams.page = pagination.page;
    currentDepartmentParams.limit = pagination.limit;
    renderDepartmentPagination(pagination);
  }).fail((xhr) => {
    showDepartmentAlert(xhr.responseJSON?.message || 'Lỗi khi tải danh sách phòng ban', 'danger');
    $('#departmentTable').html('<div class="text-center text-muted py-4">Không có dữ liệu</div>');
    $('#departmentPagination').empty();
  });
}

$('#createDepartmentForm').on('submit', function (e) {
  e.preventDefault();
  const formData = Object.fromEntries(new FormData(this));
  if (!formData.code || !formData.name) {
    showDepartmentAlert('Vui lòng nhập mã và tên phòng ban', 'danger');
    return;
  }

  $.post(APP_BASE_PATH + '/departments', formData, function (res) {
    showDepartmentAlert(res.message, 'success');
    reopenAfterSubmit = true;
    safeHideModal('#departmentModal');
    $('#createDepartmentForm')[0].reset();
    currentDepartmentParams.page = 1;
    loadDepartments(currentDepartmentParams);
  }).fail((xhr) => {
    showDepartmentAlert(xhr.responseJSON?.message || 'Lỗi khi thêm phòng ban', 'danger');
  });
});

function updateDepartment(id) {
  const data = {
    code: $(`#dept-code-${id}`).val(),
    name: $(`#dept-name-${id}`).val(),
    note: $(`#dept-note-${id}`).val()
  };

  if (!data.code || !data.name) {
    showDepartmentAlert('Thiếu dữ liệu mã và tên phòng ban', 'danger');
    return;
  }

  $.ajax({
    url: APP_BASE_PATH + `/departments/${id}/update`,
    type: 'PUT',
    data,
    success: (res) => {
      showDepartmentAlert(res.message, 'success');
      loadDepartments(currentDepartmentParams);
    },
    error: (xhr) => {
      showDepartmentAlert(xhr.responseJSON?.message || 'Lỗi khi cập nhật phòng ban', 'danger');
    }
  });
}

function toggleDepartment(id) {
  $.ajax({
    url: APP_BASE_PATH + `/departments/${id}/toggle`,
    type: 'PUT',
    success: (res) => {
      showDepartmentAlert(res.message, 'success');
      loadDepartments(currentDepartmentParams);
    },
    error: (xhr) => {
      showDepartmentAlert(xhr.responseJSON?.message || 'Lỗi khi cập nhật trạng thái', 'danger');
    }
  });
}

function deleteDepartment(id) {
  Swal.fire({
    title: 'Bạn có chắc?',
    text: 'Phòng ban này sẽ bị xóa vĩnh viễn!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Xóa',
    cancelButtonText: 'Hủy',
    confirmButtonColor: '#d33'
  }).then((result) => {
    if (!result.isConfirmed) return;

    $.ajax({
      url: APP_BASE_PATH + `/departments/${id}/delete`,
      type: 'DELETE',
      success: (res) => {
        showDepartmentAlert(res.message, 'success');
        loadDepartments(currentDepartmentParams);
      },
      error: (xhr) => {
        showDepartmentAlert(xhr.responseJSON?.message || 'Lỗi khi xóa phòng ban', 'danger');
      }
    });
  });
}

$('#filterDepartmentForm').on('submit', function (e) {
  e.preventDefault();
  currentDepartmentParams = {
    ...Object.fromEntries(new FormData(this)),
    page: 1,
    limit: 10
  };
  loadDepartments(currentDepartmentParams);
});

$('#resetDepartmentBtn').on('click', function () {
  $('#filterDepartmentForm')[0].reset();
  currentDepartmentParams = { page: 1, limit: 10 };
  loadDepartments(currentDepartmentParams);
});

$(document).ready(() => {
  loadDepartments(currentDepartmentParams);
});
