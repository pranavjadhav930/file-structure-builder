"use strict";

/*
=========================================================
FILE STRUCTURE BUILDER
Production Client-Side Application
=========================================================

Privacy model:

- No backend
- No database
- No authentication
- No intentional upload of user input
- File structures are processed in the browser
- ZIP generation happens locally

Important:
Clearing JavaScript references does not guarantee
cryptographic erasure from browser memory.
=========================================================
*/


/* ========================================================
   APPLICATION STATE
======================================================== */

const state = {

  currentParsedTree: null,

  nodeIndexMap: new Map(),

  nodeCounter: 0,

  totalFolders: 0,

  totalFiles: 0,

  activeInspectorNode: null

};


/* ========================================================
   TEMPLATES
======================================================== */

const TEMPLATES = {

  "react-vite": `my-react-app/
├── public/
│   ├── favicon.ico
│   └── vite.svg
├── src/
│   ├── assets/
│   │   └── logo.svg
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   └── Card.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   └── About.jsx
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   └── index.css
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
└── README.md`,



  "express-api": `my-express-api/
├── src/
│   ├── config/
│   │   ├── db.js
│   │   └── env.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── userRoutes.js
│   └── app.js
├── .env.example
├── .gitignore
├── Dockerfile
├── package.json
└── README.md`,



  "nextjs-app": `my-next-project/
├── app/
│   ├── api/
│   │   └── users/
│   │       └── route.js
│   ├── dashboard/
│   │   ├── page.jsx
│   │   └── layout.jsx
│   ├── globals.css
│   ├── layout.jsx
│   └── page.jsx
├── components/
│   ├── button.jsx
│   └── modal.jsx
├── public/
├── .env.example
├── next.config.js
├── package.json
└── README.md`,



  "python-pkg": `my_python_pkg/
├── src/
│   └── my_pkg/
│       ├── __init__.py
│       ├── core.py
│       └── cli.py
├── tests/
│   └── test_core.py
├── pyproject.toml
├── README.md
└── requirements.txt`

};


/* ========================================================
   DOM HELPERS
======================================================== */

function $(id) {

  return document.getElementById(id);

}


/* ========================================================
   INPUT SANITIZATION
======================================================== */

function sanitizeName(name) {

  if (!name) {
    return "";
  }

  let clean = String(name).trim();

  // Remove comments
  clean = clean.replace(
    /\s*(?:#|\/\/).*$/,
    ""
  );

  // Remove leading/trailing separators
  clean = clean.replace(
    /^[\/\\]+|[\/\\]+$/g,
    ""
  );

  // Replace characters invalid on Windows
  clean = clean.replace(
    /[:*?"<>|]/g,
    "_"
  );

  // Prevent dangerous path traversal
  clean = clean.replace(
    /\.\.(?=\/|\\|$)/g,
    "_"
  );

  clean = clean
    .trim()
    .replace(/\.+$/, "");

  return clean;

}


/* ========================================================
   BOILERPLATE GENERATOR
======================================================== */

function getBoilerplateContent(filename) {

  if (!filename) {
    return "";
  }

  const lower = filename.toLowerCase();


  if (lower === "package.json") {

    return `{
  "name": "my-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "node index.js",
    "dev": "vite"
  }
}`;

  }


  if (lower === ".gitignore") {

    return `node_modules/
dist/
.env
.env.*
!.env.example
*.log
.DS_Store
`;

  }


  if (lower === "dockerfile") {

    return `FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
`;

  }


  if (lower === "readme.md") {

    return `# Project Title

Generated with File Structure Builder.

This project structure was generated locally in your browser.
`;

  }


  if (lower.endsWith(".html")) {

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>App</title>
</head>
<body>

    <h1>Hello World</h1>

</body>
</html>
`;

  }


  if (lower.endsWith(".css")) {

    return `/* Custom Styles */

body {
  margin: 0;
  background-color: #0f172a;
  color: #f8fafc;
  font-family: sans-serif;
}
`;

  }


  if (
    lower.endsWith(".jsx") ||
    lower.endsWith(".tsx")
  ) {

    const baseName =
      filename.split(".")[0] || "Component";

    const componentName =
      baseName.charAt(0).toUpperCase() +
      baseName.slice(1);

    return `import React from "react";

export default function ${componentName}() {
  return (
    <div>
      <h2>${componentName} Component</h2>
    </div>
  );
}
`;

  }


  if (
    lower.endsWith(".js") ||
    lower.endsWith(".ts")
  ) {

    return `/**
 * ${filename}
 */

export function main() {
  console.log("Running ${filename}");
}

main();
`;

  }


  if (lower.endsWith(".py")) {

    return `"""
${filename}
"""

def main():
    print("Running ${filename}")


if __name__ == "__main__":
    main()
`;

  }


  if (lower.endsWith(".json")) {

    return `{
  "status": "ok"
}
`;

  }


  return `/* ${filename} */
`;

}


/* ========================================================
   NODE CREATION
======================================================== */

function createSafeNode(
  name,
  type,
  path
) {

  state.nodeCounter++;

  const safeId =
    `node_${state.nodeCounter}`;

  const safeName =
    sanitizeName(name);

  const node = {

    id: safeId,

    name: safeName,

    type,

    path,

    children:
      type === "folder"
        ? []
        : undefined

  };

  state.nodeIndexMap.set(
    safeId,
    node
  );

  return node;

}


/* ========================================================
   PARSE INPUT
======================================================== */

function parseFileStructure(rawText) {

  state.nodeIndexMap.clear();

  state.nodeCounter = 0;

  if (
    !rawText ||
    !rawText.trim()
  ) {

    return null;

  }


  let cleaned =
    rawText.trim();


  // Remove markdown code fences
  cleaned =
    cleaned
      .replace(
        /^```[a-zA-Z]*\s*/gm,
        ""
      )
      .replace(
        /```\s*$/gm,
        ""
      );


  const lines =
    cleaned
      .split(/\r?\n/)
      .filter(
        line => line.trim().length > 0
      );


  if (!lines.length) {
    return null;
  }


  const isPathList =
    lines.every(
      line =>
        line.trim().includes("/") &&
        !/[├└│|]/.test(
          line.trim()
        )
    );


  return isPathList
    ? parsePathList(lines)
    : parseAsciiTree(lines);

}


/* ========================================================
   PATH LIST PARSER
======================================================== */

function parsePathList(lines) {

  const rootNode =
    createSafeNode(
      "project",
      "folder",
      ""
    );

  const map =
    new Map();


  for (const line of lines) {

    let clean =
      line
        .trim()
        .replace(/\\/g, "/");


    if (clean.startsWith("./")) {

      clean =
        clean.substring(2);

    }


    const parts =
      clean
        .split("/")
        .filter(Boolean);


    let currentPath = "";

    let parent = rootNode;


    parts.forEach(
      (rawPart, index) => {

        const isLast =
          index === parts.length - 1;

        const isFolder =
          !isLast ||
          rawPart.endsWith("/");


        const part =
          sanitizeName(
            rawPart
              .replace(/\/$/, "")
          );


        if (!part) {
          return;
        }


        currentPath =
          currentPath
            ? `${currentPath}/${part}`
            : part;


        let node =
          map.get(currentPath);


        if (!node) {

          node =
            createSafeNode(
              part,
              isFolder
                ? "folder"
                : "file",
              currentPath
            );

          map.set(
            currentPath,
            node
          );


          parent.children.push(
            node
          );

        }


        if (
          node.type === "folder"
        ) {

          parent = node;

        }

      }
    );

  }


  if (
    rootNode.children.length === 1 &&
    rootNode.children[0].type === "folder"
  ) {

    return rootNode.children[0];

  }


  return rootNode;

}


/* ========================================================
   ASCII TREE PARSER
======================================================== */

function parseAsciiTree(lines) {

  const parsed =
    lines
      .map(line => {

        let clean =
          line.replace(
            /\s*(?:#|\/\/).*$/,
            ""
          );


        const nameMatch =
          clean.match(
            /^[\s\t│|├└+─\-]+/
          );


        if (!nameMatch) {

          const trimmed =
            clean.trim();

          if (!trimmed) {
            return null;
          }


          const explicitFolder =
            trimmed.endsWith("/");


          return {

            depth: 0,

            name:
              sanitizeName(
                explicitFolder
                  ? trimmed.slice(0, -1)
                  : trimmed
              ),

            isExplicitFolder:
              explicitFolder

          };

        }


        const prefix =
          nameMatch[0];


        let name =
          clean
            .substring(prefix.length)
            .trim();


        if (!name) {
          return null;
        }


        const isExplicitFolder =
          name.endsWith("/");


        if (isExplicitFolder) {

          name =
            name.slice(0, -1);

        }


        const branchIndex =
          prefix.search(/[├└+]/);


        let depth = 1;


        if (branchIndex >= 0) {

          const indent =
            prefix
              .substring(0, branchIndex)
              .replace(/\t/g, "    ");


          depth =
            1 +
            Math.floor(
              indent.length / 4
            );

        } else {

          const expanded =
            prefix.replace(
              /\t/g,
              "    "
            );


          depth =
            Math.max(
              1,
              Math.floor(
                expanded.length / 2
              )
            );

        }


        return {

          depth,

          name:
            sanitizeName(name),

          isExplicitFolder

        };

      })
      .filter(Boolean);


  if (!parsed.length) {
    return null;
  }


  const rootLine =
    parsed[0];


  const rootNode =
    createSafeNode(
      rootLine.name || "project",
      "folder",
      rootLine.name
    );


  const stack = [
    {
      node: rootNode,
      depth: rootLine.depth
    }
  ];


  for (
    let i = 1;
    i < parsed.length;
    i++
  ) {

    const current =
      parsed[i];

    const next =
      parsed[i + 1];


    const nextIsDeeper =
      next &&
      next.depth > current.depth;


    const hasExtension =
      current.name.includes(".") &&
      !current.name.startsWith(".");


    const isFolder =
      current.isExplicitFolder ||
      nextIsDeeper ||
      !hasExtension;


    while (
      stack.length > 1 &&
      stack[
        stack.length - 1
      ].depth >= current.depth
    ) {

      stack.pop();

    }


    const parent =
      stack[
        stack.length - 1
      ].node;


    const itemPath =
      parent.path
        ? `${parent.path}/${current.name}`
        : current.name;


    const node =
      createSafeNode(
        current.name,
        isFolder
          ? "folder"
          : "file",
        itemPath
      );


    if (!parent.children) {
      parent.children = [];
    }


    parent.children.push(node);


    if (isFolder) {

      stack.push({

        node,

        depth: current.depth

      });

    }

  }


  return rootNode;

}


/* ========================================================
   UPDATE APPLICATION
======================================================== */

function handleInputUpdate() {

  const raw =
    $("rawTextInput").value;


  const lines =
    raw
      ? raw.split("\n").length
      : 0;


  $("lineCountBadge").textContent =
    `${lines} ${
      lines === 1
        ? "line"
        : "lines"
    }`;


  state.currentParsedTree =
    parseFileStructure(raw);


  state.totalFolders = 0;

  state.totalFiles = 0;


  if (
    state.currentParsedTree
  ) {

    prepareTree(
      state.currentParsedTree
    );

  }


  $("folderCountPill").textContent =
    `📁 ${state.totalFolders} folders`;


  $("fileCountPill").textContent =
    `📄 ${state.totalFiles} files`;


  renderTreeDOM();

}


/* ========================================================
   PREPARE TREE
======================================================== */

function prepareTree(node) {

  if (node.type === "folder") {

    state.totalFolders++;


    if (node.children) {

      node.children.forEach(
        prepareTree
      );

    }

    return;

  }


  state.totalFiles++;


  if (
    node.content === undefined
  ) {

    node.content =
      getBoilerplateContent(
        node.name
      );

  }

}


/* ========================================================
   ESCAPE HTML
======================================================== */

function escapeHTML(value) {

  return String(value)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


/* ========================================================
   TREE SEARCH
======================================================== */

function nodeMatchesSearch(
  node,
  query
) {

  if (!query) {
    return true;
  }


  if (
    node.name
      .toLowerCase()
      .includes(query)
  ) {

    return true;

  }


  if (
    node.type === "folder" &&
    node.children
  ) {

    return node.children.some(
      child =>
        nodeMatchesSearch(
          child,
          query
        )
    );

  }


  return false;

}


/* ========================================================
   TREE RENDER
======================================================== */

function renderTreeDOM() {

  const container =
    $("treeContainer");


  const query =
    $("searchInput")
      .value
      .toLowerCase()
      .trim();


  if (
    !state.currentParsedTree
  ) {

    container.innerHTML = `

      <div class="tree-empty">

        <div style="font-size:40px">
          📁
        </div>

        <p>
          No folder structure parsed yet.
        </p>

      </div>

    `;

    return;

  }


  function buildNodeHTML(node) {

    if (
      !nodeMatchesSearch(
        node,
        query
      )
    ) {

      return "";

    }


    const isFolder =
      node.type === "folder";


    const icon =
      isFolder
        ? "📁"
        : "📄";


    let childrenHTML = "";


    if (
      isFolder &&
      node.children &&
      node.children.length
    ) {

      childrenHTML = `

        <div class="tree-children">

          ${node.children
            .map(buildNodeHTML)
            .join("")}

        </div>

      `;

    }


    const safeName =
      escapeHTML(node.name);


    const safeId =
      escapeHTML(node.id);


    const itemCount =
      node.children
        ? node.children.length
        : 0;


    return `

      <div class="tree-node">

        <div
          class="tree-row"
          data-node-id="${safeId}"
          data-node-type="${isFolder ? "folder" : "file"}"
        >

          <div
            style="
              display:flex;
              align-items:center;
              gap:8px;
              min-width:0;
            "
          >

            <span>
              ${isFolder ? "▼" : ""}
            </span>

            <span>
              ${icon}
            </span>

            <span
              class="tree-name ${
                isFolder
                  ? "folder-name"
                  : "file-name"
              }"
            >
              ${safeName}
            </span>

          </div>


          <div>

            ${
              isFolder

                ? `
                  <span
                    style="
                      color:#64748b;
                      font-size:9px;
                    "
                  >
                    ${itemCount} items
                  </span>
                `

                : `
                  <button
                    class="inspect-btn"
                    data-node-id="${safeId}"
                    type="button"
                  >
                    Edit
                  </button>
                `
            }

          </div>

        </div>


        ${childrenHTML}

      </div>

    `;

  }


  container.innerHTML =
    buildNodeHTML(
      state.currentParsedTree
    );

}


/* ========================================================
   ZIP DOWNLOAD
======================================================== */

function triggerDownload(
  blob,
  filename
) {

  const url =
    URL.createObjectURL(blob);


  const link =
    document.createElement("a");


  link.href = url;

  link.download = filename;

  link.style.display = "none";


  document.body.appendChild(
    link
  );


  link.click();


  setTimeout(() => {

    link.remove();

    URL.revokeObjectURL(url);

  }, 1000);

}


/* ========================================================
   ADD TREE TO ZIP
======================================================== */

function addNodeToZip(
  node,
  folderZip
) {

  const cleanName =
    sanitizeName(node.name);


  if (!cleanName) {
    return;
  }


  if (
    node.type === "folder"
  ) {

    const subFolder =
      folderZip.folder(
        cleanName
      );


    if (
      node.children
    ) {

      node.children.forEach(
        child =>
          addNodeToZip(
            child,
            subFolder
          )
      );

    }


    return;

  }


  folderZip.file(
    cleanName,
    node.content || ""
  );

}


/* ========================================================
   DOWNLOAD ZIP
======================================================== */

async function handleDownloadZip() {

  try {

    if (
      !state.currentParsedTree
    ) {

      const raw =
        $("rawTextInput")
          .value;


      if (
        raw &&
        raw.trim()
      ) {

        handleInputUpdate();

      }

    }


    if (
      !state.currentParsedTree
    ) {

      showToast(
        "Please enter a folder structure first.",
        "error"
      );

      return;

    }


    if (
      typeof JSZip === "undefined"
    ) {

      showToast(
        "ZIP library is unavailable. Please refresh the page.",
        "error"
      );

      return;

    }


    showToast(
      "Generating ZIP package...",
      "info"
    );


    const zip =
      new JSZip();


    const rootName =
      sanitizeName(
        state.currentParsedTree.name
      ) || "project";


    const rootZip =
      zip.folder(rootName);


    if (
      state.currentParsedTree.children
    ) {

      state.currentParsedTree.children.forEach(
        child =>
          addNodeToZip(
            child,
            rootZip
          )
      );

    }


    const blob =
      await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
          level: 6
        }
      });


    triggerDownload(
      blob,
      `${rootName}.zip`
    );


    showToast(
      `✅ Generated ${rootName}.zip`,
      "success"
    );


    /*
      Clear the temporary generated ZIP reference.

      Note:
      This does not guarantee cryptographic erasure
      from browser memory.
    */

    state.activeInspectorNode = null;


  } catch (error) {

    console.error(
      "ZIP generation error:",
      error
    );


    showToast(
      "Unable to generate ZIP: " +
      error.message,
      "error"
    );

  }

}


/* ========================================================
   PURGE INPUT
======================================================== */

function purgeMemoryAndInput() {

  $("rawTextInput").value = "";

  state.currentParsedTree = null;

  state.nodeIndexMap.clear();

  state.nodeCounter = 0;

  state.totalFolders = 0;

  state.totalFiles = 0;

  state.activeInspectorNode = null;


  renderTreeDOM();


  $("lineCountBadge").textContent =
    "0 lines";


  $("folderCountPill").textContent =
    "📁 0 folders";


  $("fileCountPill").textContent =
    "📄 0 files";

}


/* ========================================================
   TOAST
======================================================== */

function showToast(
  message,
  type = "info"
) {

  const toast =
    $("statusToast");


  const content =
    $("statusToastContent");


  toast.classList.remove(
    "hidden",
    "info",
    "success",
    "error"
  );


  toast.classList.add(
    type
  );


  content.textContent =
    message;

}


/* ========================================================
   FILE INSPECTOR
======================================================== */

function openInspectorNode(
  id
) {

  const node =
    state.nodeIndexMap.get(id);


  if (!node) {
    return;
  }


  state.activeInspectorNode =
    node;


  $("modalFileName")
    .textContent =
    node.name;


  $("modalFilePath")
    .textContent =
    node.path;


  $("modalFileContent")
    .value =
    node.content || "";


  $("fileInspectorModal")
    .classList.remove(
      "hidden"
    );

}


function closeInspector() {

  $("fileInspectorModal")
    .classList.add(
      "hidden"
    );


  state.activeInspectorNode =
    null;

}


/* ========================================================
   COPY
======================================================== */

async function copyInput() {

  const text =
    $("rawTextInput")
      .value;


  if (!text) {

    showToast(
      "There is nothing to copy.",
      "info"
    );

    return;

  }


  try {

    await navigator.clipboard.writeText(
      text
    );


    $("copyBtnLabel")
      .textContent =
      "Copied";


    setTimeout(() => {

      $("copyBtnLabel")
        .textContent =
        "Copy";

    }, 1500);


  } catch (error) {

    showToast(
      "Clipboard access was blocked by the browser.",
      "error"
    );

  }

}


/* ========================================================
   INITIALIZATION
======================================================== */

function initializeApp() {

  /*
    Input
  */

  $("rawTextInput")
    .addEventListener(
      "input",
      handleInputUpdate
    );


  /*
    Search
  */

  $("searchInput")
    .addEventListener(
      "input",
      renderTreeDOM
    );


  /*
    Preset menu
  */

  $("presetToggleBtn")
    .addEventListener(
      "click",
      event => {

        event.stopPropagation();

        $("presetMenu")
          .classList.toggle(
            "hidden"
          );

      }
    );


  document.addEventListener(
    "click",
    () => {

      $("presetMenu")
        .classList.add(
          "hidden"
        );

    }
  );


  /*
    Presets
  */

  document
    .querySelectorAll(
      ".preset-option-btn"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          event.stopPropagation();


          const preset =
            button.dataset.preset;


          if (
            !TEMPLATES[preset]
          ) {

            return;

          }


          $("rawTextInput")
            .value =
            TEMPLATES[preset];


          $("presetMenu")
            .classList.add(
              "hidden"
            );


          handleInputUpdate();

        }
      );

    });


  /*
    Copy
  */

  $("copyInputBtn")
    .addEventListener(
      "click",
      copyInput
    );


  /*
    Clear
  */

  $("clearInputBtn")
    .addEventListener(
      "click",
      purgeMemoryAndInput
    );


  /*
    Download
  */

  $("downloadZipBtn")
    .addEventListener(
      "click",
      handleDownloadZip
    );


  /*
    Tree clicks
  */

  $("treeContainer")
    .addEventListener(
      "click",
      event => {

        const inspectButton =
          event.target.closest(
            ".inspect-btn"
          );


        if (
          inspectButton
        ) {

          event.stopPropagation();


          openInspectorNode(
            inspectButton.dataset.nodeId
          );


          return;

        }


        const row =
          event.target.closest(
            ".tree-row"
          );


        if (!row) {
          return;
        }


        if (
          row.dataset.nodeType ===
          "file"
        ) {

          openInspectorNode(
            row.dataset.nodeId
          );

        }

      }
    );


  /*
    Modal
  */

  $("closeInspectorBtn")
    .addEventListener(
      "click",
      closeInspector
    );


  $("fileInspectorModal")
    .addEventListener(
      "click",
      event => {

        if (
          event.target ===
          $("fileInspectorModal")
        ) {

          closeInspector();

        }

      }
    );


  /*
    Save file content
  */

  $("saveInspectorBtn")
    .addEventListener(
      "click",
      () => {

        if (
          state.activeInspectorNode
        ) {

          state.activeInspectorNode.content =
            $("modalFileContent")
              .value;

        }


        closeInspector();


        showToast(
          "File changes saved.",
          "success"
        );

      }
    );


  /*
    Reset boilerplate
  */

  $("resetModalBoilerplateBtn")
    .addEventListener(
      "click",
      () => {

        if (
          state.activeInspectorNode
        ) {

          $("modalFileContent")
            .value =
            getBoilerplateContent(
              state.activeInspectorNode.name
            );

        }

      }
    );


  /*
    Close toast
  */

  $("closeToastBtn")
    .addEventListener(
      "click",
      () => {

        $("statusToast")
          .classList.add(
            "hidden"
          );

      }
    );


  /*
    ESC key
  */

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape"
      ) {

        closeInspector();

        $("presetMenu")
          .classList.add(
            "hidden"
          );

      }

    }
  );


  /*
    Default template
  */

  $("rawTextInput")
    .value =
    TEMPLATES["react-vite"];


  handleInputUpdate();

}


/* ========================================================
   START APP
======================================================== */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initializeApp
  );

} else {

  initializeApp();

}