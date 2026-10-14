export function whatsapp(phone: string, message = ""): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.length <= 11 ? "55" + digits : digits}${message ? "?text=" + encodeURIComponent(message) : ""}`;
}
export function maskPhone(value: string): string {
  const raw = value.replace(/\D/g, "");
  const d = (raw.length > 11 && raw.startsWith("55") ? raw.slice(2) : raw).slice(0, 11);
  return d.length > 7
    ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
    : d.length > 2
      ? `(${d.slice(0, 2)}) ${d.slice(2)}`
      : d;
}
export function validPhone(value: string): boolean {
  return /^[1-9]{2}9\d{8}$/.test(value.replace(/\D/g, ""));
}
