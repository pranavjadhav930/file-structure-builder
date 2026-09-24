# 📁 File Structure Builder

A browser-based tool for converting text-based project structures into downloadable ZIP archives.

## ✨ Features

- 🌳 ASCII tree parsing
- 📂 Folder structure preview
- 📄 File detection
- ✏️ File content editor
- 📦 ZIP generation
- 📋 Copy input
- 🔍 Tree search
- 🚀 Project presets
- 📱 Responsive interface
- 🔒 Client-side processing

## 🔐 Privacy

File Structure Builder is designed as a client-side application.

The application does not require:

- An account
- A database
- A backend server
- File uploads
- API keys

The entered project structure and generated ZIP archive are processed in the user's browser.

The project does not intentionally send the entered structure to a backend server.

### Important limitation

Clearing JavaScript variables or browser inputs cannot guarantee cryptographic erasure from browser memory.

Therefore, this project does not claim guaranteed secure memory erasure.

## 📦 Supported Input

### ASCII tree

```text
my-project/
├── src/
│   ├── main.js
│   └── app.js
├── public/
│   └── favicon.ico
└── package.json