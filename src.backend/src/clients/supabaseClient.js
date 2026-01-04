require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Supabase-Client erstellen
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
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
