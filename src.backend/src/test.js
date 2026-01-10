const supabaseClient = require('./clients/supabaseClient');

async function main() {



  const rooms = await supabaseClient.getAllRooms();

  console.log(rooms)
  const testroom = rooms[0];


  const prevAndNext = await supabaseClient.getMinutesToPreviousAndNextBooking(testroom, new Date());

  console.log(prevAndNext)

}


main()
