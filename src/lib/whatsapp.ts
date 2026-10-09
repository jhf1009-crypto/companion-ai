export function whatsapp(phone: string, message = ""): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.startsWith("55") ? digits : "55" + digits}${message ? "?text=" + encodeURIComponent(message) : ""}`;
}
export function maskPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  return d.length > 6
    ? `(${d.slice(0, 2)}) ${d.slice(2, d.length === 11 ? 7 : 6)}-${d.slice(d.length === 11 ? 7 : 6)}`
    : d.length > 2
      ? `(${d.slice(0, 2)}) ${d.slice(2)}`
      : d;
}
export function validPhone(value: string): boolean {
  return /^[1-9]{2}(?:9\d{8}|[2-5]\d{7})$/.test(value.replace(/\D/g, ""));
}
