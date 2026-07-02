require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || "https://zesvaaohtkqwzaggfjpi.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || "sb_publishable_r4nEYMpyywZTCSmMLuLPsQ_L6QvEJFk";

if (!supabaseUrl || !supabaseKey) {
  console.error('SERVER ERROR: Supabase credentials missing in .env file.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
