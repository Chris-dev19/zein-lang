import argv
import ast
import codegen
import gleam/int
import gleam/io
import gleam/json
import gleam/list
import gleam/string
import parser
import simplifile
import tokenizer
import typechecker

@external(erlang, "erlang", "halt")
@external(javascript, "./zein_ffi.mjs", "halt")
pub fn halt(code: Int) -> Nil

const version = "0.1.0"

pub fn main() -> Nil {
  let args = argv.load().arguments
  case args {
    ["--help", ..] -> print_usage()
    ["-h", ..] -> print_usage()
    ["--version", ..] -> io.println("Zein " <> version)
    ["-v", ..] -> io.println("Zein " <> version)
    ["--diagnostics", filename, ..] -> diagnostics(filename)
    ["--compile", filename, ..] ->
      case read_source(filename) {
        Ok(source) -> compile_and_print(source)
        Error(Nil) -> halt(1)
      }
    [filename, ..] ->
      case read_source(filename) {
        Ok(source) -> run_source(source)
        Error(Nil) -> halt(1)
      }
    _ -> print_usage()
  }
}

fn print_usage() -> Nil {
  io.println("usage: zein [--compile|--diagnostics|--help|--version] <filename.zn>")
}

fn read_source(filename: String) -> Result(String, Nil) {
  case simplifile.read(from: filename) {
    Ok(content) -> Ok(content)
    Error(_) -> Error(Nil)
  }
}

fn run_source(source: String) -> Nil {
  case generate_js(source) {
    Ok(js) -> run_js(js)
    Error(Nil) -> halt(1)
  }
}

fn compile_and_print(source: String) -> Nil {
  case generate_js(source) {
    Ok(js) -> io.print(js)
    Error(Nil) -> halt(1)
  }
}

fn generate_js(source: String) -> Result(String, Nil) {
  let res = tokenizer.tokenize(source)

  case res.errors {
    [_, ..] -> {
      io.println("tokenizer errors:")
      res.errors
      |> list.each(fn(e) {
        io.println("  line " <> int.to_string(e.line) <> ": " <> e.message)
      })
      Error(Nil)
    }
    [] -> {
      case parser.parse_module(res.tokens) {
        Error(e) -> {
          io.println("parse error: " <> parser_error_string(e))
          Error(Nil)
        }
        Ok(#(mod, _remaining)) -> {
          case resolve_imports(mod) {
            Error(msg) -> {
              io.println(msg)
              Error(Nil)
            }
            Ok(mod) -> {
              case typechecker.check_module(mod) {
                Error(errors) -> {
                  io.println("type errors:")
                  errors |> list.each(fn(e) { io.println("  " <> e.message) })
                  Error(Nil)
                }
                Ok(_state) -> {
                  case codegen.generate(mod) {
                    Ok(js) -> Ok(js)
                    Error(e) -> {
                      io.println("codegen error: " <> e.message)
                      Error(Nil)
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

fn resolve_imports(mod: ast.Module) -> Result(ast.Module, String) {
  case mod.imports {
    [] -> Ok(mod)
    imports -> {
      let known = ["random"]
      let result =
        list.fold(imports, Ok(mod), fn(acc, imp) {
          case acc {
            Error(_) -> acc
            Ok(m) -> {
              case list.contains(known, imp.path) {
                True -> Ok(m)
                False -> Error("unknown module: " <> imp.path)
              }
            }
          }
        })
      result
    }
  }
}

fn run_js(js: String) -> Nil {
  io.print(js)
}

fn diagnostics(filename: String) -> Nil {
  case read_source(filename) {
    Error(Nil) ->
      io.print(
        json.to_string(
          json.preprocessed_array([
            mk_diag("error", "file not found: " <> filename, 0, 0),
          ]),
        ),
      )
    Ok(source) -> run_diagnostics(source)
  }
}

fn run_diagnostics(source: String) -> Nil {
  let res = tokenizer.tokenize(source)

  let diags =
    list.flatten([
      res.errors
        |> list.map(fn(e) { mk_diag("error", e.message, e.line, e.col) }),
      case parser.parse_module(res.tokens) {
        Ok(#(mod, _remaining)) -> {
          case typechecker.check_module(mod) {
            Ok(_state) -> []
            Error(errors) ->
              errors
              |> list.map(fn(e) { mk_diag("error", e.message, 0, 0) })
          }
        }
        Error(e) -> [
          mk_diag("error", "parse error: " <> parser_error_string(e), 0, 0),
        ]
      },
    ])

  io.print(json.to_string(json.preprocessed_array(diags)))
}

fn mk_diag(
  severity: String,
  message: String,
  line: Int,
  col: Int,
) -> json.Json {
  json.object([
    #("severity", json.string(severity)),
    #("message", json.string(message)),
    #(
      "range",
      json.object([
        #(
          "start",
          json.object([
            #("line", json.int(line)),
            #("character", json.int(col)),
          ]),
        ),
        #(
          "end",
          json.object([
            #("line", json.int(line)),
            #("character", json.int(col + 1)),
          ]),
        ),
      ]),
    ),
  ])
}

fn parser_error_string(e: parser.ParseError) -> String {
  case e {
    parser.ParseError(expected, found, _, _) ->
      "expected " <> expected <> ", found " <> tokenizer.token_name(found)
    parser.ParseErrors(errors) ->
      errors |> list.map(parser_error_string) |> string.join("\n")
  }
}
