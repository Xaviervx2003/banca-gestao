export const brl = (v) =>
  Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
 
export const pct = (v, decimals = 1) => `${Number(v).toFixed(decimals)}%`;
 
export const fmtOdd = (v, decimals = 3) => `${Number(v).toFixed(decimals)}x`;
 
export const compact = (v) => {
  if (Math.abs(v) >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000)     return `R$ ${(v / 1_000).toFixed(1)}k`;
  return brl(v);
};
 






