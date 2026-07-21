import gleam/int
import gleam/list
import gleam/string

const digits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]

const lower_letters = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
]

const upper_letters = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
]

pub type Token {
  Module
  Import
  As
  Fn
  Let
  Type
  If
  Else
  Match
  For
  In
  Return
  TrueToken
  FalseToken
  Underscore

  Plus
  Minus
  Star
  Slash
  Percent
  EqualEqual
  BangEqual
  Less
  Greater
  LessEqual
  GreaterEqual
  AndAnd
  OrOr
  Bang
  Concat
  Pipe

  LParen
  RParen
  LBrace
  RBrace
  LBracket
  RBracket
  Comma
  Dot
  Colon
  Arrow
  Equal
  DotDot

  IntLiteral(Int)
  FloatLiteral(Float)
  StringLiteral(String)
  Identifier(String)

  Newline
  EOF
}

pub type TokenError {
  TokenError(message: String, line: Int, col: Int)
}

pub type TokenizeResult {
  TokenizeResult(tokens: List(Token), errors: List(TokenError))
}

pub fn tokenize(source: String) -> TokenizeResult {
  let chars = string.to_graphemes(source)
  do_tokenize(chars, 0, 0, [], [])
}

fn starts_with(
  chars: List(String),
  expected: String,
) -> Result(List(String), Nil) {
  case chars {
    [c, ..rest] if c == expected -> Ok(rest)
    _ -> Error(Nil)
  }
}

fn do_tokenize(
  chars: List(String),
  line: Int,
  col: Int,
  tokens: List(Token),
  errors: List(TokenError),
) -> TokenizeResult {
  case chars {
    [] -> TokenizeResult(tokens: list.reverse(tokens), errors: errors)

    [c, ..rest] ->
      case c {
        "\n" -> do_tokenize(rest, line + 1, 0, [Newline, ..tokens], errors)

        " " -> do_tokenize(rest, line, col + 1, tokens, errors)
        "\t" -> do_tokenize(rest, line, col + 1, tokens, errors)
        "\r" -> do_tokenize(rest, line, col + 1, tokens, errors)

        "/" -> {
          case starts_with(rest, "/") {
            Ok(comment_rest) ->
              skip_line_comment(comment_rest, line, col, tokens, errors)
            _ -> do_tokenize(rest, line, col + 1, [Slash, ..tokens], errors)
          }
        }

        "+" -> do_tokenize(rest, line, col + 1, [Plus, ..tokens], errors)
        "-" -> {
          case starts_with(rest, ">") {
            Ok(after_arrow) ->
              do_tokenize(after_arrow, line, col + 2, [Arrow, ..tokens], errors)
            _ -> do_tokenize(rest, line, col + 1, [Minus, ..tokens], errors)
          }
        }
        "*" -> do_tokenize(rest, line, col + 1, [Star, ..tokens], errors)
        "%" -> do_tokenize(rest, line, col + 1, [Percent, ..tokens], errors)

        "=" -> {
          case starts_with(rest, "=") {
            Ok(after_eq) ->
              do_tokenize(
                after_eq,
                line,
                col + 2,
                [EqualEqual, ..tokens],
                errors,
              )
            _ -> do_tokenize(rest, line, col + 1, [Equal, ..tokens], errors)
          }
        }

        "!" -> {
          case starts_with(rest, "=") {
            Ok(after_bangeq) ->
              do_tokenize(
                after_bangeq,
                line,
                col + 2,
                [BangEqual, ..tokens],
                errors,
              )
            _ -> do_tokenize(rest, line, col + 1, [Bang, ..tokens], errors)
          }
        }

        "<" -> {
          case starts_with(rest, ">") {
            Ok(after_concat) ->
              do_tokenize(
                after_concat,
                line,
                col + 2,
                [Concat, ..tokens],
                errors,
              )
            _ -> {
              case starts_with(rest, "=") {
                Ok(after_le) ->
                  do_tokenize(
                    after_le,
                    line,
                    col + 2,
                    [LessEqual, ..tokens],
                    errors,
                  )
                _ -> do_tokenize(rest, line, col + 1, [Less, ..tokens], errors)
              }
            }
          }
        }

        ">" -> {
          case starts_with(rest, "=") {
            Ok(after_ge) ->
              do_tokenize(
                after_ge,
                line,
                col + 2,
                [GreaterEqual, ..tokens],
                errors,
              )
            _ -> do_tokenize(rest, line, col + 1, [Greater, ..tokens], errors)
          }
        }

        "&" -> {
          case starts_with(rest, "&") {
            Ok(after_and) ->
              do_tokenize(after_and, line, col + 2, [AndAnd, ..tokens], errors)
            _ ->
              do_tokenize(rest, line, col + 1, tokens, [
                TokenError("unexpected '&'", line, col),
                ..errors
              ])
          }
        }

        "|" -> {
          case starts_with(rest, "|") {
            Ok(after_or) ->
              do_tokenize(after_or, line, col + 2, [OrOr, ..tokens], errors)
            _ -> {
              case starts_with(rest, ">") {
                Ok(after_pipe) ->
                  do_tokenize(
                    after_pipe,
                    line,
                    col + 2,
                    [Pipe, ..tokens],
                    errors,
                  )
                _ ->
                  do_tokenize(rest, line, col + 1, tokens, [
                    TokenError("unexpected '|'", line, col),
                    ..errors
                  ])
              }
            }
          }
        }

        "(" -> do_tokenize(rest, line, col + 1, [LParen, ..tokens], errors)
        ")" -> do_tokenize(rest, line, col + 1, [RParen, ..tokens], errors)
        "{" -> do_tokenize(rest, line, col + 1, [LBrace, ..tokens], errors)
        "}" -> do_tokenize(rest, line, col + 1, [RBrace, ..tokens], errors)
        "[" -> do_tokenize(rest, line, col + 1, [LBracket, ..tokens], errors)
        "]" -> do_tokenize(rest, line, col + 1, [RBracket, ..tokens], errors)
        "," -> do_tokenize(rest, line, col + 1, [Comma, ..tokens], errors)
        ":" -> do_tokenize(rest, line, col + 1, [Colon, ..tokens], errors)

        "." -> {
          case starts_with(rest, ".") {
            Ok(after_dotdot) ->
              do_tokenize(
                after_dotdot,
                line,
                col + 2,
                [DotDot, ..tokens],
                errors,
              )
            _ -> do_tokenize(rest, line, col + 1, [Dot, ..tokens], errors)
          }
        }

        "\"" -> read_string(rest, line, col + 1, "", tokens, errors)

        _ -> {
          case list.contains(digits, c) {
            True -> read_number(chars, line, col, "", tokens, errors)
            False -> {
              case is_ident_start(c) {
                True -> read_ident(chars, line, col, "", tokens, errors)
                False ->
                  do_tokenize(rest, line, col + 1, tokens, [
                    TokenError("unexpected character: " <> c, line, col),
                    ..errors
                  ])
              }
            }
          }
        }
      }
  }
}

fn is_ident_start(c: String) -> Bool {
  list.contains(lower_letters, c) || list.contains(upper_letters, c) || c == "_"
}

fn skip_line_comment(
  chars: List(String),
  line: Int,
  col: Int,
  tokens: List(Token),
  errors: List(TokenError),
) -> TokenizeResult {
  case chars {
    [] -> do_tokenize([], line, col, tokens, errors)
    ["\n", ..rest_cps] -> do_tokenize(rest_cps, line, col, tokens, errors)
    [_, ..rest_cps] ->
      skip_line_comment(rest_cps, line, col + 1, tokens, errors)
  }
}

fn read_string(
  chars: List(String),
  line: Int,
  col: Int,
  acc: String,
  tokens: List(Token),
  errors: List(TokenError),
) -> TokenizeResult {
  case chars {
    [] ->
      TokenizeResult(tokens: list.reverse(tokens), errors: [
        TokenError("unterminated string", line, col),
        ..errors
      ])
    ["\n", ..] ->
      TokenizeResult(tokens: list.reverse(tokens), errors: [
        TokenError("unterminated string", line, col),
        ..errors
      ])
    ["\"", ..rest] ->
      do_tokenize(rest, line, col + 1, [StringLiteral(acc), ..tokens], errors)
    ["\\", ..rest] -> {
      case rest {
        ["n", ..rest2] ->
          read_string(rest2, line, col + 2, acc <> "\n", tokens, errors)
        ["t", ..rest2] ->
          read_string(rest2, line, col + 2, acc <> "\t", tokens, errors)
        ["\\", ..rest2] ->
          read_string(rest2, line, col + 2, acc <> "\\", tokens, errors)
        ["\"", ..rest2] ->
          read_string(rest2, line, col + 2, acc <> "\"", tokens, errors)
        _ -> read_string(rest, line, col + 1, acc <> "\\", tokens, errors)
      }
    }
    [c, ..rest] -> read_string(rest, line, col + 1, acc <> c, tokens, errors)
  }
}

fn read_number(
  chars: List(String),
  line: Int,
  col: Int,
  acc: String,
  tokens: List(Token),
  errors: List(TokenError),
) -> TokenizeResult {
  let is_float = string.contains(acc, ".")

  case chars {
    [] -> finish_number([], acc, is_float, line, col, tokens, errors)
    [c, ..rest] -> {
      case list.contains(digits, c) {
        True -> read_number(rest, line, col + 1, acc <> c, tokens, errors)
        False -> {
          case c {
            "." if !is_float -> {
              case rest {
                [] ->
                  finish_number([], acc <> ".", True, line, col, tokens, errors)
                [n, ..] -> {
                  case list.contains(digits, n) {
                    True ->
                      read_number(
                        rest,
                        line,
                        col + 1,
                        acc <> ".",
                        tokens,
                        errors,
                      )
                    False ->
                      finish_number(
                        chars,
                        acc,
                        is_float,
                        line,
                        col,
                        tokens,
                        errors,
                      )
                  }
                }
              }
            }
            _ -> finish_number(chars, acc, is_float, line, col, tokens, errors)
          }
        }
      }
    }
  }
}

fn finish_number(
  chars: List(String),
  acc: String,
  is_float: Bool,
  line: Int,
  col: Int,
  tokens: List(Token),
  errors: List(TokenError),
) -> TokenizeResult {
  let token = case is_float {
    True ->
      case int.parse(acc) {
        Ok(n) -> IntLiteral(n)
        _ ->
          case parse_float(acc) {
            Ok(f) -> FloatLiteral(f)
            _ -> Identifier(acc)
          }
      }
    False ->
      case int.parse(acc) {
        Ok(n) -> IntLiteral(n)
        _ -> Identifier(acc)
      }
  }
  do_tokenize(chars, line, col, [token, ..tokens], errors)
}

fn parse_float(s: String) -> Result(Float, Nil) {
  case s {
    "" -> Error(Nil)
    _ -> {
      let parts = string.split(s, ".")
      case parts {
        [int_part, frac_part] if frac_part != "" -> {
          case int.parse(int_part) {
            Ok(n) -> {
              case int.parse(frac_part) {
                Ok(f) -> {
                  let frac_len = string.length(frac_part)
                  let divisor = power(10.0, frac_len)
                  let result = int.to_float(n) +. int.to_float(f) /. divisor
                  Ok(result)
                }
                _ -> Error(Nil)
              }
            }
            _ -> Error(Nil)
          }
        }
        _ -> Error(Nil)
      }
    }
  }
}

fn power(base: Float, exp: Int) -> Float {
  case exp {
    0 -> 1.0
    _ if exp < 0 -> 1.0 /. power(base, -exp)
    _ -> base *. power(base, exp - 1)
  }
}

fn read_ident(
  chars: List(String),
  line: Int,
  col: Int,
  acc: String,
  tokens: List(Token),
  errors: List(TokenError),
) -> TokenizeResult {
  case chars {
    [] -> finish_ident([], acc, line, col, tokens, errors)
    [c, ..rest] -> {
      case is_ident_continue(c) {
        True -> read_ident(rest, line, col + 1, acc <> c, tokens, errors)
        False -> finish_ident(chars, acc, line, col, tokens, errors)
      }
    }
  }
}

fn is_ident_continue(c: String) -> Bool {
  is_ident_start(c) || list.contains(digits, c)
}

fn finish_ident(
  chars: List(String),
  acc: String,
  line: Int,
  col: Int,
  tokens: List(Token),
  errors: List(TokenError),
) -> TokenizeResult {
  let keyword_token = case acc {
    "module" -> Ok(Module)
    "import" -> Ok(Import)
    "as" -> Ok(As)
    "fn" -> Ok(Fn)
    "let" -> Ok(Let)
    "type" -> Ok(Type)
    "if" -> Ok(If)
    "else" -> Ok(Else)
    "match" -> Ok(Match)
    "for" -> Ok(For)
    "in" -> Ok(In)
    "return" -> Ok(Return)
    "true" -> Ok(TrueToken)
    "false" -> Ok(FalseToken)
    "_" -> Ok(Underscore)
    _ -> Error(Nil)
  }
  let token = case keyword_token {
    Ok(t) -> t
    Error(Nil) -> Identifier(acc)
  }
  do_tokenize(chars, line, col, [token, ..tokens], errors)
}

pub fn token_name(t: Token) -> String {
  case t {
    Module -> "module"
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
    TrueToken -> "true"
    FalseToken -> "false"
    Underscore -> "_"
    Plus -> "+"
    Minus -> "-"
    Star -> "*"
    Slash -> "/"
    Percent -> "%"
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
