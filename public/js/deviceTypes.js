let currentDeviceTypeParams = { page: 1, limit: 10 };
let reopenAfterSubmit = false; // Mặc định không mở lại

function safeHideModal(modalSelector) {
  document.activeElement?.blur(); // Xóa focus
  $(modalSelector).modal('hide');

  setTimeout(() => {
    $('body').css('overflow', 'auto').removeClass('modal-open'); // ✅ Gỡ class modal-open
    $('.modal-backdrop').remove(); // ✅ Gỡ nền đen nếu bị dư

    // ✅ Nếu bật cờ mở lại
    if (reopenAfterSubmit) {
      reopenAfterSubmit = false; // reset lại
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
  setTimeout(() => { $('.alert').alert('close'); }, 5000);
}

function loadDeviceTypes(params = {}) {
  const query = $.param(params);
  $.get(`/device-types/ajax?${query}`, function (data) {
    const rows = Array.isArray(data.deviceTypes)
      ? data.deviceTypes.map((dt) => `
        <tr>
          <td><input value="${dt.code}" id="dtype-code-${dt.id}" class="form-control form-control-sm"></td>
          <td><input value="${dt.name}" id="dtype-name-${dt.id}" class="form-control form-control-sm" /></td>
          <td><input value="${dt.note}" id="dtype-code-${dt.id}" class="form-control form-control-sm"></td>
          <td>
            <button class="btn btn-sm btn-warning" onclick="updateDeviceType(${dt.id})">✏️</button>
            <button class="btn btn-sm btn-secondary" onclick="toggleDeviceType(${dt.id})">${dt.isInactive ? '🔄 Kích hoạt' : '🔄 Tạm ngưng'}</button>
            <button class="btn btn-sm btn-danger" onclick="deleteDeviceType(${dt.id})">❌</button>
          </td>
        </tr>
      `).join('')
      : '<tr><td colspan="2">Không có loại thiết bị</td></tr>';

    $('#deviceTypeTable').html(`
      <div class="table-responsive">
        <table class="table table-bordered table-striped">
          <thead><tr><th>Mã</th><th>Tên</th><th>Ghi chú</th><th>Thao tác</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `);

    const totalPages = Math.ceil(data.total / currentDeviceTypeParams.limit);
    const p = data.currentPage;
    $('#deviceTypePagination').html(`
      <div class="d-flex flex-wrap justify-content-center gap-2">
        <button class="btn btn-sm btn-outline-primary" ${p===1 ? 'disabled' : ''} onclick="loadDeviceTypes({ ...currentDeviceTypeParams, page: 1 })">⏮</button>
        <button class="btn btn-sm btn-outline-primary" ${p===1 ? 'disabled' : ''} onclick="loadDeviceTypes({ ...currentDeviceTypeParams, page: ${p - 1} })">⏪</button>
        <span class="align-self-center">${p} / ${totalPages}</span>
        <button class="btn btn-sm btn-outline-primary" ${p===totalPages ? 'disabled' : ''} onclick="loadDeviceTypes({ ...currentDeviceTypeParams, page: ${p + 1} })">⏩</button>
        <button class="btn btn-sm btn-outline-primary" ${p===totalPages ? 'disabled' : ''} onclick="loadDeviceTypes({ ...currentDeviceTypeParams, page: ${totalPages} })">⏭</button>
      </div>
    `);

    currentDeviceTypeParams.page = p;
  });
}

$('#createDeviceTypeForm').on('submit', function (e) {
  e.preventDefault();
  const formData = Object.fromEntries(new FormData(this));
  if (!formData.name || formData.name.length > 100) {
    showDeviceTypeAlert('Tên loại thiết bị không được trống và tối đa 100 ký tự', 'danger');
    return;
  }

  $.post('/device-types', formData, function (res) {
    showDeviceTypeAlert(res.message, 'success');
    reopenAfterSubmit = true;
    safeHideModal('#deviceTypeModal');
    $('#createDeviceTypeForm')[0].reset();
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
  }
  if (!data.code || !data.name) {
    showDeviceTypeAlert('Tên loại thiết bị không được để trống', 'danger');
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
        showDeviceTypeAlert(xhr.responseJSON?.message || 'Lỗi khi xóa thiết bị', 'danger');
      }
    });
  });
}

// 🔄 Reset bộ lọc
$('#resetDeviceTypeBtn').on('click', function() {
  $('#filterDeviceTypeForm')[0].reset();
  currentDeviceTypeParams = { page: 1, limit: 10 };
  loadDeviceTypes(currentDeviceTypeParams);
});

// 🔍 Tìm kiếm
$('#filterDeviceTypeForm').on('submit', function(e) {
  e.preventDefault();
  currentDeviceTypeParams = Object.fromEntries(new FormData(this));
  currentDeviceTypeParams.page = 1;
  currentDeviceTypeParams.limit = 10;
  loadDeviceTypes(currentDeviceTypeParams);
});

// 🚀 Khởi động
$(document).ready(() => {
  loadDeviceTypes(currentDeviceTypeParams);
});