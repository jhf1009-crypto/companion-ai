import { describe, expect, it } from "vitest";
import { config, initialHours, initialServices, servicePrice } from "../config";
import { availableSlots } from "./availability";
import { serviceForBarber, updateBarberService } from "./services";
import { validData, readData, saveData } from "./storage";
import type { Data, ServiceSettings } from "../types";
import { vi } from "vitest";

const degrade = initialServices[0];
const settings: ServiceSettings = {
  name: "Degradê na navalha", price: 47.5, duration: 60, active: true,
};
const data = (): Data => ({
  version: 1,
  services: structuredClone(initialServices),
  appointments: [], blocks: [],
  hours: structuredClone(initialHours), lunch: structuredClone(config.lunch),
});

describe("Configurações individuais por barbeiro", () => {
  it("mantém todos os preços oficiais sem configurações novas", () => {
    expect(initialServices.map((s) => servicePrice(s, "luiz"))).toEqual([35, 20, 10, 35, 30, 20, 10, 25]);
    expect(initialServices.map((s) => servicePrice(s, "enzo"))).toEqual([45, 20, 10, 40, 35, 20, 10, 25]);
  });

  it("editar Enzo não altera Luiz nem os dados base do serviço", () => {
    const edited = updateBarberService(degrade, "enzo", settings);
    expect(serviceForBarber(edited, "enzo")).toMatchObject(settings);
    expect(serviceForBarber(edited, "luiz")).toMatchObject({name: "Degradê", price: 35, duration: 30, active: true});
    expect(degrade).not.toHaveProperty("barberSettings");
  });

  it("salvar Luiz depois de Enzo preserva as duas tabelas", () => {
    const enzo = updateBarberService(degrade, "enzo", settings);
    const luiz = updateBarberService(enzo, "luiz", {name: "Degradê clássico", price: 0, duration: 45, active: false});
    expect(serviceForBarber(luiz, "enzo")).toMatchObject(settings);
    expect(serviceForBarber(luiz, "luiz")).toMatchObject({name: "Degradê clássico", price: 0, duration: 45, active: false});
    expect(servicePrice(luiz, "enzo")).toBe(47.5);
  });

  it("usa a duração específica ao oferecer horários", () => {
    const edited = updateBarberService(degrade, "enzo", settings);
    const d = data();
    const now = { date: "2026-10-09", minutes: 480 };
    const date = "2026-10-10";
    expect(availableSlots(d, date, serviceForBarber(edited, "enzo").duration, "enzo", now)).not.toContain(1170);
    expect(availableSlots(d, date, serviceForBarber(edited, "luiz").duration, "luiz", now)).toContain(1170);
  });

  it("recarrega configurações sem apagar outras reservas ou dados antigos", () => {
    const d = data();
    expect(validData(d)).toBe(true);
    d.services[0] = updateBarberService(degrade, "enzo", settings);
    let saved = "";
    vi.stubGlobal("localStorage", {
      setItem: (_key: string, value: string) => { saved = value; },
      getItem: () => saved,
    });
    try {
      saveData(d);
      const loaded = readData();
      expect(validData(loaded)).toBe(true);
      expect(serviceForBarber(loaded.services[0], "enzo")).toMatchObject(settings);
      expect(loaded).toEqual(d);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("rejeita configurações salvas com preço ou duração inválidos", () => {
    const d = data();
    d.services[0] = updateBarberService(degrade, "enzo", {...settings, price: -1});
    expect(validData(d)).toBe(false);
    d.services[0] = updateBarberService(degrade, "enzo", {...settings, duration: 0});
    expect(validData(d)).toBe(false);
  });
});
