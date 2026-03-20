import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [erro,    setErro]    = useState('');

  const loginGoogle = async () => {
    setLoading(true);
    setErro('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) { setErro(error.message); setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0d0f14', padding: 20,
    }}>
      <div style={{
        background: '#13161d', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 24, padding: '48px 40px', width: '100%', maxWidth: 400,
        textAlign: 'center',
      }}>
        {/* logo */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontSize: 28, fontWeight: 800, letterSpacing: -1,
            background: 'linear-gradient(135deg,#4f6ef7,#a78bfa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: 6,
          }}>
            BancaControl
          </h1>
          <p style={{ fontSize: 13, color: '#4e5568', fontWeight: 500, letterSpacing: 0.4 }}>
            GESTÃO PROGRESSIVA DE APOSTAS
          </p>
        </div>

        {/* tagline */}
        <div style={{
          background: 'rgba(79,110,247,0.08)', border: '1px solid rgba(79,110,247,0.15)',
          borderRadius: 14, padding: '16px 20px', marginBottom: 32,
        }}>
          <p style={{ fontSize: 13, color: '#8b92a8', lineHeight: 1.7, margin: 0 }}>
            Acompanhe seu desafio, registre apostas e evolua sua banca — de qualquer dispositivo.
          </p>
        </div>

        {/* botão Google */}
        <button
          onClick={loginGoogle}
          disabled={loading}
          style={{
            width: '100%', padding: '14px 20px', borderRadius: 12,
            background: loading ? 'rgba(255,255,255,0.05)' : '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#111', fontWeight: 700, fontSize: 15,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            transition: 'all .2s', fontFamily: 'DM Sans, sans-serif',
          }}
        >
          {loading ? (
            <span style={{ color: '#8b92a8' }}>Redirecionando...</span>
          ) : (
            <>
              {/* ícone Google SVG */}
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.1l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8H6.3C9.7 35.6 16.3 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.1 5.5l6.2 5.2C42.9 35.2 44 30 44 24c0-1.3-.1-2.7-.4-3.9z"/>
              </svg>
              Entrar com Google
            </>
          )}
        </button>

        {erro && (
          <div style={{ marginTop: 16, fontSize: 12, color: '#ef4444', background: 'rgba(239,68,68,0.08)', borderRadius: 8, padding: '8px 12px' }}>
            {erro}
          </div>
        )}

        <p style={{ fontSize: 11, color: '#4e5568', marginTop: 24, lineHeight: 1.6 }}>
          Ao entrar, seus dados ficam sincronizados na nuvem.<br />
          Acesse de qualquer dispositivo com a mesma conta.
        </p>
      </div>
    </div>
  );
}