$(document).ready(function() {
  loadDeviceAssignments();
  initSelect2();
  loadDepartments();
});

function initSelect2() {
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

function toggleModal(modalSelector, action = 'open') {
  document.activeElement?.blur(); // ✅ Gỡ focus trước khi thao tác

  if (action === 'open') {
    $(modalSelector).modal('show');
  } else if (action === 'close') {
    $(modalSelector).modal('hide');
    setTimeout(() => {
      $('body').css('overflow', 'auto').removeClass('modal-open');
      $('.modal-backdrop').remove();
    }, 500);
  }
}

let departmentsLoaded = false;

function loadDepartments() {
  // Nếu đã nạp rồi thì trả về Promise thành công luôn
  if (departmentsLoaded) return Promise.resolve();
  // Sử dụng đúng route bạn đã định nghĩa trong file assignment.js (route)
  return $.get('/assignments/departments/ajax', function (data) {
    const createDropdown = $('#createDeptDropdown');
    const editDropdown = $('#editDeptDropdown');
    const options = (data || []).map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    const placeholder = '<option value="">-- Chọn phòng ban --</option>';

    // Xóa sạch option cũ
    createDropdown.empty().append(placeholder + options);
    editDropdown.empty().append(placeholder + options);

    departmentsLoaded = true;
  });
}

function matchByText(params, data) {
  if ($.trim(params.term) === '') return data;
  if (typeof data.text === 'undefined') return null;

  const term = params.term.toLowerCase();
  const text = data.text.toLowerCase();

  return text.includes(term) ? data : null;
}

function loadDeviceAssignments(params = {}) {
  $.get('/assignments/ajax?' + $.param(params), function (data) {
    const rows = data.map(item => {
      const badge = item.isUnderRepair ? '<span class="text-danger ms-2">(Đang sửa)</span>' : '';
      const cleanNote = item.note ? item.note.replace(/'/g, "\\'").replace(/"/g, "&quot;") : '';
      const sDate = item.startDate || '';
      const eDate = item.endDate || '';
      return `
        <tr>
          <td>${item.deviceCode} - ${item.deviceName} (${item.deviceType || ''}) ${badge}</td>
          <td>${item.deptName}</td>
          <td>${item.startDate?.slice(0,10)} → ${eDate ? eDate.slice(0,10) : 'Hiện tại'}</td>
          <td>${item.note || ''}</td>
          <td>
            <button class="btn btn-sm btn-warning" onclick="openEditAssignmentModal('${item.id}', '${item.deptId}', '${sDate}', '${eDate}', '${cleanNote}')">✏️</button>
            <button class="btn btn-sm btn-secondary" onclick="revokeAssignment(${item.id})">⛔ Thu hồi</button>
            <button class="btn btn-sm btn-danger" onclick="deleteAssignment(${item.id})">🗑️</button>
          </td>
        </tr>`;
    }).join('');
    $('#deviceAssignmentTable').html(rows || '<tr><td colspan="5" class="text-center">Không có dữ liệu</td></tr>');
  });
}

async function openCreateAssignmentModal() {
  try {
    // Reset form trước khi mở
    $('#createDeviceAssignmentForm')[0].reset();
    $('#createDeptDropdown').val('').trigger('change');

    // Gọi nạp phòng ban trước
    await loadDepartments();
    
    // Nạp danh sách thiết bị rảnh
    const res = await $.get('/assignments/available-devices');
    const dropdown = $('#createDeviceDropdown');
    dropdown.empty().append('<option value="">-- Chọn thiết bị --</option>');
    
    res.devices.forEach(d => {
      dropdown.append(`<option value="${d.id}">${d.deviceCode} - ${d.deviceName}</option>`);
    });

    toggleModal('#createDeviceAssignmentModal', 'open');
  } catch (err) {
    console.error("Lỗi khi chuẩn bị modal:", err);
  }
}

async function openEditAssignmentModal(id, deptId, startDate, endDate, note) {
  try {
    $('#editDeviceAssignmentForm')[0].reset();
    // 1. Điền dữ liệu text/date vào trước để người dùng thấy ngay
    $('#editAssignmentId').val(id);
    $('#editStartDate').val(startDate ? startDate.slice(0, 10) : '');
    $('#editEndDate').val(endDate && endDate !== 'null' ? endDate.slice(0, 10) : '');
    $('#editNote').val(note && note !== 'null' ? note : '');

    await loadDepartments();

    // 3. Mở Modal
    toggleModal('#editDeviceAssignmentModal', 'open');
    // 2. Cập nhật Select2 sau khi Modal bắt đầu hiển thị
    setTimeout(() => {
        if (deptId && deptId !== 'null') {
            $('#editDeptDropdown').val(deptId).trigger('change');
        } else {
            $('#editDeptDropdown').val('').trigger('change');
        }
    }, 150);
    
  } catch (error) {
    console.error("Lỗi khi mở modal sửa:", error);
  }
}

$('#createDeviceAssignmentForm').on('submit', function (e) {
  e.preventDefault();
  const payload = {
    deviceId: $('#createDeviceDropdown').val(),
    deptId: $('#createDeptDropdown').val(),
    startDate: $('#createStartDate').val(),
    note: $('#createNote').val()
  };
  $.post('/assignments', payload, () => {
    toggleModal('#createDeviceAssignmentModal', 'close');
    loadDeviceAssignments();
  });
});

$('#editDeviceAssignmentForm').on('submit', function (e) {
  e.preventDefault();
  const id = $('#editAssignmentId').val();
  const payload = {
    deptId: $('#editDeptDropdown').val(),
    startDate: $('#editStartDate').val(),
    endDate: $('#editEndDate').val(),
    note: $('#editNote').val()
  };
  $.ajax({
    url: `/assignments/${id}`,
    method: 'PUT',
    data: payload,
    success: () => {
      toggleModal('#editDeviceAssignmentModal', 'close');
      loadDeviceAssignments();
    },
    error: (xhr) => alert('Lỗi: ' + (xhr.responseJSON?.message || 'Không thể cập nhật'))
  });
});

function revokeAssignment(id) {
  $.ajax({
    url: `/assignments/${id}/revoke`,
    method: 'PUT',
    success: () => loadDeviceAssignments()
  });
}

function deleteAssignment(id) {
  $.ajax({
    url: `/assignments/${id}`,
    method: 'DELETE',
    success: () => loadDeviceAssignments()
  });
}

$('#btnOpenCreateAssignmentModal').on('click', openCreateAssignmentModal);

$('#filterDeviceAssignmentForm').on('submit', function (e) {
  e.preventDefault();
  const params = Object.fromEntries(new FormData(this));
  loadDeviceAssignments(params);
});

$('#resetDeviceAssignmentFilter').on('click', function () {
  $('#resetDeviceAssignmentFilter').on('click', function () {
  $('#filterDeviceAssignmentForm')[0].reset();
  loadDeviceAssignments({ status: 'active' }); // ✅ gắn lại mặc định rõ ràng
});

});

$(document).ready(() => {
  loadDeviceAssignments();
  loadDepartments()
});

