/**
 * Author: wa7205@mci4me.at
 * Modified: 18 Jan 2025
 */

require('dotenv').config({ path: '../.env.backend'});

const { createClient } = require('@supabase/supabase-js');

const supabaseClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY
);

module.exports = supabaseClient;
