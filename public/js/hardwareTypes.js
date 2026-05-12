let currentHardwareTypeParams = { page: 1, limit: 10, filter: 'all' };
let reopenAfterSubmit = false;

function safeHideModal(modalSelector) {
  document.activeElement?.blur();

  const modalElement = document.querySelector(modalSelector);
  const modalInstance = bootstrap.Modal.getInstance(modalElement);

  if (modalInstance) {
    modalInstance.hide();
  }

  setTimeout(() => {
    $('body').css('overflow', 'auto').removeClass('modal-open');
    $('.modal-backdrop').remove();

    if (reopenAfterSubmit) {
      reopenAfterSubmit = false;
      const nextModal = new bootstrap.Modal(modalElement);
      nextModal.show();
    }
  }, 300);
}

function showHardwareTypeAlert(message, type = 'success') {
  const alertHtml = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      <strong>Lưu ý:</strong> ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;

  $('#hardwareTypeAlertContainer').html(alertHtml);

  setTimeout(() => {
    $('.alert').alert('close');
  }, 5000);
}

function getErrorMessage(xhr, fallback = 'Có lỗi xảy ra') {
  return xhr.responseJSON?.message || fallback;
}

function setHardwareTypeLoading(isLoading) {
  if (isLoading) {
    $('#hardwareTypeTable').html(`
      <div class="text-center py-4">
        <div class="spinner-border" role="status"></div>
        <div class="mt-2">Đang tải dữ liệu...</div>
      </div>
    `);
  }
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

function renderHardwareTypeTable(hardwareTypes) {
  const rows = Array.isArray(hardwareTypes) && hardwareTypes.length > 0
    ? hardwareTypes.map((ht) => `
      <tr>
        <td>
          <input
            value="${escapeHtml(ht.code)}"
            id="ht-code-${ht.id}"
            class="form-control form-control-sm"
          />
        </td>
        <td>
          <input
            value="${escapeHtml(ht.name)}"
            id="ht-name-${ht.id}"
            class="form-control form-control-sm"
          />
        </td>
        <td>
          <input
            value="${escapeHtml(ht.note || '')}"
            id="ht-note-${ht.id}"
            class="form-control form-control-sm"
          />
        </td>
        <td class="text-nowrap">
          <button class="btn btn-sm btn-warning" onclick="updateHardwareType(${ht.id})">
            ✏️
          </button>
          <button class="btn btn-sm btn-secondary" onclick="toggleHardwareType(${ht.id})">
            ${ht.isInactive ? '🔄 Kích hoạt' : '🔄 Tạm ngưng'}
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteHardwareType(${ht.id})">
            ❌
          </button>
        </td>
      </tr>
    `).join('')
    : '<tr><td colspan="4" class="text-center text-muted">Không có dữ liệu</td></tr>';

  $('#hardwareTypeTable').html(`
    <div class="table-responsive">
      <table class="table table-bordered table-striped align-middle">
        <thead>
          <tr>
            <th>Mã</th>
            <th>Tên</th>
            <th>Ghi chú</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `);
}

function renderHardwareTypePagination(pagination) {
  const page = pagination.page;
  const totalPages = pagination.totalPages || 1;

  $('#hardwareTypePagination').html(`
    <div class="d-flex flex-wrap justify-content-center gap-2">
      <button
        class="btn btn-sm btn-outline-primary"
        ${page === 1 ? 'disabled' : ''}
        onclick="changeHardwareTypePage(1)"
      >
        ⏮
      </button>

      <button
        class="btn btn-sm btn-outline-primary"
        ${page === 1 ? 'disabled' : ''}
        onclick="changeHardwareTypePage(${page - 1})"
      >
        ⏪
      </button>

      <span class="align-self-center">
        Trang ${page} / ${totalPages}
      </span>

      <button
        class="btn btn-sm btn-outline-primary"
        ${page === totalPages ? 'disabled' : ''}
        onclick="changeHardwareTypePage(${page + 1})"
      >
        ⏩
      </button>

      <button
        class="btn btn-sm btn-outline-primary"
        ${page === totalPages ? 'disabled' : ''}
        onclick="changeHardwareTypePage(${totalPages})"
      >
        ⏭
      </button>
    </div>
  `);
}

function changeHardwareTypePage(page) {
  currentHardwareTypeParams.page = page;
  loadHardwareTypes(currentHardwareTypeParams);
}

function loadHardwareTypes(params = {}) {
  currentHardwareTypeParams = {
    ...currentHardwareTypeParams,
    ...params
  };

  setHardwareTypeLoading(true);

  $.get('/hardware-types/ajax', currentHardwareTypeParams)
    .done(function (res) {
      const hardwareTypes = res.data || [];
      const pagination = res.meta?.pagination || {
        page: 1,
        limit: currentHardwareTypeParams.limit,
        totalItems: 0,
        totalPages: 1
      };

      renderHardwareTypeTable(hardwareTypes);
      renderHardwareTypePagination(pagination);

      currentHardwareTypeParams.page = pagination.page;
      currentHardwareTypeParams.limit = pagination.limit;
    })
    .fail(function (xhr) {
      showHardwareTypeAlert(
        getErrorMessage(xhr, 'Lỗi khi tải danh sách loại phần cứng'),
        'danger'
      );

      renderHardwareTypeTable([]);
      renderHardwareTypePagination({
        page: 1,
        limit: currentHardwareTypeParams.limit,
        totalItems: 0,
        totalPages: 1
      });
    });
}

$('#createHardwareTypeForm').on('submit', function (e) {
  e.preventDefault();

  const formData = Object.fromEntries(new FormData(this));

  if (!formData.code || !formData.name) {
    showHardwareTypeAlert('Vui lòng nhập mã và tên loại phần cứng', 'danger');
    return;
  }

  $.post('/hardware-types', formData)
    .done((res) => {
      showHardwareTypeAlert(res.message, 'success');

      reopenAfterSubmit = true;
      safeHideModal('#hardwareTypeModal');

      $('#createHardwareTypeForm')[0].reset();

      currentHardwareTypeParams.page = 1;
      loadHardwareTypes(currentHardwareTypeParams);
    })
    .fail((xhr) => {
      showHardwareTypeAlert(
        getErrorMessage(xhr, 'Lỗi khi thêm loại phần cứng'),
        'danger'
      );
    });
});

function updateHardwareType(id) {
  const data = {
    code: $(`#ht-code-${id}`).val(),
    name: $(`#ht-name-${id}`).val(),
    note: $(`#ht-note-${id}`).val()
  };

  if (!data.code || !data.name) {
    showHardwareTypeAlert('Mã và tên loại phần cứng là bắt buộc', 'danger');
    return;
  }

  $.ajax({
    url: `/hardware-types/${id}`,
    type: 'PUT',
    data
  })
    .done((res) => {
      showHardwareTypeAlert(res.message, 'success');
      loadHardwareTypes(currentHardwareTypeParams);
    })
    .fail((xhr) => {
      showHardwareTypeAlert(
        getErrorMessage(xhr, 'Lỗi khi cập nhật loại phần cứng'),
        'danger'
      );
    });
}

function toggleHardwareType(id) {
  $.ajax({
    url: `/hardware-types/${id}/toggle`,
    type: 'PATCH'
  })
    .done((res) => {
      showHardwareTypeAlert(res.message, 'success');
      loadHardwareTypes(currentHardwareTypeParams);
    })
    .fail((xhr) => {
      showHardwareTypeAlert(
        getErrorMessage(xhr, 'Lỗi khi thay đổi trạng thái'),
        'danger'
      );
    });
}

function deleteHardwareType(id) {
  Swal.fire({
    title: 'Bạn có chắc?',
    text: 'Loại phần cứng này sẽ bị xóa vĩnh viễn!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Xóa',
    cancelButtonText: 'Hủy',
    confirmButtonColor: '#d33'
  }).then((result) => {
    if (!result.isConfirmed) return;

    $.ajax({
      url: `/hardware-types/${id}`,
      type: 'DELETE'
    })
      .done((res) => {
        showHardwareTypeAlert(res.message, 'success');
        loadHardwareTypes(currentHardwareTypeParams);
      })
      .fail((xhr) => {
        showHardwareTypeAlert(
          getErrorMessage(xhr, 'Lỗi khi xóa loại phần cứng'),
          'danger'
        );
      });
  });
}

$('#resetHardwareTypeBtn').on('click', function () {
  $('#filterHardwareTypeForm')[0].reset();

  currentHardwareTypeParams = {
    page: 1,
    limit: 10,
    filter: 'all'
  };

  loadHardwareTypes(currentHardwareTypeParams);
});

$('#filterHardwareTypeForm').on('submit', function (e) {
  e.preventDefault();

  const formData = Object.fromEntries(new FormData(this));

  currentHardwareTypeParams = {
    ...formData,
    page: 1,
    limit: 10
  };

  loadHardwareTypes(currentHardwareTypeParams);
});

$(document).ready(() => {
  loadHardwareTypes(currentHardwareTypeParams);
});