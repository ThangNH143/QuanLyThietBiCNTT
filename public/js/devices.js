let currentParams = { page: 1, limit: 10 };
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

function loadDeviceTypesSync() {
  return $.get('/device-types/ajax').then(data => {
    const dropdown = $('#deviceTypeDropdown');
    const modalDropdown = $('#modalDeviceType');
    const deviceTypes = Array.isArray(data) ? data : data.deviceTypes || [];

    dropdown.empty().append(`<option value="">-- Loại thiết bị --</option>`);
    modalDropdown.empty();

    deviceTypes.forEach(dt => {
      dropdown.append(`<option value="${dt.id}">${dt.name}</option>`);
      modalDropdown.append(`<option value="${dt.id}">${dt.name}</option>`);
    });

    dropdown.select2({ width: '100%', placeholder: 'Chọn loại thiết bị', allowClear: true });
    modalDropdown.select2({ dropdownParent: $('#deviceModal'), width: '100%' });

    return deviceTypes; // ✅ trả về mảng đã load
  });
}

function showDeviceAlert(message, type = 'success') {
  const alertHtml = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      <strong>Lưu ý:</strong> ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
  $('#deviceAlertContainer').html(alertHtml);

  // 🕒 Tự động ẩn sau 5 giây
  setTimeout(() => {
    $('.alert').alert('close');
  }, 5000);
}

// 🔧 Load loại thiết bị cho dropdown lọc và modal
function loadDeviceTypes() {
  $.get('/device-types/ajax', function(data) {
    const dropdown = $('#deviceTypeDropdown');
    const modalDropdown = $('#modalDeviceType');

    dropdown.empty().append(`<option value="">-- Loại thiết bị --</option>`);
    modalDropdown.empty();

    const deviceTypes = Array.isArray(data) ? data : data.deviceTypes || [];

    deviceTypes.forEach(dt => {
      dropdown.append(`<option value="${dt.id}">${dt.name}</option>`);
      modalDropdown.append(`<option value="${dt.id}">${dt.name}</option>`);
    });

    // Nếu muốn dùng Select2 như các module khác:
    $('#deviceTypeDropdown')
      .select2({ width: '100%', placeholder: 'Chọn loại thiết bị', allowClear: true })
      .trigger('change');

    modalDropdown.select2({ dropdownParent: $('#deviceModal'), width: '100%' });
  });
}

// 📋 Load danh sách thiết bị
function loadDevices(params = {}) {
  loadDeviceTypesSync().then(deviceTypes => {
    const query = $.param(params);
    $.get(`/devices/ajax?${query}`, function(data) {
      const rows = data.devices.map(d => `
        <tr>
          <td><input value="${d.code}" id="code-${d.id}" class="form-control form-control-sm"></td>
          <td><input value="${d.name}" id="name-${d.id}" class="form-control form-control-sm"></td>
          <td>
            <select id="type-${d.id}" class="form-control form-control-sm">
              ${deviceTypes.map(dt => {
                const selected = dt.id == d.deviceTypeId ? 'selected' : '';
                return `<option value="${dt.id}" ${selected}>${dt.name}</option>`;
              }).join('')}
            </select>
          </td>
          <td><input type="date" value="${d.purchaseDate?.split('T')[0]}" id="date-${d.id}" class="form-control form-control-sm"></td>
          <td><input value="${d.note || ''}" id="note-${d.id}" class="form-control form-control-sm"></td>
          <td>
            <button class="btn btn-sm btn-warning" onclick="updateDevice(${d.id})">✏️</button>
            <button class="btn btn-sm btn-secondary" onclick="toggleDevice(${d.id})">${d.isInactive ? '🔄 Kích hoạt' : '🔄 Tạm ngưng'}</button>
            <button class="btn btn-sm btn-danger" onclick="deleteDevice(${d.id})">❌</button>
          </td>
        </tr>
      `).join('');

      $('#deviceTable').html(`
        <table class="table table-bordered table-striped">
          <thead><tr><th>Mã</th><th>Tên</th><th>Loại</th><th>Ngày mua</th><th>Ghi chú</th><th>Thao tác</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      `);

      const totalPages = Math.ceil(data.total / currentParams.limit);
      const p = data.currentPage;
      $('#pagination').html(`
        <button class="btn btn-sm btn-outline-primary me-2" ${p === 1 ? 'disabled' : ''} onclick="loadDevices({ ...currentParams, page: 1 })">⏮</button>
        <button class="btn btn-sm btn-outline-primary me-2" ${p === 1 ? 'disabled' : ''} onclick="loadDevices({ ...currentParams, page: ${p - 1} })">⏪</button>
        <span>${p} / ${totalPages}</span>
        <button class="btn btn-sm btn-outline-primary ms-2" ${p === totalPages ? 'disabled' : ''} onclick="loadDevices({ ...currentParams, page: ${p + 1} })">⏩</button>
        <button class="btn btn-sm btn-outline-primary ms-2" ${p === totalPages ? 'disabled' : ''} onclick="loadDevices({ ...currentParams, page: ${totalPages} })">⏭</button>
      `);
      currentParams.page = p;
    });
  });
}

// ➕ Thêm thiết bị
$('#createDeviceForm').on('submit', function(e) {
  e.preventDefault();
  const formData = Object.fromEntries(new FormData(this));
  if (!formData.code || !formData.name || !formData.deviceTypeId || !formData.purchaseDate) {
    showDeviceAlert('Vui lòng điền đầy đủ thông tin', 'danger');
    return;
  }
  $.post('/devices', formData, function(res) {
    showDeviceAlert(res.message, 'success');
    reopenAfterSubmit = true;
    safeHideModal('#deviceModal');
    $('#createDeviceForm')[0].reset();
    loadDevices(currentParams);
  }).fail((xhr) => {
  showDeviceAlert(xhr.responseJSON?.message || 'Lỗi khi thêm thiết bị', 'danger');
  });
});

// ✏️ Sửa thiết bị
function updateDevice(id) {
  const data = {
    code: $(`#code-${id}`).val(),
    name: $(`#name-${id}`).val(),
    deviceTypeId: $(`#type-${id}`).val(),
    purchaseDate: $(`#date-${id}`).val(),
    note: $(`#note-${id}`).val()
  };
  if (!data.code || !data.name || !data.deviceTypeId || !data.purchaseDate) {
    showDeviceAlert('Vui lòng điền đầy đủ thông tin', 'danger');
    return;
  }
  $.ajax({
    url: `/devices/${id}/update`,
    type: 'PUT',
    data,
    success: (res) => {
      showDeviceAlert(res.message, 'success');
      loadDevices(currentParams);
    },
    error: (xhr) => {
    showDeviceAlert(xhr.responseJSON?.message || 'Lỗi khi cập nhật thiết bị', 'danger');
    }
  });
}

// 🔄 Tạm ngưng / kích hoạt
function toggleDevice(id) {
  $.ajax({
    url: `/devices/${id}/toggle`,
    type: 'PUT',
    success: (res) => {
      showDeviceAlert(res.message, 'success');
      loadDevices(currentParams);
    },
    error: (xhr) => {
    showDeviceAlert(xhr.responseJSON?.message || 'Lỗi khi tạm ngưng thiết bị', 'danger');
    }
  });
}

// ❌ Xóa thiết bị
function deleteDevice(id) {
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
    url: `/devices/${id}/delete`,
    type: 'DELETE',
    success: (res) => {
      showDeviceAlert(res.message, 'success');
      loadDevices(currentParams);
    },
    error: (xhr) => {
      showDeviceAlert(xhr.responseJSON?.message || 'Lỗi khi xóa thiết bị', 'danger');
      }
    });
  });
}

// 🔄 Reset bộ lọc
$('#resetBtn').on('click', function() {
  $('#filterForm')[0].reset();
  currentParams = { page: 1, limit: 10 };
  loadDevices(currentParams);
});

// 🔍 Tìm kiếm
$('#filterForm').on('submit', function(e) {
  e.preventDefault();
  currentParams = Object.fromEntries(new FormData(this));
  currentParams.page = 1;
  currentParams.limit = 10;
  loadDevices(currentParams);
});

// 🚀 Khởi động
$(document).ready(() => {
  loadDevices(currentParams);
});
