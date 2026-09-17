import re
import sympy as sp
from typing import Callable

ALLOWED = {
    "sin": sp.sin,
    "sen": sp.sin,
    "seno": sp.sin,
    "cos": sp.cos,
    "coseno": sp.cos,
    "tan": sp.tan,
    "tangente": sp.tan,
    "exp": sp.exp,
    "log": sp.log,
    "ln": sp.log,
    "sqrt": sp.sqrt,
    "abs": sp.Abs,
}


def _normalize_expression(source: str) -> str:
    expr = source.strip()
    if not expr:
        raise ValueError("La función no puede estar vacía")

    expr = re.sub(r'([xy])([2-9]\d*)\b', r'\1**\2', expr, flags=re.IGNORECASE)

    for idx, func_name in enumerate(sorted(ALLOWED.keys(), key=len, reverse=True)):
        placeholder = f"⟦F{idx}⟧"
        expr = re.sub(rf"{re.escape(func_name)}(?=\()", placeholder, expr)

    expr = re.sub(r'(?<=[0-9A-Za-z\)])(?=⟦)', '*', expr)
    expr = re.sub(r'(?<=[0-9\)])(?=[A-Za-z_])', '*', expr)
    expr = re.sub(r'(?<=[A-Za-z_])(?=[A-Za-z_])', '*', expr)
    expr = re.sub(r'(?<=[A-Za-z_0-9\)])(?=\()', '*', expr)

    for idx, func_name in enumerate(sorted(ALLOWED.keys(), key=len, reverse=True)):
        placeholder = f"⟦F{idx}⟧"
        expr = expr.replace(placeholder, func_name)

    return expr


def parse_function(source: str) -> tuple[Callable[[float], float], sp.Expr, sp.Symbol]:
    source = _normalize_expression(source)
    x = sp.Symbol("x")
    safe_globals = {"__builtins__": {}, "Symbol": sp.Symbol}
    safe_globals.update({k: getattr(sp, k) for k in ("Integer", "Float", "Rational", "Add", "Mul", "Pow")})
    try:
        expr = sp.parse_expr(source, local_dict={"x": x, **ALLOWED}, global_dict=safe_globals)
    except Exception as exc: raise ValueError("La función no es válida") from exc
    if expr.free_symbols - {x}: raise ValueError("Solo se permite la variable x")
    return sp.lambdify(x, expr, modules=["numpy"]), expr, x


def parse_function_2d(source: str) -> tuple[Callable[[float, float], float], sp.Expr, sp.Symbol, sp.Symbol]:
    source = _normalize_expression(source)
    x, y = sp.symbols("x y")
    safe_globals = {"__builtins__": {}, "Symbol": sp.Symbol}
    safe_globals.update({k: getattr(sp, k) for k in ("Integer", "Float", "Rational", "Add", "Mul", "Pow")})
    try:
        expr = sp.parse_expr(source, local_dict={"x": x, "y": y, **ALLOWED}, global_dict=safe_globals)
    except Exception as exc: raise ValueError("La función no es válida") from exc
    allowed_symbols = {x, y}
    if expr.free_symbols - allowed_symbols: raise ValueError("Solo se permiten las variables x e y")
    if not expr.free_symbols.issubset(allowed_symbols): raise ValueError("Solo se permiten las variables x e y")
    return sp.lambdify((x, y), expr, modules=["numpy"]), expr, x, y
