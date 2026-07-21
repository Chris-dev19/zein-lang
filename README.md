# Zein

**Learn Once, Practice Forever**

A minimal, statically-typed programming language with Go-like syntax, garbage collection, and mutation — compiles to JavaScript.

```zn
fn main() {
  print("hello from Zein!")
}
```

## Quick Start

```bash
git clone https://github.com/zein-lang/zein && cd zein
./install.sh       # installs deps + builds from source
zein hello.zn      # compile and run
```

Requires Gleam 1.17+, Erlang/OTP 27+, and Node.js 18+.

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

See [install.sh](install.sh) — detects your distro (Debian, Fedora, Arch, NixOS, macOS) and installs dependencies automatically.

## VS Code Extension

Install from VSIX:

```bash
code --install-extension zein-vscode/zein-lang-0.1.0.vsix
```

Features: syntax highlighting, live diagnostics, autocomplete.

## Documentation

Full language tour: [zein.dev](https://zein.dev)

## Building

```bash
gleam build              # Erlang target
gleam build --target javascript  # JS target (for fast compiler)
gleam export escript     # escript fallback
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
├── zeinc                # Node.js compiler launcher (generated)
├── zein                 # Shell wrapper (generated)
└── install.sh           # Build & install script
```

## License

MIT
