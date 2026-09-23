import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

let socket: Socket | null = null;

/* -------------------------------------------------------------------------- */
/* Get Socket                                                                 */
/* -------------------------------------------------------------------------- */

export function getSocket(): Socket {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Authentication required");
  }

  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      auth: {
        token,
      },
      transports: ["websocket"],
    });
  }

  /*
   * Always use the latest token.
   */
  socket.auth = {
    token,
  };

  return socket;
}

/* -------------------------------------------------------------------------- */
/* Connect                                                                    */
/* -------------------------------------------------------------------------- */

export function connectSocket(): Socket {
  const currentSocket = getSocket();

  if (!currentSocket.connected) {
    currentSocket.connect();
  }

  return currentSocket;
}

/* -------------------------------------------------------------------------- */
/* Logout / Disconnect                                                        */
/* -------------------------------------------------------------------------- */

export function disconnectSocket() {
  if (!socket) {
    return;
  }

  /*
   * Tell the server explicitly that this user is logging out.
   * This makes presence update immediately instead of waiting
   * for the normal disconnect event.
   */
  if (socket.connected) {
    socket.emit("user_logout");
  }

  /*
   * Disconnect after notifying the server.
   */
  socket.disconnect();

  /*
   * Remove the client-side socket completely.
   */
  socket.removeAllListeners();

  socket = null;
}

/* -------------------------------------------------------------------------- */
/* Join Conversation                                                          */
/* -------------------------------------------------------------------------- */

export function joinConversation(
  conversationId: string
) {
  const currentSocket = connectSocket();

  currentSocket.emit(
    "join_conversation",
    conversationId
  );
}

/* -------------------------------------------------------------------------- */
/* Leave Conversation                                                         */
/* -------------------------------------------------------------------------- */

export function leaveConversation(
  conversationId: string
) {
  if (!socket || !socket.connected) {
    return;
  }

  socket.emit(
    "leave_conversation",
    conversationId
  );
}

/* -------------------------------------------------------------------------- */
/* Typing Indicators                                                          */
/* -------------------------------------------------------------------------- */

export function startTyping(
  conversationId: string
) {
  const currentSocket = connectSocket();

  currentSocket.emit(
    "typing_start",
    conversationId
  );
}

export function stopTyping(
  conversationId: string
) {
  if (!socket || !socket.connected) {
    return;
  }

  socket.emit(
    "typing_stop",
    conversationId
  );
}

/* -------------------------------------------------------------------------- */
/* Notifications                                                              */
/* -------------------------------------------------------------------------- */

export interface SocketNotification {
  _id: string;
  type:
    | "price_drop"
    | "listing_sold"
    | "review"
    | "message"
    | "system";
  title: string;
  message: string;
  product?: {
    _id: string;
    title: string;
    images: string[];
    price: number;
  };
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export function subscribeToNotifications(
  callback: (notification: SocketNotification) => void
) {
  const currentSocket = connectSocket();

  currentSocket.on(
    "new_notification",
    callback
  );

  return () => {
    currentSocket.off(
      "new_notification",
      callback
    );
  };
}