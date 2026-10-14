import type { Service, ServiceSettings } from "../types";

// Older browsers have only priceByBarber. Resolve both formats without
// resetting saved services, appointments or other local settings.
export function serviceForBarber(service: Service, barberId: string): Service {
  return {
    ...service,
    price: service.priceByBarber?.[barberId] ?? service.price,
    ...service.barberSettings?.[barberId],
  };
}

export function updateBarberService(
  service: Service,
  barberId: string,
  settings: ServiceSettings,
): Service {
  return {
    ...service,
    priceByBarber: { ...service.priceByBarber, [barberId]: settings.price },
    barberSettings: { ...service.barberSettings, [barberId]: { ...settings } },
  };
}
