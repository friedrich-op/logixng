import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ruwrnmpgoageamgniqbr.supabase.co";
const SUPABASE_KEY = "sb_publishable_Y4dv4NiOBcX_-qL5_79x0w_M4p_lKGs";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
