import {
  useEffect,
} from "react";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notificationService";

import {
  subscribeToNotifications,
  type SocketNotification,
} from "../services/socket";

/* -------------------------------------------------------------------------- */
/* Notifications                                                             */
/* -------------------------------------------------------------------------- */

export function useNotifications(
  enabled = true
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    enabled,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const unsubscribe =
      subscribeToNotifications(
        (
          notification: SocketNotification
        ) => {
          queryClient.setQueryData(
            ["notifications"],
            (oldData:
              | {
                  success: boolean;
                  notifications: SocketNotification[];
                  unreadCount: number;
                }
              | undefined) => {
              if (!oldData) {
                return oldData;
              }

              /*
               * Prevent duplicate notifications
               * if the same event is received twice.
               */
              const alreadyExists =
                oldData.notifications.some(
                  (item) =>
                    item._id ===
                    notification._id
                );

              if (alreadyExists) {
                return oldData;
              }

              return {
                ...oldData,

                notifications: [
                  notification,
                  ...oldData.notifications,
                ],

                unreadCount:
                  oldData.unreadCount + 1,
              };
            }
          );
        }
      );

    return unsubscribe;
  }, [
    enabled,
    queryClient,
  ]);

  return query;
}

/* -------------------------------------------------------------------------- */
/* Mark Notification Read                                                    */
/* -------------------------------------------------------------------------- */

export function useMarkNotificationRead() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      notificationId: string
    ) =>
      markNotificationRead(
        notificationId
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Mark All Notifications Read                                               */
/* -------------------------------------------------------------------------- */

export function useMarkAllNotificationsRead() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn:
      markAllNotificationsRead,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Delete Notification                                                       */
/* -------------------------------------------------------------------------- */

export function useDeleteNotification() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      notificationId: string
    ) =>
      deleteNotification(
        notificationId
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });
    },
  });
}