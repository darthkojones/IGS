/**
 * Author: wa7205@mci4me.at
 * Modified: 18 Jan 2025
 */

const clientPath = __dirname.split('/');
const envPath = clientPath.slice(0, clientPath.length - 3).join('/') + '/.env.local';

require('dotenv').config({ path: envPath });

const { createClient } = require('@supabase/supabase-js');

const supabaseClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_SERVICE_KEY
);

module.exports = supabaseClient;
