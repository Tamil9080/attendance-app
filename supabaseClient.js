require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || "https://dhvshvwktvhnulxhpycv.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY || "sb_publishable_Au5Q0tbqfDke68wg1C3fJQ_hbRupqpZ";

if (!supabaseUrl || !supabaseKey) {
  console.error('SERVER ERROR: Supabase credentials missing in .env file.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
