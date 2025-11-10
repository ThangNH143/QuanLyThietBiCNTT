let currentHardwareTypeParams = { page: 1, limit: 10 };
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

function showHardwareTypeAlert(message, type = 'success') {
  const alertHtml = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      <strong>Lưu ý:</strong> ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
  $('#hardwareTypeAlertContainer').html(alertHtml);
  setTimeout(() => $('.alert').alert('close'), 5000);
}

function loadHardwareTypes(params = {}) {
  const query = $.param(params);
  $.get(`/hardware-types/ajax?${query}`, function (data) {
    const rows = Array.isArray(data.hardwareTypes)
      ? data.hardwareTypes.map((ht) => `
        <tr>
          <td><input value="${ht.code}" id="ht-code-${ht.id}" class="form-control form-control-sm" /></td>
          <td><input value="${ht.name}" id="ht-name-${ht.id}" class="form-control form-control-sm" /></td>
          <td><input value="${ht.note || ''}" id="ht-note-${ht.id}" class="form-control form-control-sm" /></td>
          <td>
            <button class="btn btn-sm btn-warning" onclick="updateHardwareType(${ht.id})">✏️</button>
            <button class="btn btn-sm btn-secondary" onclick="toggleHardwareType(${ht.id})">${ht.isInactive ? '🔄 Kích hoạt' : '🔄 Tạm ngưng'}</button>
            <button class="btn btn-sm btn-danger" onclick="deleteHardwareType(${ht.id})">❌</button>
          </td>
        </tr>
      `).join('')
      : '<tr><td colspan="4">Không có dữ liệu</td></tr>';

    $('#hardwareTypeTable').html(`
      <div class="table-responsive">
        <table class="table table-bordered table-striped">
          <thead><tr><th>Mã</th><th>Tên</th><th>Ghi chú</th><th>Thao tác</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `);

    const totalPages = Math.ceil(data.total / currentHardwareTypeParams.limit);
    const p = data.currentPage;
    $('#hardwareTypePagination').html(`
      <div class="d-flex flex-wrap justify-content-center gap-2">
        <button class="btn btn-sm btn-outline-primary" ${p===1 ? 'disabled' : ''} onclick="loadHardwareTypes({ ...currentHardwareTypeParams, page: 1 })">⏮</button>
        <button class="btn btn-sm btn-outline-primary" ${p===1 ? 'disabled' : ''} onclick="loadHardwareTypes({ ...currentHardwareTypeParams, page: ${p - 1} })">⏪</button>
        <span class="align-self-center">${p} / ${totalPages}</span>
        <button class="btn btn-sm btn-outline-primary" ${p===totalPages ? 'disabled' : ''} onclick="loadHardwareTypes({ ...currentHardwareTypeParams, page: ${p + 1} })">⏩</button>
        <button class="btn btn-sm btn-outline-primary" ${p===totalPages ? 'disabled' : ''} onclick="loadHardwareTypes({ ...currentHardwareTypeParams, page: ${totalPages} })">⏭</button>
      </div>
    `);

    currentHardwareTypeParams.page = p;
  });
}

$('#createHardwareTypeForm').on('submit', function (e) {
  e.preventDefault();
  const formData = Object.fromEntries(new FormData(this));
  if (!formData.code || !formData.name) {
    showHardwareTypeAlert('Vui lòng nhập mã và tên phần cứng', 'danger');
    return;
  }

  $.post('/hardware-types', formData, function (res) {
    showHardwareTypeAlert(res.message, 'success');
    reopenAfterSubmit = true;
    safeHideModal('#hardwareTypeModal');
    $('#createHardwareTypeForm')[0].reset();
    loadHardwareTypes(currentHardwareTypeParams);
  }).fail((xhr) => {
    showHardwareTypeAlert(xhr.responseJSON?.message || 'Lỗi khi thêm phần cứng', 'danger');
  });
});

function updateHardwareType(id) {
  const data = {
    code: $(`#ht-code-${id}`).val(),
    name: $(`#ht-name-${id}`).val(),
    note: $(`#ht-note-${id}`).val()
  };

  if (!data.code || !data.name) {
    showHardwareTypeAlert('Mã và tên phần cứng là bắt buộc', 'danger');
    return;
  }

  $.ajax({
    url: `/hardware-types/${id}/update`,
    type: 'PUT',
    data,
    success: (res) => {
      showHardwareTypeAlert(res.message, 'success');
      loadHardwareTypes(currentHardwareTypeParams);
    },
    error: (xhr) => {
      showHardwareTypeAlert(xhr.responseJSON?.message || 'Lỗi khi cập nhật', 'danger');
    }
  });
}

function toggleHardwareType(id) {
  $.ajax({
    url: `/hardware-types/${id}/toggle`,
    type: 'PUT',
    success: (res) => {
      showHardwareTypeAlert(res.message, 'success');
      loadHardwareTypes(currentHardwareTypeParams);
    },
    error: (xhr) => {
      showHardwareTypeAlert(xhr.responseJSON?.message || 'Lỗi khi thay đổi trạng thái', 'danger');
    }
  });
}

function deleteHardwareType(id) {
  Swal.fire({
    title: 'Bạn có chắc?',
    text: 'Loại phần cứng này sẽ bị xóa vĩnh viễn!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Xóa',
    cancelButtonText: 'Hủy',
    confirmButtonColor: '#d33'
  }).then((result) => {
    if (!result.isConfirmed) return;

    $.ajax({
      url: `/hardware-types/${id}/delete`,
      type: 'DELETE',
      success: (res) => {
        showHardwareTypeAlert(res.message, 'success');
        loadHardwareTypes(currentHardwareTypeParams);
        },
      error: (xhr) => {
        showHardwareTypeAlert(xhr.responseJSON?.message || 'Lỗi khi xóa thiết bị', 'danger');
      }
    });
  });
}

// 🔄 Reset bộ lọc
$('#resetHardwareTypeBtn').on('click', function() {
  $('#filterHardwareTypeForm')[0].reset();
  currentHardwareTypeParams = { page: 1, limit: 10 };
  loadHardwareTypes(currentHardwareTypeParams);
});

// 🔍 Tìm kiếm
$('#filterHardwareTypeForm').on('submit', function(e) {
  e.preventDefault();
  currentHardwareTypeParams = Object.fromEntries(new FormData(this));
  currentHardwareTypeParams.page = 1;
  currentHardwareTypeParams.limit = 10;
  loadHardwareTypes(currentHardwareTypeParams);
});

// 🚀 Khởi động
$(document).ready(() => {
  loadHardwareTypes(currentHardwareTypeParams);
});