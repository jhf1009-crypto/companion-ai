import { useEffect, useState } from "react";
import { Home } from "./pages/Home";
import { Booking } from "./pages/Booking";
import { Admin } from "./pages/Admin";
import { NotFound } from "./pages/NotFound";
import { useStore } from "./state/store";
import { config } from "./config";
export function App() {
  const [route, setRoute] = useState(location.hash || "#/");
  const { notice, memoryOnly } = useStore();
  useEffect(() => {
    const handler = () => {
      setRoute(location.hash || "#/");
      if (location.hash.startsWith("#/")) window.scrollTo(0, 0);
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
      url: config.siteUrl,
      priceRange: "R$",
    });
    document.head.appendChild(script);
    return () => script.remove();
  }, []);
  const path = route.split("?")[0];
  const homeRoute = ["#/", "#servicos", "#localizacao"].includes(path);
  return (
    <>
      <header className="site-header">
        <a className="brand" href="#/" aria-label={`${config.name} — início`}>
          <img
            className="brand-symbol logo-image"
            src={`${import.meta.env.BASE_URL}images/logo.webp`}
            alt="Logo Barbearia do Enzo"
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
        </nav>
      </header>
      {memoryOnly && (
        <p className="storage-warning" role="status">
          Armazenamento indisponível: dados mantidos só em memória nesta aba.
          Não feche a página.
        </p>
      )}
      {location.pathname !== "/" && location.pathname !== "/index.html" ? <NotFound /> : path === "#/gestao" ? <Admin /> : path === "#/agendar" ? <Booking key={route} /> : homeRoute ? <Home /> : <NotFound />}
      <footer className="site-footer">
        <div className="container">
          <a className="brand" href="#/">
            <img
              className="brand-symbol logo-image"
              src={`${import.meta.env.BASE_URL}images/logo.webp`}
              alt="Logo Barbearia do Enzo"
            />
            <span>
              <small>BARBEARIA</small>
              <strong>
                {config.name.replace("Barbearia ", "").toUpperCase()}
              </strong>
            </span>
          </a>
          <p>{config.slogan}</p>
        </div>
      </footer>
      {notice && (
        <div className="toast" role="status">
          ✓ {notice}
        </div>
      )}
    </>
  );
}
