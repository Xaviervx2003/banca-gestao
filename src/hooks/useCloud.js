import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const DEBOUNCE_MS = 1500; // salva 1.5s depois da última mudança

export function useCloud(user, challenge, setChallenge) {
  const timerRef    = useRef(null);
  const loadedRef   = useRef(false);

  // ── CARREGAR do Supabase ao logar ─────────────────────────────────────────
  useEffect(() => {
    if (!user || loadedRef.current) return;

    const load = async () => {
      const { data, error } = await supabase
        .from('challenges')
        .select('data')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) { console.error('Supabase load error:', error); return; }

      if (data?.data) {
        // nuvem tem dados — usa eles (mais recentes)
        setChallenge(data.data);
        localStorage.setItem('banca_react', JSON.stringify(data.data));
      }
      // se não tem dados na nuvem, usa o localStorage (já carregado pelo useBanca)
      loadedRef.current = true;
    };

    load();
  }, [user]);

  // ── SALVAR no Supabase com debounce ───────────────────────────────────────
  const sync = useCallback(async (data) => {
    if (!user) return;
    const { error } = await supabase
      .from('challenges')
      .upsert({ user_id: user.id, data }, { onConflict: 'user_id' });
    if (error) console.error('Supabase sync error:', error);
  }, [user]);

  useEffect(() => {
    if (!user || !challenge || !loadedRef.current) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => sync(challenge), DEBOUNCE_MS);
    return () => clearTimeout(timerRef.current);
  }, [challenge, user, sync]);

  // ── DELETAR da nuvem ao resetar desafio ───────────────────────────────────
  const deletarNuvem = useCallback(async () => {
    if (!user) return;
    await supabase.from('challenges').delete().eq('user_id', user.id);
    loadedRef.current = false;
  }, [user]);

  return { deletarNuvem };
}