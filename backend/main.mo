import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Order "mo:core/Order";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";


actor {
  /// Types
  public type DayOfWeek = {
    #monday;
    #tuesday;
    #wednesday;
    #thursday;
    #friday;
    #saturday;
    #sunday;
  };

  public type SetRow = {
    id : Nat;
    description : Text;
    completed : Bool;
  };

  public type WorkoutSchedule = {
    dayOfWeek : DayOfWeek;
    workoutName : Text;
    workoutDetails : Text;
    timeReminder : ?Text;
    completed : Bool;
    setRows : [SetRow];
    owner : Principal;
  };

  module WorkoutSchedule {
    public func compare(entry1 : WorkoutSchedule, entry2 : WorkoutSchedule) : Order.Order {
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
    currentTier : Nat;
    lastEvaluatedWeek : Nat;
  };

  public type Tier = {
    index : Nat;
    name : Text;
  };

  public type TierProgressionResult = {
    newTier : Tier;
    previousTier : Tier;
    direction : { #up; #down; #same };
  };

  /// Tier constant (TODO: Move to JS)
  let tiers : [Tier] = [
    { index = 0; name = "Dirt 1" },
    { index = 1; name = "Dirt 2" },
    { index = 2; name = "Dirt 3" },
    { index = 3; name = "Bronze 1" },
    { index = 4; name = "Bronze 2" },
    { index = 5; name = "Bronze 3" },
    { index = 6; name = "Silver 1" },
    { index = 7; name = "Silver 2" },
    { index = 8; name = "Silver 3" },
    { index = 9; name = "Platinum 1" },
    { index = 10; name = "Platinum 2" },
    { index = 11; name = "Platinum 3" },
    { index = 12; name = "Gold 1" },
    { index = 13; name = "Gold 2" },
    { index = 14; name = "Gold 3" },
    { index = 15; name = "Emerald 1" },
    { index = 16; name = "Emerald 2" },
    { index = 17; name = "Emerald 3" },
    { index = 18; name = "Diamond 1" },
    { index = 19; name = "Diamond 2" },
    { index = 20; name = "Diamond 3" },
    { index = 21; name = "Anti-matter" },
  ];

  // Initialize authorization state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  /// Persistent state
  let workoutSchedules = Map.empty<Text, WorkoutSchedule>();
  let motivationalMessages = Map.empty<Nat, MotivationalMessage>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  /// Seed motivational messages at initialization
  do {
    motivationalMessages.add(1, { id = 1; message = "Push yourself because no one else is going to do it for you." });
    motivationalMessages.add(2, { id = 2; message = "Great things never come from comfort zones." });
    motivationalMessages.add(3, { id = 3; message = "Success doesn't just find you. You have to go out and get it." });
    motivationalMessages.add(4, { id = 4; message = "It's going to be hard, but hard does not mean impossible." });
    motivationalMessages.add(5, { id = 5; message = "Don't stop when you're tired. Stop when you're done." });
  };

  // ── Helper Functions ──────────────────────────────────────────────────────

  /// Helper function to check if caller has user role
  func callerHasUserRole(caller : Principal) : Bool {
    AccessControl.hasPermission(accessControlState, caller, #user);
  };

  /// Helper function to check if caller is admin
  func callerIsAdmin(caller : Principal) : Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  func getCurrentTier(userProfile : UserProfile) : Tier {
    if (userProfile.currentTier < tiers.size()) {
      tiers[userProfile.currentTier];
    } else {
      tiers[0];
    };
  };

  // ── Workout Schedules API ──────────────────────────────────────────────────

  /// Create or update a workout schedule entry. Only authenticated users may call this.
  public shared ({ caller }) func createOrUpdateWorkoutSchedule(id : Text, schedule : WorkoutSchedule) : async () {
    if (not callerHasUserRole(caller)) {
      Runtime.trap("Unauthorized: Only users can create or update workout schedules");
    };
    let newSchedule : WorkoutSchedule = {
      dayOfWeek = schedule.dayOfWeek;
      workoutName = schedule.workoutName;
      workoutDetails = schedule.workoutDetails;
      timeReminder = schedule.timeReminder;
      completed = schedule.completed;
      setRows = schedule.setRows;
      owner = caller;
    };
    workoutSchedules.add(id, newSchedule);
  };

  /// Returns all workout schedule entries owned by the caller.
  public query ({ caller }) func getWorkoutSchedules() : async [WorkoutSchedule] {
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
        let updatedEntry : WorkoutSchedule = {
          dayOfWeek = entry.dayOfWeek;
          workoutName = entry.workoutName;
          workoutDetails = entry.workoutDetails;
          timeReminder = entry.timeReminder;
          completed = completed;
          setRows = entry.setRows;
          owner = entry.owner;
        };
        workoutSchedules.add(id, updatedEntry);
      };
    };
  };

  /// Update a specific set row as complete or incomplete. Only the owner may do this.
  public shared ({ caller }) func markSetRowComplete(workoutId : Text, rowId : Nat, completed : Bool) : async () {
    if (not callerHasUserRole(caller)) {
      Runtime.trap("Unauthorized: Only users can mark workout sets as complete");
    };
    switch (workoutSchedules.get(workoutId)) {
      case (null) { Runtime.trap("Workout not found") };
      case (?workout) {
        if (workout.owner != caller) {
          Runtime.trap("Unauthorized: Only the owner can mark workout sets as complete");
        };
        let updatedRows = workout.setRows.map(
          func(row) {
            if (row.id == rowId) { { row with completed } } else { row };
          }
        );
        let updatedWorkout : WorkoutSchedule = {
          workout with setRows = updatedRows
        };
        workoutSchedules.add(workoutId, updatedWorkout);
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
  /// Preserves existing tier and lastEvaluatedWeek data to prevent users from resetting their tier.
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not callerHasUserRole(caller)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    // Preserve existing tier progression data; do not allow the caller to overwrite it
    let (existingTier, existingWeek) = switch (userProfiles.get(caller)) {
      case (null) { (0, 0) };
      case (?existing) { (existing.currentTier, existing.lastEvaluatedWeek) };
    };

    let newOrDefaultProfile : UserProfile = {
      displayName = profile.displayName;
      notificationsEnabled = profile.notificationsEnabled;
      currentTier = existingTier;
      lastEvaluatedWeek = existingWeek;
    };

    userProfiles.add(caller, newOrDefaultProfile);
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

  // ── Week Evaluation & Tier Progression ──────────────────────────────────────────

  /// Evaluate a specific user's tier progression for a specific week (admin-only).
  public shared ({ caller }) func evaluateUserTierProgression(
    user : Principal,
    weekNumber : Nat,
    completedDays : Nat,
  ) : async TierProgressionResult {
    if (not callerIsAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can evaluate user tiers");
    };

    let profile = switch (userProfiles.get(user)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) { profile };
    };

    evaluateAndUpdateTier(user, profile, weekNumber, completedDays);
  };

  /// Get the caller's current tier without modifying it. Requires authenticated user.
  public query ({ caller }) func getUserTier() : async Tier {
    if (not callerHasUserRole(caller)) {
      Runtime.trap("Unauthorized: Only users can view their tier");
    };
    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) { getCurrentTier(profile) };
    };
  };

  /// Evaluate and advance the caller's tier progression for a specific week.
  /// Requires authenticated user.
  public shared ({ caller }) func evaluateAndAdvanceTier(weekNumber : Nat) : async TierProgressionResult {
    if (not callerHasUserRole(caller)) {
      Runtime.trap("Unauthorized: Only users can evaluate and advance their tier");
    };

    let profile = switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) { profile };
    };

    let completedDays = workoutSchedules.values().toArray().filter(func(entry) { entry.owner == caller }).filter(func(entry) { entry.completed }).size();

    evaluateAndUpdateTier(caller, profile, weekNumber, completedDays);
  };

  /// Helper function to move the user to the new tier based on completed days.
  /// Takes the user principal explicitly to correctly persist the updated profile.
  func evaluateAndUpdateTier(user : Principal, profile : UserProfile, week : Nat, completedDays : Nat) : TierProgressionResult {
    let previousTier = getCurrentTier(profile);

    let completionRate = completedDays.toFloat() / 7.0;
    var newTierIndex = profile.currentTier;
    var direction : { #up; #down; #same } = #same;

    if (completionRate >= 1.0) {
      direction := #up;
      newTierIndex := Nat.min(profile.currentTier + 1, tiers.size() - 1);
    } else if (completionRate >= 0.7) {
      direction := #up;
      newTierIndex := Nat.min(profile.currentTier + 1, tiers.size() - 1);
    } else if (completionRate >= 0.4) {
      direction := #same;
    } else {
      if (profile.currentTier > 0) {
        direction := #down;
        newTierIndex := profile.currentTier - 1;
      } else {
        direction := #same;
        newTierIndex := 0;
      };
    };

    let updatedProfile : UserProfile = {
      profile with
      currentTier = newTierIndex;
      lastEvaluatedWeek = week;
    };

    userProfiles.add(user, updatedProfile);

    {
      newTier = tiers[newTierIndex];
      previousTier;
      direction;
    };
  };

  /// Only for backwards compatibility with the original model (Motoko allows
  /// for null queries). This method should be preferred over getting the
  /// profile directly.
  public query ({ caller }) func isNotificationsEnabled() : async Bool {
    if (not callerHasUserRole(caller)) {
      Runtime.trap("Unauthorized: Only users can view notification preference");
    };

    switch (userProfiles.get(caller)) {
      case (null) { false };
      case (?profile) { profile.notificationsEnabled };
    };
  };
};
