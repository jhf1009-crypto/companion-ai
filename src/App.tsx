import { useEffect, useState } from "react";
import { Home } from "./pages/Home";
import { Booking } from "./pages/Booking";
import { Admin } from "./pages/Admin";
import { useStore } from "./state/store";
import { config } from "./config";
export function App() {
  const [route, setRoute] = useState(location.hash || "#/");
  const { reset, notice, memoryOnly } = useStore();
  const [resetOpen, setResetOpen] = useState(false);
  useEffect(() => {
    const handler = () => {
      setRoute(location.hash || "#/");
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  useEffect(() => {
    document.title = `${config.name} | Agende seu horário`;
    Object.entries(config.colors).forEach(([key, value]) =>
      document.documentElement.style.setProperty("--" + key, value),
    );
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "HairSalon",
      name: config.name,
      description: config.description,
      telephone: "+" + config.whatsapp,
      address: {
        "@type": "PostalAddress",
        streetAddress: config.address,
        addressLocality: config.city,
      },
      priceRange: "R$",
    });
    document.head.appendChild(script);
    return () => script.remove();
  }, []);
  const path = route.split("?")[0];
  return (
    <>
      <div className="demo-bar">
        <span>
          <b>DEMO</b> Seu próximo corte, sem fila.
        </span>
        <div>
          <a href="#/admin">Abrir painel do barbeiro ↗</a>
          <button onClick={() => setResetOpen(true)}>
            Resetar dados de demonstração
          </button>
        </div>
      </div>
      <header className="site-header">
        <a className="brand" href="#/" aria-label={`${config.name} — início`}>
          <img
            className="brand-symbol"
            src={`${import.meta.env.BASE_URL}images/scissors.svg`}
            alt=""
          />
          <span>
            <small>BARBEARIA</small>
            <strong>
              {config.name.replace("Barbearia ", "").toUpperCase()}
            </strong>
          </span>
        </a>
        <nav aria-label="Navegação principal">
          <a href="#/">O espaço</a>
          <a href="#/agendar">Agendar</a>
          <a className="header-admin" href="#/admin">
            Painel ↗
          </a>
        </nav>
      </header>
      {memoryOnly && (
        <p className="storage-warning" role="status">
          Armazenamento indisponível: dados mantidos só em memória nesta aba.
          Não feche a página.
        </p>
      )}
      {path === "#/admin" ? (
        <Admin />
      ) : path === "#/agendar" ? (
        <Booking key={route} />
      ) : (
        <Home />
      )}
      <footer className="site-footer">
        <div className="container">
          <a className="brand" href="#/">
            <img
              className="brand-symbol"
              src={`${import.meta.env.BASE_URL}images/scissors.svg`}
              alt=""
            />
            <span>
              <small>BARBEARIA</small>
              <strong>
                {config.name.replace("Barbearia ", "").toUpperCase()}
              </strong>
            </span>
          </a>
          <p>{config.slogan}</p>
          <small>Versão de demonstração – dados fictícios</small>
          <a href="#/admin">Painel do barbeiro ↗</a>
        </div>
      </footer>
      {notice && (
        <div className="toast" role="status">
          ✓ {notice}
        </div>
      )}
      {resetOpen && (
        <div className="modal-backdrop">
          <section
            className="reset-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-title"
            onKeyDown={(event) => {
              if (event.key === "Escape") setResetOpen(false);
              if (event.key === "Tab") {
                const buttons = event.currentTarget.querySelectorAll("button");
                const first = buttons[0],
                  last = buttons[buttons.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                  event.preventDefault();
                  last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                  event.preventDefault();
                  first.focus();
                }
              }
            }}
          >
            <h2 id="reset-title">Começar de novo?</h2>
            <p>
              Isso apaga as reservas e alterações locais e restaura os dados de
              demonstração.
            </p>
            <div className="actions">
              <button
                className="button outline"
                autoFocus
                onClick={() => setResetOpen(false)}
              >
                Manter dados
              </button>
              <button
                className="button primary"
                onClick={() => {
                  reset();
                  setResetOpen(false);
                }}
              >
                Resetar demonstração
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
