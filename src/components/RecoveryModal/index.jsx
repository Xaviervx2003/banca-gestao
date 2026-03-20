import { RotateCcw, Download } from 'lucide-react';
import { brl } from '../../utils/formatters';
 
export default function RecoveryModal({ modal, diaAtual, onConfirm, onClose, onExportCSV, onExportTxt, onResetarDia }) {
  if (!modal.open) return null;
 
  const fechar = () => onClose();
 
  return (
    <div className="modal-overlay open">
      <div className="modal">
 
        {/* ── RESET DESAFIO ── */}
        {modal.type === 'reset' && (
          <>
            <h3>Resetar desafio?</h3>
            <p>Todos os dados serão apagados permanentemente. Ação sem volta.</p>
            <div className="btn-row">
              <button className="btn btn-ghost" onClick={fechar}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => onConfirm('reset')}>Confirmar</button>
            </div>
          </>
        )}
 
        {/* ── RESET DIA ── */}
        {modal.type === 'reset-dia' && (
          <>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <RotateCcw size={18} style={{ color: 'var(--amber)' }} />
              Resetar Dia {diaAtual?.dia}?
            </h3>
            <p>
              O resultado e as odds deste dia serão apagados. A banca volta para{' '}
              <strong>{brl(diaAtual?.bancaInicio)}</strong> e as metas seguintes são recalculadas.
            </p>
            <div style={{
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--amber)',
            }}>
              Esta ação não apaga os outros dias já registrados.
            </div>
            <div className="btn-row">
              <button className="btn btn-ghost" onClick={fechar}>Cancelar</button>
              <button
                className="btn"
                style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.3)' }}
                onClick={() => { onResetarDia(); fechar(); }}
              >
                <RotateCcw size={14} /> Confirmar Reset
              </button>
            </div>
          </>
        )}
 
        {/* ── EXPORT ── */}
        {modal.type === 'export' && (
          <>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Download size={18} style={{ color: 'var(--accent2)' }} /> Exportar Desafio
            </h3>
            <p>Escolha o formato de exportação:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Exportar CSV', desc: 'Abre no Excel / Sheets. Todos os dias, odds, tags e anotações.', color: 'var(--green)', bg: 'rgba(34,197,94,0.12)', fn: onExportCSV },
                { label: 'Exportar TXT', desc: 'Relatório formatado para leitura. Fácil de compartilhar.',      color: 'var(--accent2)', bg: 'rgba(79,110,247,0.12)', fn: onExportTxt },
              ].map(({ label, desc, color, bg, fn }) => (
                <button key={label} className="btn btn-ghost"
                  style={{ justifyContent: 'flex-start', gap: 12, padding: '14px 16px' }}
                  onClick={() => { fn(); fechar(); }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Download size={16} color={color} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{desc}</div>
                  </div>
                </button>
              ))}
            </div>
            <button className="btn btn-ghost" onClick={fechar}>Cancelar</button>
          </>
        )}
 
        {/* ── RESULTADO DIA (ganhou / perdeu) ── */}
        {(modal.type === 'ganhou' || modal.type === 'perdeu') && (
          <>
            <h3>{modal.type === 'ganhou' ? '🎉 Dia Concluído!' : '😔 Dia Finalizado'}</h3>
            <p>
              {modal.type === 'ganhou'
                ? `Retorno final: ${brl(modal.retornoFinal)}. Banca do próximo dia atualizada.`
                : `Retorno final: ${brl(modal.retornoFinal)}.`}
            </p>
            {modal.type === 'perdeu' && (
              <div
                className="check-group"
                onClick={(e) => { const c = document.getElementById('chk-recup'); if (e.target !== c) c.checked = !c.checked; }}
              >
                <input type="checkbox" id="chk-recup" defaultChecked />
                <div>
                  <div className="check-group-title">Ativar modo recuperação</div>
                  <div className="check-group-desc">
                    Redistribui as metas dos próximos dias via juros compostos reversos para ainda atingir a meta final.
                  </div>
                </div>
              </div>
            )}
            <div className="btn-row" style={{ marginTop: 20 }}>
              {modal.type === 'perdeu' && (
                <button className="btn btn-ghost" onClick={fechar}>Cancelar</button>
              )}
              <button
                className={`btn ${modal.type === 'ganhou' ? 'btn-green' : 'btn-red'}`}
                style={{ gridColumn: modal.type === 'ganhou' ? '1 / -1' : 'auto' }}
                onClick={() => onConfirm('resultado', document.getElementById('chk-recup')?.checked)}
              >
                Salvar Resultado
              </button>
            </div>
          </>
        )}
 
      </div>
    </div>
  );
}
 