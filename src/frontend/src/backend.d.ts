import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Staff {
    id: bigint;
    scheduledInTime: TimeOfDay;
    name: string;
    scheduledOutTime: TimeOfDay;
}
export interface AttendanceRecord {
    lateMinutesIn: bigint;
    isPresent: boolean;
    actualInTime?: TimeOfDay;
    date: string;
    lateForIn: boolean;
    lateForOut: boolean;
    actualOutTime?: TimeOfDay;
    lateMinutesOut: bigint;
}
export interface UserProfile {
    name: string;
}
export interface TimeOfDay {
    hour: bigint;
    minute: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addStaff(name: string, scheduledInHour: bigint, scheduledInMinute: bigint, scheduledOutHour: bigint, scheduledOutMinute: bigint): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAllStaff(): Promise<Array<Staff>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCurrentTime(): Promise<TimeOfDay>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markAttendance(staffId: bigint, date: string, isPresent: boolean): Promise<AttendanceRecord>;
    removeStaff(staffId: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitInTime(staffId: bigint, date: string, hour: bigint, minute: bigint): Promise<AttendanceRecord>;
    submitOutTime(staffId: bigint, date: string, hour: bigint, minute: bigint): Promise<AttendanceRecord>;
    updateStaffTimes(staffId: bigint, scheduledInHour: bigint, scheduledInMinute: bigint, scheduledOutHour: bigint, scheduledOutMinute: bigint): Promise<void>;
}
