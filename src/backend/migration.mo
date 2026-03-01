import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Principal "mo:core/Principal";

module {
  // Types
  type TimeOfDay = {
    hour : Nat;
    minute : Nat;
  };

  type Staff = {
    id : Nat;
    name : Text;
    scheduledInTime : TimeOfDay;
    scheduledOutTime : TimeOfDay;
  };

  type AttendanceRecord = {
    date : Text;
    isPresent : Bool;
    actualInTime : ?TimeOfDay;
    actualOutTime : ?TimeOfDay;
    lateForIn : Bool;
    lateForOut : Bool;
    lateMinutesIn : Nat;
    lateMinutesOut : Nat;
  };

  type UserProfile = {
    name : Text;
  };

  type Actor = {
    staffMap : Map.Map<Nat, Staff>;
    nextStaffId : Nat;
    attendanceMap : Map.Map<Text, AttendanceRecord>;
    userProfiles : Map.Map<Principal, UserProfile>;
  };

  public func run(old : Actor) : Actor {
    // No schema changes needed, just carry old state over unchanged
    old;
  };
};
