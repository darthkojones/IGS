require('dotenv').config({ path: '../../.env.local'});

const { createClient } = require('@supabase/supabase-js');

// Supabase-Client erstellen
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function getAllBookings() {
  const { data, error } = await supabase
    .from('booking')
    .select('*');

  console.log('Bookings: ', data);

  if (error) {
    console.error('Supabase error fetching bookings', error);
    throw error;
  }

  return data || [];
}

module.exports = {
  supabase,
  getAllBookings
};
