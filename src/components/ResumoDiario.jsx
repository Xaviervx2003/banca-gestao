import { brl } from '../utils/formatters';

export function ResumoDiario({ challenge }) {
  // Evita quebrar se o desafio ainda não foi iniciado
  if (!challenge || !challenge.dias) return null;

  // 1. Identifica o "Dia Atual" (primeiro dia com status 'pendente')
  const idxPendente = challenge.dias.findIndex(d => d.status === 'pendente');

  // Se não achar dia pendente, o desafio foi concluído
  if (idxPendente === -1) {
    return (
      <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#e8f0fe', color: '#1a73e8', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 4px' }}>Desafio Concluído! 🎉</h3>
        <p style={{ margin: 0 }}>Sua banca final fechou em <strong>{brl(challenge.bancaAtual)}</strong>.</p>
      </div>
    );
  }

  // 2. Coleta os dados para o cálculo
  const diaNumero = challenge.dias[idxPendente].dia;
  const bancaAtual = challenge.bancaAtual;

  // 3. Descobre a Meta Ideal
  // A meta ideal para o início do dia atual é a "metaOriginal" do dia anterior.
  // Se for o primeiro dia, a meta ideal é a própria banca inicial.
  const metaIdeal = idxPendente === 0 
    ? challenge.config.bancaInicial 
    : challenge.dias[idxPendente - 1].metaOriginal;

  // 4. Calcula a diferença e define o feedback visual
  const diferenca = bancaAtual - metaIdeal;
  const isPositivo = diferenca >= 0;

  // Cores dinâmicas (Verde para acima/na meta, Laranja/Vermelho para abaixo)
  const bgCor = isPositivo ? '#e6f4ea' : '#fce8e6';
  const textCor = isPositivo ? '#137333' : '#c5221f';
  const borderCor = isPositivo ? '#ceead6' : '#fad2cf';

  return (
    <div style={{
      padding: '16px',
      borderRadius: '8px',
      backgroundColor: bgCor,
      color: textCor,
      border: `1px solid ${borderCor}`,
      marginBottom: '24px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '600' }}>
        Hoje é o dia {diaNumero} 🎯
      </h3>
      <p style={{ margin: 0, fontSize: '15px' }}>
        Sua banca atual é de <strong>{brl(bancaAtual)}</strong>.<br/>
        Você está <strong>{brl(Math.abs(diferenca))}</strong> {isPositivo ? 'acima' : 'abaixo'} da curva ideal.
      </p>
    </div>
  );
}