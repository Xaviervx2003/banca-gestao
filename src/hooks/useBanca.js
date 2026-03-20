import { useState, useEffect } from 'react';
import { brl } from '../utils/formatters';
import { TAGS_DISPONIVEIS } from '../utils/constants';
import {
  defaultEntradas, calcularPassos, getRetornoFinal,
  isDiaConcluido, isEntradaBloqueada,
} from '../utils/math';

const STORAGE_KEY = 'banca_react';

const loadChallenge = () => {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
};

export function useBanca() {
  // ─── ESTADO GLOBAL ──────────────────────────────────────────────────────────
  const [challenge,    setChallenge]    = useState(loadChallenge);
  const [screen,       setScreen]       = useState(() => loadChallenge() ? 'dashboard' : 'home');
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [diaAtual,     setDiaAtual]     = useState(null);
  const [modal,        setModal]        = useState({ open: false, type: null, retornoFinal: 0 });

  // ─── MODO DE APOSTA ─────────────────────────────────────────────────────────
  const [modo,       setModo]       = useState('soros');
  const [grupoSize,  setGrupoSize]  = useState(2);
  const [entradas,   setEntradas]   = useState(defaultEntradas('soros'));
  const [errosOdd,   setErrosOdd]   = useState({});
  const [undoStack,  setUndoStack]  = useState([]); // histórico para undo

  // ─── FORMULÁRIO HOME ────────────────────────────────────────────────────────
  const [cfgBanca, setCfgBanca] = useState(10);
  const [cfgDias,  setCfgDias]  = useState(30);
  const [cfgOdd,   setCfgOdd]   = useState(1.5);

  // ─── CALCULADORA ────────────────────────────────────────────────────────────
  const [calcBancaI,    setCalcBancaI]    = useState(10);
  const [calcMeta,      setCalcMeta]      = useState(1000);
  const [calcDias,      setCalcDias]      = useState(25);
  const [calcNEntradas, setCalcNEntradas] = useState(3);

  // ─── MARCOS ─────────────────────────────────────────────────────────────────
  const [novoMarcoDia,   setNovoMarcoDia]   = useState('');
  const [novoMarcoBanca, setNovoMarcoBanca] = useState('');

  // ─── PERSISTÊNCIA ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (challenge) localStorage.setItem(STORAGE_KEY, JSON.stringify(challenge));
    else           localStorage.removeItem(STORAGE_KEY);
  }, [challenge]);

  // auto-salva entradas/modo/grupoSize no dia
  useEffect(() => {
    if (!diaAtual || !challenge) return;
    const nc  = JSON.parse(JSON.stringify(challenge));
    const idx = nc.dias.findIndex((d) => d.dia === diaAtual.dia);
    if (idx === -1) return;
    nc.dias[idx].entradas  = entradas;
    nc.dias[idx].modo      = modo;
    nc.dias[idx].grupoSize = grupoSize;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nc));
  }, [entradas, modo, grupoSize, diaAtual?.dia]);

  // ─── DERIVADOS ──────────────────────────────────────────────────────────────
  // bancaEfetiva = banca base do dia + aporte extra adicionado
  const _bancaEfetiva = diaAtual
    ? parseFloat(((diaAtual.bancaInicio || 0) + (diaAtual.aporte || 0)).toFixed(2))
    : 0;

  const passos = diaAtual
    ? calcularPassos(entradas, _bancaEfetiva, modo, grupoSize)
    : [];

  const oddCombinada     = entradas.reduce((acc, e) => acc * (parseFloat(e.odd) || 1), 1);
  const retornoProjetado = getRetornoFinal(passos, modo);
  const metaOk           = diaAtual
    ? parseFloat(oddCombinada.toFixed(3)) >= (diaAtual.oddSugerida || challenge?.config?.oddDia || 1.5) - 0.005
    : false;
  const temErros = Object.keys(errosOdd).length > 0 ||
    entradas.some((e) => { const o = parseFloat(e.odd); return isNaN(o) || o < 1.01; });

  // ─── HELPERS ────────────────────────────────────────────────────────────────
  const navigateTo = (s) => { setScreen(s); setSidebarOpen(false); };

  const handleModoChange = (novoModo) => {
    setModo(novoModo);
    setGrupoSize(2);
    setEntradas(defaultEntradas(novoModo));
    setErrosOdd({});
  };

  const validarOdd = (valor, index) => {
    const o = parseFloat(valor);
    if (isNaN(o) || o < 1.01) {
      setErrosOdd((p) => ({ ...p, [index]: 'Odd mínima: 1.01' }));
      return false;
    }
    if (o > 100) {
      setErrosOdd((p) => ({ ...p, [index]: 'Odd máxima: 100.00' }));
      return false;
    }
    setErrosOdd((p) => { const n = { ...p }; delete n[index]; return n; });
    return true;
  };

  const atualizarOdd = (index, valor) => {
    setEntradas(entradas.map((e, i) => i === index ? { ...e, odd: valor } : e));
    validarOdd(valor, index);
  };

  // ─── INICIAR DESAFIO ────────────────────────────────────────────────────────
  const iniciarDesafio = () => {
    let b = parseFloat(cfgBanca);
    const diasArr = Array.from({ length: parseInt(cfgDias) }, (_, i) => {
      const meta = parseFloat((b * parseFloat(cfgOdd)).toFixed(2));
      const d = {
        dia: i + 1, bancaInicio: parseFloat(b.toFixed(2)),
        meta, metaOriginal: meta, status: 'pendente', bancaFim: null,
        anotacao: '', tags: [], entradas: null, modo: 'soros', grupoSize: 2,
        aporte: 0,       // ← dinheiro extra adicionado antes de apostar no dia
      };
      b = meta;
      return d;
    });
    setChallenge({
      config: { dias: parseInt(cfgDias), bancaInicial: parseFloat(cfgBanca), oddDia: parseFloat(cfgOdd) },
      dias: diasArr, bancaAtual: parseFloat(cfgBanca),
      criadoEm: new Date().toISOString(), marcos: [],
    });
    setScreen('dashboard');
  };

  // ─── ABRIR DIA ──────────────────────────────────────────────────────────────
  const abrirDia = (d) => {
    setDiaAtual(d);
    setErrosOdd({});
    setUndoStack([]); // limpa histórico ao entrar em novo dia
    if (d.entradas?.length > 0) {
      setEntradas(d.entradas);
      setModo(d.modo || 'soros');
      setGrupoSize(d.grupoSize || 2);
    } else {
      const m = d.modo || 'soros';
      setModo(m);
      setGrupoSize(d.grupoSize || 2);
      setEntradas(defaultEntradas(m));
    }
    navigateTo('dia');
  };

  // ─── REGISTRAR PASSO ────────────────────────────────────────────────────────
  const registrarPasso = (index, resultado) => {
    if (temErros) return;
    // salva snapshot das entradas antes de mudar (para undo)
    setUndoStack((prev) => [...prev.slice(-9), [...entradas]]);
    const novas = entradas.map((e, i) => i === index ? { ...e, status: resultado } : e);
    setEntradas(novas);
    const bancaEfetiva = parseFloat(((diaAtual.bancaInicio || 0) + (diaAtual.aporte || 0)).toFixed(2));
    if (isDiaConcluido(novas, modo, grupoSize)) {
      const ps  = calcularPassos(novas, bancaEfetiva, modo, grupoSize);
      const ret = getRetornoFinal(ps, modo);
      setModal({ open: true, type: ret >= diaAtual.meta * 0.99 ? 'ganhou' : 'perdeu', retornoFinal: ret });
    }
  };

  // ─── DESFAZER ÚLTIMO RESULTADO ──────────────────────────────────────────────
  const desfazerUltimo = () => {
    if (undoStack.length === 0) return;
    const anterior = undoStack[undoStack.length - 1];
    setEntradas(anterior);
    setUndoStack((prev) => prev.slice(0, -1));
    setModal({ open: false, type: null, retornoFinal: 0 });
  };

  // ─── APOSTADO REAL (valor editado pelo usuário) ──────────────────────────────
  const atualizarApostadoReal = (index, valor) => {
    const novas = entradas.map((e, i) => i === index ? { ...e, apostadoReal: valor } : e);
    setEntradas(novas);
  };

  const adicionarEntrada = () => {
    if (entradas.length >= 6) return;
    const nova = modo === 'misto'
      ? { id: Date.now(), odd: '1.20', status: 'pendente', grupo: false }
      : { id: Date.now(), odd: '1.20', status: 'pendente' };
    setEntradas([...entradas, nova]);
  };

  const removerEntrada = (index) => {
    if (modo === 'misto' && index < grupoSize) return;
    if (entradas.length <= 1) return;
    const novas = entradas.filter((_, i) => i !== index);
    if (modo === 'misto' && grupoSize >= novas.length) setGrupoSize(Math.max(1, novas.length - 1));
    setEntradas(novas);
  };

  // ─── CONFIRMAR RESULTADO DO DIA ─────────────────────────────────────────────
  const confirmarResultadoDia = (recuperar) => {
    const isGreen = modal.type === 'ganhou';
    const retFinal = modal.retornoFinal;
    const nc  = JSON.parse(JSON.stringify(challenge));
    const idx = nc.dias.findIndex((d) => d.dia === diaAtual.dia);

    if (isGreen) {
      nc.dias[idx].status   = 'ganhou';
      nc.dias[idx].bancaFim = retFinal;
      nc.bancaAtual         = retFinal;
      let b = retFinal;
      for (let i = idx + 1; i < nc.dias.length; i++) {
        const m = parseFloat((b * nc.config.oddDia).toFixed(2));
        nc.dias[i].bancaInicio = parseFloat(b.toFixed(2));
        nc.dias[i].meta        = m;
        b = m;
      }
    } else {
      const bancaRestante = retFinal > 0 ? retFinal : diaAtual.bancaInicio;
      nc.dias[idx].status   = 'perdeu';
      nc.dias[idx].bancaFim = bancaRestante;
      nc.bancaAtual         = bancaRestante;
      if (recuperar && idx + 1 < nc.dias.length && bancaRestante > 0) {
        const metaFinal = nc.dias[nc.dias.length - 1].metaOriginal;
        const diasRest  = nc.dias.length - (idx + 1);
        const novaOdd   = Math.pow(metaFinal / bancaRestante, 1 / diasRest);
        let b = bancaRestante;
        for (let i = idx + 1; i < nc.dias.length; i++) {
          const m = parseFloat((b * novaOdd).toFixed(2));
          nc.dias[i].bancaInicio = parseFloat(b.toFixed(2));
          nc.dias[i].meta        = m;
          nc.dias[i].oddSugerida = novaOdd;
          b = m;
        }
      }
    }

    setChallenge(nc);
    setDiaAtual(nc.dias[idx]);
    setModal({ open: false, type: null, retornoFinal: 0 });
    setScreen('dashboard');
  };

  // ─── RESETAR DIA ────────────────────────────────────────────────────────────
  const resetarDia = () => {
    const nc  = JSON.parse(JSON.stringify(challenge));
    const idx = nc.dias.findIndex((d) => d.dia === diaAtual.dia);
    if (idx === -1) return;
    const bancaOriginal = idx === 0
      ? nc.config.bancaInicial
      : nc.dias[idx - 1].bancaFim ?? nc.dias[idx - 1].bancaInicio;

    nc.dias[idx].status      = 'pendente';
    nc.dias[idx].bancaFim    = null;
    nc.dias[idx].entradas    = null;
    nc.dias[idx].aporte      = 0;   // ← zera o aporte ao resetar
    nc.dias[idx].bancaInicio = parseFloat(bancaOriginal.toFixed(2));
    nc.bancaAtual            = parseFloat(bancaOriginal.toFixed(2));
    delete nc.dias[idx].oddSugerida;

    let b = parseFloat(bancaOriginal.toFixed(2));
    for (let i = idx; i < nc.dias.length; i++) {
      const m = parseFloat((b * nc.config.oddDia).toFixed(2));
      nc.dias[i].bancaInicio = parseFloat(b.toFixed(2));
      nc.dias[i].meta        = m;
      b = m;
    }

    setChallenge(nc);
    setDiaAtual(nc.dias[idx]);
    setEntradas(defaultEntradas(modo));
    setErrosOdd({});
    setModal({ open: false, type: null, retornoFinal: 0 });
  };

  // ─── APORTE ─────────────────────────────────────────────────────────────────
  const salvarAporte = (valor) => {
    const v = parseFloat(valor) || 0;
    const nc  = JSON.parse(JSON.stringify(challenge));
    const idx = nc.dias.findIndex((d) => d.dia === diaAtual.dia);
    if (idx === -1) return;
    nc.dias[idx].aporte = v;
    // recalcula meta do dia com nova bancaEfetiva
    const bancaEfetiva = parseFloat(((nc.dias[idx].bancaInicio || 0) + v).toFixed(2));
    nc.dias[idx].meta  = parseFloat((bancaEfetiva * nc.config.oddDia).toFixed(2));
    setChallenge(nc);
    setDiaAtual(nc.dias[idx]);
  };

  // ─── SALVAR ANOTAÇÃO ────────────────────────────────────────────────────────
  const salvarAnotacao = (texto) => {
    if (!diaAtual) return;
    const nc  = JSON.parse(JSON.stringify(challenge));
    const idx = nc.dias.findIndex((d) => d.dia === diaAtual.dia);
    nc.dias[idx].anotacao = texto;
    setChallenge(nc);
    setDiaAtual(nc.dias[idx]);
  };

  // ─── TAGS ────────────────────────────────────────────────────────────────────
  const toggleTag = (tagId) => {
    if (!diaAtual) return;
    const nc  = JSON.parse(JSON.stringify(challenge));
    const idx = nc.dias.findIndex((d) => d.dia === diaAtual.dia);
    const tags = nc.dias[idx].tags || [];
    nc.dias[idx].tags = tags.includes(tagId) ? tags.filter((t) => t !== tagId) : [...tags, tagId];
    setChallenge(nc);
    setDiaAtual(nc.dias[idx]);
  };

  // ─── MARCOS ─────────────────────────────────────────────────────────────────
  const adicionarMarco = () => {
    const dia   = parseInt(novoMarcoDia);
    const banca = parseFloat(novoMarcoBanca);
    if (!dia || !banca || dia < 1 || dia > (challenge?.config?.dias || 30) || banca <= 0) return;
    const nc = JSON.parse(JSON.stringify(challenge));
    nc.marcos = [...(nc.marcos || []), { dia, banca }]
      .sort((a, b) => a.dia - b.dia)
      .filter((m, i, arr) => arr.findIndex((x) => x.dia === m.dia) === i);
    setChallenge(nc);
    setNovoMarcoDia('');
    setNovoMarcoBanca('');
  };

  const removerMarco = (dia) => {
    const nc = JSON.parse(JSON.stringify(challenge));
    nc.marcos = (nc.marcos || []).filter((m) => m.dia !== dia);
    setChallenge(nc);
  };

  // ─── EXPORT ─────────────────────────────────────────────────────────────────
  const exportarCSV = () => {
    if (!challenge) return;
    const header = ['Dia','Banca Início','Aporte','Banca Efetiva','Meta','Banca Fim','Status','Modo','Odd Combinada','Tags','Anotação'];
    const rows = challenge.dias.map((d) => {
      const aporte      = (d.aporte || 0);
      const bancaEf     = parseFloat((d.bancaInicio + aporte).toFixed(2));
      const oddComb     = d.entradas ? d.entradas.reduce((acc, e) => acc * (parseFloat(e.odd) || 1), 1).toFixed(3) : '-';
      const tags        = (d.tags || []).map((t) => TAGS_DISPONIVEIS.find((x) => x.id === t)?.label || t).join('; ');
      return [
        d.dia,
        d.bancaInicio.toFixed(2),
        aporte.toFixed(2),
        bancaEf.toFixed(2),
        d.meta.toFixed(2),
        d.bancaFim != null ? d.bancaFim.toFixed(2) : '-',
        d.status === 'ganhou' ? 'GREEN' : d.status === 'perdeu' ? 'RED' : 'ABERTO',
        d.modo || 'soros', oddComb, tags,
        `"${(d.anotacao || '').replace(/"/g, '""')}"`,
      ].join(',');
    });
    _download('\uFEFF' + [header.join(','), ...rows].join('\n'), `bancacontrol_${_hoje()}.csv`, 'text/csv');
  };

  const exportarTexto = () => {
    if (!challenge) return;
    const { config, dias, bancaAtual } = challenge;
    const metaFinal = dias[dias.length - 1].metaOriginal;
    const ganhos  = dias.filter((d) => d.status === 'ganhou').length;
    const perdas  = dias.filter((d) => d.status === 'perdeu').length;
    const jogados = ganhos + perdas;
    const taxa    = jogados ? ((ganhos / jogados) * 100).toFixed(1) : '0.0';
    const linhas  = [
      '═══════════════════════════════════════',
      '         RELATÓRIO — BANCACONTROL       ',
      '═══════════════════════════════════════',
      `Criado em : ${new Date(challenge.criadoEm).toLocaleDateString('pt-BR')}`,
      `Banca ini.: ${brl(config.bancaInicial)}`,
      `Odd/dia   : ${config.oddDia}x`,
      `Meta final: ${brl(metaFinal)}`,
      '',
      '─── RESULTADO ATUAL ───────────────────',
      `Banca atual  : ${brl(bancaAtual)}`,
      `Dias jogados : ${jogados}  Green: ${ganhos}  Red: ${perdas}`,
      `Taxa de acerto: ${taxa}%`,
      '',
      '─── HISTÓRICO ─────────────────────────',
      ...dias.map((d) => {
        const st   = d.status === 'ganhou' ? '✅' : d.status === 'perdeu' ? '❌' : '⏳';
        const tags = (d.tags || []).map((t) => TAGS_DISPONIVEIS.find((x) => x.id === t)?.label || t).join(', ');
        return `${st} Dia ${String(d.dia).padStart(2,'0')} | ${brl(d.bancaInicio)} → ${brl(d.meta)}${tags ? ` [${tags}]` : ''}${d.anotacao ? ` — ${d.anotacao.slice(0,50)}` : ''}`;
      }),
      '',
      '═══════════════════════════════════════',
    ];
    _download(linhas.join('\n'), `bancacontrol_relatorio_${_hoje()}.txt`, 'text/plain');
  };

  const _hoje  = () => new Date().toISOString().slice(0, 10);
  const _download = (content, filename, type) => {
    const blob = new Blob([content], { type: `${type};charset=utf-8;` });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  // ─── RESETAR DESAFIO ────────────────────────────────────────────────────────
  const resetarDesafio = () => {
    setChallenge(null);
    setScreen('home');
    setModal({ open: false, type: null, retornoFinal: 0 });
  };

  // ─── RETORNO DO HOOK ────────────────────────────────────────────────────────
  // ─── DERIVADO BANCA EFETIVA (exposto para o App) ───────────────────────────
  const bancaEfetiva = _bancaEfetiva;

  return {
    // estado
    challenge, screen, sidebarOpen, setSidebarOpen,
    diaAtual, modal, setModal,
    modo, grupoSize, setGrupoSize,
    entradas, setEntradas, errosOdd,
    cfgBanca, setCfgBanca, cfgDias, setCfgDias, cfgOdd, setCfgOdd,
    calcBancaI, setCalcBancaI, calcMeta, setCalcMeta,
    calcDias,   setCalcDias,   calcNEntradas, setCalcNEntradas,
    novoMarcoDia, setNovoMarcoDia, novoMarcoBanca, setNovoMarcoBanca,
    // derivados
    passos, oddCombinada, retornoProjetado, metaOk, temErros,
    bancaEfetiva,
    undoStack,
    // funções
    navigateTo, handleModoChange, atualizarOdd,
    iniciarDesafio, abrirDia,
    registrarPasso, adicionarEntrada, removerEntrada,
    desfazerUltimo, atualizarApostadoReal,
    confirmarResultadoDia, resetarDia, resetarDesafio,
    salvarAporte, salvarAnotacao,
    toggleTag, adicionarMarco, removerMarco,
    exportarCSV, exportarTexto,
  };
}