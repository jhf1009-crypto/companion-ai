import { config, initialHours, initialServices } from "../config";
import { addDays, nowClock } from "./dates";
import { availableSlots } from "./availability";
import type { Data } from "../types";
export function seed(): Data {
  const data: Data = {
    version: 1,
    services: structuredClone(initialServices),
    hours: structuredClone(initialHours),
    lunch: structuredClone(config.lunch),
    blocks: [],
    appointments: [],
  };
  const now = nowClock();
  const names = [
    "João Silva",
    "Pedro Santos",
    "Lucas Oliveira",
    "Bruno Costa",
    "Gabriel Souza",
    "André Lima",
    "Felipe Rocha",
    "Diego Alves",
    "Thiago Ribeiro",
    "Marcos Pereira",
    "Daniel Gomes",
    "Mateus Dias",
  ];
  // Historical times today populate the panel, while client bookings retain the lead rule.
  for (let offset = 0; offset < 7 && data.appointments.length < 12; offset++) {
    const date = addDays(now.date, offset);
    const perDay = offset === 0 ? 4 : 3;
    for (let n = 0; n < perDay && data.appointments.length < 12; n++) {
      const service = data.services[n % 3];
      const slots = availableSlots(
        data,
        date,
        service.duration,
        config.barbers[0].id,
        { date: now.date, minutes: -60 },
      );
      const start = slots[n * 2];
      if (start === undefined) continue;
      const i = data.appointments.length;
      data.appointments.push({
        id: `seed-${i}`,
        serviceId: service.id,
        serviceName: service.name,
        barberId: config.barbers[0].id,
        date,
        start,
        duration: service.duration,
        price: service.price,
        name: names[i],
        phone: `7700000${String(i).padStart(4, "0")}`,
        status:
          offset === 0 && start + service.duration < now.minutes
            ? "completed"
            : "confirmed",
        source: "seed",
        created: Date.now(),
      });
    }
  }
  return data;
}
