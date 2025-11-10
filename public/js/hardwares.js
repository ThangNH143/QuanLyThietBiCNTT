let currentHardwareParams = { page: 1, limit: 10 };
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

function loadHardwareTypesSync() {
  return $.get('/hardware-types/ajax?page=1&limit=100');
}

// 🛎️ Thông báo alert Bootstrap
function showHardwareAlert(message, type = 'success') {
  $('#hardwareAlertContainer').html(`
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      <strong>Lưu ý:</strong> ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `);
  setTimeout(() => $('.alert').alert('close'), 5000);
}

// 🔧 Tải loại phần cứng cho dropdown
function loadHardwareTypes() {
  $.get('/hardware-types/ajax?page=1&limit=100', function(data) {
    const dropdown = $('#hardwareTypeDropdown');
    const modalDropdown = $('#modalHardwareType');
    dropdown.empty().append(`<option value="">-- Loại phần cứng --</option>`);
    modalDropdown.empty();
    data.hardwareTypes.forEach(ht => {
      dropdown.append(`<option value="${ht.id}">${ht.name}</option>`);
      modalDropdown.append(`<option value="${ht.id}">${ht.name}</option>`);
    });
  });
}

// 📋 Tải danh sách phần cứng
function loadHardwares(params = {}) {
  loadHardwareTypesSync().then((typeData) => {
    const dropdown = $('#hardwareTypeDropdown');
    const modalDropdown = $('#modalHardwareType');
    dropdown.empty().append(`<option value="">-- Loại phần cứng --</option>`);
    modalDropdown.empty();
    typeData.hardwareTypes.forEach(ht => {
      dropdown.append(`<option value="${ht.id}">${ht.name}</option>`);
      modalDropdown.append(`<option value="${ht.id}">${ht.name}</option>`);
    });
    const query = $.param(params);
    $.get(`/hardwares/ajax?${query}`, function(data) {
      const rows = Array.isArray(data.hardwares)
        ? data.hardwares.map(hw => `
          <tr>
            <td><input value="${hw.code}" id="code-${hw.id}" class="form-control form-control-sm" /></td>
            <td><input value="${hw.name}" id="name-${hw.id}" class="form-control form-control-sm" /></td>
            <td>
              <select id="type-${hw.id}" class="form-select form-select-sm">
                ${$('#hardwareTypeDropdown option').map((i, opt) => {
                  const selected = $(opt).val() == hw.hardwareTypeId ? 'selected' : '';
                  return `<option value="${$(opt).val()}" ${selected}>${$(opt).text()}</option>`;
                }).get().join('')}
              </select>
            </td>
            <td><input value="${hw.note || ''}" id="note-${hw.id}" class="form-control form-control-sm" /></td>
            <td>
              <button class="btn btn-sm btn-warning" onclick="updateHardware(${hw.id})">✏️</button>
              <button class="btn btn-sm btn-secondary" onclick="toggleHardware(${hw.id})">${hw.isInactive ? '🔄 Kích hoạt' : '🔄 Tạm ngưng'}</button>
              <button class="btn btn-sm btn-danger" onclick="deleteHardware(${hw.id})">❌</button>
            </td>
          </tr>
        `).join('')
        : '<tr><td colspan="6">Không có dữ liệu phần cứng</td></tr>';

      $('#hardwareTable').html(`
        <div class="table-responsive">
          <table class="table table-bordered table-striped">
            <thead><tr><th>Mã</th><th>Tên</th><th>Loại</th><th>Ghi chú</th><th>Thao tác</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `);

      const p = data.currentPage;
      const totalPages = Math.ceil(data.total / currentHardwareParams.limit);
      $('#hardwarePagination').html(`
        <div class="d-flex flex-wrap justify-content-center gap-2">
          <button class="btn btn-sm btn-outline-dark" ${p===1 ? 'disabled' : ''} onclick="loadHardwares({ ...currentHardwareParams, page: 1 })">⏮</button>
          <button class="btn btn-sm btn-outline-dark" ${p===1 ? 'disabled' : ''} onclick="loadHardwares({ ...currentHardwareParams, page: ${p - 1} })">⏪</button>
          <span class="align-self-center">${p} / ${totalPages}</span>
          <button class="btn btn-sm btn-outline-dark" ${p===totalPages ? 'disabled' : ''} onclick="loadHardwares({ ...currentHardwareParams, page: ${p + 1} })">⏩</button>
          <button class="btn btn-sm btn-outline-dark" ${p===totalPages ? 'disabled' : ''} onclick="loadHardwares({ ...currentHardwareParams, page: ${totalPages} })">⏭</button>
        </div>
      `);

      currentHardwareParams.page = p;
    });
  });
}

// ➕ Thêm phần cứng
$('#createHardwareForm').on('submit', function(e) {
  e.preventDefault();
  const formData = Object.fromEntries(new FormData(this));
  if (!formData.code || !formData.name || !formData.hardwareTypeId) {
    showHardwareAlert('Vui lòng nhập đầy đủ thông tin', 'danger');
    return;
  }

  $.post('/hardwares', formData, function(res) {
    showHardwareAlert(res.message, 'success');
    reopenAfterSubmit = true;
    safeHideModal('#hardwareModal');
    $('#createHardwareForm')[0].reset();
    loadHardwares(currentHardwareParams);
  }).fail((xhr) => {
    showHardwareAlert(xhr.responseJSON?.message || 'Lỗi khi thêm phần cứng', 'danger');
  });
});

// ✏️ Sửa phần cứng
function updateHardware(id) {
  const data = {
    code: $(`#code-${id}`).val(),
    name: $(`#name-${id}`).val(),
    hardwareTypeId: $(`#type-${id}`).val(),
    note: $(`#note-${id}`).val()
  };

  if (!data.code || !data.name || !data.hardwareTypeId) {
    showHardwareAlert('Vui lòng điền đầy đủ thông tin khi cập nhật', 'danger');
    return;
  }

  $.ajax({
    url: `/hardwares/${id}/update`,
    type: 'PUT',
    data,
    success: (res) => {
      showHardwareAlert(res.message, 'success');
      loadHardwares(currentHardwareParams);
    },
    error: (xhr) => {
      showHardwareAlert(xhr.responseJSON?.message || 'Lỗi khi cập nhật', 'danger');
    }
  });
}

// 🔄 Tạm ngưng / kích hoạt
function toggleHardware(id) {
  $.ajax({
    url: `/hardwares/${id}/toggle`,
    type: 'PUT',
    success: (res) => {
      showHardwareAlert(res.message, 'success');
      loadHardwares(currentHardwareParams);
    },
    error: (xhr) => {
      showHardwareAlert(xhr.responseJSON?.message || 'Lỗi khi cập nhật trạng thái', 'danger');
    }
  });
}

// ❌ Xóa phần cứng
function deleteHardware(id) {
  Swal.fire({
    title: 'Bạn có chắc?',
    text: 'Phần cứng này sẽ bị xóa vĩnh viễn!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Xóa',
    cancelButtonText: 'Hủy',
    confirmButtonColor: '#d33'
  }).then((result) => {
    if (!result.isConfirmed) return;

    $.ajax({
      url: `/hardwares/${id}/delete`,
      type: 'DELETE',
      success: (res) => {
        showHardwareAlert(res.message, 'success');
        loadHardwares(currentHardwareParams);
      },
      error: (xhr) => {
        showHardwareAlert(xhr.responseJSON?.message || 'Lỗi khi xóa phần cứng', 'danger');
      }
    });
  });
}

// 🔄 Reset
$('#resetHardwareBtn').on('click', function() {
  $('#filterHardwareForm')[0].reset();
  currentHardwareParams = { page: 1, limit: 10 };
  loadHardwares(currentHardwareParams);
});

// 🔍 Tìm kiếm
$('#filterHardwareForm').on('submit', function(e) {
  e.preventDefault();
  currentHardwareParams = Object.fromEntries(new FormData(this));
  currentHardwareParams.page = 1;
  currentHardwareParams.limit = 10;
  loadHardwares(currentHardwareParams);
});

// 🚀 Khởi động
$(document).ready(() => {
  loadHardwareTypes();
  loadHardwares(currentHardwareParams);
});