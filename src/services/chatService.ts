const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

export interface ChatUser {
  _id: string;
  name: string;
  avatar?: string;
  rating?: number;
  totalRatings?: number;
}

export interface ChatProduct {
  _id: string;
  title: string;
  price: number;
  images: string[];
  condition: string;
}

export interface Conversation {
  _id: string;
  participants: ChatUser[];
  product?: ChatProduct;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  _id: string;
  conversation: string;
  sender: ChatUser;
  text: string;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

interface ConversationResponse {
  success: boolean;
  message?: string;
  conversation: Conversation;
}

interface ConversationsResponse {
  success: boolean;
  message?: string;
  conversations: Conversation[];
}

interface MessagesResponse {
  success: boolean;
  message?: string;
  messages: ChatMessage[];
}

function getAuthHeaders(): HeadersInit {
  const token =
    localStorage.getItem("token");

  if (!token) {
    throw new Error(
      "Authentication required"
    );
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/**
 * Create or get an existing conversation
 */
export async function createOrGetConversation(
  sellerId: string,
  productId?: string
): Promise<Conversation> {
  const response = await fetch(
    `${API_URL}/api/conversations`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        sellerId,
        ...(productId ? { productId } : {}),
      }),
    }
  );

  let data: ConversationResponse;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "Invalid response from server"
    );
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
    }

    throw new Error(
      data.message ||
        "Failed to create conversation"
    );
  }

  return data.conversation;
}


/**
 * Get logged-in user's conversations
 */
export async function getMyConversations(): Promise<
  Conversation[]
> {
  const response = await fetch(
    `${API_URL}/api/conversations`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  let data: ConversationsResponse;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "Invalid response from server"
    );
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
    }

    throw new Error(
      data.message ||
        "Failed to fetch conversations"
    );
  }

  return data.conversations;
}


/**
 * Get messages for a conversation
 */
export async function getConversationMessages(
  conversationId: string
): Promise<ChatMessage[]> {
  const response = await fetch(
    `${API_URL}/api/conversations/${conversationId}/messages`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  let data: MessagesResponse;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "Invalid response from server"
    );
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
    }

    throw new Error(
      data.message ||
        "Failed to fetch messages"
    );
  }

  return data.messages;
}


/**
 * Send a message
 */
export async function sendMessage(
  conversationId: string,
  text: string
): Promise<ChatMessage> {
  const response = await fetch(
    `${API_URL}/api/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        text,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
    }

    throw new Error(
      data.message ||
        "Failed to send message"
    );
  }

  return data.message;
}

export async function markConversationAsRead(
  conversationId: string
): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/conversations/${conversationId}/read`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    }
  );

  let data: {
    success?: boolean;
    message?: string;
  };

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "Invalid response from server"
    );
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      throw new Error(
        "Your session has expired. Please login again."
      );
    }

    throw new Error(
      data.message ||
        "Failed to mark conversation as read"
    );
  }
}