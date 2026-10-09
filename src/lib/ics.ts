import type { Appointment } from "../types";
import { config } from "../config";
import { time } from "./dates";
const escape = (s: string) =>
  s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
export function calendar(a: Appointment): void {
  const stamp = (min: number) =>
    a.date.replace(/-/g, "") + "T" + time(min).replace(":", "") + "00";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Barbearia Exclusiva//Agenda Demo//PT",
    "BEGIN:VTIMEZONE",
    "TZID:America/Bahia",
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:-0300",
    "TZOFFSETTO:-0300",
    "TZNAME:BRT",
    "END:STANDARD",
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    `UID:${a.id}@barbearia-demo`,
    `DTSTAMP:${new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "")}`,
    `DTSTART;TZID=${config.timezone}:${stamp(a.start)}`,
    `DTEND;TZID=${config.timezone}:${stamp(a.start + a.duration)}`,
    `SUMMARY:${escape(a.serviceName + " — " + config.name)}`,
    `LOCATION:${escape(config.address + ", " + config.city)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const url = URL.createObjectURL(
    new Blob([lines.join("\r\n") + "\r\n"], {
      type: "text/calendar;charset=utf-8",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "agendamento.ics";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
