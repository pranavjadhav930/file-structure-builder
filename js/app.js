"use strict";


let projectTree = [];
let currentFile = null;


/* =========================================================
   DOM
========================================================= */

const input = document.getElementById("rawTextInput");
const treeContainer = document.getElementById("treeContainer");

const downloadBtn = document.getElementById("downloadZipBtn");

const lineCountBadge = document.getElementById("lineCountBadge");
const folderCountPill = document.getElementById("folderCountPill");
const fileCountPill = document.getElementById("fileCountPill");

const searchInput = document.getElementById("searchInput");

const statusToast = document.getElementById("statusToast");
const statusToastContent = document.getElementById("statusToastContent");

const libraryStatus = document.getElementById("libraryStatus");

const presetToggleBtn = document.getElementById("presetToggleBtn");
const presetMenu = document.getElementById("presetMenu");

const copyInputBtn = document.getElementById("copyInputBtn");
const copyBtnLabel = document.getElementById("copyBtnLabel");

const clearInputBtn = document.getElementById("clearInputBtn");

const closeToastBtn = document.getElementById("closeToastBtn");

const modal = document.getElementById("fileInspectorModal");
const modalFileName = document.getElementById("modalFileName");
const modalFilePath = document.getElementById("modalFilePath");
const modalFileContent = document.getElementById("modalFileContent");

const closeInspectorBtn = document.getElementById("closeInspectorBtn");
const saveInspectorBtn = document.getElementById("saveInspectorBtn");
const resetModalBoilerplateBtn =
  document.getElementById("resetModalBoilerplateBtn");


/* =========================================================
   JSZIP CHECK
========================================================= */

function isJSZipAvailable() {
  return (
    typeof window.JSZip === "function" ||
    typeof window.JSZip === "object"
  );
}


function updateLibraryStatus() {

  if (isJSZipAvailable()) {

    libraryStatus.textContent = "ZIP library ready";

    libraryStatus.className =
      "text-xs font-mono px-3 py-1 rounded-full border " +
      "text-emerald-400 bg-emerald-950/40 border-emerald-500/30";

    downloadBtn.disabled = false;

    downloadBtn.className =
      "w-full sm:w-auto px-6 py-3 text-sm font-semibold rounded-xl " +
      "bg-gradient-to-r from-indigo-600 to-violet-600 " +
      "hover:from-indigo-500 hover:to-violet-500 " +
      "text-white shadow-lg cursor-pointer active:scale-95";

  } else {

    libraryStatus.textContent = "ZIP library unavailable";

    libraryStatus.className =
      "text-xs font-mono px-3 py-1 rounded-full border " +
      "text-rose-400 bg-rose-950/40 border-rose-500/30";

    downloadBtn.disabled = true;

    downloadBtn.className =
      "w-full sm:w-auto px-6 py-3 text-sm font-semibold rounded-xl " +
      "bg-slate-700 text-slate-400 cursor-not-allowed";

    showStatus(
      "ZIP library is unavailable. Please refresh the page.",
      "error"
    );
  }
}


/*
 * Small delay allows slower mobile browsers to finish
 * loading the local JSZip file.
 */
function waitForJSZip() {

  let attempts = 0;

  const timer = setInterval(() => {

    attempts++;

    if (isJSZipAvailable()) {

      clearInterval(timer);
      updateLibraryStatus();
      return;
    }

    if (attempts >= 50) {

      clearInterval(timer);
      updateLibraryStatus();
    }

  }, 100);
}


/* =========================================================
   STATUS
========================================================= */

function showStatus(message, type = "success") {

  statusToast.classList.remove("hidden");

  statusToastContent.textContent = message;

  if (type === "error") {

    statusToast.className =
      "mt-4 p-3 rounded-xl text-xs bg-rose-950/80 " +
      "border border-rose-900 text-rose-200";

  } else {

    statusToast.className =
      "mt-4 p-3 rounded-xl text-xs bg-emerald-950/80 " +
      "border border-emerald-900 text-emerald-200";
  }
}


closeToastBtn.addEventListener("click", () => {
  statusToast.classList.add("hidden");
});


/* =========================================================
   PARSER
========================================================= */

function parseStructure(text) {

  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .filter(line => line.trim() !== "");

  const root = [];

  const stack = [
    {
      level: -1,
      children: root
    }
  ];

  lines.forEach((rawLine) => {

    let line = rawLine.trimEnd();

    /*
     * Remove tree drawing characters.
     */
    line = line
      .replace(/^[│┃| ]+/g, "")
      .replace(/^[├└┌┬┤┘┐└─—]+\s*/g, "")
      .trim();

    if (!line) return;


    /*
     * Calculate indentation.
     */
    const leadingSpaces =
      rawLine.search(/\S|$/);

    let level = Math.floor(leadingSpaces / 4);


    /*
     * ASCII tree characters usually indicate one level.
     */
    if (
      rawLine.includes("├──") ||
      rawLine.includes("└──") ||
      rawLine.includes("├─") ||
      rawLine.includes("└─")
    ) {
      level = Math.max(0, level);
    }


    /*
     * Determine folder/file.
     */
    const looksLikeFolder =
      line.endsWith("/") ||
      line.endsWith("\\") ||
      /^[^./]+$/.test(line);


    const name = line
      .replace(/[\/\\]+$/, "")
      .trim();


    const isFile =
      !looksLikeFolder ||
      /\.[a-zA-Z0-9]{1,10}$/.test(name);


    const node = {
      name,
      type: isFile ? "file" : "folder",
      content: isFile ? getBoilerplate(name) : "",
      children: []
    };


    while (
      stack.length > 1 &&
      stack[stack.length - 1].level >= level
    ) {
      stack.pop();
    }


    stack[stack.length - 1].children.push(node);


    if (node.type === "folder") {

      stack.push({
        level,
        children: node.children
      });
    }

  });

  return root;
}


/* =========================================================
   BOILERPLATE
========================================================= */

function getBoilerplate(filename) {

  const lower = filename.toLowerCase();

  if (lower === "index.html") {

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>My Project</title>
</head>
<body>
  <h1>Hello World</h1>
</body>
</html>`;
  }


  if (lower.endsWith(".html")) {

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${filename}</title>
</head>
<body>

</body>
</html>`;
  }


  if (lower.endsWith(".css")) {

    return `/* ${filename} */

body {
  margin: 0;
  font-family: sans-serif;
}`;
  }


  if (lower.endsWith(".js")) {

    return `// ${filename}

console.log("Hello from ${filename}");`;
  }


  if (lower.endsWith(".json")) {

    return `{
  "name": "my-project"
}`;
  }


  if (lower.endsWith(".py")) {

    return `# ${filename}

def main():
    print("Hello World")


if __name__ == "__main__":
    main()
`;
  }


  if (lower === "readme.md") {

    return `# My Project

Project description goes here.
`;
  }


  if (lower === ".gitignore") {

    return `node_modules/
.env
dist/
build/
`;
  }


  return "";
}


/* =========================================================
   COUNTS
========================================================= */

function countNodes(nodes) {

  let folders = 0;
  let files = 0;


  function walk(list) {

    list.forEach(node => {

      if (node.type === "folder") {

        folders++;
        walk(node.children);

      } else {

        files++;
      }

    });
  }


  walk(nodes);

  return {
    folders,
    files
  };
}


/* =========================================================
   RENDER TREE
========================================================= */

function renderTree(nodes, container = treeContainer, depth = 0) {

  container.innerHTML = "";

  if (!nodes.length) {

    container.innerHTML =
      `<div class="text-slate-500 text-sm text-center py-10">
        Enter a project structure to see the preview.
      </div>`;

    return;
  }


  function createNodes(list, parent, currentDepth) {

    list.forEach(node => {

      const row = document.createElement("div");

      row.className =
        "flex items-center gap-2 px-3 py-2 rounded-lg " +
        "hover:bg-slate-800/80 cursor-pointer text-sm";


      row.style.paddingLeft =
        `${12 + currentDepth * 20}px`;


      const icon =
        node.type === "folder"
          ? "📁"
          : getFileIcon(node.name);


      const name = document.createElement("span");

      name.textContent = node.name;

      name.className =
        node.type === "folder"
          ? "text-amber-300"
          : "text-slate-300 font-mono text-xs";


      row.innerHTML = `
        <span>${icon}</span>
      `;

      row.appendChild(name);


      if (node.type === "file") {

        row.addEventListener("click", () => {

          openFileEditor(node);

        });

      }


      parent.appendChild(row);


      if (node.children && node.children.length) {

        createNodes(
          node.children,
          parent,
          currentDepth + 1
        );
      }

    });
  }


  createNodes(nodes, container, depth);
}


function getFileIcon(filename) {

  const lower = filename.toLowerCase();

  if (lower.endsWith(".js")) return "🟨";
  if (lower.endsWith(".html")) return "🌐";
  if (lower.endsWith(".css")) return "🎨";
  if (lower.endsWith(".json")) return "⚙️";
  if (lower.endsWith(".py")) return "🐍";
  if (lower.endsWith(".md")) return "📝";

  return "📄";
}


/* =========================================================
   UPDATE UI
========================================================= */

function updateProject() {

  projectTree = parseStructure(input.value);

  const counts = countNodes(projectTree);


  lineCountBadge.textContent =
    `${input.value.split(/\r?\n/).length} lines`;


  folderCountPill.textContent =
    `📁 ${counts.folders} folders`;


  fileCountPill.textContent =
    `📄 ${counts.files} files`;


  renderTree(projectTree);
}


input.addEventListener("input", updateProject);


/* =========================================================
   SEARCH
========================================================= */

searchInput.addEventListener("input", () => {

  const query =
    searchInput.value.trim().toLowerCase();


  if (!query) {

    renderTree(projectTree);
    return;
  }


  const filtered = [];


  function filterNodes(nodes) {

    const result = [];

    nodes.forEach(node => {

      const matches =
        node.name.toLowerCase().includes(query);


      const childMatches =
        node.children &&
        filterNodes(node.children);


      if (matches || childMatches.length) {

        result.push({
          ...node,
          children: childMatches
        });
      }

    });

    return result;
  }


  const result = filterNodes(projectTree);

  renderTree(result);
});


/* =========================================================
   CLEAR
========================================================= */

clearInputBtn.addEventListener("click", () => {

  input.value = "";

  updateProject();

});


/* =========================================================
   COPY
========================================================= */

copyInputBtn.addEventListener("click", async () => {

  try {

    await navigator.clipboard.writeText(input.value);

    copyBtnLabel.textContent = "Copied!";

    setTimeout(() => {

      copyBtnLabel.textContent = "Copy";

    }, 1500);

  } catch {

    showStatus(
      "Unable to copy text.",
      "error"
    );
  }

});


/* =========================================================
   PRESETS
========================================================= */

const presets = {

  "react-vite": `react-app/
├── src/
│   ├── components/
│   │   └── App.jsx
│   ├── main.jsx
│   └── styles.css
├── public/
│   └── favicon.ico
├── index.html
├── package.json
├── vite.config.js
└── README.md`,

  "express-api": `express-api/
├── src/
│   ├── controllers/
│   │   └── userController.js
│   ├── routes/
│   │   └── userRoutes.js
│   ├── middleware/
│   │   └── auth.js
│   └── server.js
├── package.json
└── README.md`,

  "nextjs-app": `next-app/
├── app/
│   ├── layout.js
│   ├── page.js
│   └── globals.css
├── public/
├── package.json
├── next.config.js
└── README.md`,

  "python-pkg": `python-project/
├── src/
│   └── mypackage/
│       ├── __init__.py
│       └── main.py
├── tests/
│   └── test_main.py
├── pyproject.toml
├── README.md
└── .gitignore`
};


presetToggleBtn.addEventListener("click", () => {

  presetMenu.classList.toggle("hidden");

});


document.querySelectorAll(".preset-option-btn")
  .forEach(button => {

    button.addEventListener("click", () => {

      const preset =
        button.dataset.preset;

      input.value =
        presets[preset] || "";

      presetMenu.classList.add("hidden");

      updateProject();

    });

  });


/* =========================================================
   FILE EDITOR
========================================================= */

function openFileEditor(node) {

  currentFile = node;

  modalFileName.textContent =
    node.name;

  modalFilePath.textContent =
    node.name;

  modalFileContent.value =
    node.content || "";

  modal.classList.remove("hidden");
}


closeInspectorBtn.addEventListener("click", () => {

  modal.classList.add("hidden");

});


saveInspectorBtn.addEventListener("click", () => {

  if (!currentFile) return;

  currentFile.content =
    modalFileContent.value;

  modal.classList.add("hidden");

  showStatus(
    `${currentFile.name} saved.`,
    "success"
  );

});


resetModalBoilerplateBtn.addEventListener("click", () => {

  if (!currentFile) return;

  modalFileContent.value =
    getBoilerplate(currentFile.name);

});


/* =========================================================
   ZIP GENERATION
========================================================= */

function addNodesToZip(zip, nodes, currentPath = "") {

  nodes.forEach(node => {

    const safeName =
      node.name.replace(/^[/\\]+/, "");

    const path =
      currentPath
        ? `${currentPath}/${safeName}`
        : safeName;


    if (node.type === "folder") {

      /*
       * Explicitly create the folder.
       */
      zip.folder(path);

      addNodesToZip(
        zip,
        node.children,
        path
      );

    } else {

      zip.file(
        path,
        node.content || ""
      );
    }

  });
}


async function downloadZip() {

  /*
   * Final safety check.
   */
  if (!isJSZipAvailable()) {

    showStatus(
      "ZIP library is unavailable. Please refresh the page.",
      "error"
    );

    return;
  }


  if (!projectTree.length) {

    showStatus(
      "Please enter a project structure first.",
      "error"
    );

    return;
  }


  try {

    downloadBtn.disabled = true;

    downloadBtn.textContent =
      "Creating ZIP...";


    const zip =
      new window.JSZip();


    addNodesToZip(
      zip,
      projectTree
    );


    const blob =
      await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
          level: 6
        }
      });


    /*
     * Mobile-friendly download.
     */
    const url =
      URL.createObjectURL(blob);


    const anchor =
      document.createElement("a");

    anchor.href = url;

    anchor.download =
      getZipFilename();


    anchor.style.display = "none";

    document.body.appendChild(anchor);

    anchor.click();

    /*
     * Give mobile browsers time to start
     * the download before removing the object.
     */
    setTimeout(() => {

      anchor.remove();

      URL.revokeObjectURL(url);

    }, 1500);


    showStatus(
      "ZIP archive created successfully.",
      "success"
    );


  } catch (error) {

    console.error(
      "ZIP generation error:",
      error
    );

    showStatus(
      "Could not create ZIP: " +
      error.message,
      "error"
    );

  } finally {

    downloadBtn.disabled = false;

    downloadBtn.textContent =
      "Download ZIP";

  }
}


downloadBtn.addEventListener(
  "click",
  downloadZip
);


/* =========================================================
   ZIP NAME
========================================================= */

function getZipFilename() {

  const first =
    projectTree[0];

  if (
    first &&
    first.type === "folder" &&
    first.name
  ) {

    return (
      first.name
        .replace(/[^a-zA-Z0-9_-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
      || "project"
    ) + ".zip";
  }


  return "project-structure.zip";
}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /*
   * Wait for local JSZip.
   */
  waitForJSZip();

  /*
   * Initial UI.
   */
  updateProject();

});
