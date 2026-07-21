import gleam/option.{type Option}

pub type Box(a) {
  Box(a)
}

pub type Location {
  Location(line: Int, col: Int, file: String)
}

pub type Literal {
  LInt(Int)
  LFloat(Float)
  LBool(Bool)
  LString(String)
}

pub type InfixOp {
  Add
  Subtract
  Multiply
  Divide
  Modulo
  Equal
  NotEqual
  LessThan
  GreaterThan
  LessOrEqual
  GreaterOrEqual
  And
  Or
  Concat
}

pub type UnaryOp {
  Negate
  Not
}

pub type Pattern {
  PLiteral(Literal)
  PVariable(String)
  PWildcard
  PVariant(String, List(Pattern))
}

pub type MatchClause {
  MatchClause(pattern: Pattern, guard: Option(Expression), body: Expression)
}

pub type TypeAnnotation {
  TNamed(String, List(TypeAnnotation))
  TVariable(String)
  TFunction(List(TypeAnnotation), Box(TypeAnnotation))
}

pub type TypeParam {
  TypeParam(name: String)
}

pub type VariantField {
  VariantField(name: String, value_type: TypeAnnotation)
}

pub type Variant {
  Variant(name: String, fields: List(VariantField))
}

pub type Definition {
  DefFunction(
    name: String,
    params: List(FunctionParam),
    return_type: Option(TypeAnnotation),
    body: Expression,
  )
  DefType(SumType)
  DefRecord(RecordType)
  DefAlias(TypeAlias)
  DefLet(String, Option(TypeAnnotation), Expression)
}

pub type FunctionParam {
  FunctionParam(name: String, param_type: Option(TypeAnnotation))
}

pub type SumType {
  SumType(name: String, params: List(TypeParam), variants: List(Variant))
}

pub type RecordType {
  RecordType(name: String, params: List(TypeParam), fields: List(Field))
}

pub type Field {
  Field(name: String, field_type: TypeAnnotation)
}

pub type TypeAlias {
  TypeAlias(name: String, target: TypeAnnotation)
}

pub type BlockItem {
  BlockExpr(Expression)
  BlockDef(Definition)
}

pub type Expression {
  // Literal value (42, true, "hello")
  ELiteral(Literal)
  // Variable/function reference
  EVariable(String)
  // Function call: callee(args)
  ECall(Box(Expression), List(Expression))
  // Infix operation: left op right
  EInfix(Box(Expression), InfixOp, Box(Expression))
  // Unary operation: op operand
  EUnary(UnaryOp, Box(Expression))
  // Variable reassignment
  EReassign(String, Box(Expression))
  // Let binding with body scope: let x = value; body
  ELet(String, Option(TypeAnnotation), Box(Expression), Box(Expression))
  // Block: sequence of statements, last is result
  EBlock(List(BlockItem))
  // If expression
  EIf(Box(Expression), Box(Expression), Box(Expression))
  // Early return
  EReturn(Box(Expression))
  // Pipe: left |> right  (equivalent to right(left))
  EPipe(Box(Expression), Box(Expression))
  // Range: start..end
  ERange(Box(Expression), Box(Expression))
  // Match expression
  EMatch(Box(Expression), List(MatchClause))
  // Anonymous function
  ELambda(List(FunctionParam), Option(TypeAnnotation), Box(Expression))
  // For-in loop: for x in iterable { body }
  EFor(String, Box(Expression), Box(Expression))
}

pub type Import {
  Import(path: String, alias: Option(String))
}

pub type Module {
  Module(name: String, imports: List(Import), definitions: List(Definition))
}
