// public/js/hardwares.js
// Compatible with both legacy API responses and standardized API responses.

let currentHardwareParams = {
  page: 1,
  limit: 10,
  filter: 'all'
};

function getErrorMessage(xhr, fallback = 'Có lỗi xảy ra') {
  return xhr.responseJSON?.message || fallback;
}

function escapeHtml(value) {
  if (value === null || value === undefined) return '';

  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function showHardwareAlert(message, type = 'success') {
  const alertHtml = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      <strong>Lưu ý:</strong> ${escapeHtml(message)}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;

  $('#hardwareAlertContainer').html(alertHtml);

  setTimeout(() => {
    $('.alert').alert('close');
  }, 5000);
}

function setHardwareLoading(isLoading) {
  if (!isLoading) return;

  $('#hardwareTable').html(`
    <div class="text-center py-4">
      <div class="spinner-border" role="status"></div>
      <div class="mt-2">Đang tải dữ liệu...</div>
    </div>
  `);
}

function renderHardwareTypeOptions(types, selectedValue = '') {
  const options = ['<option value="">-- Chọn loại phần cứng --</option>'];

  types.forEach((type) => {
    const selected = String(type.id) === String(selectedValue) ? 'selected' : '';

    options.push(`
      <option value="${escapeHtml(type.id)}" ${selected}>
        ${escapeHtml(type.name || type.code || '')}
      </option>
    `);
  });

  return options.join('');
}

function loadHardwareTypesForSelects(selectedValue = '') {
  return $.get('/hardware-types/ajax', {
    page: 1,
    limit: 1000,
    filter: 'active'
  })
    .then((res) => {
      const types = getListFromResponse(res, 'hardwareTypes');

      $('select[name="hardwareTypeId"], #hardwareTypeId, #filterHardwareTypeId').each(function () {
        const currentValue = $(this).val() || selectedValue;
        $(this).html(renderHardwareTypeOptions(types, currentValue));
      });

      return types;
    })
    .catch((xhr) => {
      showHardwareAlert(
        getErrorMessage(xhr, 'Lỗi khi tải danh sách loại phần cứng'),
        'danger'
      );

      return [];
    });
}

function renderHardwareTable(hardwares) {
  const rows = Array.isArray(hardwares) && hardwares.length > 0
    ? hardwares.map((hw) => {
      const id = hw.id;
      const code = hw.code ?? '';
      const name = hw.name ?? '';
      const note = hw.note ?? '';

      const hardwareTypeName =
        hw.hardwareTypeName ??
        hw.typeName ??
        hw.hardware_type_name ??
        hw.HardwareTypeName ??
        hw.TypeName ??
        '';

      const isInactive = Boolean(hw.isInactive);

      return `
        <tr>
          <td><input value="${escapeHtml(code)}" id="hw-code-${id}" class="form-control form-control-sm" /></td>
          <td><input value="${escapeHtml(name)}" id="hw-name-${id}" class="form-control form-control-sm" /></td>
          <td>${escapeHtml(hardwareTypeName)}</td>
          <td><input value="${escapeHtml(note)}" id="hw-note-${id}" class="form-control form-control-sm" /></td>
          <td>
            <span class="badge ${isInactive ? 'bg-secondary' : 'bg-success'}">
              ${isInactive ? 'Tạm ngưng' : 'Hoạt động'}
            </span>
          </td>
          <td class="text-nowrap">
            <button class="btn btn-sm btn-warning" onclick="updateHardware(${id})">✏️</button>
            <button class="btn btn-sm btn-secondary" onclick="toggleHardware(${id})">
              ${isInactive ? '🔄 Kích hoạt' : '🔄 Tạm ngưng'}
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteHardware(${id})">❌</button>
          </td>
        </tr>
      `;
    }).join('')
    : '<tr><td colspan="6" class="text-center text-muted">Không có dữ liệu</td></tr>';

  $('#hardwareTable').html(`
    <div class="table-responsive">
      <table class="table table-bordered table-striped align-middle">
        <thead>
          <tr>
            <th>Mã</th>
            <th>Tên phần cứng</th>
            <th>Loại phần cứng</th>
            <th>Ghi chú</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `);
}

function renderHardwarePagination(pagination) {
  window.AppPagination.render({
    containerSelector: '#hardwarePagination',
    pagination,
    windowSize: 10,
    onPageChange: changeHardwarePage
  });
}

function changeHardwarePage(page) {
  const targetPage = Number(page);
  if (!targetPage || targetPage < 1) return;

  currentHardwareParams.page = targetPage;
  loadHardwares(currentHardwareParams);
}

function loadHardwares(params = {}) {
  currentHardwareParams = {
    ...currentHardwareParams,
    ...params
  };

  setHardwareLoading(true);

  $.get('/hardwares/ajax', currentHardwareParams)
    .done((res) => {
      const hardwares = getListFromResponse(res, 'hardwares');
      const pagination = getPaginationFromResponse(res, currentHardwareParams);

      renderHardwareTable(hardwares);
      renderHardwarePagination(pagination);

      currentHardwareParams.page = pagination.page;
      currentHardwareParams.limit = pagination.limit;
    })
    .fail((xhr) => {
      showHardwareAlert(
        getErrorMessage(xhr, 'Lỗi khi tải danh sách phần cứng'),
        'danger'
      );

      renderHardwareTable([]);
      renderHardwarePagination({
        page: 1,
        limit: currentHardwareParams.limit,
        totalItems: 0,
        totalPages: 1
      });
    });
}

$('#createHardwareForm').on('submit', function (e) {
  e.preventDefault();

  const formData = Object.fromEntries(new FormData(this));

  if (!formData.code || !formData.name || !formData.hardwareTypeId) {
    showHardwareAlert('Vui lòng nhập mã, tên và loại phần cứng', 'danger');
    return;
  }

  $.post('/hardwares', formData)
    .done((res) => {
      showHardwareAlert(res.message || 'Thêm phần cứng thành công', 'success');

      $('#createHardwareForm')[0].reset();

      const modalEl = document.querySelector('#hardwareModal');

      if (modalEl && typeof bootstrap !== 'undefined') {
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
      }

      currentHardwareParams.page = 1;
      loadHardwares(currentHardwareParams);
    })
    .fail((xhr) => {
      showHardwareAlert(
        getErrorMessage(xhr, 'Lỗi khi thêm phần cứng'),
        'danger'
      );
    });
});

function updateHardware(id) {
  const data = {
    code: $(`#hw-code-${id}`).val(),
    name: $(`#hw-name-${id}`).val(),
    note: $(`#hw-note-${id}`).val()
  };

  if (!data.code || !data.name) {
    showHardwareAlert('Mã và tên phần cứng là bắt buộc', 'danger');
    return;
  }

  $.ajax({
    url: `/hardwares/${id}`,
    type: 'PUT',
    data
  })
    .done((res) => {
      showHardwareAlert(res.message || 'Cập nhật phần cứng thành công', 'success');
      loadHardwares(currentHardwareParams);
    })
    .fail((xhr) => {
      showHardwareAlert(
        getErrorMessage(xhr, 'Lỗi khi cập nhật phần cứng'),
        'danger'
      );
    });
}

function toggleHardware(id) {
  $.ajax({
    url: `/hardwares/${id}/toggle`,
    type: 'PATCH'
  })
    .done((res) => {
      showHardwareAlert(res.message || 'Đã thay đổi trạng thái phần cứng', 'success');
      loadHardwares(currentHardwareParams);
    })
    .fail((xhr) => {
      showHardwareAlert(
        getErrorMessage(xhr, 'Lỗi khi thay đổi trạng thái'),
        'danger'
      );
    });
}

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
      url: `/hardwares/${id}`,
      type: 'DELETE'
    })
      .done((res) => {
        showHardwareAlert(res.message || 'Xóa phần cứng thành công', 'success');
        loadHardwares(currentHardwareParams);
      })
      .fail((xhr) => {
        showHardwareAlert(
          getErrorMessage(xhr, 'Lỗi khi xóa phần cứng'),
          'danger'
        );
      });
  });
}

$('#resetHardwareBtn').on('click', function () {
  $('#filterHardwareForm')[0].reset();

  currentHardwareParams = {
    page: 1,
    limit: 10,
    filter: 'all'
  };

  loadHardwares(currentHardwareParams);
});

$('#filterHardwareForm').on('submit', function (e) {
  e.preventDefault();

  const formData = Object.fromEntries(new FormData(this));

  currentHardwareParams = {
    ...formData,
    page: 1,
    limit: 10
  };

  loadHardwares(currentHardwareParams);
});

$(document).ready(() => {
  loadHardwareTypesForSelects();
  loadHardwares(currentHardwareParams);
});
