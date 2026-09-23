const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export interface NotificationProduct {
  _id: string;
  title: string;
  images: string[];
  price: number;
}

export type NotificationType =
  | "price_drop"
  | "listing_sold"
  | "review"
  | "message"
  | "system";

export interface Notification {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  product?: NotificationProduct;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  notifications: Notification[];
  unreadCount: number;
}

function getToken() {
  return localStorage.getItem("token");
}

// Get notifications
export async function getNotifications(): Promise<NotificationsResponse> {
  const token = getToken();

  const response = await fetch(`${API_URL}/api/notifications`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch notifications");
  }

  return data;
}

// Mark one notification as read
export async function markNotificationRead(
  notificationId: string
): Promise<void> {
  const token = getToken();

  const response = await fetch(
    `${API_URL}/api/notifications/${notificationId}/read`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to mark notification as read");
  }
}

// Mark all notifications as read
export async function markAllNotificationsRead(): Promise<void> {
  const token = getToken();

  const response = await fetch(
    `${API_URL}/api/notifications/read-all`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to mark all notifications as read"
    );
  }
}

// Delete notification
export async function deleteNotification(
  notificationId: string
): Promise<void> {
  const token = getToken();

  const response = await fetch(
    `${API_URL}/api/notifications/${notificationId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete notification");
  }
}