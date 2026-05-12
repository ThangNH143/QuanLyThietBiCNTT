let currentParams = { page: 1, limit: 10 };
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

function showDeviceAlert(message, type = 'success') {
  const alertHtml = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      <strong>Lưu ý:</strong> ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
  $('#deviceAlertContainer').html(alertHtml);
  setTimeout(() => $('.alert').alert('close'), 5000);
}

function changeDevicePage(page) {
  const targetPage = Number(page);
  if (!targetPage || targetPage < 1) return;
  currentParams.page = targetPage;
  loadDevices(currentParams);
}

function renderDevicePagination(pagination) {
  window.AppPagination.render({
    containerSelector: '#pagination',
    pagination,
    windowSize: 10,
    onPageChange: changeDevicePage
  });
}

function loadDeviceTypesSync() {
  return $.get('/device-types/ajax', { page: 1, limit: 1000, filter: 'active' }).then(data => {
    const dropdown = $('#deviceTypeDropdown');
    const modalDropdown = $('#modalDeviceType');
    const deviceTypes = getListFromResponse(data, 'deviceTypes');

    dropdown.empty().append(`<option value="">-- Loại thiết bị --</option>`);
    modalDropdown.empty();

    deviceTypes.forEach(dt => {
      dropdown.append(`<option value="${dt.id}">${dt.name}</option>`);
      modalDropdown.append(`<option value="${dt.id}">${dt.name}</option>`);
    });

    dropdown.select2({ width: '100%', placeholder: 'Chọn loại thiết bị', allowClear: true });
    modalDropdown.select2({ dropdownParent: $('#deviceModal'), width: '100%' });

    return deviceTypes;
  });
}

function loadDeviceTypes() {
  $.get('/device-types/ajax', { page: 1, limit: 1000, filter: 'active' }, function(data) {
    const dropdown = $('#deviceTypeDropdown');
    const modalDropdown = $('#modalDeviceType');
    const deviceTypes = getListFromResponse(data, 'deviceTypes');

    dropdown.empty().append(`<option value="">-- Loại thiết bị --</option>`);
    modalDropdown.empty();

    deviceTypes.forEach(dt => {
      dropdown.append(`<option value="${dt.id}">${dt.name}</option>`);
      modalDropdown.append(`<option value="${dt.id}">${dt.name}</option>`);
    });

    $('#deviceTypeDropdown')
      .select2({ width: '100%', placeholder: 'Chọn loại thiết bị', allowClear: true })
      .trigger('change');

    modalDropdown.select2({ dropdownParent: $('#deviceModal'), width: '100%' });
  });
}

function loadDevices(params = {}) {
  currentParams = {
    ...currentParams,
    ...params,
    page: parseInt(params.page ?? currentParams.page, 10) || 1,
    limit: parseInt(params.limit ?? currentParams.limit, 10) || 10
  };

  loadDeviceTypesSync().then(deviceTypes => {
    $.get('/devices/ajax', currentParams, function(res) {
      const devices = getListFromResponse(res, 'devices');
      const rows = devices.length
        ? devices.map(d => `
          <tr>
            <td><input value="${d.code || ''}" id="code-${d.id}" class="form-control form-control-sm"></td>
            <td><input value="${d.name || ''}" id="name-${d.id}" class="form-control form-control-sm"></td>
            <td>
              <select id="type-${d.id}" class="form-control form-control-sm">
                ${deviceTypes.map(dt => {
                  const selected = dt.id == d.deviceTypeId ? 'selected' : '';
                  return `<option value="${dt.id}" ${selected}>${dt.name}</option>`;
                }).join('')}
              </select>
            </td>
            <td><input type="date" value="${d.purchaseDate?.split('T')[0] || ''}" id="date-${d.id}" class="form-control form-control-sm"></td>
            <td><input value="${d.note || ''}" id="note-${d.id}" class="form-control form-control-sm"></td>
            <td>
              <button class="btn btn-sm btn-warning" onclick="updateDevice(${d.id})">✏️</button>
              <button class="btn btn-sm btn-secondary" onclick="toggleDevice(${d.id})">${d.isInactive ? '🔄 Kích hoạt' : '🔄 Tạm ngưng'}</button>
              <button class="btn btn-sm btn-danger" onclick="deleteDevice(${d.id})">❌</button>
            </td>
          </tr>
        `).join('')
        : '<tr><td colspan="6" class="text-center text-muted">Không có dữ liệu</td></tr>';

      $('#deviceTable').html(`
        <div class="table-responsive">
          <table class="table table-bordered table-striped align-middle">
            <thead><tr><th>Mã</th><th>Tên</th><th>Loại</th><th>Ngày mua</th><th>Ghi chú</th><th>Thao tác</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `);

      const pagination = getPaginationFromResponse(res, currentParams);
      currentParams.page = pagination.page;
      currentParams.limit = pagination.limit;
      renderDevicePagination(pagination);
    }).fail((xhr) => {
      showDeviceAlert(xhr.responseJSON?.message || 'Lỗi khi tải danh sách thiết bị', 'danger');
      $('#deviceTable').html('<div class="text-center text-muted py-4">Không có dữ liệu</div>');
      $('#pagination').empty();
    });
  });
}

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
    currentParams.page = 1;
    loadDevices(currentParams);
  }).fail((xhr) => {
    showDeviceAlert(xhr.responseJSON?.message || 'Lỗi khi thêm thiết bị', 'danger');
  });
});

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

function deleteDevice(id) {
  Swal.fire({
    title: 'Bạn có chắc?',
    text: 'Thiết bị này sẽ bị xóa vĩnh viễn!',
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

$('#resetBtn').on('click', function() {
  $('#filterForm')[0].reset();
  currentParams = { page: 1, limit: 10 };
  loadDevices(currentParams);
});

$('#filterForm').on('submit', function(e) {
  e.preventDefault();
  currentParams = {
    ...Object.fromEntries(new FormData(this)),
    page: 1,
    limit: 10
  };
  loadDevices(currentParams);
});

$(document).ready(() => {
  loadDevices(currentParams);
});
