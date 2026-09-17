export type Desmos3DExpression = {
  id: string;
  latex: string;
  color?: string;
  hidden?: boolean;
  opacity?: number;
};

export type Desmos3DCalculator = {
  setExpression(expression: Desmos3DExpression): void;
  setCameraPosition?(position: { x: number; y: number; z: number }): void;
  destroy(): void;
};

export type Desmos3DApi = {
  Calculator3D?: (element: HTMLElement, options: Record<string, unknown>) => Desmos3DCalculator;
  GraphingCalculator3D?: (element: HTMLElement, options: Record<string, unknown>) => Desmos3DCalculator;
};

declare global {
  interface Window {
    Desmos?: Desmos3DApi & {
      GraphingCalculator?: (element: HTMLElement, options: Record<string, unknown>) => unknown;
    };
  }
}

const DESMOS_3D_SCRIPT = "https://www.desmos.com/api/v1.12/calculator.js?apiKey=";

export function loadDesmos3D(): Promise<Desmos3DApi> {
  const desmosWindow = window as typeof window & { Desmos?: Desmos3DApi };
  if (desmosWindow.Desmos && (desmosWindow.Desmos.Calculator3D || desmosWindow.Desmos.GraphingCalculator3D)) {
    return Promise.resolve(desmosWindow.Desmos);
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src^="${DESMOS_3D_SCRIPT}"]`);
    const script = existing ?? document.createElement("script");
    const finish = () => {
      if (desmosWindow.Desmos && (desmosWindow.Desmos.Calculator3D || desmosWindow.Desmos.GraphingCalculator3D)) {
        return resolve(desmosWindow.Desmos);
      }
      reject(new Error("La API 3D de Desmos no está disponible"));
    };
    script.addEventListener("load", finish, { once: true });
    script.addEventListener("error", () => reject(new Error("No se pudo cargar Desmos 3D")), { once: true });
    if (!existing) {
      const apiKey = process.env.NEXT_PUBLIC_DESMOS_API_KEY ?? "";
      script.src = `${DESMOS_3D_SCRIPT}${encodeURIComponent(apiKey)}`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });
}
