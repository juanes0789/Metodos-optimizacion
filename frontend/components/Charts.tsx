"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { loadDesmos3D, type Desmos3DCalculator, type Desmos3DExpression } from "../lib/desmos3d";
import type { NumericalResponse } from "../types";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

type DesmosExpression = {
  id: string;
  latex: string;
  color?: string;
  hidden?: boolean;
  lineStyle?: string;
};

type DesmosCalculator = {
  setExpression(expression: DesmosExpression): void;
  setMathBounds(bounds: { left: number; right: number; bottom: number; top: number }): void;
  destroy(): void;
};

type DesmosApi = {
  GraphingCalculator(element: HTMLElement, options: Record<string, unknown>): DesmosCalculator;
};

const DESMOS_SCRIPT = "https://www.desmos.com/api/v1.12/calculator.js?apiKey=";

function loadDesmos(): Promise<DesmosApi> {
  const desmosWindow = window as typeof window & { Desmos?: DesmosApi };
  if (desmosWindow.Desmos) return Promise.resolve(desmosWindow.Desmos);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src^="${DESMOS_SCRIPT}"]`);
    const script = existing ?? document.createElement("script");
    const finish = () => desmosWindow.Desmos ? resolve(desmosWindow.Desmos) : reject(new Error("Desmos no está disponible"));
    script.addEventListener("load", finish, { once: true });
    script.addEventListener("error", () => reject(new Error("No se pudo cargar Desmos")), { once: true });
    if (!existing) {
      script.src = `${DESMOS_SCRIPT}${encodeURIComponent(process.env.NEXT_PUBLIC_DESMOS_API_KEY ?? "")}`;
      document.head.appendChild(script);
    }
  });
}

function latexFunction(expression: string): string {
  return expression
    .replace(/\bseno?\s*\(/gi, "sin(")
    .replace(/\bsen\s*\(/gi, "sin(")
    .replace(/\bln\s*\(/gi, "log(")
    .replace(/\*\*/g, "^")
    .replace(/\b(sin|cos|tan|log|sqrt|exp)\s*\(/gi, "\\$1(")
    .replace(/\*/g, "\\cdot ");
}

function bounds(result: NumericalResponse) {
  const xs = result.function_x;
  const ys = result.function_y.filter(Number.isFinite);
  const xmin = Math.min(...xs);
  const xmax = Math.max(...xs);
  const ymin = Math.min(0, ...ys);
  const ymax = Math.max(0, ...ys);
  return { xmin, xmax, ymin: ymin - Math.max(1, (ymax - ymin) * 0.1), ymax: ymax + Math.max(1, (ymax - ymin) * 0.1) };
}

function DesmosPanel({ expressions, viewport }: { expressions: DesmosExpression[]; viewport?: ReturnType<typeof bounds> }) {
  const element = useRef<HTMLDivElement>(null);
  const calculator = useRef<DesmosCalculator | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    loadDesmos().then((api) => {
      if (!active || !element.current) return;
      calculator.current = api.GraphingCalculator(element.current, {
        expressions: false,
        settingsMenu: false,
        zoomButtons: true,
        border: false,
        lockViewport: false,
      });
      setReady(true);
    }).catch((reason: Error) => { if (active) setError(reason.message); });
    return () => { active = false; calculator.current?.destroy(); calculator.current = null; };
  }, []);

  useEffect(() => {
    const current = calculator.current;
    if (!current) return;
    expressions.forEach((expression) => current.setExpression(expression));
    if (viewport) {
      current.setMathBounds({
        left: viewport.xmin,
        right: viewport.xmax,
        bottom: viewport.ymin,
        top: viewport.ymax,
      });
    }
  }, [expressions, viewport, ready]);

  if (error) return <div className="graph-error">No se pudo cargar la gráfica de Desmos: {error}</div>;
  return <div className="desmos-canvas" ref={element} />;
}

function normalizeJsExpression(expression: string): string {
  let next = expression.trim();
  next = next.replace(/\^/g, "**");
  next = next.replace(/\b(?:sen|seno)\s*\(/gi, "sin(");
  next = next.replace(/\bln\s*\(/gi, "log(");
  next = next.replace(/\bpi\b/gi, "PI");
  next = next.replace(/([0-9]+)([xy])([xy])/gi, "$1*$2*$3");
  next = next.replace(/([0-9]+)([xy])/gi, "$1*$2");
  next = next.replace(/([xy])([0-9]+)/gi, "$1*$2");
  next = next.replace(/([xy])([xy])/gi, "$1*$2");
  next = next.replace(/([xy])\s*\(/gi, "$1*(");
  next = next.replace(/\)\s*([xy])/gi, ")*$1");
  return next;
}

function evaluate2D(expression: string, x: number, y: number): number {
  const normalized = normalizeJsExpression(expression);
  const fn = new Function(
    "x",
    "y",
    `const { sin, cos, tan, asin, acos, atan, sqrt, abs, log, exp, min, max, pow, PI, E } = Math; return (${normalized});`
  );
  const value = fn(x, y);
  if (!Number.isFinite(value)) return NaN;
  return value;
}

function buildSurfaceData(expression: string, xMin = -2, xMax = 2, yMin = -2, yMax = 2, resolution = 35) {
  const xValues = Array.from({ length: resolution }, (_, index) => xMin + ((xMax - xMin) * index) / (resolution - 1));
  const yValues = Array.from({ length: resolution }, (_, index) => yMin + ((yMax - yMin) * index) / (resolution - 1));
  const z = yValues.map((y) => xValues.map((x) => evaluate2D(expression, x, y)));
  return { x: xValues, y: yValues, z };
}

function Plotly3DPanel({ expression, point }: { expression: string; point?: { x: number; y: number; z: number } }) {
  const data = useMemo(() => {
    const { x, y, z } = buildSurfaceData(expression, -2, 2, -2, 2, 28);
    const series: any[] = [{
      type: "surface",
      x,
      y,
      z,
      colorscale: "Viridis",
      opacity: 0.9,
      hovertemplate: "x: %{x}<br>y: %{y}<br>z: %{z}<extra></extra>",
    }];
    if (point) {
      series.push({
        type: "scatter3d" as const,
        mode: "markers" as const,
        x: [point.x],
        y: [point.y],
        z: [point.z],
        marker: { size: 8, color: "#c74440", symbol: "diamond" },
        hovertemplate: "x: %{x}<br>y: %{y}<br>z: %{z}<extra></extra>",
      });
    }
    return series;
  }, [expression, point]);

  return <Plot
    data={data}
    layout={{
      autosize: true,
      margin: { l: 0, r: 0, t: 0, b: 0 },
      paper_bgcolor: "#ffffff",
      plot_bgcolor: "#ffffff",
      scene: {
        xaxis: { title: { text: "x" }, backgroundcolor: "#f8fafc" },
        yaxis: { title: { text: "y" }, backgroundcolor: "#f8fafc" },
        zaxis: { title: { text: "z" }, backgroundcolor: "#f8fafc" },
        camera: { eye: { x: 1.4, y: 1.4, z: 1.2 } },
      },
    }}
    config={{ responsive: true, displaylogo: false }}
    useResizeHandler
    style={{ width: "100%", height: "430px" }}
  />;
}

function Desmos3DPanel({ expression, point }: { expression: string; point?: { x: number; y: number; z: number } }) {
  const element = useRef<HTMLDivElement>(null);
  const calculator = useRef<Desmos3DCalculator | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    loadDesmos3D().then((api) => {
      if (!active || !element.current) return;
      const factory = api.Calculator3D ?? api.GraphingCalculator3D;
      if (!factory) {
        if (active) setError("La API 3D de Desmos no está disponible");
        return;
      }
      calculator.current = factory(element.current, {
        expressions: false,
        settingsMenu: false,
        zoomButtons: true,
        border: false,
      });
      setReady(true);
      setError("");
    }).catch((reason: Error) => {
      if (active) setError(reason.message);
    });

    return () => { active = false; calculator.current?.destroy(); calculator.current = null; };
  }, []);

  useEffect(() => {
    const current = calculator.current;
    if (!current || !ready) return;

    const surfaceLatex = expression.replace(/\*\*/g, "^").replace(/\s*\*\s*/g, " ");
    current.setExpression({ id: "surface", latex: `z=${surfaceLatex}`, color: "#2d70b3", opacity: 0.85 });
    if (point) {
      current.setExpression({ id: "point", latex: `(${point.x}, ${point.y}, ${point.z})`, color: "#c74440" });
    }
    current.setCameraPosition?.({ x: 1, y: 1, z: 1.5 });
  }, [expression, point, ready]);

  if (error) return <div className="graph-error">No se pudo cargar la gráfica 3D de Desmos: {error}</div>;
  return <div className="desmos-canvas" ref={element} />;
}

export function Charts({ result, expression, method }: { result: NumericalResponse; expression: string; method?: string }) {
  const functionLatex = latexFunction(expression);
  const lastIndex = result.x_history.length - 1;
  const lastX = result.x_history[lastIndex];
  const lastY = result.table[lastIndex]?.fx ?? result.final_fx ?? 0;
  const firstRow = result.table[0] ?? {};
  const initialBounds: Array<readonly [string, number]> = [];
  if (typeof firstRow.a === "number") initialBounds.push(["a", firstRow.a]);
  if (typeof firstRow.b === "number") initialBounds.push(["b", firstRow.b]);
  if (typeof firstRow.xl === "number") initialBounds.push(["xl", firstRow.xl]);
  if (typeof firstRow.xu === "number") initialBounds.push(["xu", firstRow.xu]);
  const iterationCount = result.errors.length;
  const xTickStep = Math.max(1, Math.ceil(iterationCount / 12));
  const functionExpressions: DesmosExpression[] = [
    { id: "function", latex: `f(x)=${functionLatex}`, color: "#2d70b3" },
    { id: "axis", latex: "y=0", color: "#666666" },
    ...initialBounds.map(([name, value]) => ({
      id: `initial-bound-${name}`,
      latex: `x=${value}`,
      color: "#f59e0b",
      lineStyle: "DASHED",
    })),
    ...(lastX === undefined ? [] : [{
      id: "final-approximation",
      latex: `(${lastX},${lastY})`,
      color: "#c74440",
    }]),
  ];
  const view = bounds(result);
  const point = typeof result.final_x === "number" && typeof result.final_fx === "number" ? { x: Number(result.final_x), y: Number((result.table.at(-1)?.best_y ?? result.table.at(-1)?.y ?? 0) ?? 0), z: Number(result.final_fx) } : undefined;
  const random3dPoint = typeof result.table.at(-1)?.best_x === "number" && typeof result.table.at(-1)?.best_y === "number" && typeof result.table.at(-1)?.best_fx === "number"
    ? { x: Number(result.table.at(-1)?.best_x), y: Number(result.table.at(-1)?.best_y), z: Number(result.table.at(-1)?.best_fx) }
    : undefined;

  return <div className="charts">
    <div className="card">
      <h2>{method === "random-search" ? "Superficie 3D" : "Función y aproximaciones"}</h2>
      <p className="chart-hint">{method === "random-search" ? "Superficie objetivo y mejor punto encontrado." : "Arrastra para desplazar y usa la rueda para acercar o alejar."}</p>
      {method === "random-search" ? <Desmos3DPanel expression={expression} point={random3dPoint} /> : <DesmosPanel expressions={functionExpressions} viewport={view} />}
    </div>
    <div className="card"><h2>Caída del error</h2><p className="chart-hint">El error absoluto debe descender hacia cero a medida que avanza el método.</p><Plot
      data={[{
        x: result.errors.map((_, index) => index + 1),
        y: result.errors,
        type: "scatter",
        mode: "lines+markers",
        line: { color: "#6042a6", width: 3 },
        marker: { color: "#c74440", size: 7 },
        hovertemplate: "Iteración %{x}<br>Error %{y:.4e}<extra></extra>",
      }]}
      layout={{
        autosize: true,
        height: 420,
        margin: { l: 65, r: 20, t: 20, b: 55 },
        paper_bgcolor: "#ffffff",
        plot_bgcolor: "#ffffff",
        font: { color: "#202124" },
        xaxis: { title: { text: "Iteración" }, dtick: xTickStep, tickangle: 0, automargin: true, gridcolor: "#e5e7eb", zerolinecolor: "#9ca3af" },
        yaxis: { title: { text: "Error absoluto" }, rangemode: "tozero", gridcolor: "#e5e7eb", zerolinecolor: "#9ca3af" },
        showlegend: false,
      }}
      config={{ responsive: true, displaylogo: false, modeBarButtonsToRemove: ["lasso2d", "select2d"] }}
      useResizeHandler
      style={{ width: "100%" }}
    /></div>
  </div>;
}
