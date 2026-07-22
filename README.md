# Zein

**Learn Once, Practice Forever**

A minimal, statically-typed programming language with Go-like syntax, garbage collection, and mutation — compiles to JavaScript.

```zn
fn main() {
  print("hello from Zein!")
}
```

## Quick Start

**Just need Node.js 18+** — no install required:

```bash
git clone https://github.com/Chris-dev19/zein-lang && cd zein-lang
node zeinc main.zn     # compile & run, ~0.11s
```

The repo includes a pre-built compiler bundle — just clone and run.

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

You only need **Node.js 18+** to run the compiler. Gleam and Erlang are only required if you want to build from source.

### Linux — Debian / Ubuntu

```bash
git clone https://github.com/Chris-dev19/zein-lang && cd zein-lang
sudo apt update && sudo apt install -y erlang nodejs gleam
./install.sh
zeinc hello.zn
```

If `apt install gleam` is unavailable, try `sudo snap install gleam --classic`.

### Linux — Fedora / RHEL

```bash
git clone https://github.com/Chris-dev19/zein-lang && cd zein-lang
sudo dnf install -y erlang nodejs gleam
./install.sh
zeinc hello.zn
```

On RHEL, enable EPEL first: `sudo dnf install -y epel-release`.

### Linux — Arch

```bash
git clone https://github.com/Chris-dev19/zein-lang && cd zein-lang
sudo pacman -S --noconfirm erlang nodejs gleam
./install.sh
zeinc hello.zn
```

### Linux — openSUSE

```bash
git clone https://github.com/Chris-dev19/zein-lang && cd zein-lang
sudo zypper install -y erlang nodejs gleam
./install.sh
zeinc hello.zn
```

### Linux — NixOS

```bash
git clone https://github.com/Chris-dev19/zein-lang && cd zein-lang
nix profile install nixpkgs#erlang nixpkgs#nodejs nixpkgs#gleam
./install.sh
zeinc hello.zn
```

### macOS

```bash
git clone https://github.com/Chris-dev19/zein-lang && cd zein-lang
brew install erlang nodejs gleam
./install.sh
zeinc hello.zn
```

### Windows (PowerShell)

Requires PowerShell 5.1+ and Node.js 18+.

1. **Install Node.js** — download from [nodejs.org](https://nodejs.org/) or run:
   ```
   winget install OpenJS.NodeJS.LTS
   ```

2. **Install Gleam** (for building from source):
   ```
   winget install gleam
   ```

3. **Install Erlang** (required by Gleam) — download from [erlang.org](https://erlang.org/download) or run:
   ```
   choco install erlang
   ```

4. **Clone and build:**
   ```
   git clone https://github.com/Chris-dev19/zein-lang
   cd zein-lang
   .\install.ps1
   zeinc hello.zn
   ```

The installer adds `zeinc` to your user PATH automatically. Restart your terminal after install.

### Manual build (from source)

If you already have Gleam, Erlang, and Node.js:

```bash
gleam build && gleam build --target javascript && gleam export escript
npx esbuild build/dev/javascript/*/zein.mjs --bundle --platform=node --outfile=zeinc-bundle.mjs
sudo cp zeinc-bundle.mjs zeinc.escript zeinc /usr/local/bin/
```

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
