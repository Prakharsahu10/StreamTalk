import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";
import { persist } from "zustand/middleware";

export const useChatStore = create(
  persist(
    (set, get) => ({
      messages: [],
      users: [],
      selectedUser: null,
      isUsersLoading: false,
      isMessagesLoading: false, // Initialize the app
      init: async () => {
        // Store the selectedUserId before fetching users
        const storedSelectedUserId = get().selectedUser?._id;

        // Fetch all users
        await get().getUsers();

        // Check if there was a selected user from previous session
        if (storedSelectedUserId) {
          console.log("Restoring selected user with ID:", storedSelectedUserId);

          // Find the user with matching ID in the freshly fetched users list
          const currentUsers = get().users;
          const matchingUser = currentUsers.find(
            (user) => user._id === storedSelectedUserId
          );

          if (matchingUser) {
            // Update the selectedUser with the fresh user object
            set({ selectedUser: matchingUser });
            // Then load messages for this user
            await get().getMessages(storedSelectedUserId);
          } else {
            console.warn(
              "Previously selected user not found in current users list"
            );
            set({ selectedUser: null }); // Clear selected user if not found
          }
        }
      },

      getUsers: async () => {
        set({ isUsersLoading: true });
        try {
          const response = await axiosInstance.get("/messages/users");
          set({ users: response.data });
        } catch (error) {
          console.error("Error fetching users", error);
          toast.error(error.response?.data?.message || "Failed to fetch users");
        } finally {
          set({ isUsersLoading: false });
        }
      },
      getMessages: async (userId) => {
        set({ isMessagesLoading: true });
        try {
          const response = await axiosInstance.get(`/messages/${userId}`);
          set({ messages: response.data });
        } catch (error) {
          console.error("Error fetching messages", error);
          toast.error(
            error.response?.data?.message || "Failed to fetch messages"
          );
        } finally {
          set({ isMessagesLoading: false });
        }
      },
      sendMessage: async (messageData) => {
        const { selectedUser, messages } = get();
        try {
          const response = await axiosInstance.post(
            `/messages/send/${selectedUser._id}`,
            messageData
          );
          // Update messages immediately in state
          const updatedMessages = [...messages, response.data];
          set({ messages: updatedMessages });
          console.log(
            "Message sent, updated messages:",
            updatedMessages.length
          );
          return response.data;
        } catch (error) {
          console.error("Error sending message:", error);
          toast.error(
            error.response?.data?.message || "Failed to send message"
          );
          throw error;
        }
      },

      deleteChat: async (userId) => {
        try {
          const response = await axiosInstance.delete(`/messages/chat/${userId}`);

          // Clear messages if this is the currently selected chat
          const { selectedUser } = get();
          if (selectedUser && selectedUser._id === userId) {
            set({ messages: [] });
          }

          toast.success("Chat deleted successfully");
          return response.data;
        } catch (error) {
          console.error("Error deleting chat:", error);
          toast.error(
            error.response?.data?.message || "Failed to delete chat"
          );
          throw error;
        }
      },
      subscribeToMessages: () => {
        const { selectedUser } = get();
        if (!selectedUser) {
          console.warn("No selected user for message subscription");
          return;
        }

        const socket = useAuthStore.getState().socket;
        if (!socket) {
          console.warn("Socket not available for message subscription");
          return;
        }

        console.log(
          "Setting up message subscription for user:",
          selectedUser.fullName
        );

        // First remove any existing listeners to avoid duplicates
        socket.off("newMessage");
        socket.off("chatDeleted");

        // Then add new listener with improved handling
        socket.on("newMessage", (newMessage) => {
          console.log("New message received via socket:", newMessage); // Determine if this message belongs to the current conversation
          const authUser = useAuthStore.getState().authUser;

          if (!authUser || !selectedUser) {
            console.log(
              "Auth user or selected user is null, can't process message"
            );
            return;
          }

          // Ensure we're working with string IDs consistently
          const authUserId = authUser._id.toString();
          const selectedUserId = selectedUser._id.toString(); // Always convert IDs to strings for consistent comparison
          const msgSenderId = String(newMessage.senderId);
          const msgReceiverId = String(newMessage.receiverId);

          console.log("Checking relevance of message:", {
            authUserId,
            selectedUserId,
            msgSenderId,
            msgReceiverId,
          });

          const isRelevantToCurrentChat =
            // Message is between current user and selected chat partner
            (msgSenderId === selectedUserId && msgReceiverId === authUserId) ||
            (msgSenderId === authUserId && msgReceiverId === selectedUserId);

          if (!isRelevantToCurrentChat) {
            console.log("Message not relevant to current chat");
            return;
          }

          console.log("Message is relevant to current chat!");

          console.log(
            "Adding new message to chat with:",
            selectedUser.fullName
          ); // Force React to re-render with the new message
          set((state) => {
            // Normalize message ID for comparison
            const newMessageId =
              typeof newMessage._id === "object"
                ? newMessage._id.toString()
                : newMessage._id;

            // Check if the message is already in the list to avoid duplicates
            const isDuplicate = state.messages.some((msg) => {
              const existingId =
                typeof msg._id === "object" ? msg._id.toString() : msg._id;
              return existingId === newMessageId;
            });

            if (isDuplicate) {
              console.log(
                "Message already exists in state, not adding duplicate"
              );
              return state; // Return unchanged state
            }

            const updatedMessages = [...state.messages, newMessage];
            console.log("Updated messages count:", updatedMessages.length);
            return { messages: updatedMessages };
          });
        });

        // Handle chat deletion
        socket.on("chatDeleted", (data) => {
          console.log("Chat deleted via socket:", data);
          const { selectedUser } = get();
          const authUser = useAuthStore.getState().authUser;

          if (!authUser) return;

          const authUserId = authUser._id.toString();
          const chatWithUserId = data.chatWith;

          // If the deleted chat is the currently selected chat, clear messages
          if (selectedUser && selectedUser._id === chatWithUserId) {
            set({ messages: [] });
            if (data.deletedBy !== authUserId) {
              toast.info("This chat was deleted by the other user");
            }
          }
        });
      },
      unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (socket) {
          console.log("Removing socket event listeners");
          socket.off("newMessage");
          socket.off("chatDeleted");
        }
      },

      setSelectedUser: (user) => {
        console.log("Setting selected user:", user);
        set({ selectedUser: user });
        if (user) {
          get().getMessages(user._id);
        }
      },
    }),
    {
      name: "chat-storage", // unique name for localStorage
      partialize: (state) => ({ selectedUser: state.selectedUser }), // only persist selected user
    }
  )
);
