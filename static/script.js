/* =========================================================
   AI Data Analyst — Frontend Logic
   ========================================================= */
(function () {
  'use strict';

  const uploadArea = document.getElementById('uploadArea');
  const fileInput  = document.getElementById('fileInput');
  const uploadBtn  = document.getElementById('uploadBtn');
  const fileList   = document.getElementById('fileList');

  if (!uploadArea || !fileInput || !uploadBtn) return;

  /* ---------- OPEN FILE PICKER ---------- */
  uploadBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  uploadArea.addEventListener('click', () => fileInput.click());

  /* ---------- RENDER FILE CARD ---------- */
  function iconForExt(ext) {
    switch ((ext || '').toLowerCase()) {
      case 'csv':  return 'fa-file-csv';
      case 'xlsx':
      case 'xls':  return 'fa-file-excel';
      case 'json': return 'fa-file-code';
      default:     return 'fa-file';
    }
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function addFileCard(name, sizeText, ext) {
    const card = document.createElement('div');
    card.className = 'file-card';
    card.innerHTML = `
      <div class="file-icon"><i class="fas ${iconForExt(ext)}"></i></div>
      <div class="file-info">
        <h4>${name}</h4>
        <span>${sizeText}</span>
      </div>
    `;

    // Remove "empty" card if present
    const empty = fileList.querySelector('.file-card.empty');
    if (empty) empty.remove();

    fileList.prepend(card);
  }

  /* ---------- SHOW UPLOADING STATE ---------- */
  function showUploading(file) {
    uploadArea.innerHTML = `
      <div class="upload-icon" style="color:#4f9eff;"><i class="fas fa-spinner fa-pulse"></i></div>
      <h3>Uploading ${file.name}…</h3>
      <p>${formatSize(file.size)} · Please wait</p>
    `;
  }

  function showSuccess(profile) {
    uploadArea.innerHTML = `
      <div class="upload-icon" style="color:#4f9eff;"><i class="fas fa-check-circle"></i></div>
      <h3>${profile.filename}</h3>
      <p>${profile.rows} rows · ${profile.columns} columns · Ready</p>
      <button class="upload-btn" id="uploadBtn" type="button">
        <i class="fas fa-folder-open"></i> Upload another
      </button>
      <input type="file" id="fileInput" accept=".csv,.xlsx,.xls,.json" style="display:none" />
    `;
    bindUploadControls();
  }

  function showError(msg) {
    uploadArea.innerHTML = `
      <div class="upload-icon" style="color:#ff6b6b;"><i class="fas fa-exclamation-triangle"></i></div>
      <h3>Upload failed</h3>
      <p>${msg}</p>
      <button class="upload-btn" id="uploadBtn" type="button">
        <i class="fas fa-redo"></i> Try again
      </button>
      <input type="file" id="fileInput" accept=".csv,.xlsx,.xls,.json" style="display:none" />
    `;
    bindUploadControls();
  }

  /* ---------- REBIND AFTER INNER HTML CHANGE ---------- */
  function bindUploadControls() {
    const area = document.getElementById('uploadArea');
    const btn  = document.getElementById('uploadBtn');
    const inp  = document.getElementById('fileInput');
    if (!area || !btn || !inp) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      inp.click();
    });
    area.addEventListener('click', () => inp.click());
    inp.addEventListener('change', handleFileSelect);
    attachDragAndDrop(area, inp);
  }

  /* ---------- HANDLE FILE SELECT ---------- */
  function handleFileSelect(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    uploadFile(file);
  }

  /* ---------- UPLOAD VIA FETCH ---------- */
  function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    showUploading(file);

    fetch('/upload', {
      method: 'POST',
      body: formData,
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok || data.error) {
          showError(data.error || 'Server error');
          return;
        }
        showSuccess(data.profile);
        addFileCard(
          data.profile.filename,
          formatSize(file.size),
          file.name.split('.').pop()
        );
      })
      .catch((err) => {
        console.error(err);
        showError('Network error');
      });
  }

  /* ---------- DRAG & DROP ---------- */
  function attachDragAndDrop(area, inp) {
    ['dragenter', 'dragover'].forEach((evt) =>
      area.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        area.classList.add('dragover');
      })
    );

    ['dragleave', 'drop'].forEach((evt) =>
      area.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        area.classList.remove('dragover');
      })
    );

    area.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length) {
        // Copy into real input so we can use the same handler
        inp.files = files;
        const evt = new Event('change', { bubbles: true });
        inp.dispatchEvent(evt);
      }
    });
  }

  /* ---------- INITIAL BIND ---------- */
  fileInput.addEventListener('change', handleFileSelect);
  attachDragAndDrop(uploadArea, fileInput);
})();