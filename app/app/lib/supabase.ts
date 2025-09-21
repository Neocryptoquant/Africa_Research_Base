import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';


// NEXT_PUBLIC_SUPABASE_URL=https://bhaqkuozinkoktshjlbj.supabase.co
// NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoYXFrdW96aW5rb2t0c2hqbGJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzOTgyMDMsImV4cCI6MjA3Mzk3NDIwM30.eXTq3QNC34eMjLZ3SObwgPsTN9J3Pmd6tvgQr-1SlBM

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://bhaqkuozinkoktshjlbj.supabase.co';
// const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoYXFrdW96aW5rb2t0c2hqbGJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzOTgyMDMsImV4cCI6MjA3Mzk3NDIwM30.eXTq3QNC34eMjLZ3SObwgPsTN9J3Pmd6tvgQr-1SlBM';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
