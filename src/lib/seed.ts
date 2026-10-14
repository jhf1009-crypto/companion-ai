import { config, initialHours, initialServices } from "../config";
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
  return data;
}
