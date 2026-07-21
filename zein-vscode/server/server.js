const {
  createConnection,
  TextDocuments,
  DiagnosticSeverity,
  Diagnostic,
  CompletionItemKind,
} = require("vscode-languageserver/node");
const { TextDocument } = require("vscode-languageserver-textdocument");
const { execFileSync, execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const connection = createConnection();
const documents = new TextDocuments(TextDocument);

let zeinPath;

const completions = [
  { label: "module", kind: CompletionItemKind.Keyword, detail: "module declaration" },
  { label: "import", kind: CompletionItemKind.Keyword, detail: "import module" },
  { label: "as",     kind: CompletionItemKind.Keyword, detail: "import alias" },
  { label: "fn",     kind: CompletionItemKind.Keyword, detail: "function declaration" },
  { label: "let",    kind: CompletionItemKind.Keyword, detail: "variable binding" },
  { label: "type",   kind: CompletionItemKind.Keyword, detail: "type definition" },
  { label: "if",     kind: CompletionItemKind.Keyword, detail: "conditional" },
  { label: "else",   kind: CompletionItemKind.Keyword, detail: "else branch" },
  { label: "match",  kind: CompletionItemKind.Keyword, detail: "pattern matching" },
  { label: "for",    kind: CompletionItemKind.Keyword, detail: "for loop" },
  { label: "in",     kind: CompletionItemKind.Keyword, detail: "iterator" },
  { label: "return", kind: CompletionItemKind.Keyword, detail: "return value" },
  { label: "true",   kind: CompletionItemKind.Keyword, detail: "boolean literal" },
  { label: "false",  kind: CompletionItemKind.Keyword, detail: "boolean literal" },
  { label: "_",      kind: CompletionItemKind.Keyword, detail: "wildcard pattern" },
  { label: "Int",    kind: CompletionItemKind.TypeParameter, detail: "built-in integer" },
  { label: "Float",  kind: CompletionItemKind.TypeParameter, detail: "built-in float" },
  { label: "String", kind: CompletionItemKind.TypeParameter, detail: "built-in string" },
  { label: "Bool",   kind: CompletionItemKind.TypeParameter, detail: "built-in boolean" },
  { label: "print",  kind: CompletionItemKind.Function, detail: "print value (built-in)" },
];

function findZeinBinary() {
  const projectDir = "/home/jose/Documents/Default Project/lang";
  // Try the node wrapper first (fastest)
  const wrappers = ["zeinc", "zein"];
  for (const name of wrappers) {
    const p = path.join(projectDir, name);
    try {
      execFileSync(p, ["--version"], { encoding: "utf-8", timeout: 2000, stdio: "ignore" });
      console.error("[zein-lsp] found at", p);
      return p;
    } catch (e) {
      console.error("[zein-lsp]", name, "failed:", e.message.slice(0, 80));
    }
  }

  // Try relative to extension
  for (const name of wrappers) {
    const p = path.join(__dirname, "..", "..", name);
    try {
      execFileSync(p, ["--version"], { encoding: "utf-8", timeout: 2000, stdio: "ignore" });
      console.error("[zein-lsp] found at", p);
      return p;
    } catch (e) {
      console.error("[zein-lsp]", name, "failed:", e.message.slice(0, 80));
    }
  }

  // Look in PATH
  for (const name of wrappers) {
    try {
      const which = execSync("which " + name, { encoding: "utf-8" }).trim();
      console.error("[zein-lsp] found", name, "in PATH:", which);
      return which;
    } catch {
      console.error("[zein-lsp]", name, "not in PATH");
    }
  }

  console.error("[zein-lsp] no candidate worked");
  return null;
}

connection.onInitialize((params) => {
  zeinPath = (params.initializationOptions || {}).zeinPath || findZeinBinary();
  console.error("[zein-lsp] using binary:", zeinPath);
  return {
    capabilities: {
      textDocumentSync: documents.syncKind,
      completionProvider: {
        triggerCharacters: [":", ".", ">", "|", "-", " ", "("],
        resolveProvider: false,
      },
    },
  };
});

connection.onCompletion((params) => {
  const doc = documents.get(params.textDocument.uri);
  if (!doc) {
    console.error("[zein-lsp] no document for", params.textDocument.uri);
    return [];
  }

  const text = doc.getText();
  const line = text.split("\n")[params.position.line] || "";
  const before = line.slice(0, params.position.character);
  const match = before.match(/[a-zA-Z_][a-zA-Z0-9_]*$/);
  const prefix = match ? match[0].toLowerCase() : "";

  const extracted = completions.filter(c => c.label.toLowerCase().startsWith(prefix));

  const seen = new Set(completions.map(c => c.label));
  const identRe = /[a-zA-Z_][a-zA-Z0-9_]*/g;
  let m;
  while ((m = identRe.exec(text)) !== null) {
    if (!seen.has(m[0])) {
      seen.add(m[0]);
      extracted.push({ label: m[0], kind: CompletionItemKind.Variable });
    }
  }

  return extracted;
});

function runDiagnostics(uri, text) {
  const diagnostics = [];
  if (!zeinPath) {
    diagnostics.push(
      Diagnostic.create(
        { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
        "LSP error: zeinc not found — run install.sh or set zeinPath in extension settings",
        DiagnosticSeverity.Error
      )
    );
    connection.sendDiagnostics({ uri, diagnostics });
    return;
  }
  try {
    const filePath = uri.startsWith("file://") ? decodeURIComponent(new URL(uri).pathname) : uri;
    const out = execFileSync(zeinPath, ["--diagnostics", filePath], {
      input: text,
      encoding: "utf-8",
      maxBuffer: 1024 * 1024,
    });
    for (const d of JSON.parse(out)) {
      diagnostics.push(
        Diagnostic.create(
          {
            start: { line: d.range.start.line, character: d.range.start.character },
            end:   { line: d.range.end.line,   character: d.range.end.character },
          },
          d.message,
          d.severity === "error" ? DiagnosticSeverity.Error : DiagnosticSeverity.Warning
        )
      );
    }
  } catch (e) {
    diagnostics.push(
      Diagnostic.create(
        { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
        `LSP error: ${e.message}`,
        DiagnosticSeverity.Error
      )
    );
  }
  connection.sendDiagnostics({ uri, diagnostics });
}

documents.onDidOpen((e) => runDiagnostics(e.document.uri, e.document.getText()));
documents.onDidChangeContent((e) => runDiagnostics(e.document.uri, e.document.getText()));

documents.listen(connection);
connection.listen();
