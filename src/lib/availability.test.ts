import { describe, expect, it } from "vitest";
import { availableSlots, isAvailable } from "./availability";
import { config, initialHours, initialServices } from "../config";
import type { Appointment, Data } from "../types";
const now = { date: "2026-10-09", minutes: 480 };
const date = "2026-10-10";
const barber = "rafael";
function data(): Data {
  return {
    version: 1,
    services: structuredClone(initialServices),
    hours: structuredClone(initialHours),
    lunch: structuredClone(config.lunch),
    appointments: [],
    blocks: [],
  };
}
function appointment(extra: Partial<Appointment> = {}): Appointment {
  return {
    id: "a",
    serviceId: "corte",
    serviceName: "Corte",
    date,
    start: 600,
    duration: 30,
    barberId: barber,
    name: "João",
    phone: "77999991234",
    price: 50,
    status: "confirmed",
    source: "client",
    created: 1,
    ...extra,
  };
}
describe("Disponibilidade da agenda", () => {
  it("gera grade livre a cada 30 minutos", () => {
    const slots = availableSlots(data(), date, 30, barber, now);
    expect(slots[0]).toBe(540);
    expect(slots.at(-1)).toBe(1170);
    expect(slots.length).toBe(22);
  });
  it("impede horário duplicado e sobreposto", () => {
    const d = data();
    d.appointments = [appointment()];
    expect(isAvailable(d, date, 600, 30, barber, now)).toBe(false);
    expect(isAvailable(d, date, 570, 60, barber, now)).toBe(false);
    expect(isAvailable(d, date, 630, 30, barber, now)).toBe(true);
  });
  it("permite encostar exatamente no limite de outra reserva", () => {
    const d = data();
    d.appointments = [appointment()];
    expect(isAvailable(d, date, 570, 30, barber, now)).toBe(true);
  });
  it("duração longa não cruza almoço nem fechamento", () => {
    const d = data();
    expect(isAvailable(d, now.date, 690, 60, barber, now)).toBe(false);
    expect(isAvailable(d, now.date, 600, 60, barber, now)).toBe(true);
    expect(isAvailable(d, date, 1170, 60, barber, now)).toBe(false);
    expect(isAvailable(d, date, 1140, 60, barber, now)).toBe(true);
  });
  it("bloqueio avulso remove início e sobreposição parcial", () => {
    const d = data();
    d.blocks = [
      { id: "b", date, start: 900, end: 960, barberId: barber, label: "Pausa" },
    ];
    expect(isAvailable(d, date, 900, 30, barber, now)).toBe(false);
    expect(isAvailable(d, date, 870, 60, barber, now)).toBe(false);
    expect(isAvailable(d, date, 960, 30, barber, now)).toBe(true);
  });
  it("dia fechado não oferece horários", () => {
    expect(availableSlots(data(), "2026-10-11", 30, barber, now)).toEqual([]);
  });
  it("cancelamento libera horário, demais estados o conservam", () => {
    const d = data();
    d.appointments = [appointment({ status: "cancelled" })];
    expect(isAvailable(d, date, 600, 30, barber, now)).toBe(true);
    for (const status of ["confirmed", "completed", "absent"] as const) {
      d.appointments = [appointment({ status })];
      expect(isAvailable(d, date, 600, 30, barber, now)).toBe(false);
    }
  });
  it("respeita antecedência mínima inclusive no limite", () => {
    const late = { date: now.date, minutes: 560 };
    expect(isAvailable(data(), now.date, 600, 30, barber, late)).toBe(false);
    expect(isAvailable(data(), now.date, 620, 30, barber, late)).toBe(true);
  });
  it("calcula antecedência corretamente na virada do dia", () => {
    const d = data();
    d.hours[6] = { open: 0, close: 1200, closed: false };
    expect(
      isAvailable(d, date, 0, 30, barber, { date: now.date, minutes: 1410 }),
    ).toBe(false);
    expect(
      isAvailable(d, date, 30, 30, barber, { date: now.date, minutes: 1410 }),
    ).toBe(true);
  });
  it("respeita a janela de 30 dias e rejeita passado", () => {
    expect(isAvailable(data(), "2026-10-08", 600, 30, barber, now)).toBe(false);
    expect(isAvailable(data(), "2026-11-07", 600, 30, barber, now)).toBe(true);
    expect(isAvailable(data(), "2026-11-08", 600, 30, barber, now)).toBe(false);
  });
  it("remarcação ignora somente a própria reserva", () => {
    const d = data();
    d.appointments = [appointment(), appointment({ id: "b", start: 660 })];
    expect(isAvailable(d, date, 600, 30, barber, now, "a")).toBe(true);
    expect(isAvailable(d, date, 660, 30, barber, now, "a")).toBe(false);
  });
  it("reservas de outro profissional não bloqueiam", () => {
    const d = data();
    d.appointments = [appointment({ barberId: "outro" })];
    expect(isAvailable(d, date, 600, 30, barber, now)).toBe(true);
  });
  it("dia inteiro de folga remove todas as vagas", () => {
    const d = data();
    d.blocks = [
      { id: "b", date, start: 0, end: 1440, barberId: barber, label: "Folga" },
    ];
    expect(availableSlots(d, date, 30, barber, now)).toEqual([]);
  });
  it("revalidação detecta reserva gravada depois de mostrar a grade", () => {
    const d = data();
    expect(availableSlots(d, date, 30, barber, now)).toContain(600);
    d.appointments.push(appointment());
    expect(isAvailable(d, date, 600, 30, barber, now)).toBe(false);
  });
  it("serviços de 45 e 75 minutos exigem toda a duração livre", () => {
    const d = data();
    d.appointments = [appointment({ start: 660 })];
    expect(isAvailable(d, date, 630, 45, barber, now)).toBe(false);
    expect(isAvailable(d, date, 570, 75, barber, now)).toBe(true);
  });
});
