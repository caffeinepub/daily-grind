import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useGetCallerUserProfile } from './useQueries';
import {
  registerServiceWorker,
  getNotificationPermission,
  requestNotificationPermission,
  startNotificationSchedule,
  stopNotificationSchedule,
} from '../utils/notificationService';
import type { UserProfile } from '../backend';

export type NotificationPermissionState = NotificationPermission | 'unsupported' | 'loading';

export interface UseNotificationsReturn {
  permission: NotificationPermissionState;
  isEnabled: boolean;
  isLoading: boolean;
  permissionDenied: boolean;
  enableNotifications: () => Promise<void>;
  disableNotifications: () => Promise<void>;
  sendTestNotification: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { data: userProfile, isFetched: profileFetched } = useGetCallerUserProfile();

  const [permission, setPermission] = useState<NotificationPermissionState>('loading');
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize: register SW and sync state from profile
  useEffect(() => {
    registerServiceWorker();
    const perm = getNotificationPermission();
    setPermission(perm);
  }, []);

  // Sync enabled state from backend profile
  useEffect(() => {
    if (!profileFetched || !userProfile) return;

    const shouldBeEnabled = userProfile.notificationsEnabled;
    const currentPerm = getNotificationPermission();
    setPermission(currentPerm);

    if (shouldBeEnabled && currentPerm === 'granted') {
      setIsEnabled(true);
      startNotificationSchedule();
    } else {
      setIsEnabled(false);
    }
  }, [profileFetched, userProfile]);

  const saveProfile = useCallback(
    async (notificationsEnabled: boolean) => {
      if (!actor || !userProfile) return;
      const updated: UserProfile = {
        ...userProfile,
        notificationsEnabled,
      };
      await actor.saveCallerUserProfile(updated);
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
    [actor, userProfile, queryClient]
  );

  const enableNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const perm = await requestNotificationPermission();
      setPermission(perm);

      if (perm === 'granted') {
        await startNotificationSchedule();
        setIsEnabled(true);
        await saveProfile(true);
      } else {
        setIsEnabled(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [saveProfile]);

  const disableNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      await stopNotificationSchedule();
      setIsEnabled(false);
      await saveProfile(false);
    } finally {
      setIsLoading(false);
    }
  }, [saveProfile]);

  const handleTestNotification = useCallback(async () => {
    const { sendTestNotification } = await import('../utils/notificationService');
    await sendTestNotification();
  }, []);

  return {
    permission,
    isEnabled,
    isLoading,
    permissionDenied: permission === 'denied',
    enableNotifications,
    disableNotifications,
    sendTestNotification: handleTestNotification,
  };
}
