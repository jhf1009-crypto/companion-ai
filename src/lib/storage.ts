import type { Data } from "../types";
import { seed } from "./seed";
export const STORAGE_KEY = "barbearia-demo-v1";
let memory: Data | undefined;
let failed = false;
export function storageFailed(): boolean {
  return failed;
}
export function validData(value: unknown): value is Data {
  if (!value || typeof value !== "object") return false;
  const d = value as Data;
  return (
    d.version === 1 &&
    Array.isArray(d.services) &&
    d.services.every(
      (s) =>
        typeof s.id === "string" &&
        typeof s.name === "string" &&
        Number.isFinite(s.price) &&
        s.price >= 0 &&
        Number.isFinite(s.duration) &&
        s.duration > 0 &&
        typeof s.active === "boolean",
    ) &&
    Array.isArray(d.appointments) &&
    d.appointments.every(
      (a) =>
        typeof a.id === "string" &&
        typeof a.date === "string" &&
        typeof a.name === "string" &&
        typeof a.phone === "string" &&
        Number.isFinite(a.start) &&
        Number.isFinite(a.duration) &&
        Number.isFinite(a.price) &&
        ["confirmed", "completed", "cancelled", "absent"].includes(a.status),
    ) &&
    Array.isArray(d.blocks) &&
    d.blocks.every(
      (b) =>
        typeof b.date === "string" &&
        Number.isFinite(b.start) &&
        Number.isFinite(b.end),
    ) &&
    Array.isArray(d.hours) &&
    d.hours.length === 7 &&
    d.hours.every(
      (h) =>
        Number.isFinite(h.open) &&
        Number.isFinite(h.close) &&
        typeof h.closed === "boolean",
    ) &&
    !!d.lunch &&
    typeof d.lunch.enabled === "boolean" &&
    Number.isFinite(d.lunch.start) &&
    Number.isFinite(d.lunch.end) &&
    Array.isArray(d.lunch.weekdays)
  );
}
export function readData(): Data {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const value: unknown = JSON.parse(raw);
      if (validData(value)) {
        memory = value;
        return value;
      }
    }
  } catch {
    failed = true;
  }
  if (!memory) memory = seed();
  return memory;
}
export function saveData(data: Data): void {
  memory = data;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    failed = true;
  }
}
