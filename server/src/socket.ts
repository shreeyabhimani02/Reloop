import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Conversation from "./models/Conversation.js";

interface JwtPayload {
  userId: string;
}

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

/*
 * userId -> active socket IDs
 *
 * Example:
 *
 * User A
 *   ├── socket-1
 *   └── socket-2
 *
 * User A is online as long as at least one socket exists.
 */
const onlineUsers = new Map<string, Set<string>>();
let socketIO: Server | null = null;
/* -------------------------------------------------------------------------- */
/* Presence Helpers                                                           */
/* -------------------------------------------------------------------------- */

function addOnlineSocket(
  io: Server,
  userId: string,
  socketId: string
) {
  let sockets = onlineUsers.get(userId);

  const wasOffline =
    !sockets || sockets.size === 0;

  if (!sockets) {
    sockets = new Set<string>();
    onlineUsers.set(userId, sockets);
  }

  sockets.add(socketId);

  /*
   * Only emit online when the user changes
   * from offline -> online.
   */
  if (wasOffline) {
    io.emit("user_online", {
      userId,
    });
  }

  console.log(
    `🟢 User online: ${userId} | Connections: ${sockets.size}`
  );
}

function removeOnlineSocket(
  io: Server,
  userId: string,
  socketId: string
) {
  const sockets =
    onlineUsers.get(userId);

  if (!sockets) {
    return;
  }

  /*
   * If this socket was already removed
   * during explicit logout, don't do anything.
   */
  if (!sockets.has(socketId)) {
    return;
  }

  sockets.delete(socketId);

  if (sockets.size === 0) {
    onlineUsers.delete(userId);

    io.emit("user_offline", {
      userId,
    });

    console.log(
      `🔴 User offline: ${userId}`
    );
  } else {
    console.log(
      `🟡 User still online: ${userId} | Connections: ${sockets.size}`
    );
  }
}

function isUserOnline(
  userId: string
) {
  return (
    (onlineUsers.get(userId)?.size || 0) > 0
  );
}

/* -------------------------------------------------------------------------- */
/* Initialize Socket                                                          */
/* -------------------------------------------------------------------------- */

export function initializeSocket(
  io: Server
) {
  socketIO = io;
  /* ------------------------------------------------------------------------ */
  /* Socket Authentication                                                    */
  /* ------------------------------------------------------------------------ */

  io.use(
    async (
      socket: AuthenticatedSocket,
      next
    ) => {
      try {
        const token =
          socket.handshake.auth?.token;

        if (
          !token ||
          typeof token !== "string"
        ) {
          return next(
            new Error(
              "Authentication required"
            )
          );
        }

        const secret =
          process.env.JWT_SECRET;

        if (!secret) {
          return next(
            new Error(
              "JWT secret is not configured"
            )
          );
        }

        const decoded =
          jwt.verify(
            token,
            secret
          ) as JwtPayload;

        if (
          !decoded.userId ||
          !mongoose.Types.ObjectId.isValid(
            decoded.userId
          )
        ) {
          return next(
            new Error(
              "Invalid authentication token"
            )
          );
        }

        socket.userId =
          decoded.userId;

        next();
      } catch (error) {
        console.error(
          "Socket authentication error:",
          error
        );

        next(
          new Error(
            "Invalid or expired token"
          )
        );
      }
    }
  );

  /* ------------------------------------------------------------------------ */
  /* Connection                                                               */
  /* ------------------------------------------------------------------------ */

  io.on(
    "connection",
    (socket: AuthenticatedSocket) => {
      const userId =
        socket.userId;

      if (!userId) {
        socket.disconnect(true);
        return;
      }

      console.log(
        `🔌 Authenticated socket: ${socket.id} | User: ${userId}`
      );

      addOnlineSocket(
        io,
        userId,
        socket.id
      );

      /* -------------------------------------------------------------------- */
      /* Check User Online                                                    */
      /* -------------------------------------------------------------------- */

      socket.on(
        "check_user_online",
        (targetUserId: string) => {
          if (
            !mongoose.Types.ObjectId.isValid(
              targetUserId
            )
          ) {
            return;
          }

          socket.emit(
            "user_online_status",
            {
              userId: targetUserId,
              isOnline:
                isUserOnline(
                  targetUserId
                ),
            }
          );
        }
      );

      /* -------------------------------------------------------------------- */
      /* Explicit Logout                                                      */
      /* -------------------------------------------------------------------- */

      socket.on(
        "user_logout",
        () => {
          console.log(
            `🚪 Logout requested: ${userId}`
          );

          /*
           * Remove this exact socket immediately.
           *
           * The later Socket.IO disconnect event
           * will see that the socket is already gone
           * and will not emit another offline event.
           */
          removeOnlineSocket(
            io,
            userId,
            socket.id
          );
        }
      );

      /* -------------------------------------------------------------------- */
      /* Join Conversation                                                    */
      /* -------------------------------------------------------------------- */

      socket.on(
        "join_conversation",
        async (
          conversationId: string
        ) => {
          try {
            if (
              !mongoose.Types.ObjectId.isValid(
                conversationId
              )
            ) {
              socket.emit(
                "chat_error",
                {
                  message:
                    "Invalid conversation ID",
                }
              );

              return;
            }

            const conversation =
              await Conversation.findOne(
                {
                  _id: conversationId,
                  participants: userId,
                }
              );

            if (!conversation) {
              socket.emit(
                "chat_error",
                {
                  message:
                    "Conversation access denied",
                }
              );

              return;
            }

            const room =
              `conversation:${conversationId}`;

            socket.join(room);

            socket.emit(
              "conversation_joined",
              {
                conversationId,
              }
            );

            console.log(
              `👥 ${userId} joined ${room}`
            );
          } catch (error) {
            console.error(
              "Join conversation error:",
              error
            );

            socket.emit(
              "chat_error",
              {
                message:
                  "Failed to join conversation",
              }
            );
          }
        }
      );

      /* -------------------------------------------------------------------- */
      /* Leave Conversation                                                   */
      /* -------------------------------------------------------------------- */

      socket.on(
        "leave_conversation",
        (
          conversationId: string
        ) => {
          const room =
            `conversation:${conversationId}`;

          socket.leave(room);

          console.log(
            `👋 ${userId} left ${room}`
          );
        }
      );

      /* -------------------------------------------------------------------- */
      /* Typing Start                                                         */
      /* -------------------------------------------------------------------- */

      socket.on(
        "typing_start",
        async (
          conversationId: string
        ) => {
          try {
            if (
              !mongoose.Types.ObjectId.isValid(
                conversationId
              )
            ) {
              return;
            }

            const conversation =
              await Conversation.findOne(
                {
                  _id: conversationId,
                  participants: userId,
                }
              );

            if (!conversation) {
              return;
            }

            const room =
              `conversation:${conversationId}`;

            socket
              .to(room)
              .emit(
                "user_typing",
                {
                  conversationId,
                  userId,
                }
              );
          } catch (error) {
            console.error(
              "Typing start error:",
              error
            );
          }
        }
      );

      /* -------------------------------------------------------------------- */
      /* Typing Stop                                                          */
      /* -------------------------------------------------------------------- */

      socket.on(
        "typing_stop",
        async (
          conversationId: string
        ) => {
          try {
            if (
              !mongoose.Types.ObjectId.isValid(
                conversationId
              )
            ) {
              return;
            }

            const conversation =
              await Conversation.findOne(
                {
                  _id: conversationId,
                  participants: userId,
                }
              );

            if (!conversation) {
              return;
            }

            const room =
              `conversation:${conversationId}`;

            socket
              .to(room)
              .emit(
                "user_stopped_typing",
                {
                  conversationId,
                  userId,
                }
              );
          } catch (error) {
            console.error(
              "Typing stop error:",
              error
            );
          }
        }
      );

      /* -------------------------------------------------------------------- */
      /* Disconnect                                                           */
      /* -------------------------------------------------------------------- */

      socket.on(
        "disconnect",
        (reason) => {
          console.log(
            `🔌 Socket disconnected: ${socket.id} | Reason: ${reason}`
          );

          removeOnlineSocket(
            io,
            userId,
            socket.id
          );
        }
      );
    }
  );
}

export function emitNotification(
  userId: string,
  notification: {
    _id: string;
    type: string;
    title: string;
    message: string;
    product?: {
      _id: string;
      title: string;
      images: string[];
      price: number;
    };
    read: boolean;
    createdAt: Date;
    updatedAt: Date;
  }
) {
  if (!socketIO) {
    console.warn(
      "⚠️ Socket.IO is not initialized"
    );

    return;
  }

  const userSockets =
    onlineUsers.get(userId);

  if (!userSockets || userSockets.size === 0) {
    return;
  }

  for (const socketId of userSockets) {
    socketIO.to(socketId).emit(
      "new_notification",
      notification
    );
  }

  console.log(
    `🔔 Notification emitted to user: ${userId}`
  );
}