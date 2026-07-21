import codegen
import gleam/list
import gleam/string
import gleeunit
import parser
import tokenizer
import typechecker

pub fn main() -> Nil {
  gleeunit.main()
}

// ------ Tokenizer tests ------

pub fn tokenize_simple_test() {
  let res = tokenizer.tokenize("42")
  assert True == list.is_empty(res.errors)
  let first = do_peek(res.tokens)
  assert first == tokenizer.IntLiteral(42)
}

pub fn tokenize_string_test() {
  let res = tokenizer.tokenize("\"hello\"")
  assert True == list.is_empty(res.errors)
  let first = do_peek(res.tokens)
  assert first == tokenizer.StringLiteral("hello")
}

pub fn tokenize_keyword_test() {
  let res =
    tokenizer.tokenize(
      "fn match if else for in return let type import as module",
    )
  assert True == list.is_empty(res.errors)
}

pub fn tokenize_operators_test() {
  let res = tokenizer.tokenize("+ - * / % == != < > <= >= && || ! <> |> -> ..")
  assert True == list.is_empty(res.errors)
}

pub fn tokenize_ident_test() {
  let res = tokenizer.tokenize("hello_world foo123 Bar")
  assert True == list.is_empty(res.errors)
}

pub fn tokenize_underscore_test() {
  let res = tokenizer.tokenize("_")
  assert True == list.is_empty(res.errors)
}

// ------ Parser tests ------

pub fn parse_module_test() {
  let src =
    "module main {\n  fn greet(name: String) -> String {\n    \"hello \" <> name\n  }\n}\n"
  let tokens = tokenizer.tokenize(src)
  assert True == list.is_empty(tokens.errors)

  let assert Ok(#(mod, _)) = parser.parse_module(tokens.tokens)
  assert mod.name == "main"
  assert 1 == list.length(mod.definitions)
}

pub fn parse_if_test() {
  let src =
    "module main {\n  fn f(x: Int) -> Int {\n    if x > 0 { x } else { 0 }\n  }\n}\n"
  let tokens = tokenizer.tokenize(src)
  assert True == list.is_empty(tokens.errors)

  let assert Ok(#(mod, _)) = parser.parse_module(tokens.tokens)
  assert 1 == list.length(mod.definitions)
}

pub fn parse_match_test() {
  let src =
    "module main {\n  fn f(x: Int) -> Int {\n    match x {\n      1 -> x\n      _ -> 0\n    }\n  }\n}\n"
  let tokens = tokenizer.tokenize(src)
  assert True == list.is_empty(tokens.errors)

  let assert Ok(#(mod, _)) = parser.parse_module(tokens.tokens)
  assert 1 == list.length(mod.definitions)
}

pub fn parse_for_test() {
  let src =
    "module main {\n  fn f() {\n    for x in items {\n      x\n    }\n  }\n}\n"
  let tokens = tokenizer.tokenize(src)
  assert True == list.is_empty(tokens.errors)
}

pub fn parse_type_test() {
  let src = "module main {\n  type Option(a) {\n    Some(a)\n    None\n  }\n}\n"
  let tokens = tokenizer.tokenize(src)
  assert True == list.is_empty(tokens.errors)

  let assert Ok(#(mod, _)) = parser.parse_module(tokens.tokens)
  assert 1 == list.length(mod.definitions)
}

pub fn parse_pipe_test() {
  let src =
    "module main {\n  fn f(x: Int) -> Int {\n    add(1, 2) |> double\n  }\n}\n"
  let tokens = tokenizer.tokenize(src)
  assert True == list.is_empty(tokens.errors)

  let assert Ok(#(mod, _)) = parser.parse_module(tokens.tokens)
  assert 1 == list.length(mod.definitions)
}

pub fn parse_range_test() {
  let src = "module main {\n  fn f() {\n    1..10\n  }\n}\n"
  let tokens = tokenizer.tokenize(src)
  assert True == list.is_empty(tokens.errors)

  let assert Ok(#(mod, _)) = parser.parse_module(tokens.tokens)
  assert 1 == list.length(mod.definitions)
}

pub fn parse_lambda_test() {
  let src = "module main {\n  fn f() {\n    fn(x: Int) { x + 1 }\n  }\n}\n"
  let tokens = tokenizer.tokenize(src)
  assert True == list.is_empty(tokens.errors)
}

// ------ Codegen tests ------

pub fn codegen_greet_test() {
  let src =
    "module main {\n  fn greet(name: String) -> String {\n    \"hello \" <> name\n  }\n}\n"
  let tokens = tokenizer.tokenize(src)
  let assert Ok(#(mod, _)) = parser.parse_module(tokens.tokens)
  let assert Ok(js) = codegen.generate(mod)

  assert True == string.contains(js, "function greet")
  assert True == string.contains(js, "hello ")
}

pub fn codegen_factorial_test() {
  let src =
    "module main {\n  fn factorial(n: Int) -> Int {\n    if n <= 1 { 1 } else { n * factorial(n - 1) }\n  }\n}\n"
  let tokens = tokenizer.tokenize(src)
  let assert Ok(#(mod, _)) = parser.parse_module(tokens.tokens)
  let assert Ok(js) = codegen.generate(mod)

  assert True == string.contains(js, "function factorial")
  assert True == string.contains(js, "if (n <= 1)")
}

pub fn codegen_match_test() {
  let src =
    "module main {\n  fn describe(n: Int) -> String {\n    match n { 1 -> \"one\" _ -> \"other\" }\n  }\n}\n"
  let tokens = tokenizer.tokenize(src)
  let assert Ok(#(mod, _)) = parser.parse_module(tokens.tokens)
  let assert Ok(js) = codegen.generate(mod)

  assert True == string.contains(js, "function describe")
  assert True == string.contains(js, "__v === 1")
}

pub fn codegen_let_test() {
  let src = "module main {\n  fn main() {\n    let x = 42\n    x\n  }\n}\n"
  let tokens = tokenizer.tokenize(src)
  let assert Ok(#(mod, _)) = parser.parse_module(tokens.tokens)
  let assert Ok(js) = codegen.generate(mod)

  assert True == string.contains(js, "let x = 42")
}

pub fn codegen_return_test() {
  let src = "module main {\n  fn f(x: Int) -> Int {\n    return x\n  }\n}\n"
  let tokens = tokenizer.tokenize(src)
  let assert Ok(#(mod, _)) = parser.parse_module(tokens.tokens)
  let assert Ok(js) = codegen.generate(mod)

  assert True == string.contains(js, "return x")
}

pub fn codegen_unary_test() {
  let src = "module main {\n  fn f(x: Int) -> Int {\n    -x\n  }\n}\n"
  let tokens = tokenizer.tokenize(src)
  let assert Ok(#(mod, _)) = parser.parse_module(tokens.tokens)
  let assert Ok(js) = codegen.generate(mod)

  assert True == string.contains(js, "-x")
}

pub fn codegen_not_test() {
  let src = "module main {\n  fn f(x: Bool) -> Bool {\n    !x\n  }\n}\n"
  let tokens = tokenizer.tokenize(src)
  let assert Ok(#(mod, _)) = parser.parse_module(tokens.tokens)
  let assert Ok(js) = codegen.generate(mod)

  assert True == string.contains(js, "!x")
}

pub fn codegen_lambda_test() {
  let src = "module main {\n  fn f() {\n    fn(x: Int) { x + 1 }\n  }\n}\n"
  let tokens = tokenizer.tokenize(src)
  let assert Ok(#(mod, _)) = parser.parse_module(tokens.tokens)
  let assert Ok(js) = codegen.generate(mod)

  assert True == string.contains(js, "=>")
}

pub fn codegen_full_pipeline_test() {
  let src =
    "module main {\n  fn greet(name: String) -> String {\n    \"hello \" <> name\n  }\n  fn factorial(n: Int) -> Int {\n    if n <= 1 {\n      1\n    } else {\n      n * factorial(n - 1)\n    }\n  }\n  fn main() {\n    let x = greet(\"world\")\n    let y = factorial(5)\n    y\n  }\n}\n"
  let tokens = tokenizer.tokenize(src)
  let assert Ok(#(mod, _remaining)) = parser.parse_module(tokens.tokens)
  let assert Ok(js) = codegen.generate(mod)

  assert True == string.contains(js, "function greet")
  assert True == string.contains(js, "function factorial")
  assert True == string.contains(js, "function main")
  assert True == string.contains(js, "let x = greet(\"world\")")
}

// ------ Type checker tests ------

pub fn typecheck_good_test() {
  let src =
    "module main {\n  fn add(x: Int, y: Int) -> Int {\n    x + y\n  }\n}\n"
  let tokens = tokenizer.tokenize(src)
  let assert Ok(#(mod, _)) = parser.parse_module(tokens.tokens)
  let assert Ok(_state) = typechecker.check_module(mod)
}

pub fn typecheck_factorial_test() {
  let src =
    "module main {\n  fn factorial(n: Int) -> Int {\n    if n <= 1 { 1 } else { n * factorial(n - 1) }\n  }\n}\n"
  let tokens = tokenizer.tokenize(src)
  let assert Ok(#(mod, _)) = parser.parse_module(tokens.tokens)
  let assert Ok(_state) = typechecker.check_module(mod)
}

pub fn typecheck_match_test() {
  let src =
    "module main {\n  fn describe(n: Int) -> String {\n    match n { 1 -> \"one\" _ -> \"other\" }\n  }\n}\n"
  let tokens = tokenizer.tokenize(src)
  let assert Ok(#(mod, _)) = parser.parse_module(tokens.tokens)
  let assert Ok(_state) = typechecker.check_module(mod)
}

pub fn typecheck_type_error_test() {
  // Adding Int to String should fail
  let src =
    "module main {\n  fn f(x: Int, y: String) -> Int {\n    x + y\n  }\n}\n"
  let tokens = tokenizer.tokenize(src)
  let assert Ok(#(mod, _)) = parser.parse_module(tokens.tokens)
  let assert Error(errors) = typechecker.check_module(mod)
  assert errors != []
}

pub fn typecheck_if_bool_test() {
  // If condition must be Bool
  let src =
    "module main {\n  fn f(x: Int) -> Int {\n    if x { 1 } else { 0 }\n  }\n}\n"
  let tokens = tokenizer.tokenize(src)
  let assert Ok(#(mod, _)) = parser.parse_module(tokens.tokens)
  let assert Error(errors) = typechecker.check_module(mod)
  assert errors != []
}

// ------ Error tests ------
pub fn parse_error_test() {
  let src = "module main {\n  fn f() {\n    bad_tokens ++\n  }\n}\n"
  let tokens = tokenizer.tokenize(src)
  assert 1 <= list.length(tokens.tokens)
}

// ---------- helpers ----------

fn do_peek(tokens: List(tokenizer.Token)) -> tokenizer.Token {
  case tokens {
    [] -> tokenizer.EOF
    [t, ..] -> t
  }
}
