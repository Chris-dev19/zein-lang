# Zein

**Learn Once, Practice Forever**

A minimal, statically-typed programming language with Go-like syntax, garbage collection, and mutation — compiles to JavaScript.

```zn
fn main() {
  print("hello from Zein!")
}
```

## Quick Start

**Just need Node.js 18+**

```bash
git clone https://github.com/Chris-dev19/zein-lang && cd zein-lang
node zeinc main.zn     # compile & run, ~0.11s
```

**Install to PATH (recommended)**

```bash
./install.sh           # detects distro, installs deps, builds, and installs to ~/.local/bin
zeinc hello.zn
```

**Manual install (if deps already present)**

```bash
gleam build && gleam build --target javascript
npx esbuild build/dev/javascript/*/zein.mjs --bundle --platform=node --outfile=zeinc-bundle.mjs
sudo cp zeinc-bundle.mjs zeinc.escript zeinc /usr/local/bin/
```

## Features

- **Minimal core** — if, for, match, pipe, return, range; everything else is a library
- **Mutable by default** — reassign local variables freely, no `mut` keyword
- **Static typing** — Hindley-Milner type inference, catch errors at compile time
- **Garbage collected** — you never think about memory
- **Go-like syntax** — braces, types after names, familiar structure
- **Compiles to JS** — runs anywhere Node.js runs, no runtime shim

## Example

```zn
fn greet(name: String) -> String {
  "hello " <> name
}

fn factorial(n: Int) -> Int {
  if n <= 1 { 1 } else { n * factorial(n - 1) }
}

fn describe(n: Int) -> String {
  match n {
    1 -> "one"
    2 -> "two"
    _  -> "other"
  }
}

fn main() {
  5 |> double |> print
}
```

## Install

See [install.sh](install.sh) for Linux/macOS or [install.ps1](install.ps1) for Windows. Both scripts detect your platform and install dependencies automatically.

## VS Code Extension

Install from VSIX:

```bash
code --install-extension zein-vscode/zein-lang-0.1.0.vsix
```

Features: syntax highlighting, live diagnostics, autocomplete.

## Documentation

Full language tour: [zein-lang-website.vercel.app](https://zein-lang-website.vercel.app)

## Building

```bash
gleam build              # Erlang target
gleam build --target javascript  # JS target
gleam export escript     # escript fallback
npx esbuild build/dev/javascript/*/zein.mjs --bundle --platform=node --outfile=zeinc-bundle.mjs
gleam test               # run tests
```

## Project Structure

```
zein/
├── src/                 # Compiler source (Gleam)
│   ├── zein.gleam       # CLI entry point
│   ├── tokenizer.gleam  # Lexer
│   ├── parser.gleam     # Recursive-descent parser
│   ├── typechecker.gleam# Hindley-Milner type checker
│   ├── codegen.gleam    # JavaScript code generator
│   └── ast.gleam        # AST type definitions
├── zein-vscode/         # VS Code extension
├── website/             # Documentation site (Vercel)
├── zeinc                # Node.js compiler launcher (committed)
├── zeinc-bundle.mjs     # Pre-built JS bundle (fastest startup)
├── zeinc.escript        # Erlang escript fallback (generated)
├── zein                 # Shell wrapper (generated)
└── install.sh           # Build & install script
```

## License

MIT
