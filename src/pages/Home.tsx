import { config } from "../config";
import { money, time } from "../lib/dates";
import { whatsapp } from "../lib/whatsapp";
import { useStore } from "../state/store";
export function Home() {
  const { data } = useStore();
  return (
    <>
      <section className="hero">
        <img
          className="hero-art"
          src={`${import.meta.env.BASE_URL}images/image.png`}
          alt="Ilustração de uma cadeira de barbeiro sob luzes douradas"
        />
        <div className="hero-shade" />
        <div className="container hero-content">
          <span className="eyebrow">ESTILO. CONFIANÇA. ATITUDE.</span>
          <h1>
            {config.slogan.split(",")[0]},<br />
            <em>{config.slogan.split(",").slice(1).join(",").trim()}</em>
          </h1>
          <p>
            Um momento para você.
            <br />
            Um corte à altura de quem você é.
          </p>
          <div className="actions">
            <a className="button primary" href="#/agendar">
              Agendar horário <span aria-hidden="true">↗</span>
            </a>
            <a
              className="button outline"
              href={whatsapp(config.whatsapp)}
              target="_blank"
              rel="noreferrer"
            >
              Falar no WhatsApp
            </a>
          </div>
          <div className="hero-detail">
            <span className="line" /> Precisão no corte. Respeito pelo seu
            tempo.
          </div>
        </div>
        <span className="hero-caption">O SEU PRÓXIMO CAPÍTULO COMEÇA AQUI</span>
      </section>
      <div className="promise container">
        <span>
          ✂︎ <b>Cuidado em cada detalhe</b>
        </span>
        <span>
          ◷ <b>Seu horário reservado</b>
        </span>
        <span>
          ◇ <b>Experiência sem pressa</b>
        </span>
      </div>
      <section className="section container" id="servicos">
        <div className="section-heading">
          <div>
            <span className="eyebrow">O NOSSO OFÍCIO</span>
            <h2>
              Clássico no cuidado.
              <br />
              <em>Único no resultado.</em>
            </h2>
          </div>
          <p>
            Escolha o seu ritual.
            <br />
            Nós cuidamos do resto.
          </p>
        </div>
        <div className="service-grid">
          {data.services
            .filter((s) => s.active)
            .map((s) => (
              <article
                className={`service-card ${s.featured ? "featured" : ""}`}
                key={s.id}
              >
                {s.featured && <span className="tag">MAIS PEDIDO</span>}
                <img
                  src={`${import.meta.env.BASE_URL}images/${s.icon}.svg`}
                  alt=""
                  loading="lazy"
                  width="64"
                  height="64"
                />
                <h3>{s.name}</h3>
                <p>{s.description}</p>
                <div className="service-meta">
                  <strong>{money(s.price)}</strong>
                  <span>{s.duration} min</span>
                </div>
                <a className="service-link" href={`#/agendar?servico=${s.id}`}>
                  Agendar <span aria-hidden="true">↗</span>
                </a>
              </article>
            ))}
        </div>
      </section>
      <section className="craft">
        <div className="container craft-inner">
          <img
            src={`${import.meta.env.BASE_URL}${config.barbers[0].image}`}
            alt="Ilustração do profissional Rafael"
            loading="lazy"
          />
          <div>
            <span className="eyebrow">QUEM CUIDA DE VOCÊ</span>
            <h2>
              Bom papo.
              <br />
              <em>Corte impecável.</em>
            </h2>
            <p>
              {config.description} Conheça {config.barbers[0].name}, seu
              profissional nesta demonstração.
            </p>
            <a className="button outline" href="#/agendar">
              Reservar meu horário ↗
            </a>
          </div>
        </div>
      </section>
      <section className="section container" id="localizacao">
        <div className="section-heading">
          <div>
            <span className="eyebrow">A CASA É SUA</span>
            <h2>
              Nos encontramos <em>aqui.</em>
            </h2>
          </div>
        </div>
        <div className="location-grid">
          <div className="map-art">
            <span className="map-pin">✂︎</span>
            <strong>{config.name}</strong>
            <small>Mapa ilustrativo · endereço de demonstração</small>
            <a
              className="button primary"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.address + ", " + config.city)}`}
              target="_blank"
              rel="noreferrer"
            >
              Abrir no Google Maps ↗
            </a>
          </div>
          <div className="location-copy">
            <h3>Seu próximo destino.</h3>
            <p>
              {config.address}
              <br />
              {config.city}
            </p>
            <h4>Horário de funcionamento</h4>
            <ul className="hours-list">
              {data.hours.map((h, i) => (
                <li key={i}>
                  <span>
                    {
                      [
                        "Domingo",
                        "Segunda",
                        "Terça",
                        "Quarta",
                        "Quinta",
                        "Sexta",
                        "Sábado",
                      ][i]
                    }
                  </span>
                  <span>
                    {h.closed
                      ? "Fechado"
                      : `${time(h.open)} – ${time(h.close)}`}
                  </span>
                </li>
              ))}
            </ul>
            <div className="actions">
              <a
                href={whatsapp(config.whatsapp)}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp ↗
              </a>
              <a
                href={`https://www.instagram.com/${config.instagram}/`}
                target="_blank"
                rel="noreferrer"
              >
                Instagram ↗
              </a>
            </div>
          </div>
        </div>
      </section>
      <div className="mobile-book">
        <a className="button primary" href="#/agendar">
          Agendar horário ↗
        </a>
      </div>
    </>
  );
}
