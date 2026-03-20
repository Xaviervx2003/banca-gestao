import React from 'react';
import {
  Home, LayoutDashboard, CalendarDays, Menu, Play, ArrowRight,
  CheckCircle2, XCircle, Trash2, PlusCircle, TrendingUp, Layers, GitMerge,
  RotateCcw, BarChart2, Calculator, Flame, Award, AlertCircle,
  Tag, Download, Flag, X
} from 'lucide-react';
import {
  BarChart, Bar, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

import './index.css';
import { useBanca }       from './hooks/useBanca';
import BancaChart         from './components/BancaChart';
import DayItem            from './components/DayItem';
import RecoveryModal      from './components/RecoveryModal';
import { brl, compact }   from './utils/formatters';
import { TAGS_DISPONIVEIS, MODO_LABELS, MODO_COLORS } from './utils/constants';
import { calcEstatisticas, oddNecessaria, sugerirDivisao, calcDutching, isEntradaBloqueada } from './utils/math';

export default function App() {
  const B = useBanca();

  // ── handlers do modal ──────────────────────────────────────────────────────
  const handleModalConfirm = (tipo, recuperar) => {
    if (tipo === 'reset')     { B.resetarDesafio(); return; }
    if (tipo === 'resultado') { B.confirmarResultadoDia(recuperar); }
  };

  const closeModal = () => B.setModal({ open: false, type: null, retornoFinal: 0 });

  // ── metaFinal derivado ─────────────────────────────────────────────────────
  const metaFinal = B.challenge?.dias?.[B.challenge.dias.length - 1]?.metaOriginal ?? 0;

  return (
    <div className="app">

      {/* ════ SIDEBAR ════ */}
      <aside className={`sidebar ${B.sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h1>BancaControl</h1>
          <span>GESTÃO DE APOSTAS</span>
        </div>
        <nav>
          {[
            { id: 'home',         label: 'Início',       Icon: Home },
            { id: 'dashboard',    label: 'Dashboard',    Icon: LayoutDashboard },
            { id: 'dias',         label: 'Dias',         Icon: CalendarDays },
            { id: 'estatisticas', label: 'Estatísticas', Icon: BarChart2 },
            { id: 'calculadora',  label: 'Calculadora',  Icon: Calculator },
          ].map(({ id, label, Icon }) => (
            <div key={id} className={`nav-item ${B.screen === id ? 'active' : ''}`} onClick={() => B.navigateTo(id)}>
              <Icon size={16} /> {label}
            </div>
          ))}
        </nav>
        {B.challenge && (
          <div className="sidebar-footer">
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 10 }}>Progresso</div>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'monospace', color: '#fff', marginBottom: 6 }}>{brl(B.challenge.bancaAtual)}</div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${Math.min(100, ((B.challenge.bancaAtual - B.challenge.config.bancaInicial) / (metaFinal - B.challenge.config.bancaInicial)) * 100)}%` }} />
            </div>
          </div>
        )}
      </aside>

      {/* ════ MAIN ════ */}
      <main className="main">

        {/* TOPBAR */}
        <div className="topbar">
          <button className="hamburger" onClick={() => B.setSidebarOpen(!B.sidebarOpen)}><Menu size={20} /></button>
          <div style={{ textAlign: 'center' }}>
            <div className="topbar-title">BancaControl</div>
            <div className="topbar-sub">
              {B.screen === 'dia' ? `Dia ${B.diaAtual?.dia} — ${MODO_LABELS[B.modo] || ''}` : 'Gestão Progressiva'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {B.challenge && ['dashboard','dias','estatisticas'].includes(B.screen) && (
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent2)', borderColor: 'rgba(79,110,247,0.35)' }}
                onClick={() => B.setModal({ open: true, type: 'export', retornoFinal: 0 })}>
                <Download size={13} /> Exportar
              </button>
            )}
            {/* undo — só aparece na tela do dia e quando tem algo para desfazer */}
            {B.challenge && B.screen === 'dia' && B.undoStack.length > 0 && (
              <button className="btn btn-ghost btn-sm" style={{ color: '#a78bfa', borderColor: 'rgba(167,139,250,0.35)' }}
                onClick={B.desfazerUltimo}
                title="Desfazer último resultado">
                <RotateCcw size={13} /> Desfazer
              </button>
            )}
            {B.challenge && B.screen === 'dia' && B.diaAtual && (
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--amber)', borderColor: 'rgba(245,158,11,0.35)' }}
                onClick={() => B.setModal({ open: true, type: 'reset-dia', retornoFinal: 0 })}>
                <RotateCcw size={13} /> Resetar dia
              </button>
            )}
            {B.challenge && B.screen !== 'home' && (
              <button className="btn btn-danger btn-sm" onClick={() => B.setModal({ open: true, type: 'reset', retornoFinal: 0 })}>
                Resetar
              </button>
            )}
          </div>
        </div>

        {/* ════ HOME ════ */}
        {B.screen === 'home' && (
          <div className="screen active page">
            <div className="home-grid">
              <div className="card">
                <div className="section-title" style={{ marginBottom: 20 }}>Novo Desafio</div>
                <div className="input-group">
                  <label>Banca inicial (R$)</label>
                  <input type="number" value={B.cfgBanca} onChange={(e) => B.setCfgBanca(e.target.value)} />
                </div>
                <div className="input-row cols-2">
                  <div className="input-group">
                    <label>Duração (dias)</label>
                    <input type="number" value={B.cfgDias} onChange={(e) => B.setCfgDias(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Odd alvo/dia</label>
                    <input type="number" step="0.01" value={B.cfgOdd} onChange={(e) => B.setCfgOdd(e.target.value)} />
                  </div>
                </div>
                <div className="meta-preview">
                  <div className="meta-preview-label">Meta final estimada</div>
                  <div className="meta-preview-value">
                    {brl(B.cfgBanca * Math.pow(parseFloat(B.cfgOdd) || 1, parseInt(B.cfgDias) || 1))}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(79,110,247,.55)', marginTop: 6 }}>
                    Se acertar todos os {B.cfgDias} dias com odd {B.cfgOdd}
                  </div>
                </div>
                <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={B.iniciarDesafio}>
                  <Play size={16} /> Iniciar Desafio
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════ DASHBOARD ════ */}
        {B.screen === 'dashboard' && B.challenge && (() => {
          const pct  = Math.min(100, ((B.challenge.bancaAtual - B.challenge.config.bancaInicial) / (metaFinal - B.challenge.config.bancaInicial)) * 100) || 0;
          const prox = B.challenge.dias.find((d) => d.status === 'pendente');

          return (
            <div className="screen active page">
              <div className="banca-hero">
                <div className="banca-hero-label">Banca atual</div>
                <div className="banca-hero-value">{brl(B.challenge.bancaAtual)}</div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                <div className="progress-labels">
                  <span>{brl(B.challenge.config.bancaInicial)}</span>
                  <span className="pct">{pct.toFixed(1)}%</span>
                  <span>{brl(metaFinal)}</span>
                </div>
              </div>

              {prox && (
                <div className="next-card" onClick={() => B.abrirDia(prox)}>
                  <div>
                    <div className="next-label">Próxima aposta</div>
                    <div className="next-dia">Dia {prox.dia}</div>
                    <div className="next-vals">{brl(prox.bancaInicio)} → <strong style={{ color: '#fff' }}>{brl(prox.meta)}</strong></div>
                  </div>
                  <div className="next-arrow"><ArrowRight /></div>
                </div>
              )}

              <div className="dash-grid">
                {/* gráfico */}
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div className="section-title">Evolução da banca</div>
                    {(B.challenge.marcos || []).length > 0 && (
                      <span style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Flag size={11} /> {B.challenge.marcos.length} marco(s)
                      </span>
                    )}
                  </div>
                  <div className="chart-wrap" style={{ height: 260 }}>
                    <BancaChart dias={B.challenge.dias} bancaInicial={B.challenge.config.bancaInicial} marcos={B.challenge.marcos || []} />
                  </div>
                </div>

                {/* marcos */}
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <Flag size={14} color="var(--amber)" />
                    <div className="section-title" style={{ fontSize: 14 }}>Metas intermediárias</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, marginBottom: 16 }}>
                    <div>
                      <label style={{ fontSize: 11 }}>Dia</label>
                      <input type="number" min={1} max={B.challenge.config.dias} placeholder={`1-${B.challenge.config.dias}`}
                        value={B.novoMarcoDia} onChange={(e) => B.setNovoMarcoDia(e.target.value)} style={{ padding: '8px 10px', fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11 }}>Banca (R$)</label>
                      <input type="number" placeholder="ex: 100"
                        value={B.novoMarcoBanca} onChange={(e) => B.setNovoMarcoBanca(e.target.value)} style={{ padding: '8px 10px', fontSize: 13 }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--amber)', borderColor: 'rgba(245,158,11,0.3)' }} onClick={B.adicionarMarco}>
                        <Flag size={13} /> Add
                      </button>
                    </div>
                  </div>
                  {(B.challenge.marcos || []).length === 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', padding: '20px 0' }}>
                      Nenhuma meta intermediária definida
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {B.challenge.marcos.map((m) => {
                        const diaObj    = B.challenge.dias[m.dia - 1];
                        const bancaReal = diaObj?.bancaFim ?? B.challenge.bancaAtual;
                        const passou    = diaObj?.status !== 'pendente';
                        const atingiu   = passou && bancaReal >= m.banca;
                        return (
                          <div key={m.dia} style={{
                            background: atingiu ? 'rgba(34,197,94,0.07)' : passou ? 'rgba(239,68,68,0.07)' : 'var(--bg3)',
                            border: `1px solid ${atingiu ? 'rgba(34,197,94,0.2)' : passou ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`,
                            borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          }}>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: atingiu ? 'var(--green)' : passou ? 'var(--red)' : 'var(--amber)' }}>
                                {atingiu ? '✓' : passou ? '✗' : '◎'} Dia {m.dia}
                              </div>
                              <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', marginTop: 2 }}>{brl(m.banca)}</div>
                              {passou && (
                                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                                  Real: {brl(bancaReal)} ({bancaReal >= m.banca ? '+' : ''}{brl(bancaReal - m.banca)})
                                </div>
                              )}
                            </div>
                            <button onClick={() => B.removerMarco(m.dia)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ════ DIAS ════ */}
        {B.screen === 'dias' && B.challenge && (
          <div className="screen active page">
            <div className="section-title" style={{ marginBottom: 20 }}>Todos os dias</div>
            <div className="dias-grid">
              {B.challenge.dias.map((d) => (
                <DayItem key={d.dia} dia={d} onClick={B.abrirDia} />
              ))}
            </div>
          </div>
        )}

        {/* ════ ESTATÍSTICAS ════ */}
        {B.screen === 'estatisticas' && B.challenge && (() => {
          const stats = calcEstatisticas(B.challenge.dias, B.challenge.config);
          if (!stats) return (
            <div className="screen active page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
              <p style={{ color: 'var(--text3)' }}>Nenhum dia registrado ainda.</p>
            </div>
          );

          const barData = Object.entries(stats.taxaPorModo)
            .filter(([, v]) => v.total > 0)
            .map(([k, v]) => ({ name: MODO_LABELS[k]?.split(' ')[0], taxa: parseFloat(v.taxa.toFixed(1)), total: v.total, cor: MODO_COLORS[k] }));

          const evolucaoData = [
            { name: 'Início', Banca: stats.bancaInicial },
            ...B.challenge.dias.filter((d) => d.status !== 'pendente').map((d) => ({ name: `D${d.dia}`, Banca: d.bancaFim ?? d.bancaInicio })),
          ];

          const tagStats = TAGS_DISPONIVEIS.map((tag) => {
            const diasT   = B.challenge.dias.filter((d) => (d.tags || []).includes(tag.id) && d.status !== 'pendente');
            const ganhosT = diasT.filter((d) => d.status === 'ganhou').length;
            return { ...tag, total: diasT.length, ganhos: ganhosT, taxa: diasT.length ? (ganhosT / diasT.length) * 100 : 0 };
          }).filter((t) => t.total > 0);

          return (
            <div className="screen active page">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
                {[
                  { label: 'Taxa de acerto', value: `${stats.taxaGeral.toFixed(1)}%`, Icon: TrendingUp, color: stats.taxaGeral >= 50 ? 'var(--green)' : 'var(--red)' },
                  { label: 'ROI acumulado',  value: `${stats.roi.toFixed(1)}%`,       Icon: BarChart2,  color: stats.roi >= 0 ? 'var(--green)' : 'var(--red)' },
                  { label: 'Maior sequência',value: `${stats.maxStreak}x`,            Icon: Flame,      color: 'var(--amber)' },
                  { label: 'Maior queda',    value: `${stats.maxLoss}x`,              Icon: AlertCircle,color: 'var(--red)' },
                  { label: 'Dias jogados',   value: `${stats.jogados}`,               Icon: CalendarDays,color: 'var(--accent2)' },
                  { label: 'Lucro médio/dia',value: compact(stats.lucroMedio),        Icon: Award,      color: stats.lucroMedio >= 0 ? 'var(--green)' : 'var(--red)' },
                ].map(({ label, value, Icon, color }) => (
                  <div key={label} className="card card-sm" style={{ textAlign: 'center' }}>
                    <div style={{ color, display: 'flex', justifyContent: 'center', marginBottom: 6 }}><Icon size={14} /></div>
                    <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: 'monospace', marginBottom: 3 }}>{value}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>{label}</div>
                  </div>
                ))}
              </div>

              {stats.streakTipo && (
                <div style={{
                  background: stats.streakTipo === 'ganhou' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${stats.streakTipo === 'ganhou' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                  borderRadius: 12, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  {stats.streakTipo === 'ganhou' ? <Flame size={18} color="var(--green)" /> : <AlertCircle size={18} color="var(--red)" />}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: stats.streakTipo === 'ganhou' ? 'var(--green)' : 'var(--red)' }}>
                      Sequência atual: {stats.streakAtual} {stats.streakTipo === 'ganhou' ? 'vitória(s)' : 'derrota(s)'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                      {stats.streakTipo === 'ganhou' ? 'Continue assim!' : 'Considere revisar a estratégia.'}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                {barData.length > 0 && (
                  <div className="card">
                    <div className="section-title" style={{ marginBottom: 16, fontSize: 14 }}>Taxa de acerto por modo</div>
                    <div style={{ height: 180 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} barSize={36}>
                          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="name" stroke="#4e5568" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis domain={[0, 100]} stroke="#4e5568" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                          <Tooltip contentStyle={{ backgroundColor: '#1a1e28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                            formatter={(v, _, { payload }) => [`${v}% (${payload.total} dias)`, 'Taxa']} />
                          <Bar dataKey="taxa" radius={[6, 6, 0, 0]}>
                            {barData.map((e) => <Cell key={e.name} fill={e.cor} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                <div className="card">
                  <div className="section-title" style={{ marginBottom: 16, fontSize: 14 }}>Destaques</div>
                  {stats.melhorDia && (
                    <div style={{ background: 'rgba(34,197,94,0.07)', borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
                      <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>Melhor dia — Dia {stats.melhorDia.dia}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--green)', fontFamily: 'monospace' }}>+{brl(stats.melhorDia.lucro)}</div>
                    </div>
                  )}
                  {stats.piorDia && (
                    <div style={{ background: 'rgba(239,68,68,0.07)', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>Pior dia — Dia {stats.piorDia.dia}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--red)', fontFamily: 'monospace' }}>{brl(stats.piorDia.lucro)}</div>
                    </div>
                  )}
                </div>
              </div>

              {tagStats.length > 0 && (
                <div className="card" style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <Tag size={14} color="var(--accent2)" />
                    <div className="section-title" style={{ fontSize: 14 }}>Taxa de acerto por mercado</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {tagStats.sort((a, b) => b.taxa - a.taxa).map((tag) => (
                      <div key={tag.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: tag.color, display: 'inline-block' }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{tag.label}</span>
                            <span style={{ fontSize: 11, color: 'var(--text3)' }}>{tag.ganhos}/{tag.total}</span>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: tag.taxa >= 60 ? 'var(--green)' : tag.taxa >= 40 ? 'var(--amber)' : 'var(--red)' }}>
                            {tag.taxa.toFixed(0)}%
                          </span>
                        </div>
                        <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 4, width: `${tag.taxa}%`, background: tag.taxa >= 60 ? 'var(--green)' : tag.taxa >= 40 ? 'var(--amber)' : 'var(--red)', transition: 'width .5s' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="card">
                <div className="section-title" style={{ marginBottom: 16, fontSize: 14 }}>Evolução real da banca</div>
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={evolucaoData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="#4e5568" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#4e5568" fontSize={11} tickLine={false} axisLine={false}
                        tickFormatter={(v) => v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`} />
                      <Tooltip contentStyle={{ backgroundColor: '#1a1e28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} formatter={(v) => [brl(v), 'Banca']} />
                      <Line type="monotone" dataKey="Banca" stroke="#4f6ef7" strokeWidth={2.5} dot={{ r: 3, fill: '#4f6ef7', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ════ CALCULADORA ════ */}
        {B.screen === 'calculadora' && (() => {
          const oddDiaria   = oddNecessaria(parseFloat(B.calcBancaI), parseFloat(B.calcMeta), parseInt(B.calcDias));
          const divisao     = oddDiaria ? sugerirDivisao(oddDiaria, parseInt(B.calcNEntradas)) : [];
          const dutching    = oddDiaria && parseFloat(B.calcBancaI) > 0 ? calcDutching(parseFloat(B.calcBancaI), divisao) : [];
          const oddAtual    = B.challenge?.config?.oddDia;
          const diasNec     = oddDiaria && oddAtual ? Math.ceil(Math.log(parseFloat(B.calcMeta) / parseFloat(B.calcBancaI)) / Math.log(oddAtual)) : null;
          const projData    = oddDiaria ? Array.from({ length: parseInt(B.calcDias) + 1 }, (_, i) => ({
            dia: i === 0 ? 'Início' : `D${i}`,
            Banca: parseFloat((parseFloat(B.calcBancaI) * Math.pow(oddDiaria, i)).toFixed(2)),
          })) : [];

          return (
            <div className="screen active page">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <div className="card" style={{ marginBottom: 16 }}>
                    <div className="section-title" style={{ marginBottom: 20, fontSize: 15 }}>Calculadora de odd necessária</div>
                    <div className="input-group">
                      <label>Banca inicial (R$)</label>
                      <input type="number" value={B.calcBancaI} onChange={(e) => B.setCalcBancaI(e.target.value)} />
                    </div>
                    <div className="input-group">
                      <label>Meta final (R$)</label>
                      <input type="number" value={B.calcMeta} onChange={(e) => B.setCalcMeta(e.target.value)} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div className="input-group">
                        <label>Em quantos dias?</label>
                        <input type="number" min={1} value={B.calcDias} onChange={(e) => B.setCalcDias(e.target.value)} />
                      </div>
                      <div className="input-group">
                        <label>Dividir em entradas</label>
                        <input type="number" min={1} max={6} value={B.calcNEntradas} onChange={(e) => B.setCalcNEntradas(e.target.value)} />
                      </div>
                    </div>
                    {oddDiaria ? (
                      <div style={{ background: 'rgba(79,110,247,0.1)', border: '1px solid rgba(79,110,247,0.25)', borderRadius: 14, padding: '18px 20px', marginTop: 8 }}>
                        <div style={{ fontSize: 11, color: 'var(--accent2)', fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6 }}>Odd diária necessária</div>
                        <div style={{ fontSize: 40, fontWeight: 800, fontFamily: 'monospace', color: '#fff', letterSpacing: -1 }}>{oddDiaria.toFixed(4)}x</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>{brl(B.calcBancaI)} → {brl(B.calcMeta)} em {B.calcDias} dias</div>
                        {oddAtual && diasNec !== null && (
                          <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: 8, fontSize: 12, color: 'var(--text2)' }}>
                            Com odd {oddAtual}x/dia precisaria de{' '}
                            <strong style={{ color: diasNec <= parseInt(B.calcDias) ? 'var(--green)' : 'var(--amber)' }}>{diasNec} dias</strong>
                            {diasNec <= parseInt(B.calcDias) ? ' — viável!' : ` — ${diasNec - parseInt(B.calcDias)} a mais.`}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ background: 'rgba(239,68,68,0.08)', borderRadius: 12, padding: '14px 16px', marginTop: 8, fontSize: 13, color: 'var(--red)' }}>
                        A meta deve ser maior que a banca inicial.
                      </div>
                    )}
                  </div>

                  {dutching.length > 0 && (
                    <div className="card">
                      <div className="section-title" style={{ marginBottom: 14, fontSize: 14 }}>Divisão sugerida — {B.calcNEntradas} entradas</div>
                      {dutching.map((d, i) => (
                        <div key={i} className="split-card" style={{ borderLeft: `3px solid ${'#4f6ef7,#7c5cfa,#a78bfa,#c4b5fd,#ddd6fe,#ede9fe'.split(',')[i] || '#4f6ef7'}`, marginBottom: 8 }}>
                          <div>
                            <div className="split-num">ENTRADA {i + 1}</div>
                            <div style={{ fontWeight: 700, fontSize: 15, marginTop: 3, fontFamily: 'monospace' }}>
                              {brl(d.apostado)} <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 400 }}>@ {d.odd.toFixed(3)}x</span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 700 }}>+{brl(d.lucro)}</div>
                            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>{brl(d.retorno)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  {projData.length > 0 && (
                    <div className="card" style={{ marginBottom: 16 }}>
                      <div className="section-title" style={{ marginBottom: 16, fontSize: 14 }}>Projeção de crescimento</div>
                      <div style={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={projData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="dia" stroke="#4e5568" fontSize={11} tickLine={false} axisLine={false} interval={Math.floor(projData.length / 6)} />
                            <YAxis stroke="#4e5568" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`} />
                            <Tooltip contentStyle={{ backgroundColor: '#1a1e28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} formatter={(v) => [brl(v), 'Banca projetada']} />
                            <Line type="monotone" dataKey="Banca" stroke="#4f6ef7" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {oddDiaria && (
                    <div className="card">
                      <div className="section-title" style={{ marginBottom: 14, fontSize: 14 }}>Marcos de crescimento</div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            {['Dia', 'Banca projetada', 'Lucro acum.'].map((h) => (
                              <th key={h} style={{ textAlign: h === 'Dia' ? 'left' : 'right', padding: '6px 0', color: 'var(--text3)', fontWeight: 600, fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const total = parseInt(B.calcDias) || 1;
                            const bancaI = parseFloat(B.calcBancaI) || 0;
                            // gera 4 marcos sem duplicatas: 25%, 50%, 75%, 100%
                            const dias = [...new Set([
                              Math.max(1, Math.ceil(total * 0.25)),
                              Math.max(1, Math.ceil(total * 0.5)),
                              Math.max(1, Math.ceil(total * 0.75)),
                              total,
                            ])];
                            return dias.map((d) => {
                              const banca = parseFloat((bancaI * Math.pow(oddDiaria, d)).toFixed(2));
                              const lucro = parseFloat((banca - bancaI).toFixed(2));
                              return (
                                <tr key={d} style={{ borderBottom: '1px solid var(--border)' }}>
                                  <td style={{ padding: '10px 0', fontWeight: 700, color: 'var(--accent2)' }}>Dia {d}</td>
                                  <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{brl(banca)}</td>
                                  <td style={{ padding: '10px 0', textAlign: 'right', color: lucro >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
                                    {lucro >= 0 ? '+' : ''}{brl(lucro)}
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ════ DIA DETALHE ════ */}
        {B.screen === 'dia' && B.diaAtual && (
          <div className="screen active page">

            {/* seletor de modo */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              {[
                { key: 'soros', label: 'Soros',  Icon: TrendingUp, desc: 'Sequencial' },
                { key: 'media', label: 'Média',  Icon: Layers,     desc: 'Simultânea' },
                { key: 'misto', label: 'Misto',  Icon: GitMerge,   desc: '1+2 grupo · livre' },
              ].map(({ key, label, Icon, desc }) => (
                <button key={key} onClick={() => B.handleModoChange(key)} style={{
                  flex: 1, padding: '10px 12px', borderRadius: 10,
                  border: `1.5px solid ${B.modo === key ? 'var(--accent)' : 'var(--border)'}`,
                  background: B.modo === key ? 'rgba(79,110,247,0.12)' : 'var(--bg2)',
                  color: B.modo === key ? 'var(--accent2)' : 'var(--text3)',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  transition: 'all .2s', fontFamily: 'inherit',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13 }}>
                    <Icon size={14} /> {label}
                  </div>
                  <div style={{ fontSize: 10, opacity: 0.65 }}>{desc}</div>
                </button>
              ))}
            </div>

            {/* config misto */}
            {B.modo === 'misto' && (
              <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)', letterSpacing: 0.5, marginBottom: 6 }}>DIVISÃO DO GRUPO EQUALIZADO</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>Quantas entradas entram no grupo? As demais seguem Soros.</div>
                  <input type="range" min={1} max={Math.max(1, B.entradas.length - 1)} value={B.grupoSize}
                    onChange={(e) => { B.setGrupoSize(parseInt(e.target.value)); B.setEntradas(B.entradas.map((e) => ({ ...e, status: 'pendente' }))); }}
                    style={{ width: '100%', accentColor: 'var(--amber)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                    <span>1 no grupo</span><span>{Math.max(1, B.entradas.length - 1)} no grupo</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {B.entradas.map((_, i) => (
                    <div key={i}
                      onClick={() => { const n = i + 1 <= B.entradas.length - 1 ? i + 1 : i; if (n !== B.grupoSize) { B.setGrupoSize(n); B.setEntradas(B.entradas.map((e) => ({ ...e, status: 'pendente' }))); } }}
                      style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .15s', background: i < B.grupoSize ? 'rgba(245,158,11,0.2)' : 'rgba(79,110,247,0.15)', color: i < B.grupoSize ? 'var(--amber)' : 'var(--accent2)', border: `1px solid ${i < B.grupoSize ? 'rgba(245,158,11,0.3)' : 'rgba(79,110,247,0.3)'}` }}
                    >{i + 1}</div>
                  ))}
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(245,158,11,0.3)', display: 'inline-block' }} /> Grupo ({B.grupoSize})</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(79,110,247,0.25)', display: 'inline-block' }} /> Livre ({B.entradas.length - B.grupoSize})</div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* coluna esquerda */}
              <div>
                <div className="card">
                  <div className="section-header" style={{ marginBottom: 20 }}>
                    <div className="section-title">{MODO_LABELS[B.modo]}</div>
                    <span className={`odd-badge ${B.metaOk ? 'ok' : 'warn'}`}>{B.oddCombinada.toFixed(3)}x {B.metaOk ? '✓' : '↑'}</span>
                  </div>

                  <div style={{ background: 'rgba(79,110,247,0.07)', borderRadius: 10, padding: '10px 14px', marginBottom: 18, fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
                    {B.modo === 'soros' && 'Retorno de cada entrada vira a aposta da próxima. Se qualquer uma perder, o dia encerra.'}
                    {B.modo === 'media' && 'Banca dividida para retorno igual em todas. Cada aposta é independente.'}
                    {B.modo === 'misto' && `Grupo (${B.grupoSize} entradas): equalizadas. Livre (${B.entradas.length - B.grupoSize}): Soros sobre o retorno do grupo.`}
                  </div>

                  {B.modo === 'misto' && <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber)', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 10 }}>▸ GRUPO EQUALIZADO</div>}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {B.passos.map((passo, i) => {
                      const isGrupo   = B.modo === 'misto' && i < B.grupoSize;
                      const isLivre   = B.modo === 'misto' && i >= B.grupoSize;
                      const primLivre = B.modo === 'misto' && i === B.grupoSize;
                      const bloqueada = isEntradaBloqueada(B.entradas, i, B.modo, B.grupoSize);
                      const accentColor = isGrupo ? 'var(--amber)' : passo.status === 'ganhou' ? 'var(--green)' : passo.status === 'perdeu' ? 'var(--red)' : 'var(--accent)';

                      return (
                        <React.Fragment key={passo.id}>
                          {primLivre && (
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent2)', letterSpacing: 0.6, textTransform: 'uppercase', borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 4 }}>
                              ▸ LIVRE — SOROS SOBRE RETORNO DO GRUPO
                            </div>
                          )}
                          <div className={`split-card ${passo.status}`} style={{ borderLeft: `3px solid ${accentColor}`, display: 'block', opacity: bloqueada ? 0.45 : 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                              <div>
                                <div className="split-num" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  {isGrupo ? `GRUPO ${i + 1}` : isLivre ? `LIVRE ${i - B.grupoSize + 1}` : `ENTRADA ${i + 1}`}
                                  {isGrupo && <span style={{ fontSize: 10, background: 'rgba(245,158,11,0.15)', color: 'var(--amber)', padding: '1px 7px', borderRadius: 6 }}>equalizada</span>}
                                  {B.modo === 'media' && <span style={{ fontSize: 10, background: 'rgba(79,110,247,0.15)', color: 'var(--accent2)', padding: '1px 7px', borderRadius: 6 }}>independente</span>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                                  <label style={{ margin: 0 }}>ODD:</label>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    <input type="number" step="0.01" value={passo.odd} disabled={passo.status !== 'pendente' || bloqueada}
                                      style={{ width: 80, padding: '6px 10px', fontSize: 14, borderColor: B.errosOdd[i] ? 'var(--red)' : undefined, outline: B.errosOdd[i] ? '1px solid var(--red)' : undefined }}
                                      onChange={(e) => B.atualizarOdd(i, e.target.value)} />
                                    {B.errosOdd[i] && <span style={{ fontSize: 10, color: 'var(--red)', fontWeight: 600 }}>{B.errosOdd[i]}</span>}
                                  </div>
                                </div>
                                {/* campo valor real apostado */}
                                {passo.status === 'pendente' && !bloqueada && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                                    <label style={{ margin: 0, fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>Valor real:</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                      <input
                                        type="number" step="0.01" min="0.01"
                                        placeholder={brl(passo.apostado).replace('R$\u00a0','')}
                                        value={B.entradas[i]?.apostadoReal ?? ''}
                                        style={{ width: 90, padding: '5px 9px', fontSize: 13, fontFamily: 'monospace',
                                          borderColor: B.entradas[i]?.apostadoReal ? 'rgba(167,139,250,0.5)' : undefined }}
                                        onChange={(e) => B.atualizarApostadoReal(i, e.target.value)}
                                      />
                                      {B.entradas[i]?.apostadoReal && (
                                        <span style={{ fontSize: 10, color: '#a78bfa' }}>
                                          retorno: {brl(parseFloat(B.entradas[i].apostadoReal) * (parseFloat(passo.odd) || 1))}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                                  {B.entradas[i]?.apostadoReal ? 'Valor real' : 'Sugerido'}
                                </div>
                                <div className="split-val" style={{ color: B.entradas[i]?.apostadoReal ? '#a78bfa' : 'var(--text)' }}>
                                  {brl(passo.apostado)}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                                  Retorno: <strong style={{ color: passo.retorno > 0 ? '#fff' : 'var(--text3)' }}>
                                    {brl(passo.retorno > 0 ? passo.retorno : (passo.apostado * (parseFloat(passo.odd) || 1)))}
                                  </strong>
                                </div>
                                {B.entradas[i]?.apostadoReal && parseFloat(B.entradas[i].apostadoReal) !== passo.apostadoCalc && (
                                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>
                                    calc: {brl(passo.apostadoCalc ?? passo.apostado)}
                                  </div>
                                )}
                              </div>
                            </div>

                            {passo.status === 'pendente' && !bloqueada && (
                              <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                                <button className="btn btn-danger btn-sm" style={{ flex: 1, opacity: B.temErros ? 0.4 : 1 }} disabled={B.temErros} onClick={() => B.registrarPasso(i, 'perdeu')}>
                                  <XCircle size={14} /> Red
                                </button>
                                <button className="btn btn-green btn-sm" style={{ flex: 1, opacity: B.temErros ? 0.4 : 1 }} disabled={B.temErros} onClick={() => B.registrarPasso(i, 'ganhou')}>
                                  <CheckCircle2 size={14} /> Green
                                </button>
                                {(B.modo !== 'misto' || i >= B.grupoSize) && B.entradas.length > 1 && (
                                  <button className="btn btn-ghost btn-sm" onClick={() => B.removerEntrada(i)}><Trash2 size={14} /></button>
                                )}
                              </div>
                            )}
                            {passo.status === 'ganhou' && <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(34,197,94,0.1)', color: 'var(--green)', borderRadius: 8, fontSize: 13, fontWeight: 700 }}><CheckCircle2 size={15} style={{ display: 'inline', marginBottom: -3, marginRight: 4 }} /> Green! → {brl(passo.retorno)}</div>}
                            {passo.status === 'perdeu' && <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(239,68,68,0.1)', color: 'var(--red)', borderRadius: 8, fontSize: 13, fontWeight: 700 }}><XCircle size={15} style={{ display: 'inline', marginBottom: -3, marginRight: 4 }} /> Red. Perdeu {brl(passo.apostado)}</div>}
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>

                  <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={B.adicionarEntrada}><PlusCircle size={16} /> Adicionar entrada</button>

                  {/* ── PAINEL DE RESULTADO ── */}
                  {B.modo === 'media' ? (() => {
                    const meta        = B.diaAtual.meta;
                    const banca       = B.bancaEfetiva;
                    const ganhouVal   = parseFloat(B.passos.filter(p => p.status === 'ganhou').reduce((a, p) => a + p.retorno, 0).toFixed(2));
                    const apostadoTotal = parseFloat(B.passos.reduce((a, p) => a + p.apostado, 0).toFixed(2));
                    const perdeuVal   = parseFloat(B.passos.filter(p => p.status === 'perdeu').reduce((a, p) => a + p.apostado, 0).toFixed(2));
                    const pendentes   = B.passos.filter(p => p.status === 'pendente');
                    const maxPossivel = parseFloat((ganhouVal + pendentes.reduce((a, p) => a + p.retorno, 0)).toFixed(2));
                    const falta       = parseFloat((meta - ganhouVal).toFixed(2));
                    const pct         = Math.min(100, (ganhouVal / meta) * 100);
                    const atingiu     = ganhouVal >= meta;
                    const impossivel  = maxPossivel < meta && pendentes.length === 0;

                    return (
                      <div style={{ marginTop: 20, background: 'var(--bg3)', borderRadius: 14, overflow: 'hidden' }}>
                        {/* barra de progresso */}
                        <div style={{ height: 6, background: 'rgba(255,255,255,0.06)' }}>
                          <div style={{ height: '100%', width: `${Math.max(1, pct)}%`, background: atingiu ? 'var(--green)' : 'var(--accent)', transition: 'width .4s ease', borderRadius: 4 }} />
                        </div>

                        <div style={{ padding: '16px 18px' }}>
                          {/* linha de cada entrada — resumo compacto */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 }}>
                            {B.passos.map((p, i) => {
                              const isPend = p.status === 'pendente';
                              const isWin  = p.status === 'ganhou';
                              return (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{
                                      width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontSize: 9, fontWeight: 700, flexShrink: 0,
                                      background: isWin ? 'rgba(34,197,94,0.2)' : isPend ? 'rgba(255,255,255,0.07)' : 'rgba(239,68,68,0.2)',
                                      color: isWin ? 'var(--green)' : isPend ? 'var(--text3)' : 'var(--red)',
                                    }}>
                                      {isWin ? '✓' : isPend ? '?' : '✕'}
                                    </span>
                                    <span style={{ color: 'var(--text3)' }}>Entrada {i + 1} @ {p.odd.toFixed ? p.odd.toFixed(2) : p.odd}x</span>
                                    <span style={{ color: 'var(--text3)' }}>— apostei {brl(p.apostado)}</span>
                                  </div>
                                  <span style={{ fontWeight: 700, fontFamily: 'monospace', color: isWin ? 'var(--green)' : isPend ? 'var(--text2)' : 'var(--red)' }}>
                                    {isWin ? `+${brl(p.retorno - p.apostado)}` : isPend ? brl(p.retorno) : `-${brl(p.apostado)}`}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* separador */}
                          <div style={{ borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 5 }}>
                                  {atingiu ? 'Meta atingida!' : pendentes.length > 0 ? 'Acumulado até agora' : 'Resultado final'}
                                </div>
                                <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'monospace', color: atingiu ? 'var(--green)' : 'var(--text)' }}>
                                  {brl(ganhouVal)}
                                </div>
                                {perdeuVal > 0 && (
                                  <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 3 }}>
                                    perdido: {brl(perdeuVal)}
                                  </div>
                                )}
                              </div>

                              <div style={{ textAlign: 'right' }}>
                                {atingiu ? (
                                  <div style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '10px 16px' }}>
                                    <div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 700 }}>✓ Meta atingida</div>
                                    <div style={{ fontSize: 11, color: 'rgba(34,197,94,.6)', marginTop: 2 }}>+{brl(ganhouVal - banca)} de lucro</div>
                                  </div>
                                ) : impossivel ? (
                                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '10px 16px' }}>
                                    <div style={{ fontSize: 12, color: 'var(--red)', fontWeight: 700 }}>Meta impossível</div>
                                    <div style={{ fontSize: 11, color: 'rgba(239,68,68,.6)', marginTop: 2 }}>restaram {brl(maxPossivel)}</div>
                                  </div>
                                ) : (
                                  <div style={{ background: 'rgba(79,110,247,0.1)', border: '1px solid rgba(79,110,247,0.25)', borderRadius: 10, padding: '10px 16px' }}>
                                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>Falta para a meta</div>
                                    <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', color: 'var(--accent2)' }}>{brl(Math.max(0, falta))}</div>
                                    {pendentes.length > 0 && (
                                      <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>{pendentes.length} entrada(s) pendente(s)</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })() : (
                    <div className="resultado-final" style={{ marginTop: 24, marginBottom: 0 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 6 }}>
                          Se acertar todas
                        </div>
                        <div className="val">{brl(B.retornoProjetado)}</div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: B.retornoProjetado >= B.diaAtual.meta ? 'var(--green)' : 'var(--red)' }}>
                        {B.retornoProjetado >= B.diaAtual.meta ? '✓ Meta atingida' : `Faltam ${brl(B.diaAtual.meta - B.retornoProjetado)}`}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* coluna direita */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* ── APORTE / BANCA DO DIA ── */}
                <div className="card" style={{
                  border: B.diaAtual.aporte > 0 ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--border)',
                  background: B.diaAtual.aporte > 0 ? 'rgba(34,197,94,0.04)' : 'var(--bg2)',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 14 }}>
                    Banca do dia
                  </div>

                  {/* linha base */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, color: 'var(--text3)' }}>Banca base (vinda do dia anterior)</span>
                    <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--text)' }}>{brl(B.diaAtual.bancaInicio)}</span>
                  </div>

                  {/* input aporte */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, marginBottom: 6 }}>Adicionar dinheiro extra (aporte)</label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="number" min={0} step="0.01" placeholder="0,00"
                        value={B.diaAtual.aporte || ''}
                        onChange={(e) => B.salvarAporte(e.target.value)}
                        style={{ flex: 1, padding: '10px 12px', fontSize: 15, fontFamily: 'monospace' }}
                      />
                      {B.diaAtual.aporte > 0 && (
                        <button onClick={() => B.salvarAporte(0)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 6 }}>
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 5 }}>
                      Ex: você tinha R$10 mas adicionou mais R$5 para apostar hoje
                    </div>
                  </div>

                  {/* divider */}
                  <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 12, marginTop: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Banca efetiva para apostar</span>
                      <span style={{ fontSize: 22, fontWeight: 800, fontFamily: 'monospace', color: B.diaAtual.aporte > 0 ? 'var(--green)' : 'var(--text)' }}>
                        {brl(B.bancaEfetiva)}
                      </span>
                    </div>
                    {B.diaAtual.aporte > 0 && (
                      <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 4, textAlign: 'right' }}>
                        {brl(B.diaAtual.bancaInicio)} + {brl(B.diaAtual.aporte)} aporte
                      </div>
                    )}
                  </div>
                </div>

                {/* mercados & anotações */}
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Tag size={14} color="var(--accent2)" />
                    <div className="section-title" style={{ fontSize: 14 }}>Mercados & Anotações</div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>Mercados apostados</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {TAGS_DISPONIVEIS.map((tag) => {
                        const ativa = (B.diaAtual.tags || []).includes(tag.id);
                        return (
                          <button key={tag.id} onClick={() => B.toggleTag(tag.id)} style={{
                            padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                            border: `1px solid ${ativa ? tag.color : 'var(--border2)'}`,
                            background: ativa ? `${tag.color}22` : 'transparent',
                            color: ativa ? tag.color : 'var(--text3)',
                            transition: 'all .15s', fontFamily: 'inherit',
                          }}>
                            {tag.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <textarea
                    placeholder="Análise de jogos, mercados, escanteios..."
                    value={B.diaAtual.anotacao}
                    onChange={(e) => B.salvarAnotacao(e.target.value)}
                  />
                </div>

                {/* resumo do dia */}
                <div className="card">
                  <div className="section-title" style={{ fontSize: 14, marginBottom: 14 }}>Resumo do dia</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { label: 'Banca base',         value: brl(B.diaAtual.bancaInicio),           color: 'var(--text2)' },
                      ...(B.diaAtual.aporte > 0 ? [{ label: 'Aporte extra',   value: `+${brl(B.diaAtual.aporte)}`, color: 'var(--green)' }] : []),
                      { label: 'Banca efetiva',      value: brl(B.bancaEfetiva),                    color: 'var(--text)' },
                      { label: 'Meta do dia',        value: brl(B.diaAtual.meta),                   color: 'var(--accent2)' },
                      { label: 'Lucro necessário',   value: brl(B.diaAtual.meta - B.bancaEfetiva),  color: 'var(--green)' },
                      { label: 'Odd combinada',      value: `${B.oddCombinada.toFixed(3)}x`,        color: B.metaOk ? 'var(--green)' : 'var(--red)' },
                      ...(B.diaAtual.oddSugerida ? [{ label: 'Odd sugerida (recup.)', value: `${B.diaAtual.oddSugerida.toFixed(3)}x`, color: 'var(--amber)' }] : []),
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                        <span style={{ color: 'var(--text3)' }}>{label}</span>
                        <span style={{ fontWeight: 700, color, fontFamily: 'monospace' }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* cenários misto */}
                {B.modo === 'misto' && (
                  <div className="card" style={{ background: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.2)' }}>
                    <div className="section-title" style={{ fontSize: 13, marginBottom: 10, color: 'var(--amber)' }}>Cenários do grupo ({B.grupoSize} entradas)</div>
                    {(() => {
                      const R = B.passos[0]?.retorno || 0;
                      return (
                        <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 2 }}>
                          <div>Todas ganham: <strong style={{ color: 'var(--green)' }}>{brl(R * B.grupoSize)}</strong></div>
                          {B.grupoSize > 1 && <div>{B.grupoSize - 1} de {B.grupoSize} ganham: <strong style={{ color: 'var(--amber)' }}>{brl(R * (B.grupoSize - 1))}</strong></div>}
                          <div>Só 1 ganha: <strong style={{ color: 'var(--amber)' }}>{brl(R)}</strong></div>
                          <div>Todas perdem: <strong style={{ color: 'var(--red)' }}>R$ 0,00</strong></div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* cenários média */}
                {B.modo === 'media' && (
                  <div className="card" style={{ background: 'rgba(79,110,247,0.05)', borderColor: 'rgba(79,110,247,0.2)' }}>
                    <div className="section-title" style={{ fontSize: 13, marginBottom: 10, color: 'var(--accent2)' }}>Retorno por resultado</div>
                    {(() => {
                      const R = B.passos[0]?.retorno || 0;
                      const n = B.passos.length;
                      return (
                        <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 2 }}>
                          {[n, n - 1, Math.ceil(n / 2), 1, 0].filter((v, i, a) => a.indexOf(v) === i && v >= 0).map((k) => (
                            <div key={k}>
                              {k === n ? 'Todas ganham' : k === 0 ? 'Todas perdem' : `${k} de ${n} ganham`}:{' '}
                              <strong style={{ color: k >= Math.ceil(n / 2) ? 'var(--green)' : k > 0 ? 'var(--amber)' : 'var(--red)' }}>{brl(k * R)}</strong>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ════ MODAL ════ */}
      <RecoveryModal
        modal={B.modal}
        diaAtual={B.diaAtual}
        onConfirm={handleModalConfirm}
        onClose={closeModal}
        onExportCSV={B.exportarCSV}
        onExportTxt={B.exportarTexto}
        onResetarDia={B.resetarDia}
      />

    </div>
  );
}