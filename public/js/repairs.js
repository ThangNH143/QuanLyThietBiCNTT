const REPAIR_STATUS = ['opened', 'in-progress', 'completed', 'canceled'];

// State dùng để giữ bộ lọc + trang hiện tại (giống assignments)
let currentRepairParams = {
  page: 1,
  limit: 10,
  deviceKeyword: '',
  hardwareKeyword: '',
  status: 'opened'
};

function toggleModal(modalSelector, action = 'open') {
  document.activeElement?.blur();
  if (action === 'open') {
    $(modalSelector).modal('show');
  } else {
    $(modalSelector).modal('hide');
    setTimeout(() => {
      $('body').css('overflow', 'auto').removeClass('modal-open');
      $('.modal-backdrop').remove();
    }, 500);
  }
}

function showRepairAlert(message, type = 'success') {
  const alertHtml = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      <strong>Lưu ý:</strong> ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
  $('#repairAlertContainer').html(alertHtml);
  setTimeout(() => $('.alert').alert('close'), 5000);
}

function matchByText(params, data) {
  if ($.trim(params.term) === '') return data;
  if (typeof data.text === 'undefined') return null;
  const term = params.term.toLowerCase();
  const text = data.text.toLowerCase();
  return text.includes(term) ? data : null;
}

// 🔧 Load dropdown cho modal tạo
function loadCreateDropdowns() {
  const deviceDropdown = $('#createRepairDeviceDropdown').empty();
  const hwDropdown = $('#createRepairHardwareDropdown').empty();
  const receiverDropdown = $('#createRepairReceiverDropdown').empty();

  $.get('/repairs/dropdown/devices', function (data) {
    (data.devices || []).forEach(d => {
      const label = `${d.code} - ${d.name} (${d.deviceType})`;
      deviceDropdown.append(`<option value="${d.id}">${label}</option>`);
    });
    deviceDropdown.select2({
      dropdownParent: '#repairCreateModal',
      width: '100%',
      placeholder: 'Chọn thiết bị...',
      allowClear: true,
      matcher: matchByText
    });

    // load phần cứng ngay nếu thiết bị có sẵn
    if (deviceDropdown.val()) {
      loadHardwareForCreate(deviceDropdown.val());
    }
  });

  deviceDropdown.on('change', function () {
    loadHardwareForCreate($(this).val());
  });

  $.get('/repairs/dropdown/users', function (data) {
    (data.users || []).forEach(u => {
      const label = `${u.code} - ${u.name} (${u.deptName || 'Không rõ'})`;
      receiverDropdown.append(`<option value="${u.id}">${label}</option>`);
    });
    receiverDropdown.select2({ dropdownParent: '#repairCreateModal', width: '100%', matcher: matchByText, placeholder: 'Chọn người nhận...' });
  });
}

function loadHardwareForCreate(deviceId) {
  const hwDropdown = $('#createRepairHardwareDropdown').empty();
  $.get(`/repairs/dropdown/hardware-units?deviceId=${deviceId}&currentRepairId=0`, function (data) {
    (data.units || []).forEach(hw => {
      const label = `${hw.code} - ${hw.hardwareName} - ${hw.serialNumber}`;
      const disabled = hw.isLocked ? 'disabled style="color:gray;" title="🔒 Đã ghi nhận sửa"' : '';
      hwDropdown.append(`<option value="${hw.id}" ${disabled}>${label}</option>`);
    });
    hwDropdown.select2({
      dropdownParent: '#repairCreateModal',
      width: '100%',
      multiple: true,
      placeholder: 'Chọn phần cứng chưa được sửa...',
      matcher: matchByText
    });
  });
}

// 🔧 Load dropdown cho modal sửa
function loadEditDropdowns(data) {
  const hwDropdown = $('#editRepairHardwareDropdown').empty();
  const receiverDropdown = $('#editRepairReceiverDropdown').empty();
  $.get(`/repairs/dropdown/hardware-units?deviceId=${data.deviceId}&currentRepairId=${data.id}`, function (res) {
    (res.units || []).forEach(hw => {
      const label = `${hw.code} - ${hw.hardwareName} - ${hw.serialNumber}`;
      const selected = hw.id === data.hardwareUnitId ? 'selected' : '';
      const disabled = hw.isLocked && hw.id !== data.hardwareUnitId
        ? 'disabled style="color:gray;" title="🔒 Đã ghi nhận sửa"'
        : '';
      hwDropdown.append(`<option value="${hw.id}" ${selected} ${disabled}>${label}</option>`);
    });
    hwDropdown.select2({
      dropdownParent: '#repairEditModal',
      width: '100%',
      multiple: false,
      placeholder: 'Chọn phần cứng...',
      matcher: matchByText
    });
  });

  $.get('/repairs/dropdown/users', function (dataUser) {
    (dataUser.users || []).forEach(u => {
      const label = `${u.code} - ${u.name} (${u.deptName || 'Không rõ'})`;
      $('#editRepairSenderText').val(data.userCreateName || '');
      receiverDropdown.append(`<option value="${u.id}">${label}</option>`);
    });
    receiverDropdown.select2({ dropdownParent: '#repairEditModal', width: '100%', matcher: matchByText, placeholder: 'Chọn người nhận...' });

    $('#editRepairSenderText').val(data.userCreateName || '').trigger('change');
    // Lưu ý: SP GetById có thể trả về receiverId hoặc userResolveId (tùy implementation)
    const receiverId = data.userResolveId ?? data.receiverId ?? null;
    receiverDropdown.val(receiverId).trigger('change');
  });
}

// ➕ Mở modal tạo
function openCreateRepairModal() {
  toggleModal('#repairCreateModal', 'open');
  $('#repairCreateModal').one('shown.bs.modal', function () {
    $('#createRepairForm')[0].reset();
    $('#createRepairHardwareDropdown').empty();
    $('#createRepairStatusDropdown').val('opened');
    loadCreateDropdowns();
  });
}

// ✏️ Mở modal sửa
async function openEditRepairModal(id) {
  toggleModal('#repairEditModal', 'open');
  $('#repairEditModal').one('shown.bs.modal', async function () {
    $('#editRepairForm')[0].reset();
    $('#editRepairHardwareDropdown').empty();

    // Clear select2 values (tránh giữ state cũ khi request lỗi)
    try {
      $('#editRepairReceiverDropdown').empty().trigger('change');
    } catch (_) {}

    let data;
    try {
      data = await $.get(`/repairs/${id}`);
    } catch (xhr) {
      const msg = xhr?.responseJSON?.message || xhr?.responseJSON?.error || 'Không thể tải dữ liệu phiếu sửa chữa';
      showRepairAlert(msg, 'danger');
      toggleModal('#repairEditModal', 'close');
      return;
    }
    $('#editRepairId').val(id);
    $('#editRepairDeviceId').val(data.deviceId);
    $('#editRepairDeviceInfo').val(`${data.deviceCode} - ${data.deviceName}`);
    $('#editRepairSenderText').val(data.userCreateName );
    $('#editRepairBrokenDate').val(data.brokenDate?.slice(0, 10));
    $('#editRepairRepairDate').val(data.repairDate ? data.repairDate.slice(0, 10) : '');
    $('#editRepairStatusDropdown').val(data.status);
    $('#editRepairNote').val(data.note || '');

    loadEditDropdowns(data);
  });
}

// ❌ Xóa phiếu sửa
function deleteRepair(id, status = null) {
  // Chặn xóa theo trạng thái (UI) để không tạo lỗi/500 không cần thiết
  if (status && status !== 'opened') {
    Swal.fire({
      icon: 'info',
      title: 'Không thể xóa',
      text: 'Chỉ được xóa phiếu ở trạng thái "Mới tiếp nhận".'
    });
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
      method: 'DELETE',
      success: () => {
        showRepairAlert('Đã xóa phiếu sửa chữa thành công', 'success');
        loadRepairs(currentRepairParams);
      },
      error: (xhr) => {
        const msg = xhr?.responseJSON?.message || xhr?.responseJSON?.error || 'Không thể xóa phiếu sửa chữa';
        showRepairAlert(msg, 'danger');
      }
    });
  });
}

// 📋 Load danh sách (có phân trang)
function loadRepairs(params = {}) {
  currentRepairParams = { ...currentRepairParams, ...params };

  $.get('/repairs/ajax', currentRepairParams, function (res) {
    const repairs = res.data || [];
    const tbody = $('#repairTableBody');
    tbody.empty();

    if (repairs.length === 0) {
      tbody.append('<tr><td colspan="11" class="text-center text-muted">Không có dữ liệu</td></tr>');
    } else {
      repairs.forEach((r, index) => {
        const rowNumber = (currentRepairParams.page - 1) * currentRepairParams.limit + index + 1;
        const row = `
          <tr>
            <td>${r.deviceCode} - ${r.deviceName}</td>
            <td>${r.deviceType || ''}</td>
            <td>${r.hardwareName || ''} (${r.serialNumber || ''})</td>
            <td>${r.deptName || ''}</td>
            <td>${r.senderName || ''}</td>
            <td>${r.brokenDate?.slice(0, 10) || ''}</td>
            <td>${r.receiverName || ''}</td>
            <td>${r.repairDate ? r.repairDate.slice(0, 10) : ''}</td>
            <td>${r.status || ''}</td>
            <td>${r.note || ''}</td>
            <td>
              <button class="btn btn-sm btn-warning me-1" onclick="openEditRepairModal(${r.id})">✏️</button>
              <button class="btn btn-sm btn-danger" onclick="deleteRepair(${r.id}, '${r.status || ''}')">❌</button>
            </td>
          </tr>
        `;
        tbody.append(row);
      });
    }

    renderRepairPagination(res.pagination);
  });
}

function changePage(page) {
  currentRepairParams.page = page;
  loadRepairs(currentRepairParams);
}

// Hiển thị thanh phân trang
function renderRepairPagination(pagination) {
  window.AppPagination.render({
    containerSelector: '#repairPagination',
    pagination,
    windowSize: 10,
    onPageChange: changePage
  });
}

// ✅ Submit tạo
$('#createRepairForm').on('submit', function (e) {
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
    alert('Vui lòng nhập đầy đủ thông tin bắt buộc.');
    return;
  }

  if (['completed', 'canceled'].includes(payload.status) && !payload.repairDate) {
    alert('Trạng thái đã hoàn tất hoặc hủy cần có ngày sửa.');
    return;
  }

  $.post('/repairs', payload, () => {
    toggleModal('#repairCreateModal', 'close');
    showRepairAlert('Đã tạo phiếu sửa chữa thành công');
    loadRepairs(currentRepairParams);
  });
});

// ✅ Submit sửa
$('#editRepairForm').on('submit', function (e) {
  e.preventDefault();
  const id = $('#editRepairId').val();

  const hwVal = $('#editRepairHardwareDropdown').val();
  const hardwareUnitId = Array.isArray(hwVal) ? (hwVal[0] || null) : (hwVal || null);

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

  if (!payload.brokenDate || !payload.status) {
    alert('Vui lòng nhập đầy đủ thông tin bắt buộc.');
    return;
  }

  if (['completed', 'canceled'].includes(payload.status) && !payload.repairDate) {
    alert('Trạng thái đã hoàn tất hoặc hủy cần có ngày sửa.');
    return;
  }

  $.ajax({
    url: `/repairs/${id}`,
    method: 'PUT',
    data: payload,
    success: () => {
      toggleModal('#repairEditModal', 'close');
      showRepairAlert('Đã cập nhật phiếu sửa chữa');
      loadRepairs(currentRepairParams);
    }
  });
});

// 🔍 Tìm kiếm theo bộ lọc
$('#filterRepairForm').on('submit', function (e) {
  e.preventDefault();
  const formData = Object.fromEntries(new FormData(this));
  currentRepairParams = {
    ...currentRepairParams,
    ...formData,
    page: 1
  };
  loadRepairs(currentRepairParams);
});

//Reset tìm kiếm
$('#btnResetRepairFilter').on('click', function () {
  currentRepairParams = { page: 1, limit: 10, deviceKeyword: '', hardwareKeyword: '', status: 'opened' };
  $('#filterRepairForm')[0].reset();
  loadRepairs(currentRepairParams);
});

// ➕ Mở modal tạo
$('#btnOpenCreateRepairModal').on('click', openCreateRepairModal);

// 🚀 Khởi động trang
$(document).ready(() => {
  loadRepairs(currentRepairParams);
});