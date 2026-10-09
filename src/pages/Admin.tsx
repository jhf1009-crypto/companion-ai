import { useEffect, useRef, useState, type FormEvent } from "react";
import { config } from "../config";
import {
  addDays,
  dateLabel,
  fromTime,
  money,
  nowClock,
  time,
  weekday,
} from "../lib/dates";
import { overlaps } from "../lib/availability";
import { whatsapp } from "../lib/whatsapp";
import { useStore } from "../state/store";
import { Booking } from "./Booking";
import type { Appointment, Service } from "../types";
const statuses = {
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  absent: "Faltou",
};
export function Admin() {
  const { data, update, toast, newIds, clearNew } = useStore();
  const [logged, setLogged] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [view, setView] = useState<"day" | "week">("day");
  const [date, setDate] = useState(nowClock().date);
  const [tab, setTab] = useState<"agenda" | "blocks" | "services" | "hours">(
    "agenda",
  );
  const [booking, setBooking] = useState<Appointment | true | null>(null);
  const [sound, setSound] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const seen = useRef(0);
  const [blockDate, setBlockDate] = useState(nowClock().date);
  const [blockStart, setBlockStart] = useState("15:00");
  const [blockEnd, setBlockEnd] = useState("16:00");
  const [allDay, setAllDay] = useState(false);
  const [blockBarber, setBlockBarber] = useState(config.barbers[0].id);
  useEffect(() => {
    if (logged && sound && newIds.length > seen.current && audio.current) {
      try {
        const ctx = audio.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 740;
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } catch {
        /* visual notification remains */
      }
    }
    seen.current = newIds.length;
  }, [newIds.length, logged, sound]);
  useEffect(() => {
    if (!newIds.length) return;
    const timer = setTimeout(clearNew, 20000);
    return () => clearTimeout(timer);
  }, [newIds.length, clearNew]);
  useEffect(
    () => () => {
      void audio.current?.close();
    },
    [],
  );
  if (!logged)
    return (
      <main className="container login-page">
        <div className="login-card">
          <span className="eyebrow">BASTIDORES DO BOM CORTE</span>
          <h1>
            A sua agenda.
            <br />
            <em>Sem interrupções.</em>
          </h1>
          <p>Entre no painel do barbeiro.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (pin === config.pin) {
                setLogged(true);
                setError("");
              } else
                setError(
                  "PIN incorreto. Use 1234 para explorar a demonstração.",
                );
            }}
          >
            <label htmlFor="pin">
              PIN de acesso
              <input
                id="pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                autoComplete="off"
              />
            </label>
            <p className="hint">
              Demonstração · PIN: <strong>1234</strong>
            </p>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary wide">Entrar no painel ↗</button>
          </form>
          <a className="button ghost" href="#/">
            ← Voltar ao site
          </a>
          <small>Acesso demonstrativo. Não use dados pessoais reais.</small>
        </div>
      </main>
    );
  if (booking)
    return (
      <Booking
        manual
        existing={booking === true ? undefined : booking}
        onClose={() => setBooking(null)}
      />
    );
  const days =
    view === "week"
      ? Array.from({ length: 7 }, (_, i) => addDays(date, i))
      : [date];
  const appointments = data.appointments
    .filter((a) => days.includes(a.date))
    .sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start);
  const active = appointments.filter(
    (a) => a.status !== "cancelled" && a.status !== "absent",
  );
  function status(a: Appointment, next: Appointment["status"]) {
    update((d) => ({
      ...d,
      appointments: d.appointments.map((item) =>
        item.id === a.id ? { ...item, status: next } : item,
      ),
    }));
    toast(
      next === "cancelled"
        ? "Agendamento cancelado. Horário liberado."
        : "Atendimento atualizado.",
    );
  }
  function block(event: FormEvent) {
    event.preventDefault();
    const start = allDay ? 0 : fromTime(blockStart),
      end = allDay ? 1440 : fromTime(blockEnd);
    if (
      !blockDate ||
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      end <= start
    ) {
      toast("Informe um intervalo válido.");
      return;
    }
    let conflict = false;
    update((d) => {
      if (
        d.appointments.some(
          (a) =>
            a.date === blockDate &&
            a.barberId === blockBarber &&
            a.status !== "cancelled" &&
            overlaps(start, end, a.start, a.start + a.duration),
        )
      ) {
        conflict = true;
        return d;
      }
      return {
        ...d,
        blocks: [
          ...d.blocks,
          {
            id: crypto.randomUUID(),
            date: blockDate,
            start,
            end,
            barberId: blockBarber,
            label: allDay ? "Dia de folga" : "Intervalo bloqueado",
          },
        ],
      };
    });
    toast(
      conflict
        ? "Há atendimento nesse intervalo. Remarque ou cancele antes de bloquear."
        : "Bloqueio criado. A grade do cliente já foi atualizada.",
    );
  }
  return (
    <main className="container admin-page">
      <div className="admin-heading">
        <div>
          <span className="eyebrow">PAINEL DO BARBEIRO · DEMO</span>
          <h1>
            O dia nas <em>suas mãos.</em>
          </h1>
        </div>
        <div className="actions">
          <button
            className="button outline"
            onClick={() => {
              if (!sound) {
                try {
                  audio.current ??= new AudioContext();
                  void audio.current.resume();
                  setSound(true);
                } catch {
                  toast("Som indisponível neste navegador.");
                }
              } else setSound(false);
            }}
          >
            {sound ? "Silenciar som" : "Ativar som"}
          </button>
          <button className="button ghost" onClick={() => setLogged(false)}>
            Sair
          </button>
        </div>
      </div>
      <div
        className="admin-tabs"
        role="navigation"
        aria-label="Seções do painel"
      >
        {(
          [
            ["agenda", "Agenda"],
            ["blocks", "Bloqueios"],
            ["services", "Serviços"],
            ["hours", "Expediente"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            className={tab === key ? "selected" : ""}
            onClick={() => setTab(key)}
          >
            {label}
            {key === "agenda" && newIds.length > 0 && (
              <span className="count">{newIds.length}</span>
            )}
          </button>
        ))}
      </div>
      {tab === "agenda" && (
        <>
          <div className="admin-toolbar">
            <div className="segmented">
              <button
                className={view === "day" ? "selected" : ""}
                onClick={() => {
                  setView("day");
                  setDate(nowClock().date);
                }}
              >
                Hoje
              </button>
              <button
                className={view === "week" ? "selected" : ""}
                onClick={() => setView("week")}
              >
                Semana
              </button>
            </div>
            <div className="date-navigation">
              <button
                aria-label="Dia anterior"
                onClick={() =>
                  setDate(addDays(date, view === "week" ? -7 : -1))
                }
              >
                ←
              </button>
              <label className="sr-only" htmlFor="agenda-date">
                Dia da agenda
              </label>
              <input
                id="agenda-date"
                type="date"
                value={date}
                onChange={(e) => {
                  if (e.target.value) setDate(e.target.value);
                }}
              />
              <button
                aria-label="Próximo dia"
                onClick={() => setDate(addDays(date, view === "week" ? 7 : 1))}
              >
                →
              </button>
            </div>
            <button className="button primary" onClick={() => setBooking(true)}>
              + Agendamento manual
            </button>
          </div>
          <div className="stats">
            <article>
              <small>
                ATENDIMENTOS {view === "week" ? "NA SEMANA" : "DO DIA"}
              </small>
              <strong>{active.length}</strong>
            </article>
            <article>
              <small>FATURAMENTO PREVISTO</small>
              <strong>{money(active.reduce((n, a) => n + a.price, 0))}</strong>
            </article>
            <article>
              <small>REALIZADO</small>
              <strong>
                {money(
                  appointments
                    .filter((a) => a.status === "completed")
                    .reduce((n, a) => n + a.price, 0),
                )}
              </strong>
            </article>
          </div>
          {newIds.length > 0 && (
            <div className="new-banner" role="status">
              <span>
                {newIds.length} novo(s) agendamento(s) recebido(s) do site.
              </span>
              <button onClick={clearNew}>Marcar como vistos</button>
            </div>
          )}
          {days.map((day) => (
            <section className="agenda-day" key={day}>
              <h2>
                {dateLabel(day)}{" "}
                <span>
                  {data.hours[weekday(day)].closed ? "· Fechado" : ""}
                </span>
              </h2>
              {appointments
                .filter((a) => a.date === day)
                .map((a) => (
                  <article
                    className={`appointment ${newIds.includes(a.id) ? "new" : ""} ${a.status === "cancelled" ? "cancelled" : ""}`}
                    key={a.id}
                  >
                    <div className="appointment-time">
                      <strong>{time(a.start)}</strong>
                      <small>até {time(a.start + a.duration)}</small>
                    </div>
                    <div className="appointment-info">
                      <h3>{a.name}</h3>
                      <p>
                        {a.serviceName} · {money(a.price)}
                      </p>
                      <small>
                        {a.phone} ·{" "}
                        {config.barbers.find((b) => b.id === a.barberId)?.name}
                      </small>
                      <span className={`status status-${a.status}`}>
                        {statuses[a.status]}
                      </span>
                    </div>
                    <div className="appointment-actions">
                      {a.status === "confirmed" && (
                        <>
                          <button onClick={() => status(a, "completed")}>
                            ✓ Concluir
                          </button>
                          <button onClick={() => status(a, "absent")}>
                            Faltou
                          </button>
                          <button onClick={() => setBooking(a)}>
                            Remarcar
                          </button>
                          <button
                            className="danger"
                            onClick={() => status(a, "cancelled")}
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                      <a
                        href={whatsapp(
                          a.phone,
                          `Olá, ${a.name}! Aqui é da ${config.name}.`,
                        )}
                        target="_blank"
                        rel="noreferrer"
                      >
                        WhatsApp ↗
                      </a>
                      <a href={`tel:+55${a.phone}`}>Ligar ↗</a>
                    </div>
                  </article>
                ))}
              {appointments.filter((a) => a.date === day).length === 0 && (
                <div className="empty">
                  Um espaço livre para bons cortes. Nenhum agendamento neste
                  dia.
                </div>
              )}
            </section>
          ))}
        </>
      )}
      {tab === "blocks" && (
        <section className="admin-panel">
          <h2>Reserve tempo para você.</h2>
          <p className="muted">
            Bloqueios aparecem imediatamente na disponibilidade do cliente.
          </p>
          <form onSubmit={block} className="form-grid">
            <label>
              Dia
              <input
                type="date"
                value={blockDate}
                onChange={(e) => setBlockDate(e.target.value)}
                required
              />
            </label>
            <label>
              Profissional
              <select
                value={blockBarber}
                onChange={(e) => setBlockBarber(e.target.value)}
              >
                {config.barbers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
              />{" "}
              Bloquear o dia inteiro
            </label>
            {!allDay && (
              <>
                <label>
                  Início
                  <input
                    type="time"
                    value={blockStart}
                    onChange={(e) => setBlockStart(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Fim
                  <input
                    type="time"
                    value={blockEnd}
                    onChange={(e) => setBlockEnd(e.target.value)}
                    required
                  />
                </label>
              </>
            )}
            <button className="button primary">Criar bloqueio</button>
          </form>
          <div className="block-list">
            {data.blocks.map((b) => (
              <div key={b.id}>
                <span>
                  {dateLabel(b.date, true)} · {b.label} · {time(b.start)}–
                  {b.end === 1440 ? "24:00" : time(b.end)}
                </span>
                <button
                  className="button ghost"
                  onClick={() => {
                    update((d) => ({
                      ...d,
                      blocks: d.blocks.filter((item) => item.id !== b.id),
                    }));
                    toast("Bloqueio removido.");
                  }}
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
          <LunchEditor />
        </section>
      )}
      {tab === "services" && (
        <section className="admin-panel">
          <h2>Seu menu de cuidados.</h2>
          <p className="muted">
            Alterações valem para as próximas reservas; agendamentos existentes
            mantêm o valor e a duração reservados.
          </p>
          {data.services.map((service) => (
            <ServiceEditor key={service.id} service={service} />
          ))}
          <button
            className="button primary"
            onClick={() =>
              update((d) => ({
                ...d,
                services: [
                  ...d.services,
                  {
                    id: crypto.randomUUID(),
                    name: "Novo serviço",
                    description: "Um cuidado especial.",
                    price: 40,
                    duration: 30,
                    active: false,
                    icon: "scissors",
                  },
                ],
              }))
            }
          >
            + Criar serviço
          </button>
        </section>
      )}
      {tab === "hours" && (
        <section className="admin-panel">
          <h2>O ritmo da sua semana.</h2>
          <p className="muted">
            Mudanças que conflitam com reservas existentes são impedidas.
            Remarque ou cancele essas reservas primeiro.
          </p>
          <HoursEditor />
          <LunchEditor />
        </section>
      )}
    </main>
  );
}
function ServiceEditor({ service }: { service: Service }) {
  const { update, toast } = useStore();
  const [draft, setDraft] = useState(service);
  useEffect(() => setDraft(service), [service]);
  return (
    <form
      className="service-editor"
      onSubmit={(e) => {
        e.preventDefault();
        if (
          !draft.name.trim() ||
          draft.price < 0 ||
          !Number.isFinite(draft.price) ||
          !Number.isInteger(draft.duration) ||
          draft.duration < 5 ||
          draft.duration > 600
        ) {
          toast("Informe nome, preço válido e duração de 5 a 600 minutos.");
          return;
        }
        update((d) => ({
          ...d,
          services: d.services.map((s) =>
            s.id === draft.id ? { ...draft, name: draft.name.trim() } : s,
          ),
        }));
        toast("Serviço atualizado.");
      }}
    >
      <label>
        Nome
        <input
          value={draft.name}
          required
          maxLength={70}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
      </label>
      <label>
        Preço (R$)
        <input
          type="number"
          min="0"
          step="0.01"
          value={draft.price}
          onChange={(e) =>
            setDraft({ ...draft, price: Number(e.target.value) })
          }
        />
      </label>
      <label>
        Duração (min)
        <input
          type="number"
          min="5"
          max="600"
          value={draft.duration}
          onChange={(e) =>
            setDraft({ ...draft, duration: Number(e.target.value) })
          }
        />
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={draft.active}
          onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
        />{" "}
        Ativo
      </label>
      <button className="button outline">Salvar serviço</button>
    </form>
  );
}
function HoursEditor() {
  const { data, update, toast } = useStore();
  const [draft, setDraft] = useState(data.hours);
  useEffect(() => setDraft(data.hours), [data.hours]);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (draft.some((h) => !h.closed && h.open >= h.close)) {
          toast("O fechamento deve ser depois da abertura.");
          return;
        }
        let conflict = false;
        update((d) => {
          if (
            d.appointments.some(
              (a) =>
                a.status !== "cancelled" &&
                a.date >= nowClock().date &&
                (draft[weekday(a.date)].closed ||
                  a.start < draft[weekday(a.date)].open ||
                  a.start + a.duration > draft[weekday(a.date)].close),
            )
          ) {
            conflict = true;
            return d;
          }
          return { ...d, hours: draft };
        });
        toast(
          conflict
            ? "Há reservas fora do novo expediente. Remarque ou cancele antes."
            : "Expediente atualizado.",
        );
      }}
    >
      {draft.map((h, i) => (
        <div className="hours-editor" key={i}>
          <strong>
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
          </strong>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={h.closed}
              onChange={(e) =>
                setDraft(
                  draft.map((v, j) =>
                    j === i ? { ...v, closed: e.target.checked } : v,
                  ),
                )
              }
            />{" "}
            Fechado
          </label>
          <label>
            Abertura
            <input
              type="time"
              disabled={h.closed}
              value={time(h.open)}
              onChange={(e) =>
                setDraft(
                  draft.map((v, j) =>
                    j === i ? { ...v, open: fromTime(e.target.value) } : v,
                  ),
                )
              }
              required={!h.closed}
            />
          </label>
          <label>
            Fechamento
            <input
              type="time"
              disabled={h.closed}
              value={time(h.close)}
              onChange={(e) =>
                setDraft(
                  draft.map((v, j) =>
                    j === i ? { ...v, close: fromTime(e.target.value) } : v,
                  ),
                )
              }
              required={!h.closed}
            />
          </label>
        </div>
      ))}
      <button className="button primary">Salvar expediente</button>
    </form>
  );
}
function LunchEditor() {
  const { data, update, toast } = useStore();
  const [lunch, setLunch] = useState(data.lunch);
  useEffect(() => setLunch(data.lunch), [data.lunch]);
  return (
    <form
      className="lunch-editor"
      onSubmit={(e) => {
        e.preventDefault();
        if (lunch.start >= lunch.end) {
          toast("Intervalo de almoço inválido.");
          return;
        }
        let conflict = false;
        update((d) => {
          if (
            lunch.enabled &&
            d.appointments.some(
              (a) =>
                a.status !== "cancelled" &&
                a.date >= nowClock().date &&
                lunch.weekdays.includes(weekday(a.date)) &&
                overlaps(a.start, a.start + a.duration, lunch.start, lunch.end),
            )
          ) {
            conflict = true;
            return d;
          }
          return { ...d, lunch };
        });
        toast(
          conflict
            ? "Há reservas no novo almoço. Remarque ou cancele antes."
            : "Almoço recorrente atualizado.",
        );
      }}
    >
      <h3>Uma pausa no seu dia.</h3>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={lunch.enabled}
          onChange={(e) => setLunch({ ...lunch, enabled: e.target.checked })}
        />{" "}
        Bloquear almoço recorrente
      </label>
      <div className="form-grid">
        <label>
          Início
          <input
            type="time"
            value={time(lunch.start)}
            onChange={(e) =>
              setLunch({ ...lunch, start: fromTime(e.target.value) })
            }
            required
          />
        </label>
        <label>
          Fim
          <input
            type="time"
            value={time(lunch.end)}
            onChange={(e) =>
              setLunch({ ...lunch, end: fromTime(e.target.value) })
            }
            required
          />
        </label>
      </div>
      <div className="weekday-checks">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day, i) => (
          <label className="checkbox" key={day}>
            <input
              type="checkbox"
              checked={lunch.weekdays.includes(i)}
              onChange={(e) =>
                setLunch({
                  ...lunch,
                  weekdays: e.target.checked
                    ? [...lunch.weekdays, i]
                    : lunch.weekdays.filter((d) => d !== i),
                })
              }
            />
            {day}
          </label>
        ))}
      </div>
      <button className="button outline">Salvar almoço</button>
    </form>
  );
}
