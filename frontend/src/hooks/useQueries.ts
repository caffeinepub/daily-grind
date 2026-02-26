import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { WorkoutSchedule, UserProfile } from '../backend';

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
      return actor.createOrUpdateWorkoutSchedule(id, schedule);
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
      return actor.markSetRowComplete(workoutId, rowId, completed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutSchedules'] });
    },
  });
}

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

export function useUserTier() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['userTier'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getUserTier();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useEvaluateTier() {
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
