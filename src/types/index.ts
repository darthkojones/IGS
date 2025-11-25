// Core entities based on ER diagram

export interface Institution {
  institutionId: string;
  name: string;
  address?: string;
}

export interface Building {
  buildingId: string;
  name: string;
  address: string;
  floorCount?: number;
  roomCount?: number;
  institutionId: string;
}

export interface Room {
  roomId: string;
  name: string;
  floor: number;
  capacity: number;
  buildingId: string;
  equipment: Equipment[];
  status: RoomStatus;
  currentBooking?: Booking;
  description?: string;
  hasProjector?: boolean;
  hasWhiteboard?: boolean;
  hasVideoConference?: boolean;
}

export interface Equipment {
  equipmentId: string;
  name: string;
  type: EquipmentType;
  roomId: string;
}

export enum EquipmentType {
  PROJECTOR = 'projector',
  WHITEBOARD = 'whiteboard',
  COMPUTER = 'computer',
  VIDEO_CONFERENCE = 'video_conference',
  MICROPHONE = 'microphone',
  SPEAKERS = 'speakers',
  AC = 'ac',
  SMART_BOARD = 'smart_board'
}

export interface User {
  userId: string;
  firstName: string;
  lastName: string;
  name: string;
  role: UserRole;
  institutionId?: string;
}

export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  STAFF = 'staff',
  ADMIN = 'admin'
}

export interface Booking {
  bookingId: string;
  roomId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  title: string;
  status: BookingStatus;
  entryMethod?: EntryMethod;
  enteredAt?: Date;
  createdAt: Date;
}

export enum BookingStatus {
  RESERVED = 'reserved',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

export enum EntryMethod {
  QR_CODE = 'qr_code',
  NFC = 'nfc',
  MOTION_SENSOR = 'motion_sensor'
}

export enum RoomStatus {
  FREE = 'free',
  RESERVED = 'reserved',
  OCCUPIED = 'occupied'
}

export interface RoomControl {
  roomId: string;
  doors: boolean;
  lights: boolean;
  ventilation: boolean;
}

export interface Statistics {
  roomId?: string;
  usageFrequency: number;
  averageOccupancyTime: number;
  totalBookings: number;
  noShowRate: number;
  peakHours: { hour: number; count: number }[];
}

export interface Reservation {
  id: string;
  roomId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
}
