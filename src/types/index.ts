// Core entities based on ER diagram

export interface Institution {
  institutionId: string;
  name: string;
  fullName: string;
  address?: string;
}

export interface Building {
  buildingId: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
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
  building?: Building; // Optional building data
  equipment: Equipment[];
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
  //name: string;
  email: string;
  role: UserRole;
  institutionId?: string;
  institution?: Institution;
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
  accessToken?: string; // Secure token for QR code access
  room?: Room; // Optional room data
  user?: User; // Optional user data
}

export enum BookingStatus {
  RESERVED = 'reserved',      // Initial state when booking is created
  CONFIRMED = 'confirmed',    // User confirmed they will attend
  ACTIVE = 'active',          // Meeting is currently ongoing
  EXPIRED = 'expired',        // Start time passed without confirmation
  CANCELLED = 'cancelled',    // User or admin cancelled the booking
  COMPLETED = 'completed'     // Meeting ended (only if was active)
}

export enum EntryMethod {
  QR_CODE = 'qr_code',
  NFC = 'nfc',
  MOTION_SENSOR = 'motion_sensor'
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
