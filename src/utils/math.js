// ─── ENTRADAS PADRÃO ─────────────────────────────────────────────────────────
export const defaultEntradas = (modo) => {
  const base = [
    { id: 1, odd: '1.14', status: 'pendente' },
    { id: 2, odd: '1.18', status: 'pendente' },
    { id: 3, odd: '1.30', status: 'pendente' },
  ];
  if (modo === 'misto') return base.map((e, i) => ({ ...e, grupo: i < 2 }));
  return base;
};

// ─── CÁLCULO POR MODO ────────────────────────────────────────────────────────
export const calcSoros = (entradas, bancaInicio) => {
  let val = bancaInicio;
  return entradas.map((e) => {
    const o           = parseFloat(e.odd) || 1;
    const apostadoCalc = parseFloat(val.toFixed(2));
    const apostado    = e.apostadoReal != null && e.apostadoReal !== '' && val === bancaInicio
      ? parseFloat(parseFloat(e.apostadoReal).toFixed(2))
      : apostadoCalc;
    const retornoFull = parseFloat((apostado * o).toFixed(2));
    // cashout: retorna o valor parcial que o usuário recebeu
    const retorno = e.status === 'cashout' && e.cashoutValor != null
      ? parseFloat(parseFloat(e.cashoutValor).toFixed(2))
      : retornoFull;
    const lucro = parseFloat((retorno - apostado).toFixed(2));
    if (e.status === 'perdeu')   val = 0;
    else if (e.status === 'cashout') val = retorno;
    else val = retorno;
    return { ...e, apostado, retorno, retornoFull, lucro, apostadoCalc };
  });
};

export const calcMedia = (entradas, bancaInicio) => {
  const odds    = entradas.map((e) => parseFloat(e.odd) || 1);
  const somaInv = odds.reduce((acc, o) => acc + 1 / o, 0);
  const R       = bancaInicio / somaInv;
  return entradas.map((e) => {
    const o            = parseFloat(e.odd) || 1;
    const apostadoCalc = parseFloat((R / o).toFixed(2));
    const apostado     = e.apostadoReal != null && e.apostadoReal !== ''
      ? parseFloat(parseFloat(e.apostadoReal).toFixed(2))
      : apostadoCalc;
    const retornoFull  = parseFloat((apostado * o).toFixed(2));
    // cashout: retorno parcial informado pelo usuário
    const retorno = e.status === 'ganhou'  ? retornoFull
                  : e.status === 'cashout' && e.cashoutValor != null
                    ? parseFloat(parseFloat(e.cashoutValor).toFixed(2))
                    : 0;
    const lucro = parseFloat((retorno - apostado).toFixed(2));
    return { ...e, apostado, retorno, retornoFull, lucro, apostadoCalc };
  });
};

export const calcMisto = (entradas, bancaInicio, grupoSize = 2) => {
  const grupo  = entradas.slice(0, grupoSize);
  const livres = entradas.slice(grupoSize);
  const oddsG  = grupo.map((e) => parseFloat(e.odd) || 1);
  const somaInv = oddsG.reduce((acc, o) => acc + 1 / o, 0);
  const R_grupo = bancaInicio / somaInv;

  const calcGrupo = grupo.map((e) => {
    const o       = parseFloat(e.odd) || 1;
    const apostado = parseFloat((R_grupo / o).toFixed(2));
    const retorno  = e.status === 'ganhou' ? parseFloat(R_grupo.toFixed(2)) : 0;
    const lucro    = parseFloat((retorno - apostado).toFixed(2));
    return { ...e, apostado, retorno, lucro };
  });

  const retornoGrupo = parseFloat(
    calcGrupo.reduce((acc, e) => acc + e.retorno, 0).toFixed(2)
  );

  let val = retornoGrupo;
  const calcLivres = livres.map((e) => {
    const o       = parseFloat(e.odd) || 1;
    const apostado = parseFloat(val.toFixed(2));
    const retorno  = parseFloat((apostado * o).toFixed(2));
    const lucro    = parseFloat((retorno - apostado).toFixed(2));
    if (e.status !== 'perdeu') val = retorno; else val = 0;
    return { ...e, apostado, retorno, lucro };
  });

  return [...calcGrupo, ...calcLivres];
};

export const calcularPassos = (entradas, bancaInicio, modo, grupoSize = 2) => {
  if (modo === 'soros') return calcSoros(entradas, bancaInicio);
  if (modo === 'media') return calcMedia(entradas, bancaInicio);
  if (modo === 'misto') return calcMisto(entradas, bancaInicio, grupoSize);
  return [];
};

export const getRetornoFinal = (passos, modo) => {
  if (!passos.length) return 0;
  if (modo === 'soros' || modo === 'misto') {
    const ultimo = passos[passos.length - 1];
    if (ultimo.status === 'perdeu') return 0;
    return ultimo.retorno; // cashout já tem retorno parcial calculado
  }
  if (modo === 'media') {
    return parseFloat(
      passos
        .filter((p) => p.status === 'ganhou' || p.status === 'cashout')
        .reduce((a, p) => a + p.retorno, 0)
        .toFixed(2)
    );
  }
  return 0;
};

export const isDiaConcluido = (entradas, modo, grupoSize = 2) => {
  const concluida = (e) => e.status === 'ganhou' || e.status === 'perdeu' || e.status === 'cashout';
  if (modo === 'soros') {
    return entradas.some((e) => e.status === 'perdeu' || e.status === 'cashout') ||
           entradas.every((e) => e.status === 'ganhou');
  }
  if (modo === 'media') return entradas.every(concluida);
  if (modo === 'misto') {
    const grupo  = entradas.slice(0, grupoSize);
    const livres = entradas.slice(grupoSize);
    if (!grupo.every(concluida)) return false;
    if (!livres.length) return true;
    if (livres.some((e) => e.status === 'perdeu' || e.status === 'cashout')) return true;
    return livres.every((e) => e.status === 'ganhou');
  }
  return false;
};

export const isEntradaBloqueada = (entradas, index, modo, grupoSize = 2) => {
  if (entradas[index].status !== 'pendente') return true;
  const encerrada = (e) => e.status === 'perdeu' || e.status === 'cashout';
  if (modo === 'soros') return entradas.slice(0, index).some(encerrada);
  if (modo === 'media') return false;
  if (modo === 'misto') {
    if (index < grupoSize) return false;
    return entradas.slice(grupoSize, index).some(encerrada);
  }
  return false;
};

// ─── CALCULADORA ─────────────────────────────────────────────────────────────
export const oddNecessaria = (bancaInicio, meta, dias) => {
  if (!bancaInicio || !meta || !dias || meta <= bancaInicio) return null;
  return Math.pow(meta / bancaInicio, 1 / dias);
};

export const metaFinalCalc = (bancaInicio, oddDia, dias) =>
  parseFloat((bancaInicio * Math.pow(oddDia, dias)).toFixed(2));

export const sugerirDivisao = (oddAlvo, nEntradas) => {
  if (nEntradas <= 1) return [oddAlvo];
  const subOdd = Math.pow(oddAlvo, 1 / nEntradas);
  return Array.from({ length: nEntradas }, () => parseFloat(subOdd.toFixed(3)));
};

export const calcDutching = (banca, odds) => {
  const somaInv = odds.reduce((acc, o) => acc + 1 / o, 0);
  const R = banca / somaInv;
  return odds.map((o) => ({
    odd: o,
    apostado: parseFloat((R / o).toFixed(2)),
    retorno:  parseFloat(R.toFixed(2)),
    lucro:    parseFloat((R - R / o).toFixed(2)),
  }));
};

// ─── ESTATÍSTICAS ────────────────────────────────────────────────────────────
export const calcEstatisticas = (dias, config) => {
  if (!dias?.length) return null;
  const jogados = dias.filter((d) => d.status !== 'pendente');
  const ganhos  = dias.filter((d) => d.status === 'ganhou');
  const perdas  = dias.filter((d) => d.status === 'perdeu');
  const taxaGeral = jogados.length ? (ganhos.length / jogados.length) * 100 : 0;

  const modos = ['soros', 'media', 'misto'];
  const taxaPorModo = modos.reduce((acc, m) => {
    const diasM  = jogados.filter((d) => (d.modo || 'soros') === m);
    const ganhosM = diasM.filter((d) => d.status === 'ganhou');
    acc[m] = diasM.length
      ? { taxa: (ganhosM.length / diasM.length) * 100, total: diasM.length, ganhos: ganhosM.length }
      : { taxa: 0, total: 0, ganhos: 0 };
    return acc;
  }, {});

  let maxStreak = 0, curStreak = 0, maxLoss = 0, curLoss = 0;
  jogados.forEach((d) => {
    if (d.status === 'ganhou') { curStreak++; curLoss = 0;  maxStreak = Math.max(maxStreak, curStreak); }
    else                       { curLoss++;  curStreak = 0; maxLoss   = Math.max(maxLoss,   curLoss); }
  });

  let streakAtual = 0, streakTipo = null;
  for (let i = jogados.length - 1; i >= 0; i--) {
    if (!streakTipo) streakTipo = jogados[i].status;
    if (jogados[i].status === streakTipo) streakAtual++;
    else break;
  }

  const bancaInicial  = parseFloat(config?.bancaInicial || 0);
  const bancaAtual    = jogados.length ? (jogados[jogados.length - 1].bancaFim ?? bancaInicial) : bancaInicial;
  const roi           = bancaInicial > 0 ? ((bancaAtual - bancaInicial) / bancaInicial) * 100 : 0;

  const diasComLucro  = jogados.map((d) => ({ ...d, lucro: (d.bancaFim ?? d.bancaInicio) - d.bancaInicio }));
  const melhorDia     = diasComLucro.reduce((b, d) => (d.lucro > (b?.lucro ?? -Infinity) ? d : b), null);
  const piorDia       = diasComLucro.reduce((w, d) => (d.lucro < (w?.lucro ?? Infinity)  ? d : w), null);
  const lucroMedio    = diasComLucro.length ? diasComLucro.reduce((a, d) => a + d.lucro, 0) / diasComLucro.length : 0;

  return {
    jogados: jogados.length, ganhos: ganhos.length, perdas: perdas.length,
    restantes: dias.filter((d) => d.status === 'pendente').length,
    taxaGeral, taxaPorModo, maxStreak, maxLoss,
    streakAtual, streakTipo, roi, bancaAtual, bancaInicial,
    melhorDia, piorDia, lucroMedio,
  };
};

// ─── PROBABILIDADE DE BATER A META ───────────────────────────────────────────
export const calcProbabilidade = (dias, config) => {
  if (!dias?.length || !config) return null;
  const jogados   = dias.filter((d) => d.status !== 'pendente');
  const ganhos    = jogados.filter((d) => d.status === 'ganhou').length;
  const restantes = dias.filter((d) => d.status === 'pendente').length;
  if (jogados.length < 3) return { prob: null, msg: 'Jogue pelo menos 3 dias para calcular' };
  if (restantes === 0)    return { prob: null, msg: 'Desafio concluído' };
  const taxa      = ganhos / jogados.length;
  const metaFinal = dias[dias.length - 1].metaOriginal;
  const bancaAtual = jogados.length
    ? (jogados[jogados.length - 1].bancaFim ?? parseFloat(config.bancaInicial))
    : parseFloat(config.bancaInicial);
  const oddDia = parseFloat(config.oddDia);
  let minGreens = restantes + 1;
  for (let g = 0; g <= restantes; g++) {
    if (bancaAtual * Math.pow(oddDia, g) >= metaFinal) { minGreens = g; break; }
  }
  if (minGreens > restantes) return { prob: 0, taxa, ganhos, jogados: jogados.length, restantes, minGreens, bancaAtual, metaFinal, bancaProjetada: bancaAtual * Math.pow(oddDia, Math.round(restantes * taxa)), greensEsperados: Math.round(restantes * taxa) };
  const binom = (n, k) => { if (k > n) return 0; if (k === 0 || k === n) return 1; let r = 1; for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1); return r; };
  let prob = 0;
  for (let k = minGreens; k <= restantes; k++) prob += binom(restantes, k) * Math.pow(taxa, k) * Math.pow(1 - taxa, restantes - k);
  const greensEsperados = Math.round(restantes * taxa);
  return {
    prob: Math.min(1, Math.max(0, prob)),
    taxa, ganhos, jogados: jogados.length, restantes, minGreens,
    bancaAtual, bancaProjetada: parseFloat((bancaAtual * Math.pow(oddDia, greensEsperados)).toFixed(2)),
    metaFinal, greensEsperados,
  };
};