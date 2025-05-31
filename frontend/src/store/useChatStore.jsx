import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useChatStore = create((set) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const response = await axiosInstance.get("/messages/users");
      set({ users: response.data });
    } catch (error) {
      console.error("Error fetching users", error);
      toast.error(error.response?.data?.message || "Error fetching users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  setSelectedUser: (user) => {
    set({ selectedUser: user });
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const response = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: response.data });
    } catch (error) {
      console.error("Error fetching messages", error);
      toast.error(error.response?.data?.message || "Error fetching messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageText) => {
    try {
      const response = await axiosInstance.post(`/messages`, {
        recipientId: set.getState().selectedUser._id,
        text: messageText,
      });

      set((state) => ({
        messages: [...state.messages, response.data],
      }));
    } catch (error) {
      console.error("Error sending message", error);
      toast.error(error.response?.data?.message || "Error sending message");
    }
  },
}));
