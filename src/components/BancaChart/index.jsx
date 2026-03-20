import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { brl } from '../../utils/formatters';
 
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1a1e28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px' }}>
      <p style={{ color: '#8b92a8', margin: '0 0 4px', fontSize: 12 }}>{label}</p>
      {payload.map((p) => p.value != null && (
        <p key={p.name} style={{ color: p.color, margin: '2px 0', fontSize: 12, fontWeight: 600 }}>
          {p.name}: {brl(p.value)}
        </p>
      ))}
    </div>
  );
};
 
export default function BancaChart({ dias, bancaInicial, marcos = [] }) {
  const data = useMemo(() => {
    const pts = [{ name: 'Início', Ideal: bancaInicial, Real: bancaInicial }];
    dias.forEach((d) => {
      pts.push({
        name: `D${d.dia}`,
        Ideal: d.metaOriginal,
        Real: d.status !== 'pendente' ? d.bancaFim : null,
      });
    });
    return pts;
  }, [dias, bancaInicial]);
 
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="name" stroke="#4e5568" fontSize={11} tickLine={false} axisLine={false}
          interval={Math.floor(data.length / 8)} />
        <YAxis stroke="#4e5568" fontSize={11} tickLine={false} axisLine={false}
          tickFormatter={(v) => v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`} />
        <Tooltip content={<CustomTooltip />} />
        <Line name="Ideal" type="monotone" dataKey="Ideal"
          stroke="rgba(255,255,255,0.18)" strokeDasharray="5 5" dot={false} strokeWidth={2} />
        <Line name="Real"  type="monotone" dataKey="Real"
          stroke="#4f6ef7" strokeWidth={2.5}
          dot={{ r: 3, fill: '#4f6ef7', strokeWidth: 0 }}
          activeDot={{ r: 5 }} connectNulls={false} />
        {marcos.map((m) => (
          <ReferenceLine
            key={m.dia} x={`D${m.dia}`}
            stroke="#f59e0b" strokeDasharray="4 2" strokeWidth={1.5}
            label={{ value: brl(m.banca), position: 'insideTopRight', fontSize: 10, fill: '#f59e0b' }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}


