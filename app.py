import os
import json
import pandas as pd
from flask import Flask, render_template, request, jsonify, redirect, url_for
from werkzeug.utils import secure_filename

app = Flask(__name__)

# ---------- CONFIG ----------
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls', 'json'}
MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50 MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ---------- HELPERS ----------
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def list_uploads():
    """Return a list of dicts describing files in the uploads folder."""
    files = []
    if os.path.exists(UPLOAD_FOLDER):
        for fname in sorted(
            os.listdir(UPLOAD_FOLDER),
            key=lambda f: os.path.getmtime(os.path.join(UPLOAD_FOLDER, f)),
            reverse=True,
        ):
            path = os.path.join(UPLOAD_FOLDER, fname)
            if os.path.isfile(path):
                size_kb = os.path.getsize(path) / 1024
                files.append({
                    'name': fname,
                    'size': f"{size_kb:.1f} KB" if size_kb < 1024 else f"{size_kb/1024:.2f} MB",
                    'ext': fname.rsplit('.', 1)[-1].lower(),
                })
    return files


def load_dataframe(path):
    """Load a dataframe from CSV / Excel / JSON."""
    ext = path.rsplit('.', 1)[-1].lower()
    if ext == 'csv':
        return pd.read_csv(path)
    if ext in ('xlsx', 'xls'):
        return pd.read_excel(path)
    if ext == 'json':
        return pd.read_json(path)
    raise ValueError("Unsupported file type")


# ---------- ROUTES ----------
@app.route('/')
def index():
    return render_template('index.html', files=list_uploads())


@app.route('/upload', methods=['POST'])
def upload():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400

    filename = secure_filename(file.filename)
    save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(save_path)

    # Try to profile the file
    try:
        df = load_dataframe(save_path)
        profile = {
            'filename': filename,
            'rows': int(df.shape[0]),
            'columns': int(df.shape[1]),
            'column_names': list(df.columns),
            'dtypes': {col: str(dtype) for col, dtype in df.dtypes.items()},
            'missing': {col: int(df[col].isna().sum()) for col in df.columns},
        }
        return jsonify({'success': True, 'profile': profile}), 200
    except Exception as e:
        return jsonify({'success': True, 'warning': f'Uploaded but could not profile: {e}'}), 200


@app.route('/files')
def files():
    return jsonify(list_uploads())


@app.route('/delete/<filename>', methods=['DELETE'])
def delete_file(filename):
    path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(filename))
    if os.path.exists(path):
        os.remove(path)
        return jsonify({'success': True}), 200
    return jsonify({'error': 'File not found'}), 404


@app.errorhandler(413)
def too_large(e):
    return jsonify({'error': 'File is too large (max 50 MB)'}), 413


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)