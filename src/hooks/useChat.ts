import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createOrGetConversation,
  getConversationMessages,
  getMyConversations,
  markConversationAsRead,
  sendMessage,
  type ChatMessage,
  type Conversation,
} from "../services/chatService";

import {
  connectSocket,
  joinConversation,
  leaveConversation,
  startTyping,
  stopTyping,
} from "../services/socket";

import {
  useEffect,
  useState,
} from "react";

/* -------------------------------------------------------------------------- */
/* Conversations                                                              */
/* -------------------------------------------------------------------------- */

export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: getMyConversations,
  });
}

/* -------------------------------------------------------------------------- */
/* Messages                                                                   */
/* -------------------------------------------------------------------------- */

export function useConversationMessages(
  conversationId: string
) {
  return useQuery<ChatMessage[]>({
    queryKey: [
      "conversation-messages",
      conversationId,
    ],
    queryFn: () =>
      getConversationMessages(conversationId),
    enabled: Boolean(conversationId),
  });
}

/* -------------------------------------------------------------------------- */
/* Mark Conversation As Read                                                  */
/* -------------------------------------------------------------------------- */

export function useMarkConversationAsRead(
  conversationId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      markConversationAsRead(conversationId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Create / Get Conversation                                                  */
/* -------------------------------------------------------------------------- */

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sellerId,
      productId,
    }: {
      sellerId: string;
      productId?: string;
    }) =>
      createOrGetConversation(
        sellerId,
        productId
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Send Message                                                               */
/* -------------------------------------------------------------------------- */

export function useSendMessage(
  conversationId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (text: string) =>
      sendMessage(conversationId, text),

    onSuccess: () => {
      /*
       * Socket.IO adds the actual message to the
       * message list.
       *
       * We only refresh conversations here so the
       * latest message preview and timestamp update.
       */
      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Real-Time Chat Socket                                                      */
/* -------------------------------------------------------------------------- */

export function useChatSocket(
  conversationId: string,
  onMessage?: (message: ChatMessage) => void
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    let socket;

    try {
      socket = connectSocket();
    } catch (error) {
      console.error(
        "Failed to connect chat socket:",
        error
      );

      return;
    }

    const handleNewMessage = (
      message: ChatMessage
    ) => {
      if (
        message.conversation !==
        conversationId
      ) {
        return;
      }

      queryClient.setQueryData<
        ChatMessage[]
      >(
        [
          "conversation-messages",
          conversationId,
        ],
        (oldMessages = []) => {
          const alreadyExists =
            oldMessages.some(
              (existingMessage) =>
                existingMessage._id ===
                message._id
            );

          if (alreadyExists) {
            return oldMessages;
          }

          return [
            ...oldMessages,
            message,
          ];
        }
      );

      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });

      onMessage?.(message);
    };

    socket.on(
      "new_message",
      handleNewMessage
    );

    joinConversation(
      conversationId
    );

    return () => {
      socket.off(
        "new_message",
        handleNewMessage
      );

      leaveConversation(
        conversationId
      );
    };
  }, [
    conversationId,
    queryClient,
    onMessage,
  ]);
}

/* -------------------------------------------------------------------------- */
/* Typing Indicator                                                           */
/* -------------------------------------------------------------------------- */

export function useTypingIndicator(
  conversationId: string
) {
  const [isTyping, setIsTyping] =
    useState(false);

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    let socket;

    try {
      socket = connectSocket();
    } catch (error) {
      console.error(
        "Failed to connect typing socket:",
        error
      );

      return;
    }

    const handleUserTyping = (data: {
      conversationId: string;
      userId: string;
    }) => {
      if (
        data.conversationId !==
        conversationId
      ) {
        return;
      }

      setIsTyping(true);
    };

    const handleUserStoppedTyping =
      (data: {
        conversationId: string;
        userId: string;
      }) => {
        if (
          data.conversationId !==
          conversationId
        ) {
          return;
        }

        setIsTyping(false);
      };

    socket.on(
      "user_typing",
      handleUserTyping
    );

    socket.on(
      "user_stopped_typing",
      handleUserStoppedTyping
    );

    return () => {
      socket.off(
        "user_typing",
        handleUserTyping
      );

      socket.off(
        "user_stopped_typing",
        handleUserStoppedTyping
      );

      setIsTyping(false);
    };
  }, [conversationId]);

  return {
    isTyping,

    startTyping: () =>
      startTyping(conversationId),

    stopTyping: () =>
      stopTyping(conversationId),
  };
}

/* -------------------------------------------------------------------------- */
/* User Online / Offline Status                                               */
/* -------------------------------------------------------------------------- */

export function useUserOnlineStatus(
  userId: string
) {
  const [isOnline, setIsOnline] =
    useState(false);

  useEffect(() => {
    if (!userId) {
      setIsOnline(false);
      return;
    }

    let socket;

    try {
      socket = connectSocket();
    } catch (error) {
      console.error(
        "Failed to connect online status socket:",
        error
      );

      setIsOnline(false);
      return;
    }

    const handleUserOnline = (data: {
      userId: string;
    }) => {
      if (data.userId === userId) {
        setIsOnline(true);
      }
    };

    const handleUserOffline = (data: {
      userId: string;
    }) => {
      if (data.userId === userId) {
        setIsOnline(false);
      }
    };

    const handleOnlineStatus = (data: {
      userId: string;
      isOnline: boolean;
    }) => {
      if (data.userId === userId) {
        setIsOnline(data.isOnline);
      }
    };

    /*
     * Listen first so we don't miss the response
     * from check_user_online.
     */
    socket.on(
      "user_online",
      handleUserOnline
    );

    socket.on(
      "user_offline",
      handleUserOffline
    );

    socket.on(
      "user_online_status",
      handleOnlineStatus
    );

    /*
     * Ask the server for the user's current
     * online status.
     */
    socket.emit(
      "check_user_online",
      userId
    );

    return () => {
      socket.off(
        "user_online",
        handleUserOnline
      );

      socket.off(
        "user_offline",
        handleUserOffline
      );

      socket.off(
        "user_online_status",
        handleOnlineStatus
      );
    };
  }, [userId]);

  return isOnline;
}