let currentHardwareUnitParams = { page: 1, limit: 10 };
let hardwareOptions = []; // Giữ danh sách phần cứng
let reopenAfterSubmit = false; // Mặc định không mở lại

// =========================
// Pagination helpers dùng chung
// =========================

function changeHardwareUnitPage(page) {
  const targetPage = Number(page);
  if (!targetPage || targetPage < 1) return;
  loadHardwareUnits({ page: targetPage });
}

function renderHardwareUnitPagination(pagination) {
  window.AppPagination.render({
    containerSelector: '#hardwareUnitPagination',
    pagination,
    windowSize: 10,
    onPageChange: changeHardwareUnitPage
  });
}

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

function loadHardwaresSync() {
  return $.get('/hardwares/ajax?page=1&limit=100');
}

// ✅ Thông báo
function showHardwareUnitAlert(message, type = 'success') {
  $('#hardwareUnitAlertContainer').html(`
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      <strong>Lưu ý:</strong> ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `);
  setTimeout(() => $('.alert').alert('close'), 5000);
}

// 📥 Load dropdown phần cứng cho modal thêm
function loadHardwareDropdown() {
  $.get('/hardwares/ajax?page=1&limit=100', function (data) {
    hardwareOptions = getListFromResponse(data, 'hardwares'); // ✅ Lưu danh sách để dùng cho dropdown từng dòng

    // Modal
    const modalDropdown = $('#modalHardwareDropdown');
    modalDropdown.empty().append(`<option value="">-- Chọn phần cứng --</option>`);
    hardwareOptions.forEach(hw => {
      modalDropdown.append(`<option value="${hw.id}">${hw.name}</option>`);
    });
    modalDropdown.select2({
      dropdownParent: $('#hardwareUnitModal'),
      width: '100%',
      placeholder: 'Tìm phần cứng...',
      allowClear: true
    });

    // Bộ lọc
    const filterDropdown = $('#filterHardwareDropdown');
    filterDropdown.empty().append(`<option value="">-- Tất cả phần cứng --</option>`);
    hardwareOptions.forEach(hw => {
      // Backend lọc theo hardwareName (LIKE) nên value = hw.name
      filterDropdown.append(`<option value="${hw.name}">${hw.name}</option>`);
    });
    filterDropdown.select2({
      width: '100%',
      allowClear: true,
      placeholder: 'Tìm phần cứng...'
    });

    // Giữ lại giá trị lọc hiện tại khi reload
    if (currentHardwareUnitParams.hardwareName) {
      filterDropdown.val(currentHardwareUnitParams.hardwareName).trigger('change');
    }
  });
}

// 📋 Load danh sách thiết bị phần cứng
function loadHardwareUnits(params = {}) {
  // Merge params -> đảm bảo các thao tác (tìm/reset/thêm/sửa/xóa/chuyển trang)
  // luôn giữ đúng bộ lọc hiện tại.
  currentHardwareUnitParams = {
    ...currentHardwareUnitParams,
    ...params,
    page: parseInt(params.page ?? currentHardwareUnitParams.page, 10) || 1,
    limit: parseInt(params.limit ?? currentHardwareUnitParams.limit, 10) || 10
  };

  loadHardwaresSync().then((data) => {
    hardwareOptions = getListFromResponse(data, 'hardwares');

    // ✅ Render dropdown modal
    const modalDropdown = $('#modalHardwareDropdown');
    modalDropdown.empty().append(`<option value="">-- Chọn phần cứng --</option>`);
    hardwareOptions.forEach(hw => {
      modalDropdown.append(`<option value="${hw.id}">${hw.name}</option>`);
    });
    modalDropdown.select2({
      dropdownParent: $('#hardwareUnitModal'),
      width: '100%',
      placeholder: 'Tìm phần cứng...',
      allowClear: true
    });

    // ✅ Render dropdown lọc
    const filterDropdown = $('#filterHardwareDropdown');
    filterDropdown.empty().append(`<option value="">-- Tất cả phần cứng --</option>`);
    hardwareOptions.forEach(hw => {
      // Backend lọc theo hardwareName (LIKE) nên value = hw.name
      filterDropdown.append(`<option value="${hw.name}">${hw.name}</option>`);
    });
    filterDropdown.select2({
      width: '100%',
      placeholder: 'Tìm phần cứng...',
      allowClear: true
    });

    // Giữ lại giá trị lọc hiện tại khi reload
    if (currentHardwareUnitParams.hardwareName) {
      filterDropdown.val(currentHardwareUnitParams.hardwareName).trigger('change');
    } else {
      filterDropdown.val('').trigger('change');
    }

    // ✅ Sau khi dropdown đã có → gọi dữ liệu bảng
    $.get(`/hardware-units/ajax?${$.param(currentHardwareUnitParams)}`, function (data) {
      const units = getListFromResponse(data, 'units');
      const rows = units.length
        ? units.map(unit => `
          <tr>
            <td><input value="${unit.code}" id="unit-code-${unit.id}" class="form-control form-control-sm"></td>
            <td><input value="${unit.serialNumber}" id="unit-serial-${unit.id}" class="form-control form-control-sm"></td>
            <td>
              <select class="form-select form-select-sm unit-hardware-dropdown" id="unit-hardware-${unit.id}">
                ${hardwareOptions.map(hw => `
                  <option value="${hw.id}" ${hw.id === unit.hardwareId ? 'selected' : ''}>${hw.name}</option>
                `).join('')}
              </select>
            </td>
            <td><input type="date" value="${unit.purchaseDate?.split('T')[0]}" id="unit-date-${unit.id}" class="form-control form-control-sm"></td>
            <td><input value="${unit.note || ''}" id="unit-note-${unit.id}" class="form-control form-control-sm"></td>
            <td>
              <button class="btn btn-sm btn-warning" onclick="updateHardwareUnit(${unit.id})">✏️</button>
              <button class="btn btn-sm btn-secondary" onclick="toggleHardwareUnit(${unit.id})">${unit.isInactive ? '🔄 Kích hoạt' : '🔄 Tạm ngưng'}</button>
              <button class="btn btn-sm btn-danger" onclick="deleteHardwareUnit(${unit.id})">❌</button>
            </td>
          </tr>
        `).join('')
        : '<tr><td colspan="6">Không có thiết bị</td></tr>';

      $('#hardwareUnitTable').html(`
        <div class="table-responsive">
          <table class="table table-bordered table-striped">
            <thead><tr><th>Mã</th><th>Serial</th><th>Phần cứng</th><th>Ngày mua</th><th>Ghi chú</th><th>Thao tác</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `);

      $('.unit-hardware-dropdown').select2({
        width: '100%',
        placeholder: 'Tìm phần cứng...',
        allowClear: true
      });

      const pagination = getPaginationFromResponse(data, currentHardwareUnitParams);
      currentHardwareUnitParams.page = pagination.page;
      renderHardwareUnitPagination(pagination);
    });
  });
}

// ➕ Thêm mới
$('#createHardwareUnitForm').on('submit', function (e) {
  e.preventDefault();
  const formData = Object.fromEntries(new FormData(this));

  if (!formData.code || !formData.serialNumber || !formData.hardwareId || !formData.purchaseDate) {
    showHardwareUnitAlert('Vui lòng điền đầy đủ thông tin', 'danger');
    return;
  }

  $.post('/hardware-units', formData, function (res) {
    showHardwareUnitAlert(res.message, 'success');
    reopenAfterSubmit = true;
    safeHideModal('#hardwareUnitModal');
    $('#createHardwareUnitForm')[0].reset();
    loadHardwareUnits(currentHardwareUnitParams);
  }).fail((xhr) => {
    showHardwareUnitAlert(xhr.responseJSON?.message || 'Lỗi khi thêm thiết bị phần cứng', 'danger');
  });
});

// ✏️ Cập nhật
function updateHardwareUnit(id) {
  const data = {
    code: $(`#unit-code-${id}`).val(),
    serialNumber: $(`#unit-serial-${id}`).val(),
    hardwareId: $(`#unit-hardware-${id}`).val(),
    purchaseDate: $(`#unit-date-${id}`).val(),
    note: $(`#unit-note-${id}`).val()
  };

  if (!data.code || !data.serialNumber || !data.hardwareId || !data.purchaseDate) {
    showHardwareUnitAlert('Vui lòng nhập đầy đủ thông tin khi sửa', 'danger');
    return;
  }

  $.ajax({
    url: `/hardware-units/${id}/update`,
    type: 'PUT',
    data,
    success: (res) => {
      showHardwareUnitAlert(res.message, 'success');
      loadHardwareUnits(currentHardwareUnitParams);
    },
    error: (xhr) => {
      showHardwareUnitAlert(xhr.responseJSON?.message || 'Lỗi khi cập nhật', 'danger');
    }
  });
}

// 🔄 Tạm ngưng / kích hoạt
function toggleHardwareUnit(id) {
  $.ajax({
    url: `/hardware-units/${id}/toggle`,
    type: 'PUT',
    success: (res) => {
      showHardwareUnitAlert(res.message, 'success');
      loadHardwareUnits(currentHardwareUnitParams);
    },
    error: (xhr) => {
      showHardwareUnitAlert(xhr.responseJSON?.message || 'Lỗi khi thay đổi trạng thái', 'danger');
    }
  });
}

// ❌ Xóa thiết bị phần cứng
function deleteHardwareUnit(id) {
  Swal.fire({
    title: 'Bạn có chắc?',
    text: 'Thiết bị phần cứng này sẽ bị xóa vĩnh viễn!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Xóa',
    cancelButtonText: 'Hủy',
    confirmButtonColor: '#d33'
  }).then((result) => {
    if (!result.isConfirmed) return;

    $.ajax({
      url: `/hardware-units/${id}/delete`,
      type: 'DELETE',
      success: (res) => {
        showHardwareUnitAlert(res.message, 'success');
        loadHardwareUnits(currentHardwareUnitParams);
      },
      error: (xhr) => {
        showHardwareUnitAlert(xhr.responseJSON?.message || 'Lỗi khi xóa thiết bị phần cứng', 'danger');
      }
    });
  });
}

// 🔄 Reset lọc
$('#resetHardwareUnitBtn').on('click', function () {
  $('#filterHardwareUnitForm')[0].reset();
  currentHardwareUnitParams = { page: 1, limit: 10 };
  // Reset select2 dropdown filter
  $('#filterHardwareDropdown').val('').trigger('change');
  loadHardwareUnits(currentHardwareUnitParams);
});

// 🔍 Tìm kiếm
$('#filterHardwareUnitForm').on('submit', function (e) {
  e.preventDefault();
  currentHardwareUnitParams = Object.fromEntries(new FormData(this));
  currentHardwareUnitParams.page = 1;
  currentHardwareUnitParams.limit = 10;
  loadHardwareUnits(currentHardwareUnitParams);
});

// 🚀 Khởi động
$(document).ready(() => {
  loadHardwareUnits(currentHardwareUnitParams);
});
