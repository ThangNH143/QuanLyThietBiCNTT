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
      return `
        <tr>
          <td>${item.deviceCode} - ${item.deviceName} (${item.deviceType || ''}) ${badge}</td>
          <td>${item.deptName}</td>
          <td>${item.startDate?.slice(0,10)} → ${item.endDate ? item.endDate.slice(0,10) : 'Hiện tại'}</td>
          <td>${item.note || ''}</td>
          <td>
            <button class="btn btn-sm btn-warning" onclick="openEditAssignmentModal(${item.id})">✏️</button>
            <button class="btn btn-sm btn-secondary" onclick="revokeAssignment(${item.id})">⛔ Thu hồi</button>
            <button class="btn btn-sm btn-danger" onclick="deleteAssignment(${item.id})">🗑️</button>
          </td>
        </tr>`;
    }).join('');
    $('#deviceAssignmentTable').html(rows);
  });
}

function openCreateAssignmentModal() {
  toggleModal('#createDeviceAssignmentModal', 'open');
      const deviceDropdown = $('#createDeviceDropdown').empty();
      const deptDropdown = $('#createDeptDropdown').empty();

      $.get('/assignments/available-devices', function (data) {
        (data.devices || []).forEach(dev => {
          const label = `${dev.deviceCode} - ${dev.deviceName} (${dev.deviceType})`;
          deviceDropdown.append(`<option value="${dev.id}">${label}</option>`);
        });
        deviceDropdown.select2({
          dropdownParent: '#createDeviceAssignmentModal',
          width: '100%',
          placeholder: 'Tìm thiết bị...',
          allowClear: true,
          matcher: matchByText
        });
      });

      $.get('/departments/ajax', function (data) {
        (data.departments || []).forEach(dept => {
          deptDropdown.append(`<option value="${dept.id}">${dept.name}</option>`);
        });
        deptDropdown.select2({
          dropdownParent: '#createDeviceAssignmentModal',
          width: '100%',
          placeholder: 'Tìm phòng ban...',
          allowClear: true,
          matcher: matchByText
        });
      });
}

function openEditAssignmentModal(id) {
  toggleModal('#editDeviceAssignmentModal', 'open');
      $('#editAssignmentId').val(id);

      $.get('/assignments/ajax', function (list) {
        const found = list.find(a => a.id === id);
        if (!found) return;

        $('#editStartDate').val(found.startDate?.slice(0,10));
        $('#editEndDate').val(found.endDate ? found.endDate.slice(0,10) : '');
        $('#editNote').val(found.note || '');

        $.get('/departments/ajax', function (data) {
          const dropdown = $('#editDeptDropdown').empty();
          (data.departments || []).forEach(dept => {
            dropdown.append(`<option value="${dept.id}">${dept.name}</option>`);
          });
          dropdown.val(found.deptId).trigger('change');
          dropdown.select2({
            dropdownParent: '#editDeviceAssignmentModal',
            width: '100%',
            placeholder: 'Tìm phòng ban...',
            allowClear: true,
            matcher: matchByText
          });
        });
      });

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
    }
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

$(document).ready(() => loadDeviceAssignments());
