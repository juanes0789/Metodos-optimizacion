import Link from "next/link";

const examples = [
  ["Polinomios", "x**3 - x - 2", "Usa ** para potencias y * para multiplicar."],
  ["Seno", "sin(x) o sen(x)", "También puedes escribir seno(x)."],
  ["Coseno y exponencial", "cos(x) + exp(x)", "Las funciones se escriben con paréntesis."],
  ["Logaritmo y raíz", "log(x) + sqrt(x)", "ln(x) es equivalente a log(x)."],
];

export default function Instructions() {
  return (
    <main className="guide-page">
      <header className="guide-hero">
        <nav className="top-nav"><Link href="/">Laboratorio</Link><Link className="current" href="/instructions">Instrucciones</Link></nav>
        <div className="guide-kicker"><span className="eyebrow">NUMERICAL LAB</span><span className="guide-status">Guía rápida · 3 min</span></div>
        <div className="hero-grid">
          <div>
            <h1>Resultados claros,<br /><em>mejores decisiones.</em></h1>
            <p className="hero-copy">Aprende a escribir funciones, elegir un método y leer cada resultado sin perderte en los detalles.</p>
            <Link className="run hero-action" href="/">Abrir el laboratorio <span aria-hidden="true">→</span></Link>
          </div>
          <div className="hero-orbit" aria-hidden="true">
            <span className="orbit-ring orbit-ring-one" />
            <span className="orbit-ring orbit-ring-two" />
            <span className="orbit-dot dot-one" />
            <span className="orbit-dot dot-two" />
            <span className="orbit-dot dot-three" />
            <span className="orbit-label">f(x)</span>
          </div>
        </div>
      </header>

      <section className="guide-intro">
        <div><span className="section-number">01</span><h2>Empieza en tres pasos</h2></div>
        <div className="step-grid">
          <article className="step"><span>01</span><h3>Elige un método</h3><p>Selecciona un método de raíces u optimización desde el panel lateral.</p></article>
          <article className="step"><span>02</span><h3>Define tu problema</h3><p>Escribe la función y completa los parámetros que aparecen para ese método.</p></article>
          <article className="step"><span>03</span><h3>Ejecuta y explora</h3><p>Presiona <strong>Run method</strong> para calcular, graficar y revisar la tabla.</p></article>
        </div>
      </section>

      <section className="guide-section">
        <div className="section-heading"><span className="section-number">02</span><div><h2>Escribe funciones sin sorpresas</h2><p>La aplicación acepta sintaxis estilo Python/SymPy y expresiones naturales.</p></div></div>
        <div className="format-layout">
          <article className="card syntax-card">
            <div className="card-heading"><span className="icon-badge">ƒ</span><div><h3>Reglas de formato</h3><p>Usa paréntesis para que el orden de las operaciones sea evidente.</p></div></div>
            <div className="syntax-list">
              <div><code>+ &nbsp; - &nbsp; * &nbsp; /</code><span>Operaciones básicas</span></div>
              <div><code>**</code><span>Potencias · no uses <code>^</code></span></div>
              <div><code>2*x</code> <span className="arrow">→</span> <code>2x</code><span>La multiplicación implícita también funciona</span></div>
            </div>
            <div className="function-list"><span>Funciones disponibles</span><code>sin · sen · seno · cos · tan · exp · log · ln · sqrt · abs</code></div>
          </article>
          <article className="card example-card">
            <div className="card-heading"><span className="icon-badge accent">⌁</span><div><h3>Ejemplos listos para probar</h3><p>Copia una expresión y ejecútala en el laboratorio.</p></div></div>
            <div className="examples">{examples.map(([title, expression, detail]) => <div key={title}><div><strong>{title}</strong><small>{detail}</small></div><code>{expression}</code></div>)}</div>
          </article>
        </div>
      </section>

      <section className="guide-section method-guide">
        <div className="section-heading"><span className="section-number">03</span><div><h2>Qué necesita cada método</h2><p>Usa esta referencia para preparar los datos antes de ejecutar.</p></div></div>
        <div className="method-grid">
          <article><span className="method-tag roots">RAÍCES</span><h3>Bisection · False Position</h3><p>Necesitan un intervalo <code>[a, b]</code> donde la función cambie de signo.</p></article>
          <article><span className="method-tag roots">RAÍCES</span><h3>Newton-Raphson</h3><p>Necesita un valor inicial <code>x0</code> cercano a la raíz.</p></article>
          <article><span className="method-tag optimize">OPTIMIZACIÓN</span><h3>Golden Section · Quadratic</h3><p>Trabajan con un intervalo y permiten elegir entre minimizar o maximizar.</p></article>
          <article><span className="method-tag optimize">2 VARIABLES</span><h3>Random Search</h3><p>Escribe una función con <code>x</code> y <code>y</code>, define ambos rangos y explora la superficie 3D.</p></article>
        </div>
        <div className="note"><span aria-hidden="true">i</span><p>La tolerancia debe ser cero o positiva. El máximo de iteraciones debe ser un entero mayor que cero. Cambiar la función o los parámetros limpia el resultado anterior hasta que vuelvas a ejecutar.</p></div>
      </section>

      <footer className="guide-footer"><div><span className="eyebrow">LISTO PARA EXPERIMENTAR</span><h2>Tu siguiente aproximación empieza aquí.</h2></div><Link className="run" href="/">Ir al laboratorio <span aria-hidden="true">→</span></Link></footer>
    </main>
  );
}
