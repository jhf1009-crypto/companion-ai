import { config } from "../config";
import { addDays, dayNumber, weekday } from "./dates";
import type { Clock, Data } from "../types";
export function overlaps(
  start: number,
  end: number,
  otherStart: number,
  otherEnd: number,
): boolean {
  return start < otherEnd && end > otherStart;
}
export function isAvailable(
  data: Data,
  date: string,
  start: number,
  duration: number,
  barberId: string,
  now: Clock,
  excludeId?: string,
): boolean {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isInteger(start) ||
    !Number.isFinite(duration) ||
    duration <= 0
  )
    return false;
  if (date < now.date || date >= addDays(now.date, config.windowDays))
    return false;
  const h = data.hours[weekday(date)];
  const end = start + duration;
  if (!h || h.closed || start < h.open || end > h.close) return false;
  if (
    (dayNumber(date) - dayNumber(now.date)) * 1440 + start - now.minutes <
    config.leadMinutes
  )
    return false;
  if (
    data.lunch.enabled &&
    data.lunch.weekdays.includes(weekday(date)) &&
    overlaps(start, end, data.lunch.start, data.lunch.end)
  )
    return false;
  if (
    data.blocks.some(
      (b) =>
        b.date === date &&
        b.barberId === barberId &&
        overlaps(start, end, b.start, b.end),
    )
  )
    return false;
  return !data.appointments.some(
    (a) =>
      a.id !== excludeId &&
      a.date === date &&
      a.barberId === barberId &&
      a.status !== "cancelled" &&
      overlaps(start, end, a.start, a.start + a.duration),
  );
}
export function availableSlots(
  data: Data,
  date: string,
  duration: number,
  barberId: string,
  now: Clock,
  excludeId?: string,
): number[] {
  const h = data.hours[weekday(date)];
  if (!h || h.closed) return [];
  const slots: number[] = [];
  for (let start = h.open; start + duration <= h.close; start += config.step)
    if (isAvailable(data, date, start, duration, barberId, now, excludeId))
      slots.push(start);
  return slots;
}
