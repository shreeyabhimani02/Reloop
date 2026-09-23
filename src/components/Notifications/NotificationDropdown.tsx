import { useNavigate } from "react-router-dom";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Tag,
  Package,
  Star,
  MessageCircle,
  Info,
  X,
} from "lucide-react";
import { useNotifications, useDeleteNotification, useMarkAllNotificationsRead, useMarkNotificationRead } from "../../hooks/useNotifications";
import type { Notification } from "../../services/notificationService";
import "./NotificationDropdown.css";

interface NotificationDropdownProps {
  onClose: () => void;
}

function getNotificationIcon(type: Notification["type"]) {
  switch (type) {
    case "price_drop":
      return <Tag size={18} />;

    case "listing_sold":
      return <Package size={18} />;

    case "review":
      return <Star size={18} />;

    case "message":
      return <MessageCircle size={18} />;

    default:
      return <Info size={18} />;
  }
}

function formatNotificationTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  if (hours < 24) {
    return `${hours}h ago`;
  }

  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export default function NotificationDropdown({
  onClose,
}: NotificationDropdownProps) {
  const navigate = useNavigate();

  const {
    data,
    isLoading,
    isError,
  } = useNotifications();

  const markReadMutation = useMarkNotificationRead();
  const markAllMutation = useMarkAllNotificationsRead();
  const deleteMutation = useDeleteNotification();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const handleNotificationClick = async (
    notification: Notification
  ) => {
    if (!notification.read) {
      await markReadMutation.mutateAsync(notification._id);
    }

    if (notification.product?._id) {
      navigate(`/product/${notification.product._id}`);
      onClose();
    }
  };

  const handleMarkRead = async (
    event: React.MouseEvent,
    notificationId: string
  ) => {
    event.stopPropagation();

    await markReadMutation.mutateAsync(notificationId);
  };

  const handleDelete = async (
    event: React.MouseEvent,
    notificationId: string
  ) => {
    event.stopPropagation();

    await deleteMutation.mutateAsync(notificationId);
  };

  const handleMarkAllRead = async () => {
    await markAllMutation.mutateAsync();
  };

  return (
    <div className="notification-dropdown">
      <div className="notification-header">
        <div>
          <h3>Notifications</h3>

          {unreadCount > 0 && (
            <span className="notification-unread-summary">
              {unreadCount} unread
            </span>
          )}
        </div>

        <button
          type="button"
          className="notification-close"
          onClick={onClose}
          aria-label="Close notifications"
        >
          <X size={18} />
        </button>
      </div>

      {unreadCount > 0 && (
        <button
          type="button"
          className="notification-mark-all"
          onClick={handleMarkAllRead}
          disabled={markAllMutation.isPending}
        >
          <CheckCheck size={16} />
          {markAllMutation.isPending
            ? "Marking..."
            : "Mark all as read"}
        </button>
      )}

      <div className="notification-list">
        {isLoading && (
          <div className="notification-state">
            <Bell size={28} />
            <p>Loading notifications...</p>
          </div>
        )}

        {isError && !isLoading && (
          <div className="notification-state">
            <Bell size={28} />
            <p>Unable to load notifications.</p>
          </div>
        )}

        {!isLoading &&
          !isError &&
          notifications.length === 0 && (
            <div className="notification-state">
              <Bell size={32} />
              <h4>No notifications yet</h4>
              <p>
                Price drops, messages and other updates will appear here.
              </p>
            </div>
          )}

        {!isLoading &&
          !isError &&
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`notification-item ${
                !notification.read
                  ? "notification-item-unread"
                  : ""
              }`}
              onClick={() =>
                handleNotificationClick(notification)
              }
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" ||
                  event.key === " "
                ) {
                  event.preventDefault();
                  handleNotificationClick(notification);
                }
              }}
            >
              <div className="notification-icon">
                {getNotificationIcon(notification.type)}
              </div>

              <div className="notification-content">
                <div className="notification-title-row">
                  <h4>{notification.title}</h4>

                  {!notification.read && (
                    <span
                      className="notification-unread-dot"
                      aria-label="Unread"
                    />
                  )}
                </div>

                <p>{notification.message}</p>

                {notification.product && (
                  <div className="notification-product">
                    {notification.product.images?.[0] && (
                      <img
                        src={notification.product.images[0]}
                        alt=""
                      />
                    )}

                    <div>
                      <span>
                        {notification.product.title}
                      </span>

                      <strong>
                        ₹
                        {notification.product.price.toLocaleString(
                          "en-IN"
                        )}
                      </strong>
                    </div>
                  </div>
                )}

                <span className="notification-time">
                  {formatNotificationTime(
                    notification.createdAt
                  )}
                </span>
              </div>

              <div className="notification-actions">
                {!notification.read && (
                  <button
                    type="button"
                    onClick={(event) =>
                      handleMarkRead(
                        event,
                        notification._id
                      )
                    }
                    aria-label="Mark as read"
                    title="Mark as read"
                  >
                    <Check size={16} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={(event) =>
                    handleDelete(
                      event,
                      notification._id
                    )
                  }
                  aria-label="Delete notification"
                  title="Delete notification"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}