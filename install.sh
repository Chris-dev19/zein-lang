#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
VERSION="0.1.0"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[zein]${NC} $1"; }
warn()  { echo -e "${YELLOW}[zein]${NC} $1"; }
err()   { echo -e "${RED}[zein]${NC} $1" >&2; }

detect_distro() {
  if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo "$ID"
  elif command -v lsb_release &>/dev/null; then
    lsb_release -si 2>/dev/null | tr '[:upper:]' '[:lower:]'
  else
    echo "unknown"
  fi
}

detect_pm() {
  if command -v apt &>/dev/null; then echo "apt"
  elif command -v dnf &>/dev/null; then echo "dnf"
  elif command -v pacman &>/dev/null; then echo "pacman"
  elif command -v zypper &>/dev/null; then echo "zypper"
  elif command -v brew &>/dev/null; then echo "brew"
  else echo "unknown"
  fi
}

install_deps_apt() {
  info "Debian/Ubuntu — installing Erlang + Node.js + Gleam..."
  sudo apt update -qq
  sudo apt install -y -qq erlang nodejs gleam
}

install_deps_dnf() {
  info "Fedora/RHEL — installing Erlang + Node.js + Gleam..."
  if grep -qi "fedora" /etc/os-release 2>/dev/null; then
    sudo dnf install -y erlang nodejs gleam
  else
    sudo dnf install -y epel-release 2>/dev/null || true
    sudo dnf install -y erlang nodejs gleam
  fi
}

install_deps_pacman() {
  info "Arch Linux — installing Erlang + Node.js + Gleam..."
  sudo pacman -S --noconfirm erlang nodejs gleam
}

install_deps_zypper() {
  info "openSUSE — installing Erlang + Node.js + Gleam..."
  sudo zypper install -y erlang nodejs gleam
}

install_deps_brew() {
  info "macOS — installing Erlang + Node.js + Gleam..."
  brew install erlang nodejs gleam
}

install_deps_nixos() {
  info "NixOS — using nix profile..."
  if command -v nix &>/dev/null; then
    nix profile install nixpkgs#erlang nixpkgs#nodejs nixpkgs#gleam 2>/dev/null || \
    warn "run: nix profile install nixpkgs#erlang nixpkgs#nodejs nixpkgs#gleam"
  else
    warn "install Erlang, Node.js, and Gleam via your NixOS config, then re-run"
    exit 1
  fi
}

install_deps_unknown() {
  err "could not detect package manager"
  err "install Erlang/OTP 27+, Node.js 18+, and Gleam 1.17+ manually"
  exit 1
}

check_deps() {
  local ok=true
  command -v gleam &>/dev/null || { err "Gleam not found"; ok=false; }
  command -v node  &>/dev/null || { err "Node.js not found"; ok=false; }
  command -v erl   &>/dev/null || { err "Erlang/OTP not found (needed by Gleam)"; ok=false; }
  $ok
}

build_compiler() {
  info "building Zein $VERSION from source..."
  cd "$DIR"

  # Gleam build (Erlang target, for tests and escript fallback)
  gleam clean 2>/dev/null || true
  gleam build
  gleam test

  # Build JS target
  gleam build --target javascript

  # Generate escript fallback
  gleam export escript
  mv zein zeinc.escript

  # Copy JS build output
  rm -rf zeinc-build
  mkdir -p zeinc-build
  cp -r build/dev/javascript/* zeinc-build/
}

install_zein_binaries() {
  local dest="${PREFIX:-}"
  if [ -z "$dest" ]; then
    if [ -w "/usr/local/bin" ]; then
      dest="/usr/local/bin"
    elif command -v sudo &>/dev/null; then
      dest="/usr/local/bin"
    else
      dest="$HOME/.local/bin"
    fi
  fi
  local build_dest="${dest}/zeinc-build"

  local maybe_sudo=""
  if [ ! -w "$dest" ]; then
    if command -v sudo &>/dev/null; then
      maybe_sudo="sudo"
    else
      dest="$HOME/.local/bin"
      build_dest="$dest/zeinc-build"
    fi
  fi

  info "installing to $dest ..."
  $maybe_sudo mkdir -p "$dest"

  # Node.js launcher
  $maybe_sudo tee "$dest/zeinc" > /dev/null << 'SCRIPT'
#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
try {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const { main } = await import(join(__dirname, 'zeinc-build/zein/zein.mjs'));
  main();
} catch (e) {
  const { execFileSync } = await import('child_process');
  try {
    execFileSync(join(__dirname, 'zeinc.escript'), process.argv.slice(2), { stdio: 'inherit' });
  } catch { process.exit(1); }
}
SCRIPT

  # Shell wrapper
  $maybe_sudo tee "$dest/zein" > /dev/null << 'SCRIPT'
#!/usr/bin/env bash
DIR="$(cd "$(dirname "$0")" && pwd)"
case "$1" in
  --compile|--diagnostics|--help|-h) exec "$DIR/zeinc" "$@" ;;
esac
JS=$("$DIR/zeinc" --compile "$@" 2>/dev/null) || { "$DIR/zeinc" "$@" 2>&1; exit $?; }
exec node -e "$JS"
SCRIPT
  $maybe_sudo chmod 755 "$dest/zein" "$dest/zeinc"

  # JS build directory
  $maybe_sudo rm -rf "$build_dest"
  $maybe_sudo cp -r "$DIR/zeinc-build" "$build_dest"

  # Escript fallback
  $maybe_sudo cp "$DIR/zeinc.escript" "$dest/zeinc.escript"

  # Ensure PATH includes dest
  if ! echo "$PATH" | tr ':' '\n' | grep -qx "$dest"; then
    warn "$dest is not in your PATH"
    warn "add this to your shell config: export PATH=\"\$PATH:$dest\""
  fi

  info "installed: zeinc, zein, zeinc.escript, zeinc-build/"
}

# ── Main ──────────────────────────────────────────────────────────

info "Zein v$VERSION installer (build from source)"
echo ""

DISTRO=$(detect_distro)
PM=$(detect_pm)
info "distro: $DISTRO   package manager: $PM"
echo ""

if [ "$DISTRO" = "nixos" ]; then
  install_deps_nixos
else
  install_deps_"$PM"
fi

if check_deps; then
  info "all dependencies OK"
else
  err "install missing dependencies, then re-run"
  exit 1
fi

build_compiler
install_zein_binaries

echo ""
info "Zein $VERSION installed!"
info "  zein --help"
info "  zein hello.zn"
echo ""
info "set PREFIX=~/.local/bin for a user-local install"
