import { brl } from '../../utils/formatters';
import { TAGS_DISPONIVEIS } from '../../utils/constants';
 
export default function DayItem({ dia, onClick }) {
  const tags     = (dia.tags || []).map((tid) => TAGS_DISPONIVEIS.find((t) => t.id === tid)).filter(Boolean);
  const aporte   = dia.aporte || 0;
  const bancaEf  = parseFloat((dia.bancaInicio + aporte).toFixed(2));
 
  return (
    <div className={`dia-item ${dia.status}`} onClick={() => onClick(dia)} style={{ cursor: 'pointer' }}>
      <div>
        <div className="dia-num">
          DIA {dia.dia}
          {dia.oddSugerida && <span className="odd-chip">{dia.oddSugerida.toFixed(2)}x</span>}
          {aporte > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 12, marginLeft: 4,
              background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)',
            }}>
              +{brl(aporte)}
            </span>
          )}
        </div>
 
        <div className="dia-valores">
          {aporte > 0
            ? <>{brl(dia.bancaInicio)} <span style={{ color: '#22c55e', fontWeight: 700 }}>+{brl(aporte)}</span> → {brl(dia.meta)}</>
            : <>{brl(dia.bancaInicio)} → {brl(dia.meta)}</>
          }
        </div>
 
        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 5 }}>
            {tags.map((tag) => (
              <span key={tag.id} style={{
                fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 12,
                background: `${tag.color}22`, color: tag.color, border: `1px solid ${tag.color}44`,
              }}>{tag.label}</span>
            ))}
          </div>
        )}
 
        {dia.anotacao && (
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
            "{dia.anotacao.slice(0, 35)}{dia.anotacao.length > 35 ? '...' : ''}"
          </div>
        )}
      </div>
 
      <span className={`badge ${dia.status}`}>
        {dia.status === 'ganhou' ? 'GREEN' : dia.status === 'perdeu' ? 'RED' : 'ABERTO'}
      </span>
    </div>
  );
}
 