# Numerical Lab

Aplicación full-stack para explorar siete métodos numéricos (raíces y minimización) con historial de iteraciones y gráficos interactivos. El notebook original `metodos.ipynb` se conserva sin cambios.

## Ejecutar

```bash
cd backend && python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
cd ../frontend && npm install && npm run dev
```

Abra http://localhost:3000. Configure `backend/.env` (`CORS_ORIGINS`) y `frontend/.env.local` (`NEXT_PUBLIC_API_URL` y `NEXT_PUBLIC_DESMOS_API_KEY`) a partir de los ejemplos. La clave de Desmos se obtiene en [Desmos API](https://www.desmos.com/api).

## Visualización

Las gráficas usan el motor oficial de Desmos mediante su [Graphing Calculator API](https://www.desmos.com/api/v1.12/docs/index.html), no Recharts. La gráfica de función muestra un rango amplio, puntos de aproximación y líneas guía verticales/horizontales; ambas gráficas permiten zoom y desplazamiento.

## Métodos y API

Bisección, falsa posición y Newton-Raphson buscan raíces; razón dorada, interpolación cuadrática, Newton optimización y búsqueda aleatoria minimizan. `POST /api/v1/methods/{method}` recibe `{ "function": "x**3-x-2", "params": {...} }`. Las expresiones se analizan con una lista cerrada de funciones SymPy (sin ejecución Python).

## Tests y Docker

```bash
cd backend && pytest
docker compose up --build
```
