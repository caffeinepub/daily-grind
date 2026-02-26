import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

module {
  type DayOfWeek = {
    #monday;
    #tuesday;
    #wednesday;
    #thursday;
    #friday;
    #saturday;
    #sunday;
  };

  type MotivationalMessage = {
    id : Nat;
    message : Text;
  };

  type UserProfile = {
    displayName : Text;
    notificationsEnabled : Bool;
    currentTier : Nat;
    lastEvaluatedWeek : Nat;
  };

  type SetRow = {
    id : Nat;
    description : Text;
    completed : Bool;
  };

  type OldWorkoutSchedule = {
    dayOfWeek : DayOfWeek;
    workoutName : Text;
    workoutDetails : Text;
    timeReminder : ?Text;
    completed : Bool;
    owner : Principal;
  };

  type NewWorkoutSchedule = {
    dayOfWeek : DayOfWeek;
    workoutName : Text;
    workoutDetails : Text;
    timeReminder : ?Text;
    completed : Bool;
    setRows : [SetRow];
    owner : Principal;
  };

  type OldActor = {
    workoutSchedules : Map.Map<Text, OldWorkoutSchedule>;
    motivationalMessages : Map.Map<Nat, MotivationalMessage>;
    userProfiles : Map.Map<Principal, UserProfile>;
  };

  type NewActor = {
    workoutSchedules : Map.Map<Text, NewWorkoutSchedule>;
    motivationalMessages : Map.Map<Nat, MotivationalMessage>;
    userProfiles : Map.Map<Principal, UserProfile>;
  };

  public func run(old : OldActor) : NewActor {
    let newWorkoutSchedules = old.workoutSchedules.map<Text, OldWorkoutSchedule, NewWorkoutSchedule>(
      func(_id, oldSchedule) {
        { oldSchedule with setRows = [] };
      }
    );
    { old with workoutSchedules = newWorkoutSchedules };
  };
};
