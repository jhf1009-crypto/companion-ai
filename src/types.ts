export type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  active: boolean;
  featured?: boolean;
  icon: string;
};
export type Hours = { open: number; close: number; closed: boolean };
export type Appointment = {
  id: string;
  serviceId: string;
  serviceName: string;
  barberId: string;
  date: string;
  start: number;
  duration: number;
  price: number;
  name: string;
  phone: string;
  status: "confirmed" | "completed" | "cancelled" | "absent";
  source: "client" | "manual" | "seed";
  created: number;
};
export type Block = {
  id: string;
  date: string;
  start: number;
  end: number;
  barberId: string;
  label: string;
};
export type Data = {
  version: 1;
  services: Service[];
  appointments: Appointment[];
  blocks: Block[];
  hours: Hours[];
  lunch: { enabled: boolean; start: number; end: number; weekdays: number[] };
};
export type Clock = { date: string; minutes: number };
