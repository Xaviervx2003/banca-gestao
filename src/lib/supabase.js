import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  || 'https://ueusymlsintmhrmvtxmt.supabase.co';
const SUPABASE_KEY  = import.meta.env.VITE_SUPABASE_KEY  || 'sb_publishable__P-oslN7wbDrNzbGoOSW7Q_uT-tSEPXueusymlsintmhrmvtxmt';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);