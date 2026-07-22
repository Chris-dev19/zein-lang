import { execFileSync } from "child_process"

export function halt(code) {
  process.exit(code)
}

export function run_js(js) {
  eval(js)
}
