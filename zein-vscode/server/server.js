const {
  createConnection,
  TextDocuments,
  DiagnosticSeverity,
  Diagnostic,
  CompletionItemKind,
  InsertTextFormat,
} = require("vscode-languageserver/node");
const { TextDocument } = require("vscode-languageserver-textdocument");
const { execFileSync, execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const connection = createConnection();
const documents = new TextDocuments(TextDocument);

let zeinPath;
let diagTimer = {};

const completions = [
  { label: "module", kind: CompletionItemKind.Keyword, detail: "module name { }", insertText: "module ${1} {\n  ${2}\n}", insertTextFormat: InsertTextFormat.Snippet },
  { label: "import", kind: CompletionItemKind.Keyword, detail: "import path as alias", insertText: "import ${1} as ${2}", insertTextFormat: InsertTextFormat.Snippet },
  { label: "fn",     kind: CompletionItemKind.Keyword, detail: "fn name() { }", insertText: "fn ${1}(${2}) {\n  ${3}\n}", insertTextFormat: InsertTextFormat.Snippet },
  { label: "let",    kind: CompletionItemKind.Keyword, detail: "let name = value", insertText: "let ${1} = ${2}", insertTextFormat: InsertTextFormat.Snippet },
  { label: "type",   kind: CompletionItemKind.Keyword, detail: "type Name { Variant }", insertText: "type ${1} {\n  ${2}\n}", insertTextFormat: InsertTextFormat.Snippet },
  { label: "if",     kind: CompletionItemKind.Keyword, detail: "if { }", insertText: "if ${1} {\n  ${2}\n}", insertTextFormat: InsertTextFormat.Snippet },
  { label: "else",   kind: CompletionItemKind.Keyword, detail: "else { }", insertText: "else {\n  ${1}\n}", insertTextFormat: InsertTextFormat.Snippet },
  { label: "else if", kind: CompletionItemKind.Keyword, detail: "else if { }", insertText: "else if ${1} {\n  ${2}\n}", insertTextFormat: InsertTextFormat.Snippet },
  { label: "while",  kind: CompletionItemKind.Keyword, detail: "while { }", insertText: "while ${1} {\n  ${2}\n}", insertTextFormat: InsertTextFormat.Snippet },
  { label: "for",    kind: CompletionItemKind.Keyword, detail: "for x in iter { }", insertText: "for ${1} in ${2} {\n  ${3}\n}", insertTextFormat: InsertTextFormat.Snippet },
  { label: "match",  kind: CompletionItemKind.Keyword, detail: "match expr { }", insertText: "match ${1} {\n  ${2}\n}", insertTextFormat: InsertTextFormat.Snippet },
  { label: "return", kind: CompletionItemKind.Keyword, detail: "return value", insertText: "return ${1}", insertTextFormat: InsertTextFormat.Snippet },
  { label: "true",   kind: CompletionItemKind.Keyword, detail: "boolean true", insertText: "true", insertTextFormat: InsertTextFormat.Snippet },
  { label: "false",  kind: CompletionItemKind.Keyword, detail: "boolean false", insertText: "false", insertTextFormat: InsertTextFormat.Snippet },
  { label: "_",      kind: CompletionItemKind.Keyword, detail: "wildcard", insertText: "_", insertTextFormat: InsertTextFormat.Snippet },
  { label: "as",     kind: CompletionItemKind.Keyword, detail: "import alias", insertText: "as", insertTextFormat: InsertTextFormat.Snippet },
  { label: "in",     kind: CompletionItemKind.Keyword, detail: "iterator keyword", insertText: "in", insertTextFormat: InsertTextFormat.Snippet },

  { label: "Int",    kind: CompletionItemKind.TypeParameter, detail: "integer type", insertText: "Int", insertTextFormat: InsertTextFormat.Snippet },
  { label: "Float",  kind: CompletionItemKind.TypeParameter, detail: "float type", insertText: "Float", insertTextFormat: InsertTextFormat.Snippet },
  { label: "String", kind: CompletionItemKind.TypeParameter, detail: "string type", insertText: "String", insertTextFormat: InsertTextFormat.Snippet },
  { label: "Bool",   kind: CompletionItemKind.TypeParameter, detail: "boolean type", insertText: "Bool", insertTextFormat: InsertTextFormat.Snippet },
  { label: "Nil",    kind: CompletionItemKind.TypeParameter, detail: "unit type", insertText: "Nil", insertTextFormat: InsertTextFormat.Snippet },
  { label: "List",   kind: CompletionItemKind.TypeParameter, detail: "list type", insertText: "List", insertTextFormat: InsertTextFormat.Snippet },

  { label: "print",  kind: CompletionItemKind.Function, detail: "print(value)", insertText: "print(${1})", insertTextFormat: InsertTextFormat.Snippet },
];

function findZeinBinary() {
  const searchPaths = [
    path.join(__dirname, "..", "..", "zeinc"),
    path.join(__dirname, "..", "..", "zein"),
  ];
  for (const p of searchPaths) {
    try {
      execFileSync(p, ["--version"], { encoding: "utf-8", timeout: 2000, stdio: "ignore" });
      return p;
    } catch {}
  }
  for (const name of ["zeinc", "zein"]) {
    try {
      const which = execSync("which " + name, { encoding: "utf-8" }).trim();
      return which;
    } catch {}
  }
  return null;
}

function extractFileIdentifiers(text) {
  const idents = [];
  const fnRe = /(?:^|\n)\s*(?:fn\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*[({]/gm;
  let m;
  while ((m = fnRe.exec(text)) !== null) {
    idents.push({ label: m[1], kind: CompletionItemKind.Function });
  }
  const typeRe = /(?:^|\n)\s*type\s+([A-Z][a-zA-Z0-9_]*)/gm;
  while ((m = typeRe.exec(text)) !== null) {
    idents.push({ label: m[1], kind: CompletionItemKind.Class });
  }
  const letRe = /(?:^|\n)\s*let\s+([a-zA-Z_][a-zA-Z0-9_]*)/gm;
  while ((m = letRe.exec(text)) !== null) {
    idents.push({ label: m[1], kind: CompletionItemKind.Variable });
  }
  return idents;
}

connection.onInitialize((params) => {
  zeinPath = (params.initializationOptions || {}).zeinPath || findZeinBinary();
  console.error("[zein-lsp] using binary:", zeinPath);
  return {
    capabilities: {
      textDocumentSync: documents.syncKind,
      completionProvider: {
        triggerCharacters: [":", ".", ">", "|", "-", " ", "(", "\n"],
        resolveProvider: false,
      },
    },
  };
});

connection.onCompletion((params) => {
  const doc = documents.get(params.textDocument.uri);
  if (!doc) return [];

  const text = doc.getText();
  const line = text.split("\n")[params.position.line] || "";
  const before = line.slice(0, params.position.character);
  const match = before.match(/[a-zA-Z_][a-zA-Z0-9_]*$/);
  const prefix = match ? match[0].toLowerCase() : "";

  const extracted = completions.filter(c => c.label.toLowerCase().startsWith(prefix));

  const seen = new Set(completions.map(c => c.label));
  const fileIdents = extractFileIdentifiers(text);
  for (const ident of fileIdents) {
    if (!seen.has(ident.label)) {
      seen.add(ident.label);
      extracted.push(ident);
    }
  }

  return extracted;
});

function runDiagnostics(uri, text) {
  if (!zeinPath) {
    connection.sendDiagnostics({ uri, diagnostics: [Diagnostic.create(
      { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
      "zeinc not found — run install.sh or set zeinPath in extension settings",
      DiagnosticSeverity.Error
    )] });
    return;
  }

  const tmpFile = path.join(os.tmpdir(), "zein_" + Date.now() + ".zn");
  try {
    fs.writeFileSync(tmpFile, text, "utf-8");
    const out = execFileSync(zeinPath, ["--diagnostics", tmpFile], {
      encoding: "utf-8",
      maxBuffer: 1024 * 1024,
    });
    const parsed = JSON.parse(out);
    const diagnostics = [];
    for (const d of parsed) {
      diagnostics.push(Diagnostic.create(
        { start: { line: d.range.start.line, character: d.range.start.character },
          end:   { line: d.range.end.line,   character: d.range.end.character } },
        d.message,
        d.severity === "error" ? DiagnosticSeverity.Error : DiagnosticSeverity.Warning
      ));
    }
    connection.sendDiagnostics({ uri, diagnostics });
  } catch (e) {
    connection.sendDiagnostics({ uri, diagnostics: [Diagnostic.create(
      { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
      `LSP error: ${e.message}`,
      DiagnosticSeverity.Error
    )] });
  } finally {
    try { fs.unlinkSync(tmpFile); } catch {}
  }
}

function debouncedDiagnostics(uri, text) {
  if (diagTimer[uri]) clearTimeout(diagTimer[uri]);
  diagTimer[uri] = setTimeout(() => {
    delete diagTimer[uri];
    runDiagnostics(uri, text);
  }, 300);
}

documents.onDidOpen((e) => runDiagnostics(e.document.uri, e.document.getText()));
documents.onDidChangeContent((e) => debouncedDiagnostics(e.document.uri, e.document.getText()));
documents.onDidClose((e) => {
  if (diagTimer[e.document.uri]) {
    clearTimeout(diagTimer[e.document.uri]);
    delete diagTimer[e.document.uri];
  }
  connection.sendDiagnostics({ uri: e.document.uri, diagnostics: [] });
});

documents.listen(connection);
connection.listen();
