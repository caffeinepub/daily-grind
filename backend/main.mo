import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Order "mo:core/Order";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Types
  public type DayOfWeek = {
    #monday;
    #tuesday;
    #wednesday;
    #thursday;
    #friday;
    #saturday;
    #sunday;
  };

  public type WorkoutScheduleEntry = {
    dayOfWeek : DayOfWeek;
    workoutName : Text;
    workoutDetails : Text;
    timeReminder : ?Text;
    completed : Bool;
    owner : Principal;
  };

  module WorkoutScheduleEntry {
    public func compare(entry1 : WorkoutScheduleEntry, entry2 : WorkoutScheduleEntry) : Order.Order {
      switch (Text.compare(entry1.workoutName, entry2.workoutName)) {
        case (#equal) { Text.compare(entry1.workoutDetails, entry2.workoutDetails) };
        case (order) { order };
      };
    };
  };

  public type MotivationalMessage = {
    id : Nat;
    message : Text;
  };

  public type UserProfile = {
    displayName : Text;
    notificationsEnabled : Bool;
  };

  // Initialize authorization state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Persistent state
  let workoutSchedules = Map.empty<Text, WorkoutScheduleEntry>();
  let motivationalMessages = Map.empty<Nat, MotivationalMessage>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Seed motivational messages at initialization
  do {
    motivationalMessages.add(1, { id = 1; message = "Push yourself because no one else is going to do it for you." });
    motivationalMessages.add(2, { id = 2; message = "Great things never come from comfort zones." });
    motivationalMessages.add(3, { id = 3; message = "Success doesn't just find you. You have to go out and get it." });
    motivationalMessages.add(4, { id = 4; message = "It's going to be hard, but hard does not mean impossible." });
    motivationalMessages.add(5, { id = 5; message = "Don't stop when you're tired. Stop when you're done." });
  };

  /// Helper function to check if caller has user role
  func callerHasUserRole(caller : Principal) : Bool {
    AccessControl.hasPermission(accessControlState, caller, #user);
  };

  /// Helper function to check if caller is admin
  func callerIsAdmin(caller : Principal) : Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  // ── Workout Schedules API ──────────────────────────────────────────────────

  /// Create or update a workout schedule entry. Only authenticated users may call this.
  public shared ({ caller }) func createOrUpdateWorkoutSchedule(id : Text, schedule : WorkoutScheduleEntry) : async () {
    if (not callerHasUserRole(caller)) {
      Runtime.trap("Unauthorized: Only users can create or update workout schedules");
    };
    let newSchedule : WorkoutScheduleEntry = {
      dayOfWeek = schedule.dayOfWeek;
      workoutName = schedule.workoutName;
      workoutDetails = schedule.workoutDetails;
      timeReminder = schedule.timeReminder;
      completed = schedule.completed;
      owner = caller;
    };
    workoutSchedules.add(id, newSchedule);
  };

  /// Returns all workout schedule entries owned by the caller.
  public query ({ caller }) func getWorkoutSchedules() : async [WorkoutScheduleEntry] {
    if (not callerHasUserRole(caller)) {
      Runtime.trap("Unauthorized: Only users can view workout schedules");
    };
    workoutSchedules.values().toArray().filter(func(entry) { entry.owner == caller });
  };

  /// Mark a specific workout as complete or incomplete. Only the owner may do this.
  public shared ({ caller }) func markWorkoutComplete(id : Text, completed : Bool) : async () {
    if (not callerHasUserRole(caller)) {
      Runtime.trap("Unauthorized: Only users can mark workouts as complete");
    };
    switch (workoutSchedules.get(id)) {
      case (null) { Runtime.trap("Schedule not found") };
      case (?entry) {
        if (caller != entry.owner) {
          Runtime.trap("Unauthorized: Only the owner can mark this workout as complete");
        };
        let updatedEntry : WorkoutScheduleEntry = {
          dayOfWeek = entry.dayOfWeek;
          workoutName = entry.workoutName;
          workoutDetails = entry.workoutDetails;
          timeReminder = entry.timeReminder;
          completed = completed;
          owner = entry.owner;
        };
        workoutSchedules.add(id, updatedEntry);
      };
    };
  };

  /// Delete a workout schedule entry. Only the owner may delete their own entry.
  public shared ({ caller }) func deleteWorkoutSchedule(id : Text) : async () {
    if (not callerHasUserRole(caller)) {
      Runtime.trap("Unauthorized: Only users can delete workout schedules");
    };
    switch (workoutSchedules.get(id)) {
      case (null) { Runtime.trap("Schedule not found") };
      case (?entry) {
        if (caller != entry.owner) {
          Runtime.trap("Unauthorized: Only the owner can delete this workout schedule");
        };
        workoutSchedules.remove(id);
      };
    };
  };

  // ── Motivational Messages API ──────────────────────────────────────────────

  /// Fetch a motivational message by id. Available to all callers including guests.
  public query func getMotivationalMessage(id : Nat) : async MotivationalMessage {
    switch (motivationalMessages.get(id)) {
      case (null) { Runtime.trap("Message not found") };
      case (?message) { message };
    };
  };

  /// Fetch all motivational messages. Available to all callers including guests.
  public query func getAllMotivationalMessages() : async [MotivationalMessage] {
    motivationalMessages.values().toArray();
  };

  /// Fetch a random motivational message by cycling through available ids.
  public query func getRandomMotivationalMessage() : async MotivationalMessage {
    let total = motivationalMessages.size();
    if (total == 0) {
      Runtime.trap("No motivational messages available");
    };
    switch (motivationalMessages.get(1)) {
      case (null) { Runtime.trap("Message not found") };
      case (?message) { message };
    };
  };

  // ── User Profile API ───────────────────────────────────────────────────────

  /// Get the caller's own profile. Requires authenticated user.
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not callerHasUserRole(caller)) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  /// Save (upsert) the caller's own profile. Requires authenticated user.
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not callerHasUserRole(caller)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  /// Get a specific user's profile. Callers may only view their own profile unless they are an admin.
  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not callerIsAdmin(caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // ── Admin API ──────────────────────────────────────────────────────────────

  /// Assign a role to a user. Admin only.
  public shared ({ caller }) func assignRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  /// Check whether the caller is an admin.
  public query ({ caller }) func isAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };
};
