// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://dmrjwhhhpiyxcshpjywy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtcmp3aGhocGl5eGNzaHBqeXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzNTA2ODQsImV4cCI6MjA1MzkyNjY4NH0.MyW187xcWESxKToPpDh27IeeGFS04xjuOtw22q_WAKY";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);