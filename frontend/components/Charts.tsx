"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { loadDesmos3D, type Desmos3DCalculator } from "../lib/desmos3d";
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

interface Point3D {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

interface SurfaceSeriesPoint {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly text?: string;
  readonly color?: string;
}

interface DesmosPanelProps {
  readonly expressions: readonly DesmosExpression[];
  readonly viewport?: ReturnType<typeof bounds>;
}

interface Plotly3DPanelProps {
  readonly expression: string;
  readonly point?: Point3D;
}

interface Desmos3DPanelProps {
  readonly expression: string;
  readonly point?: Point3D;
}

interface LagrangePanelProps {
  readonly result: NumericalResponse;
  readonly expression: string;
}

interface ChartsProps {
  readonly result: NumericalResponse;
  readonly expression: string;
  readonly method?: string;
}

interface PlotlySurfaceChartProps {
  readonly expression: string;
  readonly points?: readonly SurfaceSeriesPoint[];
  readonly zAxisTitle?: string;
  readonly resolution?: number;
}

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

function DesmosPanel({ expressions, viewport }: Readonly<DesmosPanelProps>) {
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

function PlotlySurfaceChart({
  expression,
  points = [],
  zAxisTitle = "z",
  resolution = 35,
}: Readonly<PlotlySurfaceChartProps>) {
  const data = useMemo(() => {
    const { x, y, z } = buildSurfaceData(expression, -2, 2, -2, 2, resolution);
    const series: any[] = [{
      type: "surface",
      x,
      y,
      z,
      colorscale: "Viridis",
      opacity: 0.85,
      hovertemplate: "x: %{x}<br>y: %{y}<br>z: %{z}<extra></extra>",
    }];
    if (points.length > 0) {
      const hasText = points.some((p) => Boolean(p.text));
      series.push({
        type: "scatter3d" as const,
        mode: hasText ? ("markers+text" as const) : ("markers" as const),
        x: points.map((p) => p.x),
        y: points.map((p) => p.y),
        z: points.map((p) => p.z),
        text: points.map((p) => p.text ?? ""),
        textposition: "top center",
        marker: {
          size: 8,
          color: points.map((p) => p.color ?? "#c74440"),
          symbol: "diamond",
        },
        hovertemplate: hasText
          ? "x: %{x}<br>y: %{y}<br>f(x,y): %{z}<br>%{text}<extra></extra>"
          : "x: %{x}<br>y: %{y}<br>z: %{z}<extra></extra>",
      });
    }
    return series;
  }, [expression, points, resolution]);

  return (
    <Plot
      data={data}
      layout={{
        autosize: true,
        margin: { l: 0, r: 0, t: 0, b: 0 },
        paper_bgcolor: "#ffffff",
        plot_bgcolor: "#ffffff",
        scene: {
          xaxis: { title: { text: "x" }, backgroundcolor: "#f8fafc" },
          yaxis: { title: { text: "y" }, backgroundcolor: "#f8fafc" },
          zaxis: { title: { text: zAxisTitle }, backgroundcolor: "#f8fafc" },
          camera: { eye: { x: 1.4, y: 1.4, z: 1.2 } },
        },
      }}
      config={{ responsive: true, displaylogo: false }}
      useResizeHandler
      style={{ width: "100%", height: "430px" }}
    />
  );
}

function Plotly3DPanel({ expression, point }: Readonly<Plotly3DPanelProps>) {
  const points = useMemo(() => (point ? [{ x: point.x, y: point.y, z: point.z, color: "#c74440" }] : []), [point]);
  return <PlotlySurfaceChart expression={expression} points={points} zAxisTitle="z" resolution={28} />;
}

function Desmos3DPanel({ expression, point }: Readonly<Desmos3DPanelProps>) {
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

function getPointColor(type?: string): string {
  if (type === "Máximo") {
    return "#c74440";
  }
  if (type === "Mínimo") {
    return "#2d70b3";
  }
  return "#f59e0b";
}

function LagrangePanel({ result, expression }: Readonly<LagrangePanelProps>) {
  const points = useMemo(() => {
    return result.table
      .filter((r: any) => typeof r.x === "number" && typeof r.y === "number" && typeof r.f_xy === "number")
      .map((p: any) => ({
        x: p.x,
        y: p.y,
        z: p.f_xy,
        text: p.type ?? "",
        color: getPointColor(p.type),
      }));
  }, [result.table]);

  return <PlotlySurfaceChart expression={expression} points={points} zAxisTitle="f(x,y)" resolution={40} />;
}

function extractInitialBounds(firstRow: Record<string, unknown> = {}): Array<readonly [string, number]> {
  const initialBounds: Array<readonly [string, number]> = [];
  const keys = ["a", "b", "xl", "xu"] as const;
  for (const key of keys) {
    if (typeof firstRow[key] === "number") {
      initialBounds.push([key, firstRow[key] as number]);
    }
  }
  return initialBounds;
}

function buildDesmosExpressions(
  expression: string,
  initialBounds: Array<readonly [string, number]>,
  lastX: number | undefined,
  lastY: number
): DesmosExpression[] {
  const functionLatex = latexFunction(expression);
  const expressions: DesmosExpression[] = [
    { id: "function", latex: `f(x)=${functionLatex}`, color: "#2d70b3" },
    { id: "axis", latex: "y=0", color: "#666666" },
    ...initialBounds.map(([name, value]) => ({
      id: `initial-bound-${name}`,
      latex: `x=${value}`,
      color: "#f59e0b",
      lineStyle: "DASHED",
    })),
  ];

  if (lastX !== undefined) {
    expressions.push({
      id: "final-approximation",
      latex: `(${lastX},${lastY})`,
      color: "#c74440",
    });
  }

  return expressions;
}

function extractRandom3DPoint(result: NumericalResponse): Point3D | undefined {
  const lastRow = result.table.at(-1);
  if (
    typeof lastRow?.best_x === "number" &&
    typeof lastRow?.best_y === "number" &&
    typeof lastRow?.best_fx === "number"
  ) {
    return {
      x: Number(lastRow.best_x),
      y: Number(lastRow.best_y),
      z: Number(lastRow.best_fx),
    };
  }
  return undefined;
}

function getChartTitle(method?: string): string {
  if (method === "random-search" || method === "lagrange-multipliers") {
    return "Superficie 3D";
  }
  return "Función y aproximaciones";
}

function getChartHintText(method?: string): string {
  if (method === "lagrange-multipliers") {
    return "Superficie objetivo y puntos críticos encontrados (máximos en rojo, mínimos en azul).";
  }
  if (method === "random-search") {
    return "Superficie objetivo y mejor punto encontrado.";
  }
  return "Arrastra para desplazar y usa la rueda para acercar o alejar.";
}

function renderMainChartPanel(
  method: string | undefined,
  result: NumericalResponse,
  expression: string,
  random3dPoint: Point3D | undefined,
  functionExpressions: DesmosExpression[],
  view: ReturnType<typeof bounds>
) {
  if (method === "lagrange-multipliers") {
    return <LagrangePanel result={result} expression={expression} />;
  }
  if (method === "random-search") {
    return <Desmos3DPanel expression={expression} point={random3dPoint} />;
  }
  return <DesmosPanel expressions={functionExpressions} viewport={view} />;
}

export function Charts({ result, expression, method }: Readonly<ChartsProps>) {
  const lastIndex = result.x_history.length - 1;
  const lastX = result.x_history[lastIndex];
  const lastY = result.table[lastIndex]?.fx ?? result.final_fx ?? 0;
  const firstRow = (result.table[0] ?? {}) as Record<string, unknown>;

  const initialBounds = extractInitialBounds(firstRow);
  const functionExpressions = buildDesmosExpressions(expression, initialBounds, lastX, lastY);
  const view = bounds(result);
  const random3dPoint = extractRandom3DPoint(result);

  const iterationCount = result.errors.length;
  const xTickStep = Math.max(1, Math.ceil(iterationCount / 12));
  const chartTitle = getChartTitle(method);
  const chartHint = getChartHintText(method);
  const mainPanel = renderMainChartPanel(method, result, expression, random3dPoint, functionExpressions, view);

  return (
    <div className="charts">
      <div className="card">
        <h2>{chartTitle}</h2>
        <p className="chart-hint">{chartHint}</p>
        {mainPanel}
      </div>
      <div className="card">
        <h2>Caída del error</h2>
        <p className="chart-hint">El error absoluto debe descender hacia cero a medida que avanza el método.</p>
        <Plot
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
        />
      </div>
    </div>
  );
}
