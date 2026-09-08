"use client";
import {useState} from "react";
import {runMethod} from "../lib/api";
import {IterationTable} from "../components/IterationTable";
import {Charts} from "../components/Charts";
import type {NumericalResponse} from "../types";

const methods=[["bisection","Bisection","Root finding"],["false-position","False Position","Root finding"],["golden-section","Golden Section","Minimization"],["quadratic-interpolation","Quadratic Interpolation","Minimization"],["newton-optimization","Newton Optimization","Minimization"],["newton-raphson","Newton-Raphson","Root finding"],["random-search","Random Search","Minimization"]];
const defaults:Record<string,Record<string,string>>={bisection:{a:"1",b:"2",tolerance:"1e-6",max_iterations:"100"}, "false-position":{a:"1",b:"2",tolerance:"1e-6",max_iterations:"100"},"golden-section":{a:"0",b:"10",maximize:"0",tolerance:"1e-6",max_iterations:"100"},"quadratic-interpolation":{x0:"0",x1:"1",x2:"4",maximize:"1",tolerance:"1e-6",max_iterations:"100"},"newton-optimization":{x0:"5",tolerance:"1e-6",max_iterations:"100"},"newton-raphson":{x0:"1.5",tolerance:"1e-6",max_iterations:"100"},"random-search":{x_min:"-2",x_max:"2",y_min:"1",y_max:"3",maximize:"1",max_iterations:"100"}};
export default function Home(){
 const [method,setMethod]=useState("bisection");
 const [fn,setFn]=useState("x**3 - x - 2");
 const [submittedFn,setSubmittedFn]=useState("x**3 - x - 2");
 const [params,setParams]=useState(defaults.bisection);
 const [result,setResult]=useState<NumericalResponse|null>(null);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");

 const select=(m:string)=>{setMethod(m);setParams(defaults[m]);setResult(null);setError("")};
 const fields=Object.keys(params).filter(k=>k!=="tolerance"&&k!=="max_iterations"&&k!=="maximize");

 const run=async()=>{
   setLoading(true);
   setError("");
   try {
     const expression = fn.trim();
     const nextResult = await runMethod(method, expression, Object.fromEntries(Object.entries(params).map(([k,v])=>[k,Number(v)])));
     setSubmittedFn(expression);
     setResult(nextResult);
   } catch (e) {
     setError(e instanceof Error ? e.message : "Request failed");
   } finally {
     setLoading(false);
   }
 };

 const selectedMethod=methods.find(x=>x[0]===method);
 return <main className="lab-page">
   <header className="lab-header">
     <div className="lab-brand"><span className="eyebrow">NUMERICAL LAB</span><span className="brand-mark">∿</span></div>
     <nav className="lab-nav"><a className="current" href="/">Laboratorio</a><a href="/instructions">Instrucciones</a></nav>
     <div className="lab-hero"><div><span className="guide-status">WORKSPACE · {result ? "RESULTADO LISTO" : "CONFIGURACIÓN"}</span><h1>Explora. Calcula.<br /><em>Comprende.</em></h1><p>Experimenta con métodos numéricos y convierte una función en una decisión clara.</p></div><div className="lab-signal" aria-hidden="true"><span>f(x)</span><i /><i /><i /></div></div>
   </header>
   <section className="workspace">
     <aside className="method-sidebar"><div className="sidebar-heading"><div><span className="section-number">01</span><h2>Métodos</h2></div><span className="method-count">{methods.length}</span></div><p className="sidebar-copy">Elige una estrategia para comenzar tu experimento.</p><div className="method-list">{methods.map(([id,name,kind])=><button className={method===id?"active":""} onClick={()=>select(id)} key={id}><span className="method-index">{String(methods.findIndex(item=>item[0]===id)+1).padStart(2,"0")}</span><span><b>{name}</b><small>{kind}</small></span><span className="method-arrow">→</span></button>)}</div><a className="sidebar-help" href="/instructions">¿No sabes cuál usar? <strong>Ver guía →</strong></a></aside>
     <div className="content">
       <div className="card config-card"><div className="config-heading"><div><span className="section-number">02 · CONFIGURA</span><h2>{selectedMethod?.[1]}</h2><p>{selectedMethod?.[2]} · Define la función y los parámetros del experimento.</p></div><span className="active-pill">ACTIVO</span></div>
         <label className="function-field"><span>Función objetivo</span><input value={fn} onChange={e=>{setFn(e.target.value);setResult(null);setError("")}} placeholder="Ejemplo: sen(x) + x**2" /><small>Usa <code>**</code> para potencias · <a href="/instructions">Consulta la sintaxis</a></small></label>
         <div className="parameter-heading"><span>Parámetros</span><span>Los valores se pueden ajustar antes de ejecutar</span></div>
         <div className="grid">{fields.map(k=><label key={k}>{k}<input type="number" value={params[k]} onChange={e=>{setParams({...params,[k]:e.target.value});setResult(null);setError("")}}/></label>)}{(method==="golden-section"||method==="quadratic-interpolation"||method==="random-search")&&<label>Objetivo<select value={params.maximize} onChange={e=>{setParams({...params,maximize:e.target.value});setResult(null);setError("")}}><option value="0">Minimizar</option><option value="1">Maximizar</option></select></label>}{method!=="random-search"&&<label>tolerance<input type="number" value={params.tolerance??"1e-6"} onChange={e=>{setParams({...params,tolerance:e.target.value});setResult(null);setError("")}}/></label>}<label>max iterations<input type="number" value={params.max_iterations??"100"} onChange={e=>{setParams({...params,max_iterations:e.target.value});setResult(null);setError("")}}/></label></div>
         <div className="run-row"><button className="run" disabled={loading} onClick={run}>{loading?"Running…":"Run method"}<span>→</span></button><span className="run-hint">El resultado aparecerá debajo de la configuración.</span></div>{error&&<p className="error">{error}</p>}
       </div>
       {result&&<><div className={"result "+(result.converged?"ok":"warn")}><div><small>{result.converged?"CONVERGED":"MAXIMUM ITERATIONS"}</small><strong>{result.final_x?.toPrecision(10)??"—"}</strong></div><div><small>f(x)</small><strong>{result.final_fx?.toExponential(3)??"—"}</strong></div><div><small>Iterations</small><strong>{result.iterations}</strong></div></div><div className="results-heading"><div><span className="section-number">03 · RESULTADOS</span><h2>Lectura del experimento</h2></div><span>Función ejecutada: <code>{submittedFn}</code></span></div><Charts result={result} expression={submittedFn} method={method}/><IterationTable rows={result.table}/></>}
     </div>
   </section>
 </main>
}
