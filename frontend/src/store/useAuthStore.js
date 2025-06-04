import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io, Socket } from "socket.io-client";

// In production, use relative path which will connect to the same host
const BASE_URL =
  import.meta.env.MODE === "development" ? "http://localhost:5001" : "";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,
  checkAuth: async () => {
    try {
      const response = await axiosInstance.get("/auth/check");
      set({ authUser: response.data });

      // Ensure we disconnect any existing socket before reconnecting
      get().disconnectSocket();

      // Connect socket after checking auth
      setTimeout(() => {
        get().connectSocket();
      }, 100); // Small delay to ensure proper sequence
    } catch (error) {
      console.log("Error checking auth", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const response = await axiosInstance.post("/auth/signup", data);
      set({ authUser: response.data });
      toast.success("Account created successfully");
      get().connectSocket(); // Connect socket after signup
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const response = await axiosInstance.post("/auth/login", data);
      set({ authUser: response.data });
      toast.success("Logged in successfully");

      get().connectSocket(); // Connect socket after login
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket(); // Disconnect socket on logout
    } catch (error) {
      console.log("Error logging out", error);
      toast.error(error.response?.data?.message || "Error logging out");
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const response = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: response.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("Error updating profile", error);
      toast.error(error.response?.data?.message || "Error updating profile");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },
  connectSocket: () => {
    const { authUser } = get();
    if (!authUser) return;

    // If already connected, don't reconnect
    if (get().socket?.connected) {
      console.log("Socket already connected:", get().socket.id);
      return;
    }
    try {
      // Convert user ID to string for consistent comparison
      const userIdStr = authUser._id.toString();
      console.log("Attempting to connect socket for user:", userIdStr);

      // Disconnect any existing socket before creating a new one
      const existingSocket = get().socket;
      if (existingSocket) {
        console.log("Disconnecting existing socket before reconnecting");
        existingSocket.disconnect();
      }
      const socket = io(BASE_URL, {
        query: {
          userId: userIdStr,
        },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 20000,
        withCredentials: true,
        forceNew: true,
        autoConnect: true,
      }); // Set up event handlers
      socket.on("connect", () => {
        console.log("Socket connected with ID:", socket.id);
        set({ socket: socket });
      });

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);

        // In production, attempt to reconnect after a delay
        if (import.meta.env.MODE !== "development") {
          console.log("Will attempt to reconnect in 5 seconds...");
          setTimeout(() => {
            console.log("Attempting to reconnect socket...");
            socket.connect();
          }, 5000);
        }
      });

      socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        if (reason === "io server disconnect" || reason === "transport close") {
          // Server disconnected us, try to reconnect
          console.log("Server disconnected, attempting to reconnect...");
          socket.connect();
        }
      });

      socket.on("getOnlineUsers", (userIds) => {
        console.log("Online users updated:", userIds.length);
        set({ onlineUsers: userIds });
      });

      // Connect the socket
      socket.connect();
    } catch (error) {
      console.error("Error setting up socket connection:", error);
    }
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket && socket.connected) {
      socket.disconnect();
      console.log("Socket disconnected");
    }
  },
}));
