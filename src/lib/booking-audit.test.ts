import { describe, expect, it, vi } from "vitest";
import { maskPhone, validPhone, whatsapp } from "./whatsapp";
import { bookingMessage } from "./booking-message";
import { seed } from "./seed";
import { readData, STORAGE_KEY, validData } from "./storage";
import { isAvailable, scheduleSlots } from "./availability";
import type { Appointment } from "../types";

const request: Appointment = {
  id: "request-test", serviceId: "degrade", serviceName: "Degradê",
  barberId: "enzo", date: "2026-10-15", start: 540, duration: 30,
  price: 45, name: "Teste local", phone: "62999990000", status: "pending",
  source: "client", created: 1,
};

describe("Auditoria do agendamento", () => {
  it("formata celular brasileiro e aceita colagem com código do país", () => {
    expect(maskPhone("62998159719")).toBe("(62) 99815-9719");
    expect(maskPhone("+55 (62) 99815-9719")).toBe("(62) 99815-9719");
    expect(validPhone("(62) 99815-9719")).toBe(true);
    for (const value of ["", "6299815", "(62) 3981-9719", "(00) 99815-9719"]) {
      expect(validPhone(value)).toBe(false);
    }
  });
  it("não confunde o DDD 55 com o código de país", () => {
    expect(whatsapp("55999990000")).toBe("https://wa.me/5555999990000");
    expect(whatsapp("5562998159719")).toBe("https://wa.me/5562998159719");
  });
  it("preenche o WhatsApp do dono com todos os dados sem afirmar confirmação", () => {
    const message = bookingMessage(request);
    expect(message).toContain("Barbeiro: Enzo");
    expect(message).toContain("Serviço: Degradê");
    expect(message).toContain("2026-10-15");
    expect(message).toContain("09:00–09:30");
    expect(message).toContain("30 minutos");
    expect(message).toContain("45,00");
    const url = new URL(whatsapp("5562998159719", message));
    expect(url.pathname).toBe("/5562998159719");
    expect(url.searchParams.get("text")).toBe(message);
    expect(message).not.toContain("foi confirmado");
  });
  it("começa sem clientes fictícios e remove apenas as reservas de demonstração", () => {
    const d = seed();
    expect(d.appointments).toEqual([]);
    d.appointments = [{...request, id: "seed-1", source: "seed"}, request];
    vi.stubGlobal("localStorage", {getItem: (key: string) => key === STORAGE_KEY ? JSON.stringify(d) : null});
    try {
      expect(readData().appointments).toEqual([request]);
      expect(readData().services).toEqual(d.services);
    } finally { vi.unstubAllGlobals(); }
  });
  it("bloqueia solicitações pendentes no mesmo barbeiro, mas libera o outro", () => {
    const d = seed();
    d.appointments = [request];
    const now = {date: "2026-10-14", minutes: 600};
    expect(isAvailable(d, request.date, 540, 30, "enzo", now)).toBe(false);
    expect(isAvailable(d, request.date, 540, 30, "luiz", now)).toBe(true);
    expect(scheduleSlots(d, request.date, 30)).toContain(540);
    expect(validData(d)).toBe(true);
  });
  it("rejeita datas inexistentes e dados locais malformados sem lançar erro", () => {
    expect(isAvailable(seed(), "2026-02-31", 540, 30, "enzo", {date: "2026-02-01", minutes: 600})).toBe(false);
    const malformed = {...seed(), services: [null]};
    expect(validData(malformed)).toBe(false);
  });
});
