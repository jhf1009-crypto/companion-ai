import { config } from "../config";
import { dateLabel, money, time } from "./dates";
import type { Appointment } from "../types";

export function bookingMessage(a: Appointment): string {
  const barber = config.barbers.find((b) => b.id === a.barberId)?.name ?? a.barberId;
  return [
    `Olá! Gostaria de agendar na ${config.name}.`,
    `Cliente: ${a.name}`,
    `WhatsApp: ${a.phone}`,
    `Serviço: ${a.serviceName}`,
    `Barbeiro: ${barber}`,
    `Data: ${dateLabel(a.date)} (${a.date})`,
    `Horário: ${time(a.start)}–${time(a.start + a.duration)}`,
    `Duração: ${a.duration} minutos`,
    `Valor: ${money(a.price)}`,
    `Referência: ${a.id}`,
    "Pode confirmar a disponibilidade deste horário, por favor?",
  ].join("\n");
}
