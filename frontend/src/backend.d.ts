import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface WorkoutSchedule {
    workoutDetails: string;
    owner: Principal;
    dayOfWeek: DayOfWeek;
    completed: boolean;
    timeReminder?: string;
    workoutName: string;
}
export interface TierProgressionResult {
    direction: Variant_up_down_same;
    previousTier: Tier;
    newTier: Tier;
}
export interface MotivationalMessage {
    id: bigint;
    message: string;
}
export interface Tier {
    name: string;
    index: bigint;
}
export interface UserProfile {
    lastEvaluatedWeek: bigint;
    notificationsEnabled: boolean;
    displayName: string;
    currentTier: bigint;
}
export enum DayOfWeek {
    tuesday = "tuesday",
    wednesday = "wednesday",
    saturday = "saturday",
    thursday = "thursday",
    sunday = "sunday",
    friday = "friday",
    monday = "monday"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_up_down_same {
    up = "up",
    down = "down",
    same = "same"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Assign a role to a user. Admin only.
     */
    assignRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Create or update a workout schedule entry. Only authenticated users may call this.
     */
    createOrUpdateWorkoutSchedule(id: string, schedule: WorkoutSchedule): Promise<void>;
    /**
     * / Delete a workout schedule entry. Only the owner may delete their own entry.
     */
    deleteWorkoutSchedule(id: string): Promise<void>;
    /**
     * / Evaluate and advance the caller's tier progression for a specific week.
     * / Requires authenticated user.
     */
    evaluateAndAdvanceTier(weekNumber: bigint): Promise<TierProgressionResult>;
    /**
     * / Evaluate a specific user's tier progression for a specific week (admin-only).
     */
    evaluateUserTierProgression(user: Principal, weekNumber: bigint, completedDays: bigint): Promise<TierProgressionResult>;
    /**
     * / Fetch all motivational messages. Available to all callers including guests.
     */
    getAllMotivationalMessages(): Promise<Array<MotivationalMessage>>;
    /**
     * / Get the caller's own profile. Requires authenticated user.
     */
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Fetch a motivational message by id. Available to all callers including guests.
     */
    getMotivationalMessage(id: bigint): Promise<MotivationalMessage>;
    /**
     * / Fetch a random motivational message by cycling through available ids.
     */
    getRandomMotivationalMessage(): Promise<MotivationalMessage>;
    /**
     * / Get a specific user's profile. Callers may only view their own profile unless they are an admin.
     */
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    /**
     * / Get the caller's current tier without modifying it. Requires authenticated user.
     */
    getUserTier(): Promise<Tier>;
    /**
     * / Returns all workout schedule entries owned by the caller.
     */
    getWorkoutSchedules(): Promise<Array<WorkoutSchedule>>;
    /**
     * / Check whether the caller is an admin.
     */
    isAdmin(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / Only for backwards compatibility with the original model (Motoko allows
     * / for null queries). This method should be preferred over getting the
     * / profile directly.
     */
    isNotificationsEnabled(): Promise<boolean>;
    /**
     * / Mark a specific workout as complete or incomplete. Only the owner may do this.
     */
    markWorkoutComplete(id: string, completed: boolean): Promise<void>;
    /**
     * / Save (upsert) the caller's own profile. Requires authenticated user.
     * / Preserves existing tier and lastEvaluatedWeek data to prevent users from resetting their tier.
     */
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
