const TODAY = new Date().toISOString().split('T')[0];

// ── Add-card form toggle ──────────────────────────────────────────────────────
document.querySelectorAll('.add-card-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const form = document.getElementById(btn.dataset.target);
    form.classList.add('visible');
    btn.style.display = 'none';
    form.querySelector('textarea').focus();
  });
});

document.querySelectorAll('.btn-cancel').forEach(btn => {
  btn.addEventListener('click', () => {
    const form = btn.closest('.add-card-form');
    closeForm(form);
  });
});

document.querySelectorAll('.btn-save').forEach(btn => {
  btn.addEventListener('click', () => {
    const form = btn.closest('.add-card-form');
    const textarea = form.querySelector('textarea');
    const title = textarea.value.trim();
    if (!title) return;

    const priority = form.querySelector('select').value;
    const due      = form.querySelector('input[type="date"]').value;
    const column   = form.closest('.column');
    const list     = column.querySelector('.card-list');

    list.appendChild(createCard(title, '', priority, due));
    updateCount(column);

    textarea.value = '';
    form.querySelector('input[type="date"]').value = '';
    closeForm(form);
  });
});

function closeForm(form) {
  form.classList.remove('visible');
  const col = form.closest('.column');
  col.querySelector('.add-card-btn').style.display = '';
}

// ── Create card element ───────────────────────────────────────────────────────
function createCard(title, desc, priority, due) {
  const li = document.createElement('li');
  li.className = 'card';
  li.dataset.priority = priority;
  li.dataset.due = due;

  const dueClass = due && due < TODAY ? ' overdue' : '';
  const dueHtml  = due ? `<span class="due${dueClass}">📅 ${due}</span>` : '';

  li.innerHTML = `
    <strong>${escapeHtml(title)}</strong>
    ${desc ? `<p>${escapeHtml(desc)}</p>` : ''}
    <div class="card-meta">
      <span class="priority priority-${priority}">${capitalise(priority)}</span>
      ${dueHtml}
    </div>
  `;

  // Click to move between columns
  li.addEventListener('click', () => openCardModal(li));

  return li;
}

// ── Card modal (move + delete) ────────────────────────────────────────────────
function openCardModal(card) {
  const existing = document.getElementById('card-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'card-modal';
  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-box">
      <h3>${card.querySelector('strong').textContent}</h3>
      <p class="modal-section-label">Move to column</p>
      <div class="modal-actions">
        <button data-col="col-todo">To Do</button>
        <button data-col="col-inprogress">In Progress</button>
        <button data-col="col-done">Done</button>
      </div>
      <button class="modal-delete">🗑 Delete card</button>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('.modal-overlay').addEventListener('click', () => modal.remove());

  modal.querySelectorAll('[data-col]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetCol = document.getElementById(btn.dataset.col);
      const targetList = targetCol.querySelector('.card-list');
      const oldCol = card.closest('.column');
      targetList.appendChild(card);
      updateCount(oldCol);
      updateCount(targetCol);
      modal.remove();
    });
  });

  modal.querySelector('.modal-delete').addEventListener('click', () => {
    const col = card.closest('.column');
    card.remove();
    updateCount(col);
    modal.remove();
  });
}

// ── Update column card count badge ───────────────────────────────────────────
function updateCount(column) {
  const count = column.querySelectorAll('.card-list .card').length;
  const badge = column.querySelector('.card-count');
  if (badge) badge.textContent = count;
}

// ── Drag-and-drop between columns ────────────────────────────────────────────
let dragged = null;

document.addEventListener('dragstart', e => {
  if (e.target.classList.contains('card')) {
    dragged = e.target;
    e.target.style.opacity = '0.4';
  }
});

document.addEventListener('dragend', e => {
  if (e.target.classList.contains('card')) {
    e.target.style.opacity = '';
    dragged = null;
  }
});

document.querySelectorAll('.card-list').forEach(list => {
  list.addEventListener('dragover', e => {
    e.preventDefault();
    list.style.outline = '2px dashed #4759ff';
  });
  list.addEventListener('dragleave', () => {
    list.style.outline = '';
  });
  list.addEventListener('drop', e => {
    e.preventDefault();
    list.style.outline = '';
    if (dragged && dragged.closest('.card-list') !== list) {
      const oldCol = dragged.closest('.column');
      list.appendChild(dragged);
      const newCol = list.closest('.column');
      updateCount(oldCol);
      updateCount(newCol);
    }
  });
});

// Make existing cards draggable and clickable
document.querySelectorAll('.card').forEach(card => {
  card.setAttribute('draggable', 'true');
  card.addEventListener('click', () => openCardModal(card));
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
