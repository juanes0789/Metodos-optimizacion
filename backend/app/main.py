import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sympy as sp
import numpy as np
from .models import RunRequest, NumericalResponse
from .services.parser import parse_function, parse_function_2d
from .algorithms import run_method, lagrange_multipliers

app=FastAPI(title="Numerical Lab", version="1.0.0")
origins=[x.strip() for x in os.getenv("CORS_ORIGINS","http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,http://127.0.0.1:3000,http://127.0.0.1:3001,http://127.0.0.1:3002,http://127.0.0.1:3003,https://xz69w72c-3000.use2.devtunnels.ms,https://xz69w72c-3000.use2.devtunnels.ms").split(",") if x.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/v1/methods")
def methods():
    return [{"id":x,"name":x.replace("-"," ").title()} for x in ("bisection","false-position","golden-section","quadratic-interpolation","newton-optimization","newton-raphson","random-search","lagrange-multipliers")]

@app.post("/api/v1/methods/{method}",response_model=NumericalResponse)
def execute(method:str, request:RunRequest):
    try:
        p=request.params
        if p.get("tolerance",1e-6)<0 or p.get("max_iterations",1)<=0: raise ValueError("La tolerancia no puede ser negativa y las iteraciones deben ser positivas")

        if method == "lagrange-multipliers":
            constraint_str = str(p.get("constraint", ""))
            if not constraint_str: raise ValueError("Se requiere una restricción g(x,y)=0")
            fn_2d, f_sympy, x_sym, y_sym = parse_function_2d(request.function)
            _, g_sympy, _, _ = parse_function_2d(constraint_str)
            result = lagrange_multipliers(f_sympy, g_sympy, x_sym, y_sym)
            grid_x = np.linspace(-2, 2, 200)
            grid_y = np.linspace(-2, 2, 200)
            xs, ys = np.meshgrid(grid_x, grid_y)
            zs = np.array([[float(fn_2d(float(xv), float(yv))) for xv, yv in zip(xrow, yrow)] for xrow, yrow in zip(xs, ys)])
            return {**result.__dict__, "function_x": grid_x.tolist(), "function_y": zs.ravel().tolist()}

        if method == "random-search" and ("y_min" in p or "y_max" in p):
            fn,expr,x,y=parse_function_2d(request.function)
            result=run_method(method,fn,p)
            x_values=[float(v) for v in result.x_history]
            x_min=float(min(p.get("x_min", min(x_values or [0.0])), min(x_values or [0.0])))
            x_max=float(max(p.get("x_max", max(x_values or [1.0])), max(x_values or [1.0])))
            y_min=float(min(p.get("y_min", -1.0), -1.0))
            y_max=float(max(p.get("y_max", 1.0), 1.0))
            if x_max == x_min: x_max=x_min+1
            if y_max == y_min: y_max=y_min+1
            grid_x=np.linspace(x_min, x_max, 200)
            grid_y=np.linspace(y_min, y_max, 200)
            xs, ys = np.meshgrid(grid_x, grid_y)
            zs=np.array([[float(fn(float(xv), float(yv))) for xv, yv in zip(xrow, yrow)] for xrow, yrow in zip(xs, ys)])
            return {**result.__dict__,"function_x":grid_x.tolist(),"function_y":zs.ravel().tolist()}

        fn,expr,x=parse_function(request.function)
        derivative=sp.lambdify(x,sp.diff(expr,x),modules=["numpy"])
        second=sp.lambdify(x,sp.diff(expr,x,2),modules=["numpy"])
        result=run_method(method,fn,p,derivative,second)
        points=result.x_history or [float(p.get("x0", 0))]
        bounds=[*points]
        for key in ("a", "b", "x0", "x1", "x2"):
            if key in p:
                bounds.append(float(p[key]))
        lo,hi=min(bounds),max(bounds)
        span=max(hi-lo, 10.0)
        margin=max(2.0, span*.5)
        grid=np.linspace(lo-margin,hi+margin,400)
        ys=[]
        for value in grid:
            try: ys.append(float(fn(float(value))))
            except (ValueError,TypeError,OverflowError): ys.append(float("nan"))
        return {**result.__dict__,"function_x":grid.tolist(),"function_y":ys}
    except (ValueError,KeyError,TypeError,ZeroDivisionError) as exc: raise HTTPException(400,str(exc)) from exc
