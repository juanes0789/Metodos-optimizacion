"""Pure numerical methods. Algorithms return a common, JSON-friendly shape."""
from __future__ import annotations
import math
from dataclasses import dataclass, asdict
from typing import Callable, Any
import numpy as np

Fn = Callable[[float], float]

@dataclass
class NumericalResult:
    converged: bool
    message: str
    final_x: float | None
    final_fx: float | None
    iterations: int
    errors: list[float]
    x_history: list[float]
    table: list[dict[str, float | int | None]]

def _result(ok: bool, msg: str, x: float | None, fx: float | None, errors, history, table):
    return NumericalResult(ok, msg, x, fx, len(table), errors, history, table)

def _f(fn: Fn, x: float) -> float:
    y = float(fn(x))
    if not math.isfinite(y): raise ValueError(f"f({x:g}) no es finita")
    return y

def bisection(fn: Fn, a: float, b: float, tol: float, max_iter: int) -> NumericalResult:
    fa, fb = _f(fn,a), _f(fn,b)
    if fa == 0: return _result(True, "Raíz encontrada en el extremo izquierdo", a, fa, [], [a], [])
    if fb == 0: return _result(True, "Raíz encontrada en el extremo derecho", b, fb, [], [b], [])
    if fa * fb > 0: raise ValueError("El intervalo debe contener un cambio de signo")
    errors=[]; hist=[]; table=[]; prev=None
    for i in range(1,max_iter+1):
        x=(a+b)/2; fx=_f(fn,x); err=abs(x-prev) if prev is not None else abs(b-a)/2
        errors.append(err); hist.append(x); table.append({"iteration":i,"a":a,"b":b,"xr":x,"fx":fx,"error":err})
        if abs(fx)<=tol or err<=tol: return _result(True,"Convergencia alcanzada",x,fx,errors,hist,table)
        if fa*fx<0: b,fb=x,fx
        else: a,fa=x,fx
        prev=x
    return _result(False,"Se alcanzó el máximo de iteraciones",x,fx,errors,hist,table)

def false_position(fn: Fn,a: float,b: float,tol: float,max_iter: int)->NumericalResult:
    fa,fb=_f(fn,a),_f(fn,b)
    if fa*fb>0: raise ValueError("El intervalo debe contener un cambio de signo")
    errors=[];hist=[];table=[]; prev=None
    for i in range(1,max_iter+1):
        den=fb-fa
        if abs(den)<1e-15: raise ValueError("División por cero en falsa posición")
        x=(a*fb-b*fa)/den; fx=_f(fn,x); err=abs(x-prev) if prev is not None else abs(b-a)
        errors.append(err);hist.append(x);table.append({"iteration":i,"a":a,"b":b,"xr":x,"fx":fx,"error":err})
        if abs(fx)<=tol or err<=tol:return _result(True,"Convergencia alcanzada",x,fx,errors,hist,table)
        if fa*fx<0:b,fb=x,fx
        else:a,fa=x,fx
        prev=x
    return _result(False,"Se alcanzó el máximo de iteraciones",x,fx,errors,hist,table)

def golden(fn: Fn,a: float,b: float,tol: float,max_iter: int,maximize: bool = False)->NumericalResult:
    if not a<b: raise ValueError("Se requiere a < b")
    phi=(math.sqrt(5)-1)/2; c=b-phi*(b-a); d=a+phi*(b-a)
    fc,fd=_f(fn,c),_f(fn,d); errors=[];hist=[];table=[]
    best_x, best_fx = (c, fc) if (fc > fd if maximize else fc < fd) else (d, fd)
    for i in range(1,max_iter+1):
        if (fc > best_fx if maximize else fc < best_fx):
            best_x, best_fx = c, fc
        if (fd > best_fx if maximize else fd < best_fx):
            best_x, best_fx = d, fd
        err=abs(b-a)
        errors.append(err)
        hist.append(best_x)
        table.append({"iteration":i,"xl":a,"fxl":_f(fn,a),"x2":c,"fx2":fc,"x1":d,"fx1":fd,"xu":b,"fxu":_f(fn,b),"d":b-c,"x":best_x,"fx":best_fx})
        if err<=tol:return _result(True,"Convergencia alcanzada",best_x,best_fx,errors,hist,table)
        better_left = fc > fd if maximize else fc < fd
        if better_left:b,d,fd=d,c,fc;c=b-phi*(b-a);fc=_f(fn,c)
        else:a,c,fc=c,d,fd;d=a+phi*(b-a);fd=_f(fn,d)
    return _result(False,"Se alcanzó el máximo de iteraciones",best_x,best_fx,errors,hist,table)

def quadratic(fn: Fn,x0:float,x1:float,x2:float,tol:float,max_iter:int,maximize: bool = False)->NumericalResult:
    errors=[];hist=[];table=[];previous=None
    for i in range(1,max_iter+1):
        f0,f1,f2=map(lambda x:_f(fn,x),(x0,x1,x2))
        den = 2*f0*(x1 - x2) + 2*f1*(x2 - x0) + 2*f2*(x0 - x1)
        if abs(den) < 1e-15: raise ValueError("Interpolación cuadrática degenerada")
        x = (f0*(x1**2 - x2**2) + f1*(x2**2 - x0**2) + f2*(x0**2 - x1**2)) / (2*f0*(x1 - x2) + 2*f1*(x2 - x0) + 2*f2*(x0 - x1))
        fx=_f(fn,x);err=abs(x-previous) if previous is not None else abs(x-x1);errors.append(err);hist.append(x)
        table.append({"iteration":i,"x0":x0,"x1":x1,"x2":x2,"x":x,"fx":fx,"error":err})
        if err<=tol:return _result(True,"Convergencia alcanzada",x,fx,errors,hist,table)
        better = fx > f1 if maximize else fx < f1
        if x > x1:
            if better: x0,x1=x1,x
            else: x2=x
        elif x < x1:
            if better: x2,x1=x1,x
            else: x0=x
        previous=x
    return _result(False,"Se alcanzó el máximo de iteraciones",x,fx,errors,hist,table)

def newton_opt(fn: Fn, derivative: Fn, second: Fn,x:float,tol:float,max_iter:int)->NumericalResult:
    errors=[];hist=[];table=[]
    for i in range(1,max_iter+1):
        fx, d, dd=_f(fn,x),_f(derivative,x),_f(second,x)
        if abs(dd)<1e-15: raise ValueError(f"La segunda derivada es cero en x = {x:g}")
        nxt=x-d/dd;err=abs(nxt-x);errors.append(err);hist.append(nxt)
        table.append({"iteration":i,"xi":x,"fx":fx,"derivative":d,"second_derivative":dd,"x_next":nxt,"error":err})
        x=nxt
        if err<=tol:return _result(True,"Convergencia alcanzada",x,_f(fn,x),errors,hist,table)
    return _result(False,"Se alcanzó el máximo de iteraciones",x,_f(fn,x),errors,hist,table)

def newton_root(fn:Fn,derivative:Fn,x:float,tol:float,max_iter:int)->NumericalResult:
    errors=[];hist=[];table=[]
    for i in range(1,max_iter+1):
        fx,d=_f(fn,x),_f(derivative,x)
        if abs(d)<1e-15:raise ValueError(f"La derivada es cero en x = {x:g}")
        nxt=x-fx/d;err=abs(nxt-x);errors.append(err);hist.append(nxt);table.append({"iteration":i,"xi":x,"fx":fx,"derivative":d,"x_next":nxt,"error":err});x=nxt
        if abs(_f(fn,x))<=tol or err<=tol:return _result(True,"Convergencia alcanzada",x,_f(fn,x),errors,hist,table)
    return _result(False,"Se alcanzó el máximo de iteraciones",x,_f(fn,x),errors,hist,table)

def random_search(fn:Fn,a:float,b:float,max_iter:int,maximize:bool=False,seed:int=42)->NumericalResult:
    if not a<b:raise ValueError("Se requiere a < b")
    rng=np.random.default_rng(seed);best=None;errors=[];hist=[];table=[]
    for i in range(1,max_iter+1):
        x=float(rng.uniform(a,b));fx=_f(fn,x)
        old_best = best[1] if best is not None else fx
        if best is None or (fx > best[1] if maximize else fx < best[1]):best=(x,fx)
        err=abs(old_best-best[1]);errors.append(err);hist.append(best[0]);table.append({"iteration":i,"x":x,"fx":fx,"best_x":best[0],"best_fx":best[1],"error":err})
    return _result(True,"Búsqueda completada",best[0],best[1],errors,hist,table)


def random_search_2d(fn:Callable[[float,float],float],x_min:float,x_max:float,y_min:float,y_max:float,max_iter:int,maximize:bool=False,seed:int=42)->NumericalResult:
    if not (x_min < x_max and y_min < y_max): raise ValueError("Se requieren rangos válidos para x e y")
    rng=np.random.default_rng(seed);best=None;errors=[];hist=[];table=[]
    for i in range(1,max_iter+1):
        x=float(rng.uniform(x_min,x_max)); y=float(rng.uniform(y_min,y_max)); fx=float(fn(x,y))
        if not math.isfinite(fx): raise ValueError(f"f({x:g}, {y:g}) no es finita")
        old_best = best[2] if best is not None else fx
        if best is None or (fx > best[2] if maximize else fx < best[2]): best=(x,y,fx)
        err=abs(old_best-best[2]);errors.append(err);hist.append(best[0]);table.append({"iteration":i,"x":x,"y":y,"fx":fx,"best_x":best[0],"best_y":best[1],"best_fx":best[2],"error":err})
    return _result(True,"Búsqueda completada",best[0],best[2],errors,hist,table)


def lagrange_multipliers(f_expr, g_expr, x_sym, y_sym):
    """Solve constrained optimization using Lagrange multipliers (symbolic)."""
    import sympy as sp
    lam = sp.Symbol("lambda")
    f_x, f_y = sp.diff(f_expr, x_sym), sp.diff(f_expr, y_sym)
    g_x, g_y = sp.diff(g_expr, x_sym), sp.diff(g_expr, y_sym)
    system = [f_x - lam * g_x, f_y - lam * g_y, g_expr]
    solutions = sp.solve(system, [x_sym, y_sym, lam], dict=True)
    if not solutions:
        return _result(False, "No se encontraron puntos críticos", None, None, [], [], [])
    table = []; x_history = []; best_max = None; best_min = None
    for idx, sol in enumerate(solutions):
        xv = float(sol[x_sym]); yv = float(sol[y_sym]); lv = float(sol[lam])
        fv = float(f_expr.subs({x_sym: sol[x_sym], y_sym: sol[y_sym]}))
        x_history.append(xv)
        table.append({"point": idx + 1, "x": round(xv, 6), "y": round(yv, 6), "f_xy": fv, "lambda": round(lv, 6)})
        if best_max is None or fv > best_max[2]: best_max = (xv, yv, fv)
        if best_min is None or fv < best_min[2]: best_min = (xv, yv, fv)
    for row in table:
        if abs(row["f_xy"] - best_max[2]) < 1e-10: row["type"] = "Máximo"
        elif abs(row["f_xy"] - best_min[2]) < 1e-10: row["type"] = "Mínimo"
        else: row["type"] = "Punto crítico"
    msg = f"Se encontraron {len(solutions)} puntos críticos. Máximo: f={best_max[2]:.6f} en ({best_max[0]:.6f}, {best_max[1]:.6f}). Mínimo: f={best_min[2]:.6f} en ({best_min[0]:.6f}, {best_min[1]:.6f})"
    return _result(True, msg, best_max[0], best_max[2], [], x_history, table)


def run_method(name:str, fn:Fn, params:dict[str,float|int], derivative:Fn|None=None, second:Fn|None=None)->NumericalResult:
    if name == "random-search":
        if "y_min" in params and "y_max" in params:
            return random_search_2d(fn, float(params.get("x_min", params.get("a", 0))), float(params.get("x_max", params.get("b", 1))), float(params["y_min"]), float(params["y_max"]), int(params["max_iterations"]), maximize=bool(params.get("maximize", 0)), seed=int(params.get("seed", 42)))
        return random_search(fn, float(params.get("a", params.get("x_min", 0))), float(params.get("b", params.get("x_max", 1))), int(params["max_iterations"]), maximize=bool(params.get("maximize", 0)), seed=int(params.get("seed", 42)))
    methods={"bisection":lambda:bisection(fn,params["a"],params["b"],params["tolerance"],params["max_iterations"]),"false-position":lambda:false_position(fn,params["a"],params["b"],params["tolerance"],params["max_iterations"]),"golden-section":lambda:golden(fn,params["a"],params["b"],params["tolerance"],params["max_iterations"],bool(params.get("maximize",0))),"quadratic-interpolation":lambda:quadratic(fn,params["x0"],params["x1"],params["x2"],params["tolerance"],params["max_iterations"],bool(params.get("maximize",0))),"newton-optimization":lambda:newton_opt(fn,derivative,second,params["x0"],params["tolerance"],params["max_iterations"]),"newton-raphson":lambda:newton_root(fn,derivative,params["x0"],params["tolerance"],params["max_iterations"])}
    if name not in methods: raise ValueError("Método no soportado")
    return methods[name]()
