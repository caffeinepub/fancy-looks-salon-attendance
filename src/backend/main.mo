import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Migration "migration";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

(with migration = Migration.run)
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
  let attendanceMap = Map.empty<Text, AttendanceRecord>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Helper Functions
  func calculateTimeDifference(scheduled : TimeOfDay, actual : TimeOfDay) : Int {
    let scheduledMinutes = scheduled.hour * 60 + scheduled.minute;
    let actualMinutes = actual.hour * 60 + actual.minute;
    actualMinutes.toInt() - scheduledMinutes.toInt();
  };

  func getAttendanceKey(staffId : Nat, date : Text) : Text {
    staffId.toText() # "-" # date;
  };

  module Staff {
    public func compare(staff1 : Staff, staff2 : Staff) : Order.Order {
      Nat.compare(staff1.id, staff2.id);
    };
  };

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    userProfiles.add(caller, profile);
  };

  // Staff Management
  public shared ({ caller }) func addStaff(name : Text, scheduledInHour : Nat, scheduledInMinute : Nat, scheduledOutHour : Nat, scheduledOutMinute : Nat) : async Nat {
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
    staffMap.remove(staffId);
  };

  public shared ({ caller }) func updateStaffTimes(staffId : Nat, scheduledInHour : Nat, scheduledInMinute : Nat, scheduledOutHour : Nat, scheduledOutMinute : Nat) : async () {
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
    let key = getAttendanceKey(staffId, date);
    let existing = attendanceMap.get(key);

    let attendance : AttendanceRecord = {
      date;
      isPresent;
      actualInTime = switch (existing) { case (null) { null }; case (?record) { record.actualInTime } };
      actualOutTime = switch (existing) { case (null) { null }; case (?record) { record.actualOutTime } };
      lateForIn = switch (existing) { case (null) { false }; case (?record) { record.lateForIn } };
      lateForOut = switch (existing) { case (null) { false }; case (?record) { record.lateForOut } };
      lateMinutesIn = switch (existing) { case (null) { 0 }; case (?record) { record.lateMinutesIn } };
      lateMinutesOut = switch (existing) { case (null) { 0 }; case (?record) { record.lateMinutesOut } };
    };

    attendanceMap.add(key, attendance);
    attendance;
  };

  public shared ({ caller }) func submitInTime(staffId : Nat, date : Text, hour : Nat, minute : Nat) : async AttendanceRecord {
    let actualInTime : TimeOfDay = { hour; minute };
    switch (staffMap.get(staffId)) {
      case (null) { Runtime.trap("Staff not found") };
      case (?staff) {
        let lateMinutes = calculateTimeDifference(staff.scheduledInTime, actualInTime);
        let lateForIn = lateMinutes > 0;
        let key = getAttendanceKey(staffId, date);
        let existing = attendanceMap.get(key);

        let attendance : AttendanceRecord = {
          date;
          isPresent = true;
          actualInTime = ?actualInTime;
          actualOutTime = switch (existing) { case (null) { null }; case (?record) { record.actualOutTime } };
          lateForIn;
          lateForOut = switch (existing) { case (null) { false }; case (?record) { record.lateForOut } };
          lateMinutesIn = if (lateMinutes > 0) { lateMinutes.toNat() } else { 0 };
          lateMinutesOut = switch (existing) { case (null) { 0 }; case (?record) { record.lateMinutesOut } };
        };

        attendanceMap.add(key, attendance);
        attendance;
      };
    };
  };

  public shared ({ caller }) func submitOutTime(staffId : Nat, date : Text, hour : Nat, minute : Nat) : async AttendanceRecord {
    let actualOutTime : TimeOfDay = { hour; minute };
    switch (staffMap.get(staffId)) {
      case (null) { Runtime.trap("Staff not found") };
      case (?staff) {
        let earlyMinutes = calculateTimeDifference(staff.scheduledOutTime, actualOutTime) * -1;
        let lateForOut = earlyMinutes > 0;
        let key = getAttendanceKey(staffId, date);
        let existing = attendanceMap.get(key);

        let attendance : AttendanceRecord = {
          date;
          isPresent = switch (existing) { case (null) { true }; case (?record) { record.isPresent } };
          actualInTime = switch (existing) { case (null) { null }; case (?record) { record.actualInTime } };
          actualOutTime = ?actualOutTime;
          lateForIn = switch (existing) { case (null) { false }; case (?record) { record.lateForIn } };
          lateForOut;
          lateMinutesIn = switch (existing) { case (null) { 0 }; case (?record) { record.lateMinutesIn } };
          lateMinutesOut = if (earlyMinutes > 0) { earlyMinutes.toNat() } else { 0 };
        };

        attendanceMap.add(key, attendance);
        attendance;
      };
    };
  };

  public query func getAttendance(staffId : Nat, date : Text) : async ?AttendanceRecord {
    attendanceMap.get(getAttendanceKey(staffId, date));
  };

  public query func getMonthlyAttendanceForStaff(staffId : Nat, yearMonth : Text) : async [AttendanceRecord] {
    let prefix = staffId.toText() # "-" # yearMonth;

    let filteredEntries = attendanceMap.filter(
      func(key, _) {
        key.startsWith(#text(prefix));
      }
    );

    filteredEntries.values().toArray();
  };

  public query func getAllMonthlyAttendance(yearMonth : Text) : async [(Nat, [AttendanceRecord])] {
    let resultMap = Map.empty<Nat, List.List<AttendanceRecord>>();

    for ((key, record) in attendanceMap.entries()) {
      if (key.contains(#text(yearMonth))) {
        let parts = key.split(#char('-')).toArray();
        if (parts.size() > 1) {
          switch (Nat.fromText(parts[0])) {
            case (null) {};
            case (?staffId) {
              let recordList = switch (resultMap.get(staffId)) {
                case (null) {
                  let newList = List.empty<AttendanceRecord>();
                  resultMap.add(staffId, newList);
                  newList;
                };
                case (?existing) { existing };
              };
              recordList.add(record);
            };
          };
        };
      };
    };

    let resultList = List.empty<(Nat, [AttendanceRecord])>();
    for ((staffId, records) in resultMap.entries()) {
      resultList.add((staffId, records.toArray()));
    };
    resultList.toArray();
  };

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
