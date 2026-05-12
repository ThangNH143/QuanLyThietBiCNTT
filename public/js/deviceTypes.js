let currentDeviceTypeParams = { page: 1, limit: 10 };
let reopenAfterSubmit = false;

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

function showDeviceTypeAlert(message, type = 'success') {
  const alertHtml = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      <strong>Lưu ý:</strong> ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
  $('#deviceTypeAlertContainer').html(alertHtml);
  setTimeout(() => $('.alert').alert('close'), 5000);
}

function changeDeviceTypePage(page) {
  const targetPage = Number(page);
  if (!targetPage || targetPage < 1) return;
  currentDeviceTypeParams.page = targetPage;
  loadDeviceTypes(currentDeviceTypeParams);
}

function renderDeviceTypePagination(pagination) {
  window.AppPagination.render({
    containerSelector: '#deviceTypePagination',
    pagination,
    windowSize: 10,
    onPageChange: changeDeviceTypePage
  });
}

function loadDeviceTypes(params = {}) {
  currentDeviceTypeParams = {
    ...currentDeviceTypeParams,
    ...params,
    page: parseInt(params.page ?? currentDeviceTypeParams.page, 10) || 1,
    limit: parseInt(params.limit ?? currentDeviceTypeParams.limit, 10) || 10
  };

  $.get('/device-types/ajax', currentDeviceTypeParams, function (res) {
    const deviceTypes = getListFromResponse(res, 'deviceTypes');
    const rows = deviceTypes.length
      ? deviceTypes.map((dt) => `
        <tr>
          <td><input value="${dt.code || ''}" id="dtype-code-${dt.id}" class="form-control form-control-sm"></td>
          <td><input value="${dt.name || ''}" id="dtype-name-${dt.id}" class="form-control form-control-sm" /></td>
          <td><input value="${dt.note || ''}" id="dtype-note-${dt.id}" class="form-control form-control-sm"></td>
          <td>
            <button class="btn btn-sm btn-warning" onclick="updateDeviceType(${dt.id})">✏️</button>
            <button class="btn btn-sm btn-secondary" onclick="toggleDeviceType(${dt.id})">${dt.isInactive ? '🔄 Kích hoạt' : '🔄 Tạm ngưng'}</button>
            <button class="btn btn-sm btn-danger" onclick="deleteDeviceType(${dt.id})">❌</button>
          </td>
        </tr>
      `).join('')
      : '<tr><td colspan="4" class="text-center text-muted">Không có loại thiết bị</td></tr>';

    $('#deviceTypeTable').html(`
      <div class="table-responsive">
        <table class="table table-bordered table-striped align-middle">
          <thead><tr><th>Mã</th><th>Tên</th><th>Ghi chú</th><th>Thao tác</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `);

    const pagination = getPaginationFromResponse(res, currentDeviceTypeParams);
    currentDeviceTypeParams.page = pagination.page;
    currentDeviceTypeParams.limit = pagination.limit;
    renderDeviceTypePagination(pagination);
  }).fail((xhr) => {
    showDeviceTypeAlert(xhr.responseJSON?.message || 'Lỗi khi tải danh sách loại thiết bị', 'danger');
    $('#deviceTypeTable').html('<div class="text-center text-muted py-4">Không có dữ liệu</div>');
    $('#deviceTypePagination').empty();
  });
}

$('#createDeviceTypeForm').on('submit', function (e) {
  e.preventDefault();
  const formData = Object.fromEntries(new FormData(this));
  if (!formData.code || !formData.name || formData.name.length > 100) {
    showDeviceTypeAlert('Mã và tên loại thiết bị là bắt buộc, tên tối đa 100 ký tự', 'danger');
    return;
  }

  $.post('/device-types', formData, function (res) {
    showDeviceTypeAlert(res.message, 'success');
    reopenAfterSubmit = true;
    safeHideModal('#deviceTypeModal');
    $('#createDeviceTypeForm')[0].reset();
    currentDeviceTypeParams.page = 1;
    loadDeviceTypes(currentDeviceTypeParams);
  }).fail((xhr) => {
    showDeviceTypeAlert(xhr.responseJSON?.message || 'Lỗi khi thêm loại thiết bị', 'danger');
  });
});

function updateDeviceType(id) {
  const data = {
    code: $(`#dtype-code-${id}`).val(),
    name: $(`#dtype-name-${id}`).val(),
    note: $(`#dtype-note-${id}`).val()
  };

  if (!data.code || !data.name) {
    showDeviceTypeAlert('Mã và tên loại thiết bị là bắt buộc', 'danger');
    return;
  }

  $.ajax({
    url: `/device-types/${id}/update`,
    type: 'PUT',
    data,
    success: (res) => {
      showDeviceTypeAlert(res.message, 'success');
      loadDeviceTypes(currentDeviceTypeParams);
    },
    error: (xhr) => {
      showDeviceTypeAlert(xhr.responseJSON?.message || 'Lỗi khi cập nhật', 'danger');
    }
  });
}

function toggleDeviceType(id) {
  $.ajax({
    url: `/device-types/${id}/toggle`,
    type: 'PUT',
    success: (res) => {
      showDeviceTypeAlert(res.message, 'success');
      loadDeviceTypes(currentDeviceTypeParams);
    },
    error: (xhr) => {
      showDeviceTypeAlert(xhr.responseJSON?.message || 'Lỗi khi thay đổi trạng thái', 'danger');
    }
  });
}

function deleteDeviceType(id) {
  Swal.fire({
    title: 'Bạn có chắc?',
    text: 'Loại thiết bị này sẽ bị xóa vĩnh viễn!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Xóa',
    cancelButtonText: 'Hủy',
    confirmButtonColor: '#d33'
  }).then((result) => {
    if (!result.isConfirmed) return;

    $.ajax({
      url: `/device-types/${id}/delete`,
      type: 'DELETE',
      success: (res) => {
        showDeviceTypeAlert(res.message, 'success');
        loadDeviceTypes(currentDeviceTypeParams);
      },
      error: (xhr) => {
        showDeviceTypeAlert(xhr.responseJSON?.message || 'Lỗi khi xóa loại thiết bị', 'danger');
      }
    });
  });
}

$('#resetDeviceTypeBtn').on('click', function () {
  $('#filterDeviceTypeForm')[0].reset();
  currentDeviceTypeParams = { page: 1, limit: 10 };
  loadDeviceTypes(currentDeviceTypeParams);
});

$('#filterDeviceTypeForm').on('submit', function (e) {
  e.preventDefault();
  currentDeviceTypeParams = {
    ...Object.fromEntries(new FormData(this)),
    page: 1,
    limit: 10
  };
  loadDeviceTypes(currentDeviceTypeParams);
});

$(document).ready(() => {
  loadDeviceTypes(currentDeviceTypeParams);
});
