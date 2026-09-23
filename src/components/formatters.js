export const number = (n) =>
  new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 }).format(n);
export const dateTime = (d) => new Date(d).toLocaleString("es-ES");
