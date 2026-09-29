# AI Data Analyst

A beautiful, glassmorphic Flask web app that lets you upload CSV / Excel / JSON files and instantly profile them.

## Features
- 🎨 Animated aurora + floating-orb background
- 💎 Glassmorphism UI (header, main panel, dropzone)
- 📁 Drag & drop file upload (max 50 MB)
- 📊 Auto-profile: rows, columns, dtypes, missing values
- 🗂️ Recent uploads panel
- 🗑️ REST endpoint to delete files

## Project Structure
ai_data_analyst/
├── app.py
├── requirements.txt
├── README.md
├── uploads/
├── templates/index.html
├── static/
│   ├── style.css
│   └── script.js
└── venv/

## Setup
```bash
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py