import {
  ArrowLeft,
  MessageCircle,
  Send,
  User,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useSearchParams } from "react-router-dom";

import toast from "react-hot-toast";

import {
  useConversationMessages,
  useConversations,
  useSendMessage,
  useChatSocket,
  useMarkConversationAsRead,
  useTypingIndicator,
  useUserOnlineStatus,
} from "../../hooks/useChat";

import { useAuthStore } from "../../store/useAuthStore";

import type {
  ChatMessage,
  Conversation,
} from "../../services/chatService";

import "./Chat.css";

export default function Chat() {
  /* ------------------------------------------------------------------------ */
  /* Authentication                                                           */
  /* ------------------------------------------------------------------------ */

  const currentUser = useAuthStore(
    (state) => state.user
  );

  const authLoading = useAuthStore(
    (state) => state.isLoading
  );

  const currentUserId =
    currentUser?._id
      ? String(currentUser._id)
      : "";

  /* ------------------------------------------------------------------------ */
  /* Router                                                                   */
  /* ------------------------------------------------------------------------ */

  const [searchParams, setSearchParams] =
    useSearchParams();

  const conversationId =
    searchParams.get("conversation") || "";

  /* ------------------------------------------------------------------------ */
  /* Conversations                                                            */
  /* ------------------------------------------------------------------------ */

  const {
    data: conversations = [],
    isLoading: conversationsLoading,
  } = useConversations();

  /* ------------------------------------------------------------------------ */
  /* Messages                                                                 */
  /* ------------------------------------------------------------------------ */

  const {
    data: messages = [],
    isLoading: messagesLoading,
  } = useConversationMessages(
    conversationId
  );

  const sendMessageMutation =
    useSendMessage(conversationId);

  const markAsReadMutation =
    useMarkConversationAsRead(
      conversationId
    );

  /* ------------------------------------------------------------------------ */
  /* Local state                                                              */
  /* ------------------------------------------------------------------------ */

  const [messageText, setMessageText] =
    useState("");

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null);

  const typingTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  /* ------------------------------------------------------------------------ */
  /* Selected conversation                                                    */
  /* ------------------------------------------------------------------------ */

  const selectedConversation = useMemo(
    () =>
      conversations.find(
        (conversation) =>
          conversation._id === conversationId
      ),
    [conversations, conversationId]
  );

  /* ------------------------------------------------------------------------ */
  /* Get other participant                                                    */
  /* ------------------------------------------------------------------------ */

  function getOtherParticipant(
    conversation: Conversation
  ) {
    /*
     * We cannot determine the other user until
     * the authenticated user has been loaded.
     */
    if (!currentUserId) {
      return undefined;
    }

    const otherParticipant =
      conversation.participants.find(
        (participant) =>
          String(participant._id) !==
          currentUserId
      );

    return otherParticipant;
  }

  const otherParticipant =
    selectedConversation
      ? getOtherParticipant(
          selectedConversation
        )
      : undefined;

  /* ------------------------------------------------------------------------ */
  /* Debug                                                                    */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!selectedConversation) {
      return;
    }

    console.log("CHAT AUTH DEBUG:", {
      currentUser,
      currentUserId,
      conversationParticipants:
        selectedConversation.participants.map(
          (participant) => ({
            id: String(participant._id),
            name: participant.name,
          })
        ),
      otherParticipant: otherParticipant
        ? {
            id: String(
              otherParticipant._id
            ),
            name: otherParticipant.name,
          }
        : undefined,
    });
  }, [
    currentUser,
    currentUserId,
    selectedConversation,
    otherParticipant,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Online status                                                            */
  /* ------------------------------------------------------------------------ */

  const isOtherUserOnline =
    useUserOnlineStatus(
      otherParticipant?._id
        ? String(otherParticipant._id)
        : ""
    );

  /* ------------------------------------------------------------------------ */
  /* Real-time messages                                                       */
  /* ------------------------------------------------------------------------ */

  useChatSocket(conversationId);

  const {
    isTyping,
    startTyping,
    stopTyping,
  } = useTypingIndicator(
    conversationId
  );

  /* ------------------------------------------------------------------------ */
  /* Cleanup typing                                                           */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(
          typingTimeoutRef.current
        );

        typingTimeoutRef.current = null;
      }

      if (conversationId) {
        stopTyping();
      }
    };
  }, [
    conversationId,
    stopTyping,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Scroll to latest message                                                 */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  /* ------------------------------------------------------------------------ */
  /* Mark conversation as read                                                */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (
      !conversationId ||
      messagesLoading
    ) {
      return;
    }

    markAsReadMutation.mutate();
  }, [
    conversationId,
    messagesLoading,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Select conversation                                                      */
  /* ------------------------------------------------------------------------ */

  function selectConversation(
    conversation: Conversation
  ) {
    setSearchParams({
      conversation:
        conversation._id,
    });
  }

  /* ------------------------------------------------------------------------ */
  /* Send message                                                             */
  /* ------------------------------------------------------------------------ */

  async function handleSendMessage() {
    const text =
      messageText.trim();

    if (!text) {
      return;
    }

    if (!conversationId) {
      toast.error(
        "Select a conversation first."
      );

      return;
    }

    stopTyping();

    try {
      await sendMessageMutation.mutateAsync(
        text
      );

      setMessageText("");

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
        });
      }, 50);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to send message"
      );
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Enter to send                                                            */
  /* ------------------------------------------------------------------------ */

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      handleSendMessage();
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Format message time                                                      */
  /* ------------------------------------------------------------------------ */

  function formatMessageTime(
    createdAt: string
  ) {
    return new Date(
      createdAt
    ).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  /* ------------------------------------------------------------------------ */
  /* Format conversation time                                                 */
  /* ------------------------------------------------------------------------ */

  function formatConversationTime(
    conversation: Conversation
  ) {
    const date =
      conversation.lastMessageAt
        ? new Date(
            conversation.lastMessageAt
          )
        : new Date(
            conversation.updatedAt
          );

    const now = new Date();

    if (
      date.toDateString() ===
      now.toDateString()
    ) {
      return date.toLocaleTimeString(
        [],
        {
          hour: "numeric",
          minute: "2-digit",
        }
      );
    }

    return date.toLocaleDateString(
      [],
      {
        day: "numeric",
        month: "short",
      }
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Authentication loading                                                  */
  /* ------------------------------------------------------------------------ */

  /*
   * IMPORTANT:
   * This comes AFTER all hooks.
   * This avoids conditional hook execution.
   */
  if (authLoading) {
    return (
      <main className="page chat-page">
        <div className="chat-loading-screen">
          Loading chat...
        </div>
      </main>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <main className="page chat-page">
      <div
        className={
          conversationId
            ? "chat-container chat-has-selection"
            : "chat-container"
        }
      >

        {/* ---------------------------------------------------------------- */}
        {/* Conversation Sidebar                                             */}
        {/* ---------------------------------------------------------------- */}

        <aside className="chat-sidebar">

          <div className="chat-sidebar-header">
            <div>
              <span className="chat-eyebrow">
                ReLoop
              </span>

              <h1>Messages</h1>
            </div>

            <MessageCircle size={22} />
          </div>

          {conversationsLoading ? (
            <div className="chat-sidebar-loading">
              <div className="chat-loading-item" />
              <div className="chat-loading-item" />
              <div className="chat-loading-item" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="chat-empty-sidebar">
              <MessageCircle size={34} />

              <h3>No conversations</h3>

              <p>
                Your conversations with sellers
                will appear here.
              </p>
            </div>
          ) : (
            <div className="conversation-list">

              {conversations.map(
                (conversation) => {
                  const participant =
                    getOtherParticipant(
                      conversation
                    );

                  const isSelected =
                    conversation._id ===
                    conversationId;

                  return (
                    <button
                      key={
                        conversation._id
                      }
                      type="button"
                      className={`conversation-item ${
                        isSelected
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        selectConversation(
                          conversation
                        )
                      }
                    >

                      <div className="conversation-avatar">

                        {participant?.avatar ? (
                          <img
                            src={
                              participant.avatar
                            }
                            alt=""
                          />
                        ) : (
                          participant?.name
                            ?.charAt(0)
                            .toUpperCase() || (
                            <User size={20} />
                          )
                        )}

                      </div>

                      <div className="conversation-content">

                        <div className="conversation-top">

                          <strong>
                            {participant?.name ||
                              "User"}
                          </strong>

                          <span>
                            {formatConversationTime(
                              conversation
                            )}
                          </span>

                        </div>

                        {conversation.product && (
                          <p className="conversation-product">
                            {
                              conversation
                                .product
                                .title
                            }
                          </p>
                        )}

                        <div className="conversation-preview-row">

                          <p className="conversation-preview">
                            {conversation.lastMessage ||
                              "Start a conversation"}
                          </p>

                          {(conversation.unreadCount ??
                            0) > 0 && (
                            <span className="conversation-unread">
                              {
                                conversation.unreadCount
                              }
                            </span>
                          )}

                        </div>

                      </div>

                    </button>
                  );
                }
              )}

            </div>
          )}

        </aside>

        {/* ---------------------------------------------------------------- */}
        {/* Message Window                                                   */}
        {/* ---------------------------------------------------------------- */}

        <section className="chat-window">

          {!conversationId ||
          !selectedConversation ? (

            <div className="chat-no-selection">

              <div className="chat-no-selection-icon">
                <MessageCircle size={38} />
              </div>

              <h2>
                Your conversations
              </h2>

              <p>
                Select a conversation to start
                messaging.
              </p>

            </div>

          ) : (

            <>

              {/* -------------------------------------------------------- */}
              {/* Chat Header                                               */}
              {/* -------------------------------------------------------- */}

              <header className="chat-header">

                <button
                  type="button"
                  className="chat-mobile-back"
                  onClick={() =>
                    setSearchParams({})
                  }
                  aria-label="Back to conversations"
                >
                  <ArrowLeft size={20} />
                </button>

                <div className="chat-header-avatar">

                  {otherParticipant?.avatar ? (

                    <img
                      src={
                        otherParticipant.avatar
                      }
                      alt=""
                    />

                  ) : (

                    otherParticipant?.name
                      ?.charAt(0)
                      .toUpperCase() || (
                      <User size={20} />
                    )

                  )}

                </div>

                <div className="chat-header-info">

                  <h2>
                    {otherParticipant?.name ||
                      "User"}
                  </h2>

                  <div className="chat-user-status">

                    <span
                      className={
                        isOtherUserOnline
                          ? "status-dot online"
                          : "status-dot offline"
                      }
                    />

                    <span>
                      {isOtherUserOnline
                        ? "Online"
                        : "Offline"}
                    </span>

                  </div>

                  {selectedConversation.product && (
                    <p>
                      {
                        selectedConversation
                          .product.title
                      }
                    </p>
                  )}

                </div>

              </header>

              {/* -------------------------------------------------------- */}
              {/* Product Context                                           */}
              {/* -------------------------------------------------------- */}

              {selectedConversation.product && (

                <div className="chat-product-context">

                  <div className="chat-product-image">

                    {selectedConversation
                      .product.images?.[0] && (

                      <img
                        src={
                          selectedConversation
                            .product
                            .images[0]
                        }
                        alt={
                          selectedConversation
                            .product
                            .title
                        }
                      />

                    )}

                  </div>

                  <div>

                    <span>
                      Product
                    </span>

                    <strong>
                      {
                        selectedConversation
                          .product.title
                      }
                    </strong>

                    <p>
                      ₹
                      {selectedConversation
                        .product
                        .price
                        .toLocaleString(
                          "en-IN"
                        )}{" "}
                      ·{" "}
                      {
                        selectedConversation
                          .product
                          .condition
                      }
                    </p>

                  </div>

                </div>

              )}

              {/* -------------------------------------------------------- */}
              {/* Messages                                                 */}
              {/* -------------------------------------------------------- */}

              <div className="messages-area">

                {messagesLoading ? (

                  <div className="messages-loading">
                    Loading messages...
                  </div>

                ) : messages.length === 0 ? (

                  <div className="messages-empty">

                    <MessageCircle size={30} />

                    <p>
                      No messages yet.
                    </p>

                    <span>
                      Start the conversation.
                    </span>

                  </div>

                ) : (

                  messages.map(
                    (
                      message: ChatMessage
                    ) => {

                      const isOwn =
                        String(
                          message.sender._id
                        ) ===
                        currentUserId;

                      return (

                        <div
                          key={
                            message._id
                          }
                          className={`message-row ${
                            isOwn
                              ? "own"
                              : "received"
                          }`}
                        >

                          <div className="message-bubble">

                            <p>
                              {message.text}
                            </p>

                            <span>
                              {formatMessageTime(
                                message.createdAt
                              )}
                            </span>

                          </div>

                        </div>

                      );
                    }
                  )

                )}

                <div
                  ref={
                    messagesEndRef
                  }
                />

              </div>

              {/* -------------------------------------------------------- */}
              {/* Typing Indicator                                          */}
              {/* -------------------------------------------------------- */}

              {isTyping && (

                <div className="typing-indicator">

                  <span></span>
                  <span></span>
                  <span></span>

                  <span className="typing-text">
                    Typing...
                  </span>

                </div>

              )}

              {/* -------------------------------------------------------- */}
              {/* Message Composer                                          */}
              {/* -------------------------------------------------------- */}

              <div className="message-composer">

                <textarea
                  value={messageText}
                  onChange={(event) => {

                    const value =
                      event.target.value;

                    setMessageText(value);

                    if (!value.trim()) {

                      stopTyping();

                      if (
                        typingTimeoutRef.current
                      ) {
                        clearTimeout(
                          typingTimeoutRef.current
                        );

                        typingTimeoutRef.current =
                          null;
                      }

                      return;
                    }

                    startTyping();

                    if (
                      typingTimeoutRef.current
                    ) {
                      clearTimeout(
                        typingTimeoutRef.current
                      );
                    }

                    typingTimeoutRef.current =
                      setTimeout(() => {

                        stopTyping();

                        typingTimeoutRef.current =
                          null;

                      }, 1200);
                  }}
                  onKeyDown={
                    handleKeyDown
                  }
                  placeholder="Write a message..."
                  maxLength={2000}
                  rows={1}
                  disabled={
                    sendMessageMutation.isPending
                  }
                />

                <button
                  type="button"
                  onClick={
                    handleSendMessage
                  }
                  disabled={
                    !messageText.trim() ||
                    sendMessageMutation.isPending
                  }
                  aria-label="Send message"
                >
                  <Send size={18} />
                </button>

              </div>

            </>

          )}

        </section>

      </div>
    </main>
  );
}