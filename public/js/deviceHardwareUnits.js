let currentDeviceHardwareParams = {
  page: 1,
  limit: 10,
  deviceName: '',
  hardwareKeyword: ''
};

$(document).ready(function () {
  loadDeviceHardwareUnits();

  $('#btnOpenCreateModal').on('click', openCreateModal);

  $('#filterDeviceHardwareForm').on('submit', function (e) {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(this));
    currentDeviceHardwareParams = {
      ...currentDeviceHardwareParams,
      ...formData,
      page: 1
    };
    loadDeviceHardwareUnits(currentDeviceHardwareParams);
  });

  $('#resetDeviceHardwareFilter').on('click', function () {
    $('#filterDeviceHardwareForm')[0].reset();
    currentDeviceHardwareParams = {
      page: 1,
      limit: 10,
      deviceName: '',
      hardwareKeyword: ''
    };
    loadDeviceHardwareUnits(currentDeviceHardwareParams);
  });
});

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

function renderHardwareOption(hw, selectedIds = []) {
  const selected = selectedIds.includes(hw.id) ? 'selected' : '';
  const disabled = hw.isUnderRepair ? 'disabled' : '';
  const style = hw.isUnderRepair ? 'style="color:red;"' : '';
  return `<option value="${hw.id}" ${selected} ${disabled} ${style}>${hw.hardwareName} - ${hw.serialNumber}</option>`;
}

function loadDeviceHardwareUnits(params = {}) {
  currentDeviceHardwareParams = { ...currentDeviceHardwareParams, ...params };

  $.get('/device-hardware/ajax', currentDeviceHardwareParams, function (res) {
    const data = res.data || [];
    const tbody = $('#deviceHardwareTable');
    tbody.empty();

    if (data.length === 0) {
      tbody.append('<tr><td colspan="3" class="text-center text-muted">Không có dữ liệu</td></tr>');
    } else {
      const rows = data.map(item => `
        <tr>
          <td>${item.deviceCode} - ${item.deviceName} (${item.deviceType || ''})</td>
          <td>
            ${(item.hardwareUnits || []).map(hw => {
              const color = hw.isUnderRepair ? 'color:red;' : '';
              return `<span class="badge text-bg-secondary me-2 mb-1" style="${color}" title="Serial: ${hw.serialNumber}">
                ${hw.hardwareName}
                <button class="btn-close btn-close-white btn-sm ms-1" onclick="detachHardware(${hw.id}, ${item.deviceId})"></button>
              </span>`;
            }).join('')}
          </td>
          <td><button class="btn btn-sm btn-warning" onclick="openEditModal(${item.deviceId})">⚙️ Sửa</button></td>
        </tr>
      `).join('');

      tbody.html(rows);
    }

    renderPagination(res.pagination);
  });
}

function renderPagination(pagination) {
  const container = $('#deviceHardwarePagination');
  container.empty();

  if (!pagination || pagination.totalPages <= 1) return;

  const page = Number(pagination.page) || 1;
  const totalPages = Number(pagination.totalPages) || 1;

  const windowSize = 10;       // tối đa 10 trang
  const leftCount = 5;         // 5 trang trước
  const rightCount = 4;        // 4 trang sau -> tổng 10 (gồm trang hiện tại)

  let start = Math.max(1, page - leftCount);
  let end = Math.min(totalPages, page + rightCount);

  // Nếu chưa đủ 10 trang, bù sang phía còn thiếu
  const shown = end - start + 1;
  if (shown < windowSize) {
    const need = windowSize - shown;

    // ưu tiên bù về phía trước nếu end đã chạm trần
    start = Math.max(1, start - need);
    // nếu vẫn thiếu (vì start đã chạm 1), bù về phía sau
    end = Math.min(totalPages, start + windowSize - 1);
  }

  const makeBtn = (label, target, disabled = false, active = false) => {
    const cls = active ? 'btn-primary' : 'btn-outline-primary';
    return $(`
      <button class="btn btn-sm ${cls} mx-1" ${disabled ? 'disabled' : ''}>
        ${label}
      </button>
    `).on('click', () => {
      if (!disabled) changePage(target);
    });
  };

  // Đầu + Trước
  container.append(makeBtn('‹', page - 1, page <= 1));

  // Nếu có khoảng trống phía trước, hiển thị "..."
  if (start > 1) {
    container.append(makeBtn('1', 1, false, page === 1));
    if (start > 2) container.append($(`<span class="mx-1">…</span>`));
  }

  // Các trang trong cửa sổ
  for (let p = start; p <= end; p++) {
    container.append(makeBtn(String(p), p, false, p === page));
  }

  // Nếu có khoảng trống phía sau, hiển thị "..."
  if (end < totalPages) {
    if (end < totalPages - 1) container.append($(`<span class="mx-1">…</span>`));
    container.append(makeBtn(String(totalPages), totalPages, false, page === totalPages));
  }

  // Sau + Cuối
  container.append(makeBtn('›', page + 1, page >= totalPages));
}

function changePage(page) {
  if (page < 1) return;
  loadDeviceHardwareUnits({ page });
}

/* =========================
   MODALS: CREATE / EDIT
========================= */

function openCreateModal() {
  toggleModal('#createDeviceHardwareModal', 'open');

  const deviceDropdown = $('#createDeviceDropdown').empty();
  const hwDropdown = $('#createHardwareUnitsDropdown').empty();

  $.get('/device-hardware/devices/ungrouped', function (data) {
    (data.devices || []).forEach(d => {
      const label = `${d.code} - ${d.name} (${d.deviceType})`;
      deviceDropdown.append(`<option value="${d.id}">${label}</option>`);
    });
    deviceDropdown.select2({ dropdownParent: '#createDeviceHardwareModal', width: '100%' });
  });

  $.get('/device-hardware/hardware-units/create', function (data) {
    (data.units || []).forEach(hw => hwDropdown.append(renderHardwareOption(hw, [])));

    hwDropdown.select2({
      dropdownParent: '#createDeviceHardwareModal',
      width: '100%',
      multiple: true,
      placeholder: 'Tìm phần cứng theo tên hoặc serial...',
      allowClear: true,
      matcher: function (params, data) {
        if ($.trim(params.term) === '') return data;
        if (typeof data.text === 'undefined') return null;

        const term = params.term.toLowerCase();
        const text = data.text.toLowerCase();
        const serial = data.text.split(' - ')[1]?.toLowerCase() || '';

        return (text.includes(term) || serial.includes(term)) ? data : null;
      }
    });
  });
}

function openEditModal(deviceId) {
  toggleModal('#editDeviceHardwareModal', 'open');

  const deviceDropdown = $('#editDeviceDropdown').empty();
  const hwDropdown = $('#editHardwareUnitsDropdown').empty();

  $.get('/device-hardware/' + deviceId + '/assigned', function (data) {
    const assignedIds = (data.assigned || []).map(hw => hw.id);

    $.get('/device-hardware/devices/ungrouped', { includeId: deviceId }, function (devData) {
      (devData.devices || []).forEach(d => {
        const label = `${d.code} - ${d.name} (${d.deviceType})`;
        deviceDropdown.append(`<option value="${d.id}">${label}</option>`);
      });
      deviceDropdown.val(deviceId).trigger('change');
      deviceDropdown.select2({ dropdownParent: '#editDeviceHardwareModal', width: '100%' });
    });

    $.get('/device-hardware/hardware-units/edit', { deviceId, includeIds: assignedIds.join(',') }, function (unitData) {
      (unitData.units || []).forEach(hw => hwDropdown.append(renderHardwareOption(hw, assignedIds)));
      hwDropdown.select2({ dropdownParent: '#editDeviceHardwareModal', width: '100%', multiple: true });
    });
  });
}

/* =========================
   ACTIONS
========================= */

function detachHardware(hardwareUnitId, deviceId) {
  $.ajax({
    url: `/device-hardware/${deviceId}/detach/${hardwareUnitId}`,
    method: 'DELETE',
    success: () => loadDeviceHardwareUnits(currentDeviceHardwareParams)
  });
}

$('#createDeviceHardwareForm').on('submit', function (e) {
  e.preventDefault();
  const deviceId = $('#createDeviceDropdown').val();
  const hardwareUnitIds = $('#createHardwareUnitsDropdown').val();

  $.ajax({
    url: `/device-hardware/${deviceId}/update`,
    method: 'PUT',
    data: { hardwareUnitIds },
    success: () => {
      toggleModal('#createDeviceHardwareModal', 'close');
      loadDeviceHardwareUnits(currentDeviceHardwareParams);
    }
  });
});

$('#editDeviceHardwareForm').on('submit', function (e) {
  e.preventDefault();
  const deviceId = $('#editDeviceDropdown').val();
  const hardwareUnitIds = $('#editHardwareUnitsDropdown').val();

  $.ajax({
    url: `/device-hardware/${deviceId}/update`,
    method: 'PUT',
    data: { hardwareUnitIds },
    success: () => {
      toggleModal('#editDeviceHardwareModal', 'close');
      loadDeviceHardwareUnits(currentDeviceHardwareParams);
    }
  });
});
