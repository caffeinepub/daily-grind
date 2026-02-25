import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { WorkoutScheduleEntry, UserProfile, Tier, TierProgressionResult } from '../backend';
import { useInternetIdentity } from './useInternetIdentity';

// ── Workout Schedules ──────────────────────────────────────────────────────

export function useGetWorkoutSchedules() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<WorkoutScheduleEntry[]>({
    queryKey: ['workoutSchedules'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getWorkoutSchedules();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useCreateOrUpdateWorkoutSchedule() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, schedule }: { id: string; schedule: WorkoutScheduleEntry }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createOrUpdateWorkoutSchedule(id, schedule);
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
      return actor.markWorkoutComplete(id, completed);
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
      return actor.deleteWorkoutSchedule(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutSchedules'] });
    },
  });
}

// ── Motivational Messages ──────────────────────────────────────────────────

export function useRandomMotivationalMessage() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery({
    queryKey: ['randomMotivationalMessage'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getRandomMotivationalMessage();
    },
    enabled: !!actor && !actorFetching,
    staleTime: 1000 * 60 * 5, // 5 minutes
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
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ── Tier System ────────────────────────────────────────────────────────────

export function useUserTier() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  return useQuery<Tier>({
    queryKey: ['userTier'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getUserTier();
    },
    enabled: !!actor && !actorFetching && isAuthenticated,
    retry: false,
  });
}

export function useEvaluateTier() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<TierProgressionResult, Error, bigint>({
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
