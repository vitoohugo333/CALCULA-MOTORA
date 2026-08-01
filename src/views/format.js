export const money = (value, digits = 2) => new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', minimumFractionDigits: digits, maximumFractionDigits: digits
}).format(Number.isFinite(Number(value)) ? Number(value) : 0);

export const number = (value, digits = 0) => new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: digits, maximumFractionDigits: digits
}).format(Number.isFinite(Number(value)) ? Number(value) : 0);

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
