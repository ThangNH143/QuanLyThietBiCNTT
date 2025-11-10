let currentDepartmentParams = { page: 1, limit: 10 };
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

function showDepartmentAlert(message, type = 'success') {
  const alertHtml = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      <strong>Lưu ý:</strong> ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
  $('#departmentAlertContainer').html(alertHtml);

  // 🔄 Tự động ẩn sau 5 giây
  setTimeout(() => {
    $('.alert').alert('close');
  }, 5000);
}

// 📦 Load danh sách phòng ban
function loadDepartments(params = {}) {
  const query = $.param(params);
  $.get(Base_Path + `/departments/ajax?${query}`, function (data) {
    const rows = Array.isArray(data.departments)
      ? data.departments.map((d) => `
        <tr>
          <td><input value="${d.code}" id="dept-code-${d.id}" class="form-control form-control-sm"></td>
          <td><input value="${d.name}" id="dept-name-${d.id}" class="form-control form-control-sm"></td>
          <td><input value="${d.note || ''}" id="dept-note-${d.id}" class="form-control form-control-sm"></td>
          <td>
            <button class="btn btn-sm btn-warning" onclick="updateDepartment(${d.id})">✏️</button>
            <button class="btn btn-sm btn-secondary" onclick="toggleDepartment(${d.id})">${d.isInactive ? '🔄 Kích hoạt' : '🔄 Tạm ngưng'}</button>
            <button class="btn btn-sm btn-danger" onclick="deleteDepartment(${d.id})">❌</button>
          </td>
        </tr>
      `).join('')
      : '<tr><td colspan="3">Không có dữ liệu phòng ban</td></tr>';

    $('#departmentTable').html(`
      <table class="table table-bordered table-striped">
        <thead><tr><th>Mã</th><th>Tên</th><th>Ghi chú</th><th>Thao tác</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `);

    const totalPages = Math.ceil(data.total / currentDepartmentParams.limit);
    const p = data.currentPage;
    $('#departmentPagination').html(`
      <button class="btn btn-sm btn-outline-primary" ${p === 1 ? 'disabled' : ''} onclick="loadDepartments({ ...currentDepartmentParams, page: 1 })">⏮</button>
      <button class="btn btn-sm btn-outline-primary" ${p === 1 ? 'disabled' : ''} onclick="loadDepartments({ ...currentDepartmentParams, page: ${p - 1} })">⏪</button>
      <span>${p} / ${totalPages}</span>
      <button class="btn btn-sm btn-outline-primary" ${p === totalPages ? 'disabled' : ''} onclick="loadDepartments({ ...currentDepartmentParams, page: ${p + 1} })">⏩</button>
      <button class="btn btn-sm btn-outline-primary" ${p === totalPages ? 'disabled' : ''} onclick="loadDepartments({ ...currentDepartmentParams, page: ${totalPages} })">⏭</button>
    `);
    currentDepartmentParams.page = p;
  });
}

// ➕ Tạo phòng ban
$('#createDepartmentForm').on('submit', function (e) {
  e.preventDefault();
  const formData = Object.fromEntries(new FormData(this));
  if (!formData.code || !formData.name) {
    alert('Vui lòng nhập mã và tên phòng ban');
    return;
  }

  $.post(Base_Path + '/departments', formData, function (res) {
    showDepartmentAlert(res.message, 'success');
    reopenAfterSubmit = true;
    safeHideModal('#departmentModal');
    $('#createDepartmentForm')[0].reset();
    loadDepartments(currentDepartmentParams);
  }).fail((xhr) => {
    showDepartmentAlert(xhr.responseJSON?.message || 'Lỗi khi thêm phòng ban', 'danger');
  });
});

// ✏️ Cập nhật phòng ban
function updateDepartment(id) {
  const data = {
    code: $(`#dept-code-${id}`).val(),
    name: $(`#dept-name-${id}`).val(),
    note: $(`#dept-note-${id}`).val()
  };

  if (!data.code || !data.name) {
    showDepartmentAlert('Thiếu dữ liệu mã và tên phòng ban', 'danger');
    return;
  }

  $.ajax({
    url: Base_Path + `/departments/${id}/update`,
    type: 'PUT',
    data,
    success: (res) => {
      showDepartmentAlert(res.message, 'success');
      loadDepartments(currentDepartmentParams);
    },
    error: (xhr) => {
    showDepartmentAlert(xhr.responseJSON?.message || 'Lỗi khi cập nhật phòng ban', 'danger');
    }
  });
};

// 🔄 Tạm ngưng / kích hoạt
function toggleDepartment(id) {
  $.ajax({
    url: Base_Path + `/departments/${id}/toggle`,
    type: 'PUT',
    success: (res) => {
      showDepartmentAlert(res.message, 'success');
      loadDepartments(currentDepartmentParams);
    },
    error: (xhr) => {showDepartmentAlert(xhr.responseJSON?.message || 'Lỗi khi cập nhật trạng thái', 'danger');
    }
  });
};

// ❌ Xóa phòng ban
function deleteDepartment(id) {
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
    url: Base_Path + `/departments/${id}/delete`,
    type: 'DELETE',
    success: (res) => {
      showDepartmentAlert(res.message, 'success');
      loadDepartments(currentDepartmentParams);
    },
    error: (xhr) => {showDepartmentAlert(xhr.responseJSON?.message || 'Lỗi khi cập nhật trạng thái', 'danger');}
    });
  });
}

// 🔍 Tìm kiếm
$('#filterDepartmentForm').on('submit', function (e) {
  e.preventDefault();
  currentDepartmentParams = Object.fromEntries(new FormData(this));
  currentDepartmentParams.page = 1;
  currentDepartmentParams.limit = 10;
  loadDepartments(currentDepartmentParams);
});

// 🔄 Reset lọc
$('#resetDepartmentBtn').on('click', function () {
  $('#filterDepartmentForm')[0].reset();
  currentDepartmentParams = { page: 1, limit: 10 };
  loadDepartments(currentDepartmentParams);
});


// 🚀 Khởi động
$(document).ready(() => {
  loadDepartments(currentDepartmentParams);
});
