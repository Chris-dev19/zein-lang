import ast
import gleam/list
import gleam/option.{None, Some}
import gleam/result
import tokenizer.{
  type Token, AndAnd, Arrow, As, Bang, BangEqual, Colon, Comma, Concat, Dot,
  DotDot, EOF, Else, Equal, EqualEqual, FalseToken, FloatLiteral, Fn, For,
  Greater, GreaterEqual, Identifier, If, Import, In, IntLiteral, LBrace,
  LBracket, LParen, Less, LessEqual, Let, Match, Minus, Newline, OrOr,
  Percent, Pipe, Plus, PlusEqual, MinusEqual, StarEqual, SlashEqual, RBrace,
  RBracket, RParen, Return, Slash, Star, StringLiteral, TrueToken, Type,
  Underscore, While,
}

pub type ParseError {
  ParseError(expected: String, found: Token, line: Int, col: Int)
  ParseErrors(List(ParseError))
}

fn consume(
  tokens: List(Token),
  expected: String,
  kind: fn(Token) -> Bool,
) -> Result(#(Token, List(Token)), ParseError) {
  case tokens {
    [] -> Error(ParseError(expected, EOF, 0, 0))
    [t, ..rest] ->
      case kind(t) {
        True -> Ok(#(t, rest))
        False -> Error(ParseError(expected, t, 0, 0))
      }
  }
}

fn expect(
  tokens: List(Token),
  expected: Token,
) -> Result(#(Token, List(Token)), ParseError) {
  consume(tokens, token_name(expected), fn(t) { t == expected })
}

fn token_name(t: Token) -> String {
  case t {
    Import -> "import"
    As -> "as"
    Fn -> "fn"
    Let -> "let"
    Type -> "type"
    If -> "if"
    Else -> "else"
    Match -> "match"
    For -> "for"
    In -> "in"
    Return -> "return"
    While -> "while"
    TrueToken -> "true"
    FalseToken -> "false"
    Underscore -> "_"
    Plus -> "+"
    Minus -> "-"
    Star -> "*"
    Slash -> "/"
    Percent -> "%"
    PlusEqual -> "+="
    MinusEqual -> "-="
    StarEqual -> "*="
    SlashEqual -> "/="
    EqualEqual -> "=="
    BangEqual -> "!="
    Less -> "<"
    Greater -> ">"
    LessEqual -> "<="
    GreaterEqual -> ">="
    AndAnd -> "&&"
    OrOr -> "||"
    Bang -> "!"
    Concat -> "<>"
    Pipe -> "|>"
    LParen -> "("
    RParen -> ")"
    LBrace -> "{"
    RBrace -> "}"
    LBracket -> "["
    RBracket -> "]"
    Comma -> ","
    Dot -> "."
    Colon -> ":"
    Arrow -> "->"
    Equal -> "="
    DotDot -> ".."
    IntLiteral(_) -> "<int>"
    FloatLiteral(_) -> "<float>"
    StringLiteral(_) -> "<string>"
    Identifier(_) -> "<identifier>"
    Newline -> "<newline>"
    EOF -> "<eof>"
  }
}

fn skip_newlines(tokens: List(Token)) -> List(Token) {
  case tokens {
    [Newline, ..rest] -> skip_newlines(rest)
    _ -> tokens
  }
}

pub fn parse_module(
  tokens: List(Token),
) -> Result(#(ast.Module, List(Token)), ParseError) {
  let tokens = skip_newlines(tokens)
  use defs_imports <- result.try(parse_top_level(tokens, [], []))
  let #(imports, defs, remaining) = defs_imports
  Ok(#(ast.Module("main", imports, defs), remaining))
}

fn parse_top_level(
  tokens: List(Token),
  imports: List(ast.Import),
  defs: List(ast.Definition),
) -> Result(#(List(ast.Import), List(ast.Definition), List(Token)), ParseError) {
  let tokens = skip_newlines(tokens)
  case tokens {
    [] -> Ok(#(list.reverse(imports), list.reverse(defs), tokens))
    [Import, ..rest] -> {
      let rest = skip_newlines(rest)
      let assert Ok(#(Identifier(path), rest)) =
        consume(rest, "<identifier>", fn(t) {
          case t {
            Identifier(_) -> True
            _ -> False
          }
        })
      let rest = skip_newlines(rest)
      let #(alias, rest) = case rest {
        [As, ..rest2] -> {
          let rest2 = skip_newlines(rest2)
          let assert Ok(#(Identifier(a), rest2)) =
            consume(rest2, "<identifier>", fn(t) {
              case t {
                Identifier(_) -> True
                _ -> False
              }
            })
          #(Some(a), rest2)
        }
        _ -> #(None, rest)
      }
      let rest = skip_newlines(rest)
      parse_top_level(rest, [ast.Import(path, alias), ..imports], defs)
    }
    _ -> parse_definitions(tokens, imports, defs)
  }
}

fn parse_definitions(
  tokens: List(Token),
  imports: List(ast.Import),
  acc: List(ast.Definition),
) -> Result(#(List(ast.Import), List(ast.Definition), List(Token)), ParseError) {
  let tokens = skip_newlines(tokens)
  case tokens {
    [RBrace, ..] -> Ok(#(list.reverse(imports), list.reverse(acc), tokens))
    [Import, ..] -> {
      let tokens = skip_newlines(tokens)
      let assert Ok(#(Identifier(path), tokens)) =
        consume(tokens, "<identifier>", fn(t) {
          case t {
            Identifier(_) -> True
            _ -> False
          }
        })
      let tokens = skip_newlines(tokens)
      let #(alias, tokens) = case tokens {
        [As, ..rest2] -> {
          let rest2 = skip_newlines(rest2)
          let assert Ok(#(Identifier(a), rest2)) =
            consume(rest2, "<identifier>", fn(t) {
              case t {
                Identifier(_) -> True
                _ -> False
              }
            })
          #(Some(a), rest2)
        }
        _ -> #(None, tokens)
      }
      let tokens = skip_newlines(tokens)
      parse_definitions(tokens, [ast.Import(path, alias), ..imports], acc)
    }
    [Fn, ..] -> {
      use pair <- result.try(parse_function_def(tokens))
      let #(def, tokens) = pair
      let tokens = skip_newlines(tokens)
      parse_definitions(tokens, imports, [def, ..acc])
    }
    [Let, ..] -> {
      use pair <- result.try(parse_let_def(tokens))
      let #(def, tokens) = pair
      let tokens = skip_newlines(tokens)
      parse_definitions(tokens, imports, [def, ..acc])
    }
    [Type, ..] -> {
      use pair <- result.try(parse_type_def(tokens))
      let #(def, tokens) = pair
      let tokens = skip_newlines(tokens)
      parse_definitions(tokens, imports, [def, ..acc])
    }
    [Identifier(name), ..rest] -> {
      let rest_skip = skip_newlines(rest)
      case rest_skip {
        [LBrace, ..] -> {
          let assert Ok(#(body, rest)) = parse_block(rest)
          let rest = skip_newlines(rest)
          parse_definitions(rest, imports, [ast.DefFunction(name, [], None, body), ..acc])
        }
        _ -> {
          case rest {
            [] -> Ok(#(list.reverse(imports), list.reverse(acc), rest))
            [_, ..] -> parse_definitions(rest, imports, acc)
          }
        }
      }
    }
    _ -> {
      case tokens {
        [] -> Ok(#(list.reverse(imports), list.reverse(acc), tokens))
        [_, ..rest] -> parse_definitions(rest, imports, acc)
      }
    }
  }
}

// === Function Definition ===
// fn Name(Params) -> Type { Expression }
// fn Name { Expression }  (shorthand, no params)
fn parse_function_def(
  tokens: List(Token),
) -> Result(#(ast.Definition, List(Token)), ParseError) {
  let assert Ok(#(_, tokens)) = expect(tokens, Fn)
  let tokens = skip_newlines(tokens)
  let assert Ok(#(Identifier(name), tokens)) =
    consume(tokens, "<identifier>", fn(t) {
      case t {
        Identifier(_) -> True
        _ -> False
      }
    })
  let tokens = skip_newlines(tokens)

  let #(params, ret_type, tokens) = case tokens {
    [LBrace, ..] -> #([], None, tokens)
    _ -> {
      let assert Ok(#(_, tokens)) = expect(tokens, LParen)
      let tokens = skip_newlines(tokens)
      let #(params, tokens) = parse_param_list(tokens)
      let tokens = skip_newlines(tokens)
      let assert Ok(#(_, tokens)) = expect(tokens, RParen)
      let tokens = skip_newlines(tokens)

      let #(ret_type, tokens) = case tokens {
        [Arrow, ..rest] -> {
          let rest = skip_newlines(rest)
          let assert Ok(#(t, rest)) = parse_type(rest)
          #(Some(t), rest)
        }
        _ -> #(None, tokens)
      }
      #(params, ret_type, tokens)
    }
  }

  let tokens = skip_newlines(tokens)
  let assert Ok(#(body, tokens)) = parse_block(tokens)

  Ok(#(ast.DefFunction(name, params, ret_type, body), tokens))
}

fn parse_param_list(
  tokens: List(Token),
) -> #(List(ast.FunctionParam), List(Token)) {
  let tokens = skip_newlines(tokens)
  case tokens {
    [RParen, ..] -> #([], tokens)
    _ -> {
      let assert Ok(#(Identifier(name), tokens)) =
        consume(tokens, "<identifier>", fn(t) {
          case t {
            Identifier(_) -> True
            _ -> False
          }
        })
      let tokens = skip_newlines(tokens)
      let assert Ok(#(_, tokens)) = expect(tokens, Colon)
      let tokens = skip_newlines(tokens)
      let assert Ok(#(param_type, tokens)) = parse_type(tokens)
      let tokens = skip_newlines(tokens)

      let #(rest, tokens) = case tokens {
        [Comma, ..rest] -> {
          let rest = skip_newlines(rest)
          parse_param_list(rest)
        }
        _ -> #([], tokens)
      }
      #([ast.FunctionParam(name, Some(param_type)), ..rest], tokens)
    }
  }
}

fn parse_let_def(
  tokens: List(Token),
) -> Result(#(ast.Definition, List(Token)), ParseError) {
  let assert Ok(#(_, tokens)) = expect(tokens, Let)
  let tokens = skip_newlines(tokens)
  let assert Ok(#(Identifier(name), tokens)) =
    consume(tokens, "<identifier>", fn(t) {
      case t {
        Identifier(_) -> True
        _ -> False
      }
    })
  let tokens = skip_newlines(tokens)

  let #(t, tokens) = case tokens {
    [Colon, ..rest] -> {
      let rest = skip_newlines(rest)
      let assert Ok(#(ann, rest)) = parse_type(rest)
      #(Some(ann), rest)
    }
    _ -> #(None, tokens)
  }

  let tokens = skip_newlines(tokens)
  let assert Ok(#(_, tokens)) = expect(tokens, Equal)
  let tokens = skip_newlines(tokens)
  let assert Ok(#(value, tokens)) = parse_expression(tokens)
  Ok(#(ast.DefLet(name, t, value), tokens))
}

fn parse_type_def(
  tokens: List(Token),
) -> Result(#(ast.Definition, List(Token)), ParseError) {
  let assert Ok(#(_, tokens)) = expect(tokens, Type)
  let tokens = skip_newlines(tokens)
  let assert Ok(#(Identifier(name), tokens)) =
    consume(tokens, "<identifier>", fn(t) {
      case t {
        Identifier(_) -> True
        _ -> False
      }
    })
  let tokens = skip_newlines(tokens)

  let #(type_params, tokens) = parse_type_params(tokens)
  let tokens = skip_newlines(tokens)

  let assert Ok(#(_, tokens)) = expect(tokens, LBrace)
  let tokens = skip_newlines(tokens)

  let #(variants, remaining) = parse_variants(tokens)
  let remaining = skip_newlines(remaining)
  let assert Ok(#(_, remaining)) = expect(remaining, RBrace)
  Ok(#(ast.DefType(ast.SumType(name, type_params, variants)), remaining))
}

fn parse_type_params(
  tokens: List(Token),
) -> #(List(ast.TypeParam), List(Token)) {
  case tokens {
    [LParen, ..rest] -> {
      let rest = skip_newlines(rest)
      let #(params, rest) = parse_type_param_list(rest)
      let rest = skip_newlines(rest)
      let assert Ok(#(_, rest)) = expect(rest, RParen)
      #(params, rest)
    }
    _ -> #([], tokens)
  }
}

fn parse_type_param_list(
  tokens: List(Token),
) -> #(List(ast.TypeParam), List(Token)) {
  let tokens = skip_newlines(tokens)
  case tokens {
    [RParen, ..] -> #([], tokens)
    [Identifier(name), ..rest] -> {
      let rest = skip_newlines(rest)
      let #(rest_params, rest) = case rest {
        [Comma, ..rest] -> parse_type_param_list(rest)
        _ -> #([], rest)
      }
      #([ast.TypeParam(name), ..rest_params], rest)
    }
    _ -> #([], tokens)
  }
}

fn parse_variants(tokens: List(Token)) -> #(List(ast.Variant), List(Token)) {
  let tokens = skip_newlines(tokens)
  case tokens {
    [RBrace, ..] -> #([], tokens)
    [Identifier(name), ..rest] -> {
      let rest = skip_newlines(rest)
      let #(variant, rest) = case rest {
        [LParen, ..rest_after_lparen] -> {
          let #(fields, rest) = parse_variant_fields(rest_after_lparen)
          let rest = skip_newlines(rest)
          let assert Ok(#(_, rest)) = expect(rest, RParen)
          let rest = skip_newlines(rest)
          #(ast.Variant(name, fields), rest)
        }
        _ -> #(ast.Variant(name, []), skip_newlines(rest))
      }
      let #(more_variants, rest) = parse_variants(rest)
      #([variant, ..more_variants], rest)
    }
    _ -> #([], tokens)
  }
}

fn parse_variant_fields(
  tokens: List(Token),
) -> #(List(ast.VariantField), List(Token)) {
  let tokens = skip_newlines(tokens)
  case tokens {
    [RParen, ..] -> #([], tokens)
    [Identifier(name), ..rest] -> {
      let rest = skip_newlines(rest)
      // If followed by Colon, it's a named field; otherwise it's a type reference
      let #(value_type, rest) = case rest {
        [Colon, ..rest] -> {
          let rest = skip_newlines(rest)
          let assert Ok(#(t, rest)) = parse_type(rest)
          #(t, rest)
        }
        _ -> #(ast.TVariable(name), rest)
      }
      let rest = skip_newlines(rest)
      let #(rest_fields, rest) = case rest {
        [Comma, ..rest] -> {
          let rest = skip_newlines(rest)
          parse_variant_fields(rest)
        }
        _ -> #([], rest)
      }
      #([ast.VariantField(name, value_type), ..rest_fields], rest)
    }
    _ -> #([], tokens)
  }
}

fn parse_type(
  tokens: List(Token),
) -> Result(#(ast.TypeAnnotation, List(Token)), ParseError) {
  let tokens = skip_newlines(tokens)
  case tokens {
    [Identifier(name), ..rest] -> {
      let rest = skip_newlines(rest)
      // Check for type params
      let #(params, rest) = case rest {
        [LParen, ..rest] -> {
          let rest = skip_newlines(rest)
          let #(params, rest) = parse_type_list(rest)
          let rest = skip_newlines(rest)
          let assert Ok(#(_, rest)) = expect(rest, RParen)
          #(params, rest)
        }
        _ -> #([], rest)
      }

      // Check for function type (->)
      let rest = skip_newlines(rest)
      case rest {
        [Arrow, ..rest] -> {
          let rest = skip_newlines(rest)
          let assert Ok(#(ret_type, rest)) = parse_type(rest)
          Ok(#(
            ast.TFunction([ast.TNamed(name, params)], ast.Box(ret_type)),
            rest,
          ))
        }
        _ -> Ok(#(ast.TNamed(name, params), rest))
      }
    }
    _ ->
      Error(ParseError(
        "type",
        case tokens {
          [] -> EOF
          [t, ..] -> t
        },
        0,
        0,
      ))
  }
}

fn parse_type_list(
  tokens: List(Token),
) -> #(List(ast.TypeAnnotation), List(Token)) {
  let tokens = skip_newlines(tokens)
  case tokens {
    [RParen, ..] -> #([], tokens)
    _ -> {
      let assert Ok(#(t, tokens)) = parse_type(tokens)
      let tokens = skip_newlines(tokens)
      let #(rest, tokens) = case tokens {
        [Comma, ..rest] -> {
          let rest = skip_newlines(rest)
          parse_type_list(rest)
        }
        _ -> #([], tokens)
      }
      #([t, ..rest], tokens)
    }
  }
}

// === Expression Parsing ===

fn parse_expression(
  tokens: List(Token),
) -> Result(#(ast.Expression, List(Token)), ParseError) {
  let assert Ok(#(expr, tokens)) = parse_binary(tokens, 1)
  parse_pipe_chain(tokens, expr) |> reassign_check
}

fn reassign_check(
  result: Result(#(ast.Expression, List(Token)), ParseError),
) -> Result(#(ast.Expression, List(Token)), ParseError) {
  case result {
    Ok(#(ast.EVariable(name), tokens)) -> {
      let tokens = skip_newlines(tokens)
      case tokens {
        [Equal, ..rest] -> {
          let rest = skip_newlines(rest)
          let assert Ok(#(value, rest)) = parse_expression(rest)
          let rest = skip_newlines(rest)
          Ok(#(ast.EReassign(name, ast.Box(value)), rest))
        }
        [PlusEqual, ..rest] -> {
          let rest = skip_newlines(rest)
          let assert Ok(#(value, rest)) = parse_expression(rest)
          let rest = skip_newlines(rest)
          let op = ast.EInfix(ast.Box(ast.EVariable(name)), ast.Add, ast.Box(value))
          Ok(#(ast.EReassign(name, ast.Box(op)), rest))
        }
        [MinusEqual, ..rest] -> {
          let rest = skip_newlines(rest)
          let assert Ok(#(value, rest)) = parse_expression(rest)
          let rest = skip_newlines(rest)
          let op = ast.EInfix(ast.Box(ast.EVariable(name)), ast.Subtract, ast.Box(value))
          Ok(#(ast.EReassign(name, ast.Box(op)), rest))
        }
        [StarEqual, ..rest] -> {
          let rest = skip_newlines(rest)
          let assert Ok(#(value, rest)) = parse_expression(rest)
          let rest = skip_newlines(rest)
          let op = ast.EInfix(ast.Box(ast.EVariable(name)), ast.Multiply, ast.Box(value))
          Ok(#(ast.EReassign(name, ast.Box(op)), rest))
        }
        [SlashEqual, ..rest] -> {
          let rest = skip_newlines(rest)
          let assert Ok(#(value, rest)) = parse_expression(rest)
          let rest = skip_newlines(rest)
          let op = ast.EInfix(ast.Box(ast.EVariable(name)), ast.Divide, ast.Box(value))
          Ok(#(ast.EReassign(name, ast.Box(op)), rest))
        }
        _ -> Ok(#(ast.EVariable(name), tokens))
      }
    }
    _ -> result
  }
}

fn parse_pipe_chain(
  tokens: List(Token),
  left: ast.Expression,
) -> Result(#(ast.Expression, List(Token)), ParseError) {
  let tokens = skip_newlines(tokens)
  case tokens {
    [Pipe, ..rest] -> {
      let assert Ok(#(right, rest)) = parse_binary(rest, 1)
      let pipe_expr = ast.EPipe(ast.Box(left), ast.Box(right))
      parse_pipe_chain(rest, pipe_expr)
    }
    _ -> Ok(#(left, tokens))
  }
}

fn parse_binary(
  tokens: List(Token),
  min_prec: Int,
) -> Result(#(ast.Expression, List(Token)), ParseError) {
  let assert Ok(#(left, tokens_after_left)) = parse_unary(tokens)
  parse_binary_cont(tokens_after_left, left, min_prec)
}

fn parse_binary_cont(
  tokens: List(Token),
  left: ast.Expression,
  min_prec: Int,
) -> Result(#(ast.Expression, List(Token)), ParseError) {
  let tokens = skip_newlines(tokens)

  case tokens {
    [DotDot, ..rest] if min_prec <= 1 -> {
      let assert Ok(#(right, rest_after_right)) = parse_binary(rest, 2)
      let range_expr = ast.ERange(ast.Box(left), ast.Box(right))
      parse_binary_cont(rest_after_right, range_expr, min_prec)
    }
    _ -> {
      let op_info = case tokens {
        [OrOr, ..] if min_prec <= 1 -> Some(#(ast.Or, 1))
        [AndAnd, ..] if min_prec <= 2 -> Some(#(ast.And, 2))
        [EqualEqual, ..] if min_prec <= 3 -> Some(#(ast.Equal, 3))
        [BangEqual, ..] if min_prec <= 3 -> Some(#(ast.NotEqual, 3))
        [Less, ..] if min_prec <= 3 -> Some(#(ast.LessThan, 3))
        [Greater, ..] if min_prec <= 3 -> Some(#(ast.GreaterThan, 3))
        [LessEqual, ..] if min_prec <= 3 -> Some(#(ast.LessOrEqual, 3))
        [GreaterEqual, ..] if min_prec <= 3 -> Some(#(ast.GreaterOrEqual, 3))
        [Concat, ..] if min_prec <= 4 -> Some(#(ast.Concat, 4))
        [Plus, ..] if min_prec <= 5 -> Some(#(ast.Add, 5))
        [Minus, ..] if min_prec <= 5 -> Some(#(ast.Subtract, 5))
        [Star, ..] if min_prec <= 6 -> Some(#(ast.Multiply, 6))
        [Slash, ..] if min_prec <= 6 -> Some(#(ast.Divide, 6))
        [Percent, ..] if min_prec <= 6 -> Some(#(ast.Modulo, 6))
        _ -> None
      }

      case op_info {
        None -> Ok(#(left, tokens))
        Some(#(op, prec)) -> {
          case tokens {
            [_, ..rest] -> {
              let assert Ok(#(right, rest_after_right)) =
                parse_binary(rest, prec + 1)
              let combined = ast.EInfix(ast.Box(left), op, ast.Box(right))
              parse_binary_cont(rest_after_right, combined, min_prec)
            }
            _ -> Ok(#(left, tokens))
          }
        }
      }
    }
  }
}

fn parse_unary(
  tokens: List(Token),
) -> Result(#(ast.Expression, List(Token)), ParseError) {
  let tokens = skip_newlines(tokens)
  case tokens {
    [Bang, ..rest] -> {
      let assert Ok(#(operand, rest)) = parse_unary(rest)
      Ok(#(ast.EUnary(ast.Not, ast.Box(operand)), rest))
    }
    [Minus, ..rest] -> {
      let assert Ok(#(operand, rest)) = parse_unary(rest)
      Ok(#(ast.EUnary(ast.Negate, ast.Box(operand)), rest))
    }
    _ -> parse_call_primary(tokens)
  }
}

fn parse_call_primary(
  tokens: List(Token),
) -> Result(#(ast.Expression, List(Token)), ParseError) {
  let assert Ok(#(expr, tokens_after_primary)) = parse_primary(tokens)
  parse_call_cont(tokens_after_primary, expr)
}

fn parse_call_cont(
  tokens: List(Token),
  expr: ast.Expression,
) -> Result(#(ast.Expression, List(Token)), ParseError) {
  let tokens = skip_newlines(tokens)
  case tokens {
    [LParen, ..rest] -> {
      let rest = skip_newlines(rest)
      let #(args, rest) = parse_arg_list(rest)
      let rest = skip_newlines(rest)
      let assert Ok(#(_, rest)) = expect(rest, RParen)
      let call_expr = ast.ECall(ast.Box(expr), args)
      parse_call_cont(rest, call_expr)
    }
    [Dot, Identifier(name), LParen, ..rest] -> {
      let rest = skip_newlines(rest)
      let #(args, rest) = parse_arg_list(rest)
      let rest = skip_newlines(rest)
      let assert Ok(#(_, rest)) = expect(rest, RParen)
      let call_expr = ast.EMethodCall(ast.Box(expr), name, args)
      parse_call_cont(rest, call_expr)
    }
    [Dot, Identifier(name), ..rest] -> {
      let field_expr = ast.EFieldAccess(ast.Box(expr), name)
      parse_call_cont(rest, field_expr)
    }
    [LBracket, ..rest] -> {
      let rest = skip_newlines(rest)
      let assert Ok(#(index, rest)) = parse_expression(rest)
      let rest = skip_newlines(rest)
      let assert Ok(#(_, rest)) = expect(rest, RBracket)
      let index_expr = ast.EIndex(ast.Box(expr), ast.Box(index))
      parse_call_cont(rest, index_expr)
    }
    _ -> Ok(#(expr, tokens))
  }
}

fn parse_arg_list(tokens: List(Token)) -> #(List(ast.Expression), List(Token)) {
  let tokens = skip_newlines(tokens)
  case tokens {
    [RParen, ..] -> #([], tokens)
    _ -> {
      let assert Ok(#(expr, tokens)) = parse_expression(tokens)
      let tokens = skip_newlines(tokens)
      let #(rest, tokens) = case tokens {
        [Comma, ..rest] -> {
          let rest = skip_newlines(rest)
          parse_arg_list(rest)
        }
        _ -> #([], tokens)
      }
      #([expr, ..rest], tokens)
    }
  }
}

fn parse_primary(
  tokens: List(Token),
) -> Result(#(ast.Expression, List(Token)), ParseError) {
  let tokens = skip_newlines(tokens)
  case tokens {
    [IntLiteral(n), ..rest] -> Ok(#(ast.ELiteral(ast.LInt(n)), rest))
    [FloatLiteral(f), ..rest] -> Ok(#(ast.ELiteral(ast.LFloat(f)), rest))
    [TrueToken, ..rest] -> Ok(#(ast.ELiteral(ast.LBool(True)), rest))
    [FalseToken, ..rest] -> Ok(#(ast.ELiteral(ast.LBool(False)), rest))
    [StringLiteral(s), ..rest] -> Ok(#(ast.ELiteral(ast.LString(s)), rest))

    [Identifier(name), DotDot, ..rest] -> {
      let assert Ok(#(end_expr, rest)) = parse_expression(rest)
      Ok(#(ast.ERange(ast.Box(ast.EVariable(name)), ast.Box(end_expr)), rest))
    }

    [Identifier(name), LParen, ..rest] -> {
      // Peek: if after LParen we see Identifier:Colon → record construction, else → function call
      let rest_skip = skip_newlines(rest)
      case rest_skip {
        [Identifier(_), Colon, ..] -> {
          let #(fields, rest) = parse_record_fields(rest, [])
          let rest = skip_newlines(rest)
          let assert Ok(#(_, rest)) = expect(rest, RParen)
          Ok(#(ast.ERecord(name, fields), rest))
        }
        _ -> Ok(#(ast.EVariable(name), [LParen, ..rest]))
      }
    }

    [Identifier(name), ..rest] -> {
      Ok(#(ast.EVariable(name), rest))
    }

    [LParen, ..rest] -> {
      let rest = skip_newlines(rest)
      let assert Ok(#(expr, rest)) = parse_expression(rest)
      let rest = skip_newlines(rest)
      let assert Ok(#(_, rest)) = expect(rest, RParen)
      Ok(#(expr, rest))
    }

    [LBracket, ..rest] -> {
      let rest = skip_newlines(rest)
      let #(items, rest) = parse_list_items(rest, [])
      let rest = skip_newlines(rest)
      let assert Ok(#(_, rest)) = expect(rest, RBracket)
      Ok(#(ast.EList(items), rest))
    }

    [If, ..rest] -> parse_if_expr(rest)
    [Match, ..rest] -> parse_match_expr(rest)
    [For, ..rest] -> parse_for_expr(rest)
    [While, ..rest] -> parse_while_expr(rest)
    [Fn, ..rest] -> parse_lambda(rest)
    [Return, ..rest] -> parse_return_expr(rest)

    [LBrace, ..rest] -> parse_block(rest)

    _ ->
      Error(ParseError(
        "expression",
        case tokens {
          [] -> EOF
          [t, ..] -> t
        },
        0,
        0,
      ))
  }
}

fn parse_record_fields(
  tokens: List(Token),
  acc: List(#(String, ast.Expression)),
) -> #(List(#(String, ast.Expression)), List(Token)) {
  let tokens = skip_newlines(tokens)
  case tokens {
    [RParen, ..] -> #(list.reverse(acc), tokens)
    [Identifier(name), Colon, ..rest] -> {
      let rest = skip_newlines(rest)
      let assert Ok(#(value, rest)) = parse_expression(rest)
      let rest = skip_newlines(rest)
      case rest {
        [Comma, ..rest2] ->
          parse_record_fields(rest2, [#(name, value), ..acc])
        _ -> #(list.reverse([#(name, value), ..acc]), rest)
      }
    }
    _ -> #(list.reverse(acc), tokens)
  }
}

fn parse_list_items(
  tokens: List(Token),
  acc: List(ast.Expression),
) -> #(List(ast.Expression), List(Token)) {
  let tokens = skip_newlines(tokens)
  case tokens {
    [RBracket, ..] -> #(list.reverse(acc), tokens)
    _ -> {
      let assert Ok(#(expr, rest)) = parse_expression(tokens)
      let rest = skip_newlines(rest)
      case rest {
        [Comma, ..rest2] -> parse_list_items(rest2, [expr, ..acc])
        _ -> #(list.reverse([expr, ..acc]), rest)
      }
    }
  }
}

fn parse_while_expr(
  tokens: List(Token),
) -> Result(#(ast.Expression, List(Token)), ParseError) {
  let tokens = skip_newlines(tokens)
  let assert Ok(#(cond, tokens)) = parse_expression(tokens)
  let tokens = skip_newlines(tokens)
  let assert Ok(#(body, tokens)) = parse_block(tokens)
  Ok(#(ast.EWhile(ast.Box(cond), ast.Box(body)), tokens))
}

fn parse_if_expr(
  tokens: List(Token),
) -> Result(#(ast.Expression, List(Token)), ParseError) {
  let tokens = skip_newlines(tokens)
  let assert Ok(#(cond, tokens)) = parse_expression(tokens)
  let tokens = skip_newlines(tokens)
  let assert Ok(#(conseq, tokens)) = parse_block(tokens)
  let tokens = skip_newlines(tokens)
  case tokens {
    [Else, If, ..rest] -> {
      // else if → recursively parse as nested EIf in the alt position
      let rest = skip_newlines(rest)
      let assert Ok(#(alt, rest)) = parse_if_expr(rest)
      Ok(#(ast.EIf(ast.Box(cond), ast.Box(conseq), [], Some(ast.Box(alt))), rest))
    }
    [Else, ..rest] -> {
      let rest = skip_newlines(rest)
      let assert Ok(#(alt_body, rest)) = parse_block(rest)
      Ok(#(ast.EIf(ast.Box(cond), ast.Box(conseq), [], Some(ast.Box(alt_body))), rest))
    }
    _ -> Ok(#(ast.EIf(ast.Box(cond), ast.Box(conseq), [], None), tokens))
  }
}

// match Expression { Pattern -> Expression ... }
fn parse_match_expr(
  tokens: List(Token),
) -> Result(#(ast.Expression, List(Token)), ParseError) {
  let tokens = skip_newlines(tokens)
  let assert Ok(#(value, tokens)) = parse_expression(tokens)
  let tokens = skip_newlines(tokens)
  let assert Ok(#(_, tokens)) = expect(tokens, LBrace)
  let tokens = skip_newlines(tokens)
  let #(clauses, remaining) = parse_match_clauses(tokens)
  let remaining = skip_newlines(remaining)
  let assert Ok(#(_, remaining)) = expect(remaining, RBrace)
  Ok(#(ast.EMatch(ast.Box(value), clauses), remaining))
}

fn parse_match_clauses(
  tokens: List(Token),
) -> #(List(ast.MatchClause), List(Token)) {
  let tokens = skip_newlines(tokens)
  case tokens {
    [RBrace, ..] -> #([], tokens)
    _ -> {
      let assert Ok(#(pattern, tokens)) = parse_pattern(tokens)
      let tokens = skip_newlines(tokens)
      let assert Ok(#(_, tokens)) = expect(tokens, Arrow)
      let tokens = skip_newlines(tokens)
      let assert Ok(#(body, tokens)) = parse_expression(tokens)
      let tokens = skip_newlines(tokens)

      // Check for optional guard
      let #(guard, tokens) = case tokens {
        [If, ..rest] -> {
          let rest = skip_newlines(rest)
          let assert Ok(#(guard_expr, rest)) = parse_expression(rest)
          #(Some(guard_expr), rest)
        }
        _ -> #(None, tokens)
      }

      let tokens = skip_newlines(tokens)
      let #(rest, tokens) = parse_match_clauses(tokens)
      #([ast.MatchClause(pattern, guard, body), ..rest], tokens)
    }
  }
}

// for Identifier in Expression { Expression }
fn parse_for_expr(
  tokens: List(Token),
) -> Result(#(ast.Expression, List(Token)), ParseError) {
  let tokens = skip_newlines(tokens)
  let assert Ok(#(Identifier(name), tokens)) =
    consume(tokens, "<identifier>", fn(t) {
      case t {
        Identifier(_) -> True
        _ -> False
      }
    })
  let tokens = skip_newlines(tokens)
  let assert Ok(#(_, tokens)) = expect(tokens, In)
  let tokens = skip_newlines(tokens)
  let assert Ok(#(iterable, tokens)) = parse_expression(tokens)
  let tokens = skip_newlines(tokens)
  let assert Ok(#(body, tokens)) = parse_block(tokens)
  Ok(#(ast.EFor(name, ast.Box(iterable), ast.Box(body)), tokens))
}

// fn(Params) -> Type { Expression }
fn parse_lambda(
  tokens: List(Token),
) -> Result(#(ast.Expression, List(Token)), ParseError) {
  let tokens = skip_newlines(tokens)
  let assert Ok(#(_, tokens)) = expect(tokens, LParen)
  let tokens = skip_newlines(tokens)
  let #(params, tokens) = parse_param_list(tokens)
  let tokens = skip_newlines(tokens)
  let assert Ok(#(_, tokens)) = expect(tokens, RParen)
  let tokens = skip_newlines(tokens)

  let #(ret_type, tokens) = case tokens {
    [Arrow, ..rest] -> {
      let rest = skip_newlines(rest)
      let assert Ok(#(t, rest)) = parse_type(rest)
      #(Some(t), rest)
    }
    _ -> #(None, tokens)
  }

  let tokens = skip_newlines(tokens)
  let assert Ok(#(body, tokens)) = parse_block(tokens)
  Ok(#(ast.ELambda(params, ret_type, ast.Box(body)), tokens))
}

// return Expression
fn parse_return_expr(
  tokens: List(Token),
) -> Result(#(ast.Expression, List(Token)), ParseError) {
  let tokens = skip_newlines(tokens)
  let assert Ok(#(value, tokens)) = parse_expression(tokens)
  Ok(#(ast.EReturn(ast.Box(value)), tokens))
}

// { Statement* }
fn parse_block(
  tokens: List(Token),
) -> Result(#(ast.Expression, List(Token)), ParseError) {
  let assert Ok(#(_, tokens)) = expect(tokens, LBrace)
  let tokens = skip_newlines(tokens)
  let #(items, remaining) = parse_block_items(tokens)
  let remaining = skip_newlines(remaining)
  let assert Ok(#(_, remaining)) = expect(remaining, RBrace)

  Ok(#(ast.EBlock(items), remaining))
}

fn parse_block_items(
  tokens: List(Token),
) -> #(List(ast.BlockItem), List(Token)) {
  let tokens = skip_newlines(tokens)
  case tokens {
    [RBrace, ..] -> #([], tokens)
    [Fn, ..rest] -> {
      case rest {
        [LParen, ..] -> {
          let assert Ok(#(expr, tokens)) = parse_lambda(rest)
          let tokens = skip_newlines(tokens)
          let #(items, tokens) = parse_block_items(tokens)
          #([ast.BlockExpr(expr), ..items], tokens)
        }
        _ -> {
          let assert Ok(#(def, tokens)) = parse_function_def(tokens)
          let tokens = skip_newlines(tokens)
          let #(items, tokens) = parse_block_items(tokens)
          #([ast.BlockDef(def), ..items], tokens)
        }
      }
    }
    [Let, ..] -> {
      let assert Ok(#(def, tokens)) = parse_let_def(tokens)
      let tokens = skip_newlines(tokens)
      let #(items, tokens) = parse_block_items(tokens)
      #([ast.BlockDef(def), ..items], tokens)
    }
    [Type, ..] -> {
      let assert Ok(#(def, tokens)) = parse_type_def(tokens)
      let tokens = skip_newlines(tokens)
      let #(items, tokens) = parse_block_items(tokens)
      #([ast.BlockDef(def), ..items], tokens)
    }
    _ -> {
      let assert Ok(#(expr, tokens)) = parse_expression(tokens)
      let tokens = skip_newlines(tokens)
      let #(items, tokens) = parse_block_items(tokens)
      #([ast.BlockExpr(expr), ..items], tokens)
    }
  }
}

fn parse_pattern(
  tokens: List(Token),
) -> Result(#(ast.Pattern, List(Token)), ParseError) {
  let tokens = skip_newlines(tokens)
  case tokens {
    [IntLiteral(n), ..rest] -> Ok(#(ast.PLiteral(ast.LInt(n)), rest))
    [FloatLiteral(f), ..rest] -> Ok(#(ast.PLiteral(ast.LFloat(f)), rest))
    [TrueToken, ..rest] -> Ok(#(ast.PLiteral(ast.LBool(True)), rest))
    [FalseToken, ..rest] -> Ok(#(ast.PLiteral(ast.LBool(False)), rest))
    [StringLiteral(s), ..rest] -> Ok(#(ast.PLiteral(ast.LString(s)), rest))
    [Underscore, ..rest] -> Ok(#(ast.PWildcard, rest))
    [Identifier(name), ..rest] -> {
      // Check for variant with fields
      let rest = skip_newlines(rest)
      case rest {
        [LParen, ..rest] -> {
          let rest = skip_newlines(rest)
          let #(fields, rest) = parse_pattern_fields(rest)
          let rest = skip_newlines(rest)
          let assert Ok(#(_, rest)) = expect(rest, RParen)
          Ok(#(ast.PVariant(name, fields), rest))
        }
        _ -> Ok(#(ast.PVariable(name), rest))
      }
    }
    _ ->
      Error(ParseError(
        "pattern",
        case tokens {
          [] -> EOF
          [t, ..] -> t
        },
        0,
        0,
      ))
  }
}

fn parse_pattern_fields(
  tokens: List(Token),
) -> #(List(ast.Pattern), List(Token)) {
  let tokens = skip_newlines(tokens)
  case tokens {
    [Comma, ..rest] -> {
      let rest = skip_newlines(rest)
      parse_pattern_fields(rest)
    }
    [RParen, ..] -> #([], tokens)
    _ -> {
      let assert Ok(#(p, tokens)) = parse_pattern(tokens)
      let tokens = skip_newlines(tokens)
      let #(rest, tokens) = case tokens {
        [Comma, ..rest] -> {
          let rest = skip_newlines(rest)
          parse_pattern_fields(rest)
        }
        _ -> #([], tokens)
      }
      #([p, ..rest], tokens)
    }
  }
}
