import ast.{
  type BlockItem, type Definition, type Expression, type FunctionParam,
  type InfixOp, type Literal, type MatchClause, type Pattern,
  type TypeAnnotation, BlockDef, BlockExpr, DefAlias, DefFunction, DefLet,
  DefRecord, DefType, EBlock, ECall, EFor, EIf, EInfix, ELambda, ELet, ELiteral,
  EMatch, EPipe, ERange, EReassign, EReturn, EUnary, EVariable, LBool, LFloat,
  LInt, LString, Negate, Not, PLiteral, PVariable, PVariant, PWildcard,
  TFunction, TNamed, TVariable,
}
import gleam/int
import gleam/list
import gleam/option.{None, Some}
import gleam/string

pub type GenError {
  GenError(message: String)
}

pub fn generate(module: ast.Module) -> Result(String, GenError) {
  let defs = list.map(module.definitions, generate_definition)
  let defs_str = string.join(defs, "\n\n")
  let has_main =
    list.any(module.definitions, fn(d) {
      case d {
        DefFunction("main", _, _, _) -> True
        _ -> False
      }
    })
  let call = case has_main {
    True -> "\n\nmain();"
    False -> ""
  }
  Ok(defs_str <> call)
}

fn generate_definition(def: Definition) -> String {
  case def {
    DefFunction(name, params, ret_type, body) -> {
      let params_str = params |> list.map(generate_param) |> string.join(", ")
      let ret_str = case ret_type {
        Some(t) -> " /** -> " <> generate_type(t) <> " */"
        None -> ""
      }
      "function "
      <> name
      <> "("
      <> params_str
      <> ")"
      <> ret_str
      <> " {\n"
      <> generate_function_body(body)
      <> "\n}"
    }
    DefLet(name, t, value) -> {
      let t_str = case t {
        Some(ann) -> " /** : " <> generate_type(ann) <> " */"
        None -> ""
      }
      "let " <> name <> t_str <> " = " <> generate_expression(value)
    }
    DefType(st) -> generate_sum_type(st)
    DefRecord(rt) -> generate_record_type(rt)
    DefAlias(ta) -> {
      "// type alias " <> ta.name <> " = " <> generate_type(ta.target)
    }
  }
}

fn generate_function_body(body: Expression) -> String {
  case body {
    EBlock(items) -> {
      let last_index = list.length(items) - 1
      let strings =
        items
        |> list.index_map(fn(item, idx) {
          let s = generate_block_item(item)
          case idx == last_index {
            True -> "return " <> s
            False -> s
          }
        })
        |> string.join(";\n")
        |> indent
      strings
    }
    _ -> "return " <> generate_expression(body) |> indent
  }
}

fn unwrap_expr(boxed: ast.Box(Expression)) -> String {
  let ast.Box(expr) = boxed
  generate_expression(expr)
}

fn unwrap_body(boxed: ast.Box(Expression)) -> String {
  let ast.Box(expr) = boxed
  case expr {
    EBlock(items) ->
      items |> list.map(generate_block_item) |> string.join(";\n")
    _ -> generate_expression(expr)
  }
}

fn generate_sum_type(st: ast.SumType) -> String {
  let variants =
    list.map(st.variants, fn(v) {
      let fields =
        list.map(v.fields, fn(f) {
          f.name <> ": " <> generate_type(f.value_type)
        })
      let fields_str = case fields {
        [] -> ""
        _ -> " { " <> string.join(fields, ", ") <> " }"
      }
      "  " <> v.name <> fields_str
    })
  "// type " <> st.name <> "\n" <> string.join(variants, " |\n")
}

fn generate_record_type(rt: ast.RecordType) -> String {
  let fields =
    list.map(rt.fields, fn(f) {
      "  " <> f.name <> ": " <> generate_type(f.field_type)
    })
  "// record " <> rt.name <> "\n{\n" <> string.join(fields, ",\n") <> "\n}"
}

fn generate_param(p: FunctionParam) -> String {
  case p.param_type {
    Some(t) -> p.name <> " /** : " <> generate_type(t) <> " */"
    None -> p.name
  }
}

fn generate_type(t: TypeAnnotation) -> String {
  case t {
    TNamed(name, params) -> {
      let params_str = case params {
        [] -> ""
        _ -> {
          let inner = params |> list.map(generate_type) |> string.join(", ")
          "<" <> inner <> ">"
        }
      }
      name <> params_str
    }
    TVariable(name) -> name
    TFunction(params, ret) -> {
      let ret_expr = unwrap_ann(ret)
      let inner = params |> list.map(generate_type) |> string.join(", ")
      "(" <> inner <> ") => " <> ret_expr
    }
  }
}

fn unwrap_ann(boxed: ast.Box(TypeAnnotation)) -> String {
  let ast.Box(t) = boxed
  generate_type(t)
}

fn generate_expression(expr: Expression) -> String {
  case expr {
    ELiteral(lit) -> generate_literal(lit)
    EVariable(name) -> name
    ECall(callee, args) -> {
      let ast.Box(inner) = callee
      let callee_str = generate_expression(inner)
      let args_str = args |> list.map(generate_expression) |> string.join(", ")
      case inner {
        EVariable("print") -> "console.log(" <> args_str <> ")"
        _ -> callee_str <> "(" <> args_str <> ")"
      }
    }
    EInfix(left, op, right) -> {
      let op_str = infix_op_string(op)
      let left_str = unwrap_expr(left)
      let right_str = unwrap_expr(right)
      left_str <> " " <> op_str <> " " <> right_str
    }
    EUnary(op, operand) -> {
      let op_str = case op {
        Negate -> "-"
        Not -> "!"
      }
      op_str <> unwrap_expr(operand)
    }
    EReassign(name, value) -> name <> " = " <> unwrap_expr(value)
    ELet(name, t, value, body) -> {
      let t_str = case t {
        Some(ann) -> " /** : " <> generate_type(ann) <> " */"
        None -> ""
      }
      "let "
      <> name
      <> t_str
      <> " = "
      <> unwrap_expr(value)
      <> ";\n"
      <> unwrap_expr(body)
    }
    EBlock(items) -> {
      let items_str =
        items |> list.map(generate_block_item) |> string.join(";\n")
      "{\n" <> indent(items_str) <> "\n}"
    }
    EIf(cond, conseq, alt) -> {
      "(() => {\nif ("
      <> unwrap_expr(cond)
      <> ") {\nreturn "
      <> unwrap_body(conseq)
      <> "\n} else {\nreturn "
      <> unwrap_body(alt)
      <> "\n}\n})()"
    }
    EReturn(value) -> "return " <> unwrap_expr(value)
    EPipe(left, right) -> {
      "(" <> unwrap_expr(right) <> ")(" <> unwrap_expr(left) <> ")"
    }
    ERange(start, end_) -> {
      let s = unwrap_expr(start)
      let e = unwrap_expr(end_)
      "Array.from({length: ("
      <> e
      <> " - "
      <> s
      <> " + 1)}, (_, __i) => "
      <> s
      <> " + __i)"
    }
    EMatch(value, clauses) -> {
      let cases = clauses |> list.map(generate_match_clause)
      let cases_str = string.join(cases, " else ")
      "(function() {\n"
      <> indent("const __v = " <> unwrap_expr(value) <> ";\n" <> cases_str)
      <> "\n})()"
    }
    ELambda(params, _ret_type, body) -> {
      let params_str = params |> list.map(generate_param) |> string.join(", ")
      "(" <> params_str <> ") => " <> unwrap_expr(body)
    }
    EFor(name, iterable, body) -> {
      "for (const "
      <> name
      <> " of "
      <> unwrap_expr(iterable)
      <> ") "
      <> unwrap_expr(body)
    }
  }
}

fn generate_literal(lit: Literal) -> String {
  case lit {
    LInt(n) -> int.to_string(n)
    LFloat(f) -> float_to_string(f)
    LBool(True) -> "true"
    LBool(False) -> "false"
    LString(s) -> "\"" <> escape_string(s) <> "\""
  }
}

fn float_to_string(f: Float) -> String {
  let s = string.trim(string.inspect(f))
  case string.contains(s, ".") {
    True -> s
    False -> s <> ".0"
  }
}

fn escape_string(s: String) -> String {
  s
  |> string.replace("\\", "\\\\")
  |> string.replace("\"", "\\\"")
  |> string.replace("\n", "\\n")
  |> string.replace("\t", "\\t")
}

fn infix_op_string(op: InfixOp) -> String {
  case op {
    ast.Add -> "+"
    ast.Subtract -> "-"
    ast.Multiply -> "*"
    ast.Divide -> "/"
    ast.Modulo -> "%"
    ast.Equal -> "==="
    ast.NotEqual -> "!=="
    ast.LessThan -> "<"
    ast.GreaterThan -> ">"
    ast.LessOrEqual -> "<="
    ast.GreaterOrEqual -> ">="
    ast.And -> "&&"
    ast.Or -> "||"
    ast.Concat -> "+"
  }
}

fn generate_match_clause(clause: MatchClause) -> String {
  let cond = match_condition(clause.pattern)
  let body_str = generate_expression(clause.body)
  let guard_str = case clause.guard {
    Some(g) -> " && (" <> generate_expression(g) <> ")"
    None -> ""
  }
  "if (" <> cond <> guard_str <> ") { return " <> body_str <> "; }"
}

fn match_condition(pattern: Pattern) -> String {
  case pattern {
    PLiteral(lit) -> "__v " <> pattern_literal_op(lit)
    PVariable(_name) -> "true"
    PWildcard -> "true"
    PVariant(name, fields) -> {
      let check = "__v.tag === \"" <> name <> "\""
      case fields {
        [] -> check
        _ -> {
          let field_checks =
            list.index_map(fields, fn(f, i) { match_condition_field(f, i) })
          check <> " && " <> string.join(field_checks, " && ")
        }
      }
    }
  }
}

fn match_condition_field(pattern: Pattern, index: Int) -> String {
  case pattern {
    PLiteral(lit) ->
      "__v.args[" <> int.to_string(index) <> "] " <> pattern_literal_op(lit)
    PVariable(_name) -> "true"
    PWildcard -> "true"
    PVariant(name, fields) -> {
      let check =
        "__v.args[" <> int.to_string(index) <> "].tag === \"" <> name <> "\""
      case fields {
        [] -> check
        _ -> {
          let field_checks =
            list.index_map(fields, fn(f, i) { match_condition_field(f, i) })
          check <> " && " <> string.join(field_checks, " && ")
        }
      }
    }
  }
}

fn pattern_literal_op(lit: Literal) -> String {
  case lit {
    LInt(n) -> "=== " <> int.to_string(n)
    LFloat(f) -> "=== " <> float_to_string(f)
    LBool(True) -> "=== true"
    LBool(False) -> "=== false"
    LString(s) -> "=== \"" <> escape_string(s) <> "\""
  }
}

fn generate_block_item(item: BlockItem) -> String {
  case item {
    BlockExpr(expr) -> generate_expression(expr)
    BlockDef(def) -> generate_definition(def)
  }
}

fn indent(s: String) -> String {
  let lines = string.split(s, "\n")
  lines |> list.map(fn(line) { "  " <> line }) |> string.join("\n")
}
