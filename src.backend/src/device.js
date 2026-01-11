


class Device {
  baseTopic;
  building;
  floor;
  room;
  deviceName;

  mqtt;
  client;

  constructor(baseTopic, building, floor, room, devicename) {
    if (
      (baseTopic === null || baseTopic === undefined) ||
      (building === null || building === undefined) ||
      (floor === null || floor === undefined) ||
      (room === null || room === undefined) ||
      (devicename === null || devicename === undefined)
    ) { throw Error('Invalid Input'); };
    this.baseTopic = baseTopic;
    this.building = building;
    this.floor = floor;
    this.room = room;
    this.deviceName = devicename;
  }

  getFullDeviceName() {
    return String(`device:${this.baseTopic}/${this.building}/${this.floor}/${this.room}/${this.deviceName}`);
  }

  connect() {
    this.mqtt = require('mqtt');
    this.client = this.mqtt.connect('mqtt://localhost:1883');

    this.client.on('connect', () => console.log(`${this.getFullDeviceName()} is now connected to MQTT broker.`));


  }



}


function main() {
  d = new Device('mci', 'building', 'floor', 'room', 'device')

  console.log(d.getFullDeviceName())

  d.connect()
}

main()
