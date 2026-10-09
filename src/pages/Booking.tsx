import { useEffect, useState, type FormEvent } from "react";
import { config } from "../config";
import { addDays, dateLabel, money, nowClock, time } from "../lib/dates";
import { availableSlots } from "../lib/availability";
import { maskPhone, validPhone, whatsapp } from "../lib/whatsapp";
import { calendar } from "../lib/ics";
import { readData } from "../lib/storage";
import { useStore } from "../state/store";
import type { Appointment } from "../types";
export function Booking({
  manual = false,
  existing,
  onClose,
}: {
  manual?: boolean;
  existing?: Appointment;
  onClose?: () => void;
}) {
  const { data, book, toast } = useStore();
  const preselected =
    existing?.serviceId ??
    new URLSearchParams(location.hash.split("?")[1]).get("servico") ??
    "";
  const [serviceId, setServiceId] = useState(preselected);
  const [barberId, setBarberId] = useState(
    existing?.barberId ?? config.barbers[0].id,
  );
  const [step, setStep] = useState(preselected ? 1 : 0);
  const [date, setDate] = useState(existing?.date ?? "");
  const [start, setStart] = useState<number | null>(existing?.start ?? null);
  const [name, setName] = useState(existing?.name ?? "");
  const [phone, setPhone] = useState(existing ? maskPhone(existing.phone) : "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<Appointment | null>(null);
  const [now, setNow] = useState(nowClock);
  useEffect(() => {
    const id = setInterval(() => setNow(nowClock()), 30000);
    return () => clearInterval(id);
  }, []);
  const service = data.services.find((s) => s.id === serviceId && s.active);
  const dates = Array.from({ length: config.windowDays }, (_, i) =>
    addDays(now.date, i),
  );
  const slots =
    service && date
      ? availableSlots(
          data,
          date,
          service.duration,
          barberId,
          now,
          existing?.id,
        )
      : [];
  useEffect(() => {
    if (serviceId && !service) {
      setStep(0);
      setError("Este serviço não está mais disponível. Escolha outro.");
    }
  }, [serviceId, service]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!service || start === null || !date) return;
    if (name.trim().length < 2) {
      setError("Informe seu nome com pelo menos 2 letras.");
      return;
    }
    if (!validPhone(phone)) {
      setError(
        "Informe um WhatsApp válido com DDD, por exemplo (77) 99999-1234.",
      );
      return;
    }
    setSaving(true);
    const a: Appointment = {
      id: existing?.id ?? crypto.randomUUID(),
      serviceId: service.id,
      serviceName: service.name,
      barberId,
      date,
      start,
      duration: service.duration,
      price: service.price,
      name: name.trim(),
      phone: phone.replace(/\D/g, ""),
      status: "confirmed",
      source: manual ? "manual" : "client",
      created: Date.now(),
    };
    try {
      if (await book(a, existing?.id)) {
        setSuccess(
          readData().appointments.find((item) => item.id === a.id) ?? a,
        );
        toast(
          existing
            ? "Agendamento remarcado."
            : "Horário reservado com sucesso!",
        );
      } else {
        setError(
          "Esse horário acabou de ficar indisponível. Escolha outro horário livre.",
        );
        setStart(null);
        setStep(2);
      }
    } finally {
      setSaving(false);
    }
  }
  if (success)
    return (
      <main className="booking-page container">
        <div className="success-card">
          <span className="success-icon">✓</span>
          <span className="eyebrow">ESTÁ TUDO CERTO</span>
          <h1>
            Seu horário
            <br />
            <em>está reservado.</em>
          </h1>
          <p>Até breve, {success.name.split(" ")[0]}.</p>
          <div className="booking-summary">
            <h3>{success.serviceName}</h3>
            <p>
              {dateLabel(success.date)} · {time(success.start)}–
              {time(success.start + success.duration)}
            </p>
            <p>
              {config.barbers.find((b) => b.id === success.barberId)?.name} ·{" "}
              {money(success.price)}
            </p>
            <p>
              {config.address} · {config.city}
            </p>
          </div>
          <button className="button primary" onClick={() => calendar(success)}>
            Adicionar ao calendário ↓
          </button>
          <a
            className="button outline"
            href={whatsapp(
              config.whatsapp,
              `Olá! Meu agendamento na ${config.name} foi confirmado na demonstração.\nCliente: ${success.name}\nServiço: ${success.serviceName}\nData: ${dateLabel(success.date)}\nHorário: ${time(success.start)}\nValor: ${money(success.price)}`,
            )}
            target="_blank"
            rel="noreferrer"
          >
            Enviar confirmação no WhatsApp ↗
          </a>
          {manual ? (
            <button className="button ghost" onClick={onClose}>
              Voltar ao painel
            </button>
          ) : (
            <a className="button ghost" href="#/">
              Voltar ao início
            </a>
          )}
          <small>
            Reserva local de demonstração. Nenhuma mensagem foi enviada
            automaticamente.
          </small>
        </div>
      </main>
    );
  return (
    <main className="booking-page container">
      <div className="booking-top">
        <button
          className="button ghost"
          onClick={() => {
            setError("");
            if (step > 0) setStep(step - 1);
            else if (manual) onClose?.();
            else location.hash = "#/";
          }}
        >
          ← Voltar
        </button>
        <span className="eyebrow">
          {existing
            ? "REMARCAR"
            : manual
              ? "AGENDAMENTO MANUAL"
              : "SEU TEMPO, RESERVADO"}
        </span>
      </div>
      <h1>
        Vamos cuidar
        <br />
        <em>do seu próximo corte.</em>
      </h1>
      <ol className="progress" aria-label="Progresso do agendamento">
        {["Serviço", "Dia", "Horário", "Seus dados"].map((label, i) => (
          <li
            className={i === step ? "current" : i < step ? "done" : ""}
            aria-current={i === step ? "step" : undefined}
            key={label}
          >
            <span>{i < step ? "✓" : i + 1}</span>
            <b>{label}</b>
          </li>
        ))}
      </ol>
      {service && step > 0 && (
        <div className="selection-summary">
          <span>
            {service.name} · {service.duration} min · {money(service.price)}
          </span>
          <button onClick={() => setStep(0)}>Alterar serviço</button>
        </div>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <section className="booking-panel" aria-label={`Passo ${step + 1}`}>
        {step === 0 && (
          <>
            <h2>Qual é o seu ritual?</h2>
            <div className="booking-services">
              {data.services
                .filter((s) => s.active)
                .map((s) => (
                  <button
                    className={`service-option ${serviceId === s.id ? "selected" : ""}`}
                    key={s.id}
                    onClick={() => {
                      setServiceId(s.id);
                      setStart(null);
                      setStep(1);
                      setError("");
                    }}
                  >
                    <img
                      src={`${import.meta.env.BASE_URL}images/${s.icon}.svg`}
                      alt=""
                    />
                    <span>
                      <strong>{s.name}</strong>
                      <small>{s.duration} min</small>
                    </span>
                    <b>{money(s.price)}</b>
                    <span aria-hidden="true">↗</span>
                  </button>
                ))}
            </div>
          </>
        )}
        {step === 1 && service && (
          <>
            <h2>Escolha o melhor dia.</h2>
            <p className="muted">
              Próximos 30 dias · horário de {config.timezone}
            </p>
            {config.barbers.length > 1 && (
              <label>
                Profissional
                <select
                  value={barberId}
                  onChange={(e) => setBarberId(e.target.value)}
                >
                  {config.barbers.map((b) => (
                    <option value={b.id} key={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="day-strip">
              {dates.map((d) => {
                const free =
                  availableSlots(
                    data,
                    d,
                    service.duration,
                    barberId,
                    now,
                    existing?.id,
                  ).length > 0;
                return (
                  <button
                    key={d}
                    className={`day-button ${date === d ? "selected" : ""}`}
                    disabled={!free}
                    aria-label={dateLabel(d) + (free ? "" : " — sem vagas")}
                    onClick={() => {
                      setDate(d);
                      setStart(null);
                      setStep(2);
                      setError("");
                    }}
                  >
                    <small>{dateLabel(d).split(",")[0].slice(0, 3)}</small>
                    <strong>{d.slice(8)}</strong>
                    <small>{dateLabel(d, true).split(" de ").at(-1)}</small>
                    <span>{free ? "Disponível" : "Sem vagas"}</span>
                  </button>
                );
              })}
            </div>
            <p className="hint">
              Dias fechados ou sem vagas aparecem desativados.
            </p>
          </>
        )}
        {step === 2 && service && (
          <>
            <h2>Um horário só para você.</h2>
            <p className="muted">
              {date && dateLabel(date)} · {service.duration} minutos reservados
            </p>
            <div className="time-grid">
              {slots.map((t) => (
                <button
                  key={t}
                  className={start === t ? "selected" : ""}
                  onClick={() => {
                    setStart(t);
                    setStep(3);
                    setError("");
                  }}
                >
                  {time(t)}
                </button>
              ))}
            </div>
            {slots.length === 0 && (
              <div className="empty">
                <p>Nenhum horário disponível neste dia.</p>
                <button className="button outline" onClick={() => setStep(1)}>
                  Escolher outro dia
                </button>
              </div>
            )}
          </>
        )}
        {step === 3 && service && start !== null && (
          <>
            <h2>Como podemos te chamar?</h2>
            <div className="booking-summary">
              <strong>{service.name}</strong>
              <p>
                {dateLabel(date)} · {time(start)} · {money(service.price)}
              </p>
            </div>
            <form onSubmit={submit} noValidate>
              <label htmlFor="client-name">
                Seu nome
                <input
                  id="client-name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                  placeholder="Nome e sobrenome"
                  required
                />
              </label>
              <label htmlFor="client-phone">
                WhatsApp com DDD
                <input
                  id="client-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  value={phone}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                  placeholder="(77) 99999-1234"
                  required
                />
              </label>
              <p className="hint">
                Sem conta, sem complicação. Seus dados ficam apenas neste
                navegador.
              </p>
              <button
                className="button primary wide"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Reservando…"
                  : existing
                    ? "Confirmar remarcação"
                    : "Confirmar agendamento"}{" "}
                ↗
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
