import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { config } from "../config";
import { serviceForBarber } from "../lib/services";
import { addDays, dateLabel, money, nowClock, time } from "../lib/dates";
import { availableSlots, scheduleSlots } from "../lib/availability";
import { bookingMessage } from "../lib/booking-message";
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
  const preselectedBarber = new URLSearchParams(location.hash.split("?")[1]).get("barbeiro");
  const initialBarber = existing?.barberId ?? preselectedBarber;
  const [barberId, setBarberId] = useState(
    config.barbers.find((barber) => barber.id === initialBarber)?.id ?? config.barbers[0].id,
  );
  const [step, setStep] = useState(preselected ? 1 : 0);
  const [choosingProfessional, setChoosingProfessional] = useState(false);
  const [date, setDate] = useState(existing?.date ?? "");
  const [start, setStart] = useState<number | null>(existing?.start ?? null);
  const [name, setName] = useState(existing?.name ?? "");
  const [phone, setPhone] = useState(existing ? maskPhone(existing.phone) : "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<Appointment | null>(null);
  const [touched, setTouched] = useState({ name: false, phone: false });
  const [submitFailed, setSubmitFailed] = useState(false);
  const submitting = useRef(false);
  const requestId = useRef<string>();
  const stageRef = useRef<HTMLElement>(null);
  const mounted = useRef(false);
  const nameValid = name.trim().length >= 2;
  const phoneValid = validPhone(phone);
  const formValid = nameValid && phoneValid;
  useEffect(() => {
    if (mounted.current) stageRef.current?.focus({ preventScroll: true });
    mounted.current = true;
  }, [step, choosingProfessional, success]);
  const [now, setNow] = useState(nowClock);
  useEffect(() => {
    const id = setInterval(() => setNow(nowClock()), 30000);
    return () => clearInterval(id);
  }, []);
  const services = useMemo(
    () => data.services.map((item) => serviceForBarber(item, barberId)),
    [data.services, barberId],
  );
  const service = services.find((s) => s.id === serviceId && s.active);
  function changeBarber(id: string) {
    setBarberId(id);
    setDate("");
    setStart(null);
    setError("");
  }
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
  const daySlots = service && date ? scheduleSlots(data, date, service.duration) : [];
  useEffect(() => {
    if (serviceId && !service) {
      setStep(0);
      setError("Este serviço não está mais disponível. Escolha outro.");
    }
  }, [serviceId, service]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current || success) return;
    setError("");
    setTouched({ name: true, phone: true });
    if (!service || start === null || !date) return;
    if (!nameValid) {
      setError("Informe seu nome com pelo menos 2 letras.");
      return;
    }
    if (!phoneValid) {
      setError(
        "Informe um WhatsApp válido com DDD, por exemplo (77) 99999-1234.",
      );
      return;
    }
    submitting.current = true;
    setSaving(true);
    setSubmitFailed(false);
    try {
    requestId.current ??= existing?.id ?? crypto.randomUUID();
    const a: Appointment = {
      id: requestId.current,
      serviceId: service.id,
      serviceName: service.name,
      barberId,
      date,
      start,
      duration: service.duration,
      price: service.price,
      name: name.trim(),
      phone: phone.replace(/\D/g, ""),
      status: manual ? "confirmed" : "pending",
      source: manual ? "manual" : "client",
      created: Date.now(),
    };
      if (await book(a, existing?.id)) {
        setSuccess(
          readData().appointments.find((item) => item.id === a.id) ?? a,
        );
        toast(
          existing
            ? "Agendamento remarcado."
            : manual ? "Horário reservado com sucesso!" : "Solicitação pronta. Finalize pelo WhatsApp.",
        );
      } else {
        setError(
          "Esse horário acabou de ficar indisponível. Escolha outro horário livre.",
        );
        setStart(null);
        setStep(2);
        submitting.current = false;
      }
    } catch {
      setError("Não foi possível preparar o agendamento. Seus dados foram mantidos. Tente novamente.");
      setSubmitFailed(true);
      submitting.current = false;
    } finally {
      setSaving(false);
    }
  }
  if (success)
    return (
      <main className="booking-page container" ref={stageRef} tabIndex={-1}>
        <div className="success-card">
          <span className="success-icon">✓</span>
          <span className="eyebrow">{manual ? "ESTÁ TUDO CERTO" : "SOLICITAÇÃO PRONTA"}</span>
          <h1>
            Seu horário
            <br />
            <em>{manual ? "está reservado." : "confirme no WhatsApp."}</em>
          </h1>
          <p>{manual ? `Até breve, ${success.name.split(" ")[0]}.` : "Envie a mensagem pelo WhatsApp e aguarde a confirmação da barbearia."}</p>
          <div className="booking-summary">
            <h3>{success.serviceName}</h3>
            <p>
              {dateLabel(success.date)} · {time(success.start)}–
              {time(success.start + success.duration)}
            </p>
            <p>
              {config.barbers.find((b) => b.id === success.barberId)?.name} ·{" "}
              {money(success.price)} · {success.duration} min
            </p>
            <p>
              {success.name} · {maskPhone(success.phone)}
            </p>
          </div>
          {manual && <button className="button primary" onClick={() => calendar(success)}>
            Adicionar ao calendário ↓
          </button>}
          <a
            className={`button ${manual ? "outline" : "primary"}`}
            href={whatsapp(
              config.whatsapp,
              bookingMessage(success),
            )}
            target="_blank"
            rel="noreferrer"
          >
            Enviar solicitação no WhatsApp ↗
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
            {manual ? "Agendamento salvo neste navegador." : "A barbearia recebe seus dados quando você enviar a mensagem no WhatsApp. O horário depende da confirmação do barbeiro."}
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
            if (step === 0 && choosingProfessional) setChoosingProfessional(false);
            else if (step === 1) { setStep(0); setChoosingProfessional(true); }
            else if (step > 0) setStep(step - 1);
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
            {config.barbers.find((barber) => barber.id === barberId)?.name} · {service.name} · {service.duration} min · {money(service.price)}
          </span>
          <button onClick={() => { setStep(0); setChoosingProfessional(false); }}>Alterar serviço</button>
        </div>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <section className="booking-panel" aria-label={`Passo ${step + 1}`} ref={stageRef} tabIndex={-1}>
        {step === 0 && (
          <>
            <h2>{choosingProfessional ? "Quem vai te atender?" : "Qual é o seu ritual?"}</h2>
            <p className="muted">{choosingProfessional ? "Escolha o barbeiro e confira o valor e a duração." : "Escolha o serviço. Os valores podem variar conforme o barbeiro."}</p>
            {choosingProfessional ? (
              <div className="barber-picker" role="group" aria-label="Escolha o barbeiro">
                {config.barbers.map((barber) => {
                  const base = data.services.find((s) => s.id === serviceId);
                  const offer = base && serviceForBarber(base, barber.id);
                  return offer?.active ? (
                    <button type="button" className="barber-option" key={barber.id}
                      onClick={() => { changeBarber(barber.id); setChoosingProfessional(false); setStep(1); }}>
                      <span>{barber.name}</span>
                      <small>{offer.name} · {money(offer.price)} · {offer.duration} min</small>
                    </button>
                  ) : null;
                })}
              </div>
            ) : <div className="booking-services">
              {data.services
                .filter((s) => config.barbers.some((b) => serviceForBarber(s, b.id).active))
                .map((s) => (
                  <button
                    className={`service-option ${serviceId === s.id ? "selected" : ""}`}
                    key={s.id}
                    onClick={() => {
                      const availableBarber = config.barbers.find((b) => serviceForBarber(s, b.id).active);
                      if (availableBarber) changeBarber(availableBarber.id);
                      setServiceId(s.id);
                      setStart(null);
                      if (config.barbers.length > 1) setChoosingProfessional(true);
                      else setStep(1);
                      setError("");
                    }}
                  >
                    <img
                      src={`${import.meta.env.BASE_URL}images/${s.icon}.svg`}
                      alt=""
                    />
                    <span>
                      <strong>{s.name}</strong>
                      <small>Escolher profissional</small>
                    </span>
                    <b>A partir de {money(Math.min(...config.barbers.map((b) => serviceForBarber(s, b.id)).filter((offer) => offer.active).map((offer) => offer.price)))}</b>
                    <span aria-hidden="true">↗</span>
                  </button>
                ))}
            </div>}
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
                  onChange={(e) => changeBarber(e.target.value)}
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
              {date && dateLabel(date)} · {service.duration} minutos de atendimento
            </p>
            <div className="time-grid">
              {daySlots.map((t) => (
                <button
                  key={t}
                  className={start === t ? "selected" : ""}
                  disabled={!slots.includes(t)}
                  aria-label={`${time(t)}${slots.includes(t) ? "" : " — indisponível"}`}
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
                {config.barbers.find((barber) => barber.id === barberId)?.name} · {dateLabel(date)} · {time(start)} · {service.duration} min · {money(service.price)}
              </p>
            </div>
            <form onSubmit={submit} noValidate aria-busy={saving}>
              <label htmlFor="client-name">
                Seu nome
                <input
                  id="client-name"
                  name="name"
                  type="text"
                  minLength={2}
                  disabled={saving}
                  autoComplete="name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setTouched((v) => ({...v, name: true})); }}
                  aria-invalid={touched.name && !nameValid}
                  aria-describedby={touched.name && !nameValid ? "name-error" : undefined}
                  maxLength={80}
                  placeholder="Nome e sobrenome"
                  required
                />
              </label>
              {touched.name && !nameValid && <p className="hint" id="name-error" aria-live="polite">Informe seu nome com pelo menos 2 letras.</p>}
              <label htmlFor="client-phone">
                WhatsApp com DDD
                <input
                  id="client-phone"
                  name="tel"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  maxLength={19}
                  disabled={saving}
                  value={phone}
                  onChange={(e) => { setPhone(maskPhone(e.target.value)); setTouched((v) => ({...v, phone: true})); }}
                  aria-invalid={touched.phone && !phoneValid}
                  aria-describedby={touched.phone && !phoneValid ? "phone-error" : undefined}
                  placeholder="(77) 99999-1234"
                  required
                />
              </label>
              {touched.phone && !phoneValid && <p className="hint" id="phone-error" aria-live="polite">Informe DDD + celular com 9 dígitos. Exemplo: (62) 99815-9719.</p>}
              <p className="hint">
                {manual ? "Os dados ficam salvos neste navegador." : "Você enviará estes dados ao WhatsApp da barbearia para confirmar a disponibilidade."}
              </p>
              <button
                className="button primary wide"
                type="submit"
                disabled={saving || !formValid || !slots.includes(start)}
              >
                {saving
                  ? "Preparando…"
                  : submitFailed
                    ? "Tentar novamente"
                  : existing
                    ? "Confirmar remarcação"
                    : manual ? "Confirmar agendamento" : "Continuar para WhatsApp"}{" "}
                ↗
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
