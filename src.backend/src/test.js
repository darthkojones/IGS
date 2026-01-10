
const supabaseClient = require('./clients/supabaseClient');

async function main() {



  const rooms = await supabaseClient.getAllRooms();

  const testroom = rooms.at(0);

  const bookingsForRoom = supabaseClient.getAllBookingsForRoom(testroom);

  const now = new Date();
  const prev = supabaseClient.findPreviousBooking(bookingsForRoom, now);
  const next = supabaseClient.findNextBooking(bookingsForRoom, now);

  console.log(testroom)
  console.log(prev);
  console.log(next);

}


main()
