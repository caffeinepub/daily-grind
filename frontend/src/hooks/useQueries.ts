import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { WorkoutSchedule, UserProfile, SetRow, DayOfWeek } from '../backend';
import { Principal } from '@dfinity/principal';

// ── Workout Schedules ──────────────────────────────────────────────────────

export function useGetWorkoutSchedules() {
  const { actor, isFetching } = useActor();

  return useQuery<WorkoutSchedule[]>({
    queryKey: ['workoutSchedules'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getWorkoutSchedules();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateOrUpdateWorkoutSchedule() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, schedule }: { id: string; schedule: WorkoutSchedule }) => {
      if (!actor) throw new Error('Actor not available');

      // Ensure setRows ids are bigint and all fields are correct
      const normalizedSetRows: SetRow[] = (schedule.setRows ?? []).map((row, index) => ({
        id: typeof row.id === 'bigint' ? row.id : BigInt(index),
        description: row.description ?? '',
        completed: row.completed ?? false,
      }));

      const payload: WorkoutSchedule = {
        dayOfWeek: schedule.dayOfWeek,
        workoutName: schedule.workoutName,
        workoutDetails: schedule.workoutDetails,
        timeReminder: schedule.timeReminder,
        completed: schedule.completed ?? false,
        setRows: normalizedSetRows,
        owner: Principal.anonymous(), // backend overwrites with caller
      };

      await actor.createOrUpdateWorkoutSchedule(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutSchedules'] });
    },
  });
}

export function useMarkWorkoutComplete() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.markWorkoutComplete(id, completed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutSchedules'] });
    },
  });
}

export function useMarkSetRowComplete() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workoutId,
      rowId,
      completed,
    }: {
      workoutId: string;
      rowId: bigint;
      completed: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.markSetRowComplete(workoutId, rowId, completed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutSchedules'] });
    },
  });
}

export function useDeleteWorkoutSchedule() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteWorkoutSchedule(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutSchedules'] });
    },
  });
}

// ── Motivational Messages ──────────────────────────────────────────────────

export function useGetRandomMotivationalMessage() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['randomMotivationalMessage'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getRandomMotivationalMessage();
    },
    enabled: !!actor && !isFetching,
  });
}

// ── User Profile ───────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ── Tier ───────────────────────────────────────────────────────────────────

export function useGetUserTier() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['userTier'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getUserTier();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useEvaluateAndAdvanceTier() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (weekNumber: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.evaluateAndAdvanceTier(weekNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userTier'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}
