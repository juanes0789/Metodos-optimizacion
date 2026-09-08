from app.services.parser import parse_function
from app.algorithms import run_method

def run(name, expr, params):
    fn, parsed, x=parse_function(expr)
    import sympy as sp
    return run_method(name,fn,params,sp.lambdify(x,sp.diff(parsed,x),modules=["numpy"]),sp.lambdify(x,sp.diff(parsed,x,2),modules=["numpy"]))

def test_bisection():
    r=run("bisection","x**3-x-2",{"a":1,"b":2,"tolerance":1e-8,"max_iterations":100})
    assert r.converged and abs(r.final_x-1.5213797)<1e-5
def test_newton_root():
    r=run("newton-raphson","x**3-x-2",{"x0":1.5,"tolerance":1e-8,"max_iterations":30})
    assert r.converged and abs(r.final_x-1.5213797)<1e-5
def test_newton_optimization():
    r=run("newton-optimization","x**2+4*x+4",{"x0":5,"tolerance":1e-8,"max_iterations":30})
    assert r.converged and abs(r.final_x+2)<1e-5
def test_golden():
    r=run("golden-section","(x-3)**2+2",{"a":0,"b":10,"tolerance":1e-7,"max_iterations":100})
    assert abs(r.final_x-3)<1e-4
def test_invalid_parser():
    import pytest
    with pytest.raises(ValueError): parse_function("__import__('os').system('x')")
