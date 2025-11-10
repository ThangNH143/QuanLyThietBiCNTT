let currentParams = { page: 1, limit: 10 };

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

function loadHardwareUnitsForSelect() {
  return $.get('/device-hardware/hardware-units/create').then(data => {
    return Array.isArray(data.units) ? data.units : [];
  });
}

function loadDeviceTypesSync() {
  return $.get('/device-types/ajax').then(data => {
    const deviceTypes = Array.isArray(data) ? data : data.deviceTypes || [];

    const dropdown = $('#deviceTypeDropdown');
    const modalDropdown = $('#modalDeviceType');
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

function renderHardwareOption(hw, selectedIds = []) {
  const selected = selectedIds.includes(hw.id) ? 'selected' : '';
  const disabled = hw.isUnderRepair ? 'disabled' : '';
  const style = hw.isUnderRepair ? 'style="color:red;"' : '';
  return `<option value="${hw.id}" ${selected} ${disabled} ${style}>${hw.hardwareName} - ${hw.serialNumber}</option>`;
}

function loadDeviceHardwareUnits(params = {}) {
  loadHardwareUnitsForSelect().then(hardwareUnits => {
    $.get('/device-hardware/ajax?' + $.param(params), function (data) {
      console.log(data);
      console.log('deviceCode:', data[0]?.deviceCode);3
      console.log('deviceType:', data[0]?.deviceType);
      const rows = data.map(item => `
        <tr>
          <td>${item.deviceCode} - ${item.deviceName} (${item.deviceType || ''})</td>
          <td>${item.hardwareUnits.map(hw => {
            const color = hw.isUnderRepair ? 'color:red;' : '';
            return `<span class="badge text-bg-secondary me-2 mb-1" style="${color}" title="Serial: ${hw.serialNumber}">
              ${hw.hardwareName}
              <button class="btn-close btn-close-white btn-sm ms-1" onclick="detachHardware(${hw.id}, ${item.deviceId})"></button>
            </span>`;
          }).join('')}</td>
          <td><button class="btn btn-sm btn-warning" onclick="openEditModal(${item.deviceId})">⚙️ Sửa</button></td>
        </tr>
      `).join('');

      $('#deviceHardwareTable').html(rows);
    });
  });
}

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
    (data.units || []).forEach(hw => {
      hwDropdown.append(renderHardwareOption(hw, []));
    });
    hwDropdown.select2({
      dropdownParent: '#createDeviceHardwareModal',
      width: '100%',
      multiple: true,
      placeholder: 'Tìm phần cứng theo tên hoặc serial...',
      allowClear: true,
      matcher: function(params, data) {
        if ($.trim(params.term) === '') return data;
        if (typeof data.text === 'undefined') return null;

        const term = params.term.toLowerCase();
        const text = data.text.toLowerCase();
        const serial = data.text.split(' - ')[1]?.toLowerCase() || '';

        if (text.includes(term) || serial.includes(term)) {
          return data;
        }
        return null;
      }
    });
  });
}

function openEditModal(deviceId) {
  toggleModal('#editDeviceHardwareModal', 'open');
  const deviceDropdown = $('#editDeviceDropdown').empty();
  const hwDropdown = $('#editHardwareUnitsDropdown').empty();

  $.get('/device-hardware/' + deviceId + '/assigned', function (data) {
    const assignedIds = data.assigned.map(hw => hw.id);

    $.get('/device-hardware/devices/ungrouped?' + $.param({ includeId: deviceId }), function (devData) {
      (devData.devices || []).forEach(d => {
        const label = `${d.code} - ${d.name} (${d.deviceType})`;
        deviceDropdown.append(`<option value="${d.id}">${label}</option>`);
      });
      deviceDropdown.val(deviceId).trigger('change');
      deviceDropdown.select2({ dropdownParent: '#editDeviceHardwareModal', width: '100%' });
    });

    const query = $.param({ deviceId, includeIds: assignedIds.join(',') });
    $.get('/device-hardware/hardware-units/edit?' + query, function (unitData) {
      (unitData.units || []).forEach(hw => {
        hwDropdown.append(renderHardwareOption(hw, assignedIds));
      });
      hwDropdown.select2({ dropdownParent: '#editDeviceHardwareModal', width: '100%', multiple: true });
    });
  });
}

function detachHardware(hardwareUnitId, deviceId) {
  $.ajax({
    url: `/device-hardware/${deviceId}/detach/${hardwareUnitId}`,
    method: 'DELETE',
    success: () => loadDeviceHardwareUnits()
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
      loadDeviceHardwareUnits();
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
      loadDeviceHardwareUnits();
    }
  });
});

$('#btnOpenCreateModal').on('click', openCreateModal);

$('#filterDeviceHardwareForm').on('submit', function (e) {
  e.preventDefault();
  const params = Object.fromEntries(new FormData(this));
  loadDeviceHardwareUnits(params);
});

$('#resetDeviceHardwareFilter').on('click', function () {
  $('#filterDeviceHardwareForm')[0].reset();
  loadDeviceHardwareUnits();
});

$(document).ready(() => {
  loadDevices(currentParams); // Không cần gọi loadDeviceTypes() riêng
  loadDeviceHardwareUnits();
});
