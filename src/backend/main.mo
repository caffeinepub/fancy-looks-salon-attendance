import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Types
  public type TimeOfDay = {
    hour : Nat;
    minute : Nat;
  };

  public type Staff = {
    id : Nat;
    name : Text;
    scheduledInTime : TimeOfDay;
    scheduledOutTime : TimeOfDay;
  };

  public type AttendanceRecord = {
    date : Text;
    isPresent : Bool;
    actualInTime : ?TimeOfDay;
    actualOutTime : ?TimeOfDay;
    lateForIn : Bool;
    lateForOut : Bool;
    lateMinutesIn : Nat;
    lateMinutesOut : Nat;
  };

  public type UserProfile = {
    name : Text;
  };

  // State
  let staffMap = Map.empty<Nat, Staff>();
  var nextStaffId = 1;
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Helper Functions
  func calculateTimeDifference(scheduled : TimeOfDay, actual : TimeOfDay) : Int {
    let scheduledMinutes = scheduled.hour * 60 + scheduled.minute;
    let actualMinutes = actual.hour * 60 + actual.minute;
    actualMinutes.toInt() - scheduledMinutes.toInt();
  };

  module Staff {
    public func compare(staff1 : Staff, staff2 : Staff) : Order.Order {
      Nat.compare(staff1.id, staff2.id);
    };
  };

  // User Profile Management (required by frontend)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Staff Management
  public shared ({ caller }) func addStaff(name : Text, scheduledInHour : Nat, scheduledInMinute : Nat, scheduledOutHour : Nat, scheduledOutMinute : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add staff");
    };

    let staff : Staff = {
      id = nextStaffId;
      name;
      scheduledInTime = { hour = scheduledInHour; minute = scheduledInMinute };
      scheduledOutTime = { hour = scheduledOutHour; minute = scheduledOutMinute };
    };

    staffMap.add(nextStaffId, staff);
    nextStaffId += 1;
    staff.id;
  };

  public shared ({ caller }) func removeStaff(staffId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can remove staff");
    };

    staffMap.remove(staffId);
  };

  public shared ({ caller }) func updateStaffTimes(staffId : Nat, scheduledInHour : Nat, scheduledInMinute : Nat, scheduledOutHour : Nat, scheduledOutMinute : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update staff times");
    };

    switch (staffMap.get(staffId)) {
      case (null) { Runtime.trap("Staff not found") };
      case (?staff) {
        let updatedStaff : Staff = {
          id = staff.id;
          name = staff.name;
          scheduledInTime = { hour = scheduledInHour; minute = scheduledInMinute };
          scheduledOutTime = { hour = scheduledOutHour; minute = scheduledOutMinute };
        };
        staffMap.add(staffId, updatedStaff);
      };
    };
  };

  public query func getAllStaff() : async [Staff] {
    staffMap.values().toArray().sort();
  };

  // Attendance Management
  public shared ({ caller }) func markAttendance(staffId : Nat, date : Text, isPresent : Bool) : async AttendanceRecord {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can mark attendance");
    };

    let attendance : AttendanceRecord = {
      date;
      isPresent;
      actualInTime = null;
      actualOutTime = null;
      lateForIn = false;
      lateForOut = false;
      lateMinutesIn = 0;
      lateMinutesOut = 0;
    };

    attendance;
  };

  public shared func submitInTime(staffId : Nat, date : Text, hour : Nat, minute : Nat) : async AttendanceRecord {
    // Staff are unauthenticated and identified by staffId - no permission check needed
    let actualInTime : TimeOfDay = { hour; minute };
    switch (staffMap.get(staffId)) {
      case (null) { Runtime.trap("Staff not found") };
      case (?staff) {
        let lateMinutes = calculateTimeDifference(staff.scheduledInTime, actualInTime);
        let lateForIn = lateMinutes > 0;
        let attendance : AttendanceRecord = {
          date;
          isPresent = true;
          actualInTime = ?actualInTime;
          actualOutTime = null;
          lateForIn;
          lateForOut = false;
          lateMinutesIn = if (lateMinutes > 0) { lateMinutes.toNat() } else { 0 };
          lateMinutesOut = 0;
        };
        attendance;
      };
    };
  };

  public shared func submitOutTime(staffId : Nat, date : Text, hour : Nat, minute : Nat) : async AttendanceRecord {
    // Staff are unauthenticated and identified by staffId - no permission check needed
    let actualOutTime : TimeOfDay = { hour; minute };
    switch (staffMap.get(staffId)) {
      case (null) { Runtime.trap("Staff not found") };
      case (?staff) {
        let earlyMinutes = calculateTimeDifference(staff.scheduledOutTime, actualOutTime) * -1;
        let lateForOut = earlyMinutes > 0;
        let attendance : AttendanceRecord = {
          date;
          isPresent = true;
          actualInTime = null;
          actualOutTime = ?actualOutTime;
          lateForIn = false;
          lateForOut;
          lateMinutesIn = 0;
          lateMinutesOut = if (earlyMinutes > 0) { earlyMinutes.toNat() } else { 0 };
        };
        attendance;
      };
    };
  };

  // Helper function to get current time (HH:MM)
  public query func getCurrentTime() : async TimeOfDay {
    let timestamp = Time.now();
    let currentTime = timestamp / 1_000_000_000;
    let hours = (currentTime / 3600) % 24;
    let minutes = (currentTime / 60) % 60;
    {
      hour = hours.toNat();
      minute = minutes.toNat();
    };
  };
};
