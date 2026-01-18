/**
 * Author: wa7205@mci4me.at
 * Modified: 18 Jan 2025
 */

const devices = require('./deviceConfig.json').devices;
const rooms = require('./deviceConfig.json').rooms;

class DeviceParameters {
  name;
  commands;
  statusOff;
  statusOn;
  onStart;

  constructor(name, commands, statusOff, statusOn, onStart) {
    this.name = name;
    this.commands = commands;
    this.statusOff = statusOff;
    this.statusOn = statusOn;
    this.onStart = onStart;
  }
}

class Device {
  baseTopic;
  building;
  floor;
  room;
  deviceName;

  mqtt;
  client;

  parameters;

  lastCommand = { modifier: 'sys', modified: new Date(), status: 0 };

  constructor(baseTopic, building, floor, room, devicename, parameters) {
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
    this.parameters = parameters;
  }

  getFullDeviceName() {
    return `${this.baseTopic}/${this.building}/${this.floor}/${this.room}/${this.deviceName}`;
  }

  getDeviceLevels() {
    return [
      `${this.baseTopic}/${this.building}/${this.floor}/${this.room}/${this.deviceName}/`,
      `${this.baseTopic}/${this.building}/${this.floor}/${this.room}/`,
      `${this.baseTopic}/${this.building}/${this.floor}/`,
      `${this.baseTopic}/${this.building}/`,
      `${this.baseTopic}/`
    ]
  }

  connect() {
    this.mqtt = require('mqtt');
    this.client = this.mqtt.connect('mqtt://localhost:1883');
    this.client.on('connect', () => console.log(`${this.getFullDeviceName()} is now connected to MQTT broker.`));
  }

  subscribe() {
    const levels = this.getDeviceLevels();
    levels.forEach(l => {
      this.client.subscribe(l.concat('request_status'));
      this.client.subscribe(l.concat('command'));
    });
    console.log(`${this.getFullDeviceName()} is now subscribed to ${levels.length * 2} topics`);
  }

  setUpMessageHandler() {
    this.client.on('message', (topic, message) => {
      try {
        if (String(topic).endsWith('request_status')) {
          this.handleStatusRequest()
        } else if (String(topic).endsWith('command')) {
          this.handleCommandRequest(message.toString());
        }
      } catch (error) {
        console.error('Fehler:', error.message);
      }
    });
  }

  handleStatusRequest() {
    console.log('< out', this.getFullDeviceName(), this.lastCommand.status)
    this.client.publish(
      `${this.getFullDeviceName()}/reply_status`,
      JSON.stringify(this.lastCommand),
      { qos: 1}
    )
  }

  handleCommandRequest(message) {
   const command = JSON.parse(message);
   console.log('> in', this.getFullDeviceName(), command.status)
   this.lastCommand = command
  }
}

function main() {
  mockRooms = rooms;
  mockDevices = devices;

  const deviceList = [];
  mockRooms.forEach(r => {
    mockDevices.forEach(d => {
      deviceList.push(
        new Device(
          'mci',
          r.buildingId,
          r.floor,
          r.roomId,
          d.name,
          new DeviceParameters(
            d.name,
            d.commands,
            d.statusOff,
            d.statusOn,
            d.onStart
          )
        )
      )
    })
  })
  deviceList.forEach(d => {
    d.connect();
    d.subscribe();
    d.setUpMessageHandler();
  })
}

main()
