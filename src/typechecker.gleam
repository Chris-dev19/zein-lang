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
import gleam/option.{type Option, None, Some}
import gleam/string

pub type Type {
  TInt
  TFloat
  TBool
  TString
  TVar(Int)
  TFun(List(Type), ast.Box(Type))
  TApp(String, List(Type))
}

pub type TypeError {
  TypeError(message: String)
}

pub type TypeEnv {
  TypeEnv(bindings: List(#(String, Type)))
}

pub type Substitution {
  Substitution(map: List(#(Int, Type)))
}

pub type TypeCheckerState {
  TypeCheckerState(
    env: TypeEnv,
    subs: Substitution,
    counter: Int,
    errors: List(TypeError),
  )
}

fn empty_env() -> TypeEnv {
  TypeEnv([])
}

fn empty_subs() -> Substitution {
  Substitution([])
}

fn initial_state() -> TypeCheckerState {
  TypeCheckerState(empty_env(), empty_subs(), 0, [])
}

fn extend_env(env: TypeEnv, name: String, t: Type) -> TypeEnv {
  TypeEnv([#(name, t), ..env.bindings])
}

fn lookup_env(env: TypeEnv, name: String) -> Result(Type, TypeError) {
  case env.bindings {
    [] -> Error(TypeError("undefined variable: " <> name))
    [#(n, t), ..rest] ->
      case n == name {
        True -> Ok(t)
        False -> lookup_env(TypeEnv(rest), name)
      }
  }
}

fn fresh_tvar(state: TypeCheckerState) -> #(Type, TypeCheckerState) {
  #(
    TVar(state.counter),
    TypeCheckerState(state.env, state.subs, state.counter + 1, state.errors),
  )
}

fn add_subs(subs: Substitution, id: Int, t: Type) -> Substitution {
  Substitution([#(id, t), ..subs.map])
}

fn prune(t: Type, subs: Substitution) -> Type {
  case t {
    TVar(id) -> {
      case subs.map {
        [] -> TVar(id)
        [#(sid, st), ..rest] ->
          case id == sid {
            True -> prune(st, subs)
            False -> prune(TVar(id), Substitution(rest))
          }
      }
    }
    TFun(params, ret) ->
      TFun(
        list.map(params, fn(p) { prune(p, subs) }),
        ast.Box(prune(unbox(ret), subs)),
      )
    TApp(name, args) -> TApp(name, list.map(args, fn(a) { prune(a, subs) }))
    _ -> t
  }
}

fn prune_all(t: Type, subs: Substitution) -> Type {
  let t1 = prune(t, subs)
  case t1 {
    TVar(_) -> t1
    _ -> t1
  }
}

fn occurs(id: Int, t: Type, subs: Substitution) -> Bool {
  let t = prune(t, subs)
  case t {
    TVar(other_id) -> id == other_id
    TFun(params, ret) ->
      occurs_list(id, params, subs) || occurs(id, unbox(ret), subs)
    TApp(_, args) -> occurs_list(id, args, subs)
    _ -> False
  }
}

fn occurs_list(id: Int, types: List(Type), subs: Substitution) -> Bool {
  case types {
    [] -> False
    [t, ..rest] -> occurs(id, t, subs) || occurs_list(id, rest, subs)
  }
}

fn unify(t1: Type, t2: Type, state: TypeCheckerState) -> TypeCheckerState {
  let t1 = prune_all(t1, state.subs)
  let t2 = prune_all(t2, state.subs)

  case t1, t2 {
    TInt, TInt -> state
    TFloat, TFloat -> state
    TBool, TBool -> state
    TString, TString -> state

    TVar(id1), TVar(id2) if id1 == id2 -> state

    TVar(id), _ -> {
      case occurs(id, t2, state.subs) {
        True -> add_error(state, TypeError("recursive type"))
        False ->
          TypeCheckerState(
            state.env,
            add_subs(state.subs, id, t2),
            state.counter,
            state.errors,
          )
      }
    }
    _, TVar(id) -> {
      case occurs(id, t1, state.subs) {
        True -> add_error(state, TypeError("recursive type"))
        False ->
          TypeCheckerState(
            state.env,
            add_subs(state.subs, id, t1),
            state.counter,
            state.errors,
          )
      }
    }

    TFun(p1, r1), TFun(p2, r2) -> {
      let state = unify(unbox(r1), unbox(r2), state)
      unify_lists(p1, p2, state)
    }

    TApp(n1, a1), TApp(n2, a2) if n1 == n2 -> unify_lists(a1, a2, state)

    _, _ ->
      add_error(
        state,
        TypeError(type_to_string(t1) <> " != " <> type_to_string(t2)),
      )
  }
}

fn unify_lists(
  l1: List(Type),
  l2: List(Type),
  state: TypeCheckerState,
) -> TypeCheckerState {
  case l1, l2 {
    [], [] -> state
    [t1, ..r1], [t2, ..r2] -> {
      let state = unify(t1, t2, state)
      unify_lists(r1, r2, state)
    }
    _, _ -> add_error(state, TypeError("type arity mismatch"))
  }
}

fn apply_subs(t: Type, subs: Substitution) -> Type {
  let t = prune_all(t, subs)
  case t {
    TFun(params, ret) ->
      TFun(
        list.map(params, fn(p) { apply_subs(p, subs) }),
        ast.Box(apply_subs(unbox(ret), subs)),
      )
    TApp(name, args) ->
      TApp(name, list.map(args, fn(a) { apply_subs(a, subs) }))
    _ -> t
  }
}

// ── Public API ──────────────────────────────────────────

pub fn check_module(
  mod: ast.Module,
) -> Result(TypeCheckerState, List(TypeError)) {
  let state = initial_state()
  let state = add_builtins(state)
  let #(_, state) = check_definitions(mod.definitions, state)
  case state.errors {
    [] -> Ok(state)
    errors -> Error(errors)
  }
}

fn add_builtins(state: TypeCheckerState) -> TypeCheckerState {
  let env = state.env
  let #(t, state) = fresh_tvar(state)
  let env = extend_env(env, "print", TFun([t], ast.Box(TApp("Nil", []))))
  let env = extend_env(env, "int_to_string", TFun([TInt], ast.Box(TString)))
  TypeCheckerState(env, state.subs, state.counter, state.errors)
}

// ── Definition checking ─────────────────────────────────

fn check_definitions(
  defs: List(Definition),
  state: TypeCheckerState,
) -> #(Type, TypeCheckerState) {
  case defs {
    [] -> #(TApp("Nil", []), state)
    [def, ..rest] -> {
      let #(_, state) = check_definition(def, state)
      check_definitions(rest, state)
    }
  }
}

fn check_definition(
  def: Definition,
  state: TypeCheckerState,
) -> #(Type, TypeCheckerState) {
  case def {
    DefFunction(name, params, ret_type, body) -> {
      let #(param_types, state) =
        list.fold(params, #([], state), fn(acc, p) {
          let #(types, state) = acc
          let #(pt, state) = case p.param_type {
            Some(ann) -> #(type_from_annotation(ann), state)
            None -> fresh_tvar(state)
          }
          #([pt, ..types], state)
        })
      let param_types = list.reverse(param_types)

      let #(ret_t, state) = case ret_type {
        Some(ann) -> #(type_from_annotation(ann), state)
        None -> fresh_tvar(state)
      }

      let preliminary_fn_type = TFun(param_types, ast.Box(ret_t))
      let env =
        zip_fold(params, param_types, state.env, fn(e, p, t) {
          extend_env(e, p.name, t)
        })
      let env = extend_env(env, name, preliminary_fn_type)
      let state = TypeCheckerState(env, state.subs, state.counter, state.errors)

      let #(body_t, state) = infer_expression(body, state)
      let state = unify(body_t, ret_t, state)

      let ret_t_resolved = apply_subs(ret_t, state.subs)
      let fn_type =
        TFun(
          list.map(param_types, fn(t) { apply_subs(t, state.subs) }),
          ast.Box(ret_t_resolved),
        )
      let env = extend_env(state.env, name, fn_type)
      #(fn_type, TypeCheckerState(env, state.subs, state.counter, state.errors))
    }

    DefLet(name, t, value) -> {
      let #(val_t, state) = infer_expression(value, state)
      let state = case t {
        Some(ann) -> unify(val_t, type_from_annotation(ann), state)
        None -> state
      }
      let val_t = apply_subs(val_t, state.subs)
      let env = extend_env(state.env, name, val_t)
      #(val_t, TypeCheckerState(env, state.subs, state.counter, state.errors))
    }

    DefType(_st) -> #(TApp("Nil", []), state)
    DefRecord(_rt) -> #(TApp("Nil", []), state)
    DefAlias(_ta) -> #(TApp("Nil", []), state)
  }
}

fn type_from_annotation(ann: TypeAnnotation) -> Type {
  case ann {
    TNamed(name, params) -> {
      case name {
        "Int" -> TInt
        "Float" -> TFloat
        "Bool" -> TBool
        "String" -> TString
        "Nil" -> TApp("Nil", [])
        _ -> TApp(name, list.map(params, type_from_annotation))
      }
    }
    TVariable(_name) -> TApp("Var", [])
    TFunction(params, ret) ->
      TFun(
        list.map(params, type_from_annotation),
        ast.Box(type_from_annotation(unbox(ret))),
      )
  }
}

fn unbox(b: ast.Box(a)) -> a {
  let ast.Box(v) = b
  v
}

// ── Expression inference ────────────────────────────────

fn infer_expression(
  expr: Expression,
  state: TypeCheckerState,
) -> #(Type, TypeCheckerState) {
  case expr {
    ELiteral(lit) -> infer_literal(lit, state)
    EVariable(name) -> infer_variable(name, state)
    ECall(callee, args) -> infer_call(callee, args, state)
    EInfix(left, op, right) -> infer_infix(left, op, right, state)
    EUnary(op, operand) -> infer_unary(op, operand, state)
    EReassign(name, value) -> infer_reassign(name, value, state)
    ELet(name, t, value, body) -> infer_let(name, t, value, body, state)
    EBlock(items) -> infer_block(items, state)
    EIf(cond, conseq, alt) -> infer_if(cond, conseq, alt, state)
    EReturn(value) -> infer_return(value, state)
    EPipe(left, right) -> infer_pipe(left, right, state)
    ERange(start, end_) -> infer_range(start, end_, state)
    EMatch(value, clauses) -> infer_match(value, clauses, state)
    ELambda(params, ret_type, body) ->
      infer_lambda(params, ret_type, body, state)
    EFor(name, iterable, body) -> infer_for(name, iterable, body, state)
  }
}

fn infer_literal(
  lit: Literal,
  state: TypeCheckerState,
) -> #(Type, TypeCheckerState) {
  case lit {
    LInt(_) -> #(TInt, state)
    LFloat(_) -> #(TFloat, state)
    LBool(_) -> #(TBool, state)
    LString(_) -> #(TString, state)
  }
}

fn infer_variable(
  name: String,
  state: TypeCheckerState,
) -> #(Type, TypeCheckerState) {
  case name {
    "print" -> {
      let #(t, state) = fresh_tvar(state)
      #(TFun([t], ast.Box(TApp("Nil", []))), state)
    }
    _ -> {
      case lookup_env(state.env, name) {
        Ok(t) -> #(apply_subs(t, state.subs), state)
        Error(e) -> #(TVar(-1), add_error(state, e))
      }
    }
  }
}

fn infer_call(
  callee: ast.Box(Expression),
  args: List(Expression),
  state: TypeCheckerState,
) -> #(Type, TypeCheckerState) {
  let #(callee_t, state) = infer_expression(unbox(callee), state)
  let #(ret_t, state) = fresh_tvar(state)
  let #(param_types, state) =
    list.fold(args, #([], state), fn(acc, arg) {
      let #(types, state) = acc
      let #(arg_t, state) = infer_expression(arg, state)
      #([arg_t, ..types], state)
    })
  let param_types = list.reverse(param_types)
  let expected_fn_t = TFun(param_types, ast.Box(ret_t))
  let state = unify(callee_t, expected_fn_t, state)
  #(apply_subs(ret_t, state.subs), state)
}

fn infer_infix(
  left: ast.Box(Expression),
  op: InfixOp,
  right: ast.Box(Expression),
  state: TypeCheckerState,
) -> #(Type, TypeCheckerState) {
  let #(left_t, state) = infer_expression(unbox(left), state)
  let #(right_t, state) = infer_expression(unbox(right), state)

  case op {
    ast.Add | ast.Subtract | ast.Multiply | ast.Divide | ast.Modulo -> {
      let state = unify(left_t, TInt, state)
      let state = unify(right_t, TInt, state)
      #(TInt, state)
    }
    ast.Equal
    | ast.NotEqual
    | ast.LessThan
    | ast.GreaterThan
    | ast.LessOrEqual
    | ast.GreaterOrEqual -> {
      let state = unify(left_t, right_t, state)
      #(TBool, state)
    }
    ast.And | ast.Or -> {
      let state = unify(left_t, TBool, state)
      let state = unify(right_t, TBool, state)
      #(TBool, state)
    }
    ast.Concat -> {
      let state = unify(left_t, TString, state)
      let state = unify(right_t, TString, state)
      #(TString, state)
    }
  }
}

fn infer_unary(
  op: ast.UnaryOp,
  operand: ast.Box(Expression),
  state: TypeCheckerState,
) -> #(Type, TypeCheckerState) {
  let #(operand_t, state) = infer_expression(unbox(operand), state)
  case op {
    Negate -> {
      let state = unify(operand_t, TInt, state)
      #(TInt, state)
    }
    Not -> {
      let state = unify(operand_t, TBool, state)
      #(TBool, state)
    }
  }
}

fn infer_reassign(
  name: String,
  value: ast.Box(Expression),
  state: TypeCheckerState,
) -> #(Type, TypeCheckerState) {
  case lookup_env(state.env, name) {
    Ok(var_t) -> {
      let var_t = apply_subs(var_t, state.subs)
      let #(val_t, state) = infer_expression(unbox(value), state)
      let state = unify(var_t, val_t, state)
      #(var_t, state)
    }
    Error(e) -> #(TVar(-1), add_error(state, e))
  }
}

fn infer_let(
  name: String,
  t: Option(TypeAnnotation),
  value: ast.Box(Expression),
  body: ast.Box(Expression),
  state: TypeCheckerState,
) -> #(Type, TypeCheckerState) {
  let #(val_t, state) = infer_expression(unbox(value), state)
  let state = case t {
    Some(ann) -> unify(val_t, type_from_annotation(ann), state)
    None -> state
  }
  let val_t = apply_subs(val_t, state.subs)
  let env = extend_env(state.env, name, val_t)
  let state = TypeCheckerState(env, state.subs, state.counter, state.errors)
  infer_expression(unbox(body), state)
}

fn infer_block(
  items: List(BlockItem),
  state: TypeCheckerState,
) -> #(Type, TypeCheckerState) {
  case items {
    [] -> #(TApp("Nil", []), state)
    [item] -> infer_block_item(item, state)
    [item, ..rest] -> {
      let #(_, state) = infer_block_item(item, state)
      infer_block(rest, state)
    }
  }
}

fn infer_block_item(
  item: BlockItem,
  state: TypeCheckerState,
) -> #(Type, TypeCheckerState) {
  case item {
    BlockExpr(expr) -> infer_expression(expr, state)
    BlockDef(def) -> check_definition(def, state)
  }
}

fn infer_if(
  cond: ast.Box(Expression),
  conseq: ast.Box(Expression),
  alt: ast.Box(Expression),
  state: TypeCheckerState,
) -> #(Type, TypeCheckerState) {
  let #(cond_t, state) = infer_expression(unbox(cond), state)
  let state = unify(cond_t, TBool, state)
  let #(conseq_t, state) = infer_expression(unbox(conseq), state)
  let #(alt_t, state) = infer_expression(unbox(alt), state)
  let state = unify(conseq_t, alt_t, state)
  #(apply_subs(conseq_t, state.subs), state)
}

fn infer_return(
  value: ast.Box(Expression),
  state: TypeCheckerState,
) -> #(Type, TypeCheckerState) {
  let #(_val_t, state) = infer_expression(unbox(value), state)
  #(TApp("Nil", []), state)
}

fn infer_pipe(
  left: ast.Box(Expression),
  right: ast.Box(Expression),
  state: TypeCheckerState,
) -> #(Type, TypeCheckerState) {
  let #(left_t, state) = infer_expression(unbox(left), state)
  let #(right_t, state) = infer_expression(unbox(right), state)
  let #(ret_t, state) = fresh_tvar(state)
  let expected_fn = TFun([left_t], ast.Box(ret_t))
  let state = unify(right_t, expected_fn, state)
  #(apply_subs(ret_t, state.subs), state)
}

fn infer_range(
  start: ast.Box(Expression),
  end_: ast.Box(Expression),
  state: TypeCheckerState,
) -> #(Type, TypeCheckerState) {
  let #(start_t, state) = infer_expression(unbox(start), state)
  let #(end_t, state) = infer_expression(unbox(end_), state)
  let state = unify(start_t, TInt, state)
  let state = unify(end_t, TInt, state)
  #(TApp("List", [TInt]), state)
}

fn infer_match(
  value: ast.Box(Expression),
  clauses: List(MatchClause),
  state: TypeCheckerState,
) -> #(Type, TypeCheckerState) {
  let #(val_t, state) = infer_expression(unbox(value), state)

  case clauses {
    [] -> #(TVar(-1), state)
    [clause, ..rest] -> {
      let state = check_pattern(clause.pattern, val_t, state)
      let #(clause_t, state) = infer_expression(clause.body, state)
      list.fold(rest, #(clause_t, state), fn(acc, c) {
        let #(acc_t, state) = acc
        let state = check_pattern(c.pattern, val_t, state)
        let #(c_t, state) = infer_expression(c.body, state)
        let state = unify(acc_t, c_t, state)
        #(apply_subs(c_t, state.subs), state)
      })
    }
  }
}

fn check_pattern(
  pattern: Pattern,
  value_type: Type,
  state: TypeCheckerState,
) -> TypeCheckerState {
  case pattern {
    PLiteral(lit) -> {
      let lit_t = case lit {
        LInt(_) -> TInt
        LFloat(_) -> TFloat
        LBool(_) -> TBool
        LString(_) -> TString
      }
      unify(value_type, lit_t, state)
    }
    PVariable(_name) -> state
    PWildcard -> state
    PVariant(_name, fields) ->
      list.fold(fields, state, fn(s, f) { check_pattern(f, value_type, s) })
  }
}

fn infer_lambda(
  params: List(FunctionParam),
  ret_type: Option(TypeAnnotation),
  body: ast.Box(Expression),
  state: TypeCheckerState,
) -> #(Type, TypeCheckerState) {
  let #(param_types, state) =
    list.fold(params, #([], state), fn(acc, p) {
      let #(types, state) = acc
      let #(pt, state) = case p.param_type {
        Some(ann) -> #(type_from_annotation(ann), state)
        None -> fresh_tvar(state)
      }
      #([pt, ..types], state)
    })
  let param_types = list.reverse(param_types)

  let #(ret_t, state) = case ret_type {
    Some(ann) -> #(type_from_annotation(ann), state)
    None -> fresh_tvar(state)
  }

  let env =
    zip_fold(params, param_types, state.env, fn(e, p, t) {
      extend_env(e, p.name, t)
    })
  let state = TypeCheckerState(env, state.subs, state.counter, state.errors)

  let #(body_t, state) = infer_expression(unbox(body), state)
  let state = unify(body_t, ret_t, state)

  #(TFun(param_types, ast.Box(ret_t)), state)
}

fn infer_for(
  name: String,
  iterable: ast.Box(Expression),
  body: ast.Box(Expression),
  state: TypeCheckerState,
) -> #(Type, TypeCheckerState) {
  let #(iterable_t, state) = infer_expression(unbox(iterable), state)
  let #(elem_t, state) = fresh_tvar(state)
  let expected_iterable = TApp("List", [elem_t])
  let state = unify(iterable_t, expected_iterable, state)

  let env = extend_env(state.env, name, apply_subs(elem_t, state.subs))
  let state = TypeCheckerState(env, state.subs, state.counter, state.errors)
  let #(_body_t, state) = infer_expression(unbox(body), state)

  #(TApp("Nil", []), state)
}

// ── Helpers ─────────────────────────────────────────────

fn zip_fold(
  params: List(FunctionParam),
  types: List(Type),
  env: TypeEnv,
  f: fn(TypeEnv, FunctionParam, Type) -> TypeEnv,
) -> TypeEnv {
  case params, types {
    [], _ -> env
    _, [] -> env
    [p, ..prest], [t, ..trest] -> zip_fold(prest, trest, f(env, p, t), f)
  }
}

// ── Error handling ──────────────────────────────────────

fn add_error(state: TypeCheckerState, err: TypeError) -> TypeCheckerState {
  TypeCheckerState(state.env, state.subs, state.counter, [err, ..state.errors])
}

// ── Display ─────────────────────────────────────────────

pub fn type_to_string(t: Type) -> String {
  case t {
    TInt -> "Int"
    TFloat -> "Float"
    TBool -> "Bool"
    TString -> "String"
    TVar(id) -> "'t" <> int.to_string(id)
    TFun(params, ret) -> {
      let params_str = params |> list.map(type_to_string) |> string.join(", ")
      "(" <> params_str <> ") -> " <> type_to_string(unbox(ret))
    }
    TApp(name, args) -> {
      case args {
        [] -> name
        _ -> {
          let args_str = args |> list.map(type_to_string) |> string.join(", ")
          name <> "<" <> args_str <> ">"
        }
      }
    }
  }
}
