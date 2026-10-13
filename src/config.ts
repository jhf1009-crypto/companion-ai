import type { Service, Hours } from "./types";

export function servicePrice(service: Service, barberId: string) {
  return service.priceByBarber?.[barberId] ?? service.price;
}
export const config = {
  name: "Barbearia do Enzo",
  slogan: "Seu estilo, nossa paixão.",
  description:
    "Mais que um corte, uma experiência. Estilo, atitude e qualidade em cada detalhe.",
  address: "Rua das Estrelas, 123",
  city: "São Paulo – SP",
  whatsapp: "5562998159719",
  instagram: "barbeariadoenzo",
  timezone: "America/Bahia",
  pin: "1234",
  step: 30,
  leadMinutes: 60,
  windowDays: 30,
  colors: {
    background: "#0b0b0b",
    surface: "#161616",
    accent: "#c6a15b",
    text: "#f5f5f2",
    muted: "#a6a6a0",
    border: "#ffffff1f",
  },
  barbers: [
    { id: "luiz", name: "Luiz", image: "images/barber.svg" },
    { id: "enzo", name: "Enzo", image: "images/barber.svg" },
  ],
  lunch: { enabled: true, start: 690, end: 810, weekdays: [1, 2, 3, 4, 5] },
};
export const initialHours: Hours[] = Array.from({ length: 7 }, (_, day) => ({
  open: 540,
  close: 1200,
  closed: day === 0,
}));
export const initialServices: Service[] = [
  { id: "degrade", name: "Degradê", description: "Atendimento cuidadoso e acabamento preciso.", price: 35, priceByBarber: { luiz: 35, enzo: 45 }, duration: 30, active: true, icon: "scissors" },
  { id: "barba", name: "Barba", description: "Atendimento cuidadoso e acabamento preciso.", price: 20, priceByBarber: { luiz: 20, enzo: 20 }, duration: 30, active: true, icon: "razor" },
  { id: "pezinho", name: "Pezinho", description: "Atendimento cuidadoso e acabamento preciso.", price: 10, priceByBarber: { luiz: 10, enzo: 10 }, duration: 30, active: true, icon: "scissors" },
  { id: "social-tesoura", name: "Social na tesoura", description: "Atendimento cuidadoso e acabamento preciso.", price: 35, priceByBarber: { luiz: 35, enzo: 40 }, duration: 30, active: true, icon: "scissors" },
  { id: "corte-social", name: "Corte social", description: "Atendimento cuidadoso e acabamento preciso.", price: 30, priceByBarber: { luiz: 30, enzo: 35 }, duration: 30, active: true, icon: "scissors" },
  { id: "pigmentacao", name: "Pigmentação", description: "Atendimento cuidadoso e acabamento preciso.", price: 20, priceByBarber: { luiz: 20, enzo: 20 }, duration: 30, active: true, icon: "razor" },
  { id: "sobrancelha", name: "Sobrancelha", description: "Atendimento cuidadoso e acabamento preciso.", price: 10, priceByBarber: { luiz: 10, enzo: 10 }, duration: 30, active: true, icon: "brow" },
  { id: "limpeza-pele", name: "Limpeza de pele", description: "Atendimento cuidadoso e acabamento preciso.", price: 25, priceByBarber: { luiz: 25, enzo: 25 }, duration: 30, active: true, icon: "brow" },
];
