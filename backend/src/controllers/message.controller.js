import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { get } from "mongoose";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getMessages controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteChat = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    // Delete all messages between the two users
    const deleteResult = await Message.deleteMany({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    // Emit socket event to notify both users about chat deletion
    const senderIdStr = myId.toString();
    const receiverIdStr = userToChatId.toString();

    const senderSocketId = getReceiverSocketId(senderIdStr);
    const receiverSocketId = getReceiverSocketId(receiverIdStr);

    // Notify both users about chat deletion
    const chatDeletedData = {
      deletedBy: senderIdStr,
      chatWith: receiverIdStr,
      timestamp: new Date().toISOString()
    };

    if (senderSocketId) {
      io.to(senderSocketId).emit("chatDeleted", chatDeletedData);
    }

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("chatDeleted", chatDeletedData);
    }

    res.status(200).json({
      message: "Chat deleted successfully",
      deletedCount: deleteResult.deletedCount
    });
  } catch (error) {
    console.error("Error in deleteChat controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;

    // Handle image upload
    if (image) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(image, {
          resource_type: "auto",
          timeout: 60000, // Increase timeout for large uploads
        });
        imageUrl = uploadResponse.secure_url;
        console.log("Image uploaded successfully to Cloudinary");
      } catch (uploadError) {
        console.error("Error uploading image to Cloudinary:", uploadError);
        return res.status(500).json({ message: "Error uploading image" });
      }
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });
    const savedMessage = await newMessage.save();
    console.log("Message saved:", savedMessage._id);
    // Convert ObjectIds to strings for consistent comparison
    const senderIdStr = senderId.toString();
    const receiverIdStr = receiverId.toString();

    console.log(`Sending message from ${senderIdStr} to ${receiverIdStr}`);

    // Get sender's socket ID
    const senderSocketId = getReceiverSocketId(senderIdStr);

    // Get receiver's socket ID
    const receiverSocketId = getReceiverSocketId(receiverIdStr); // Broadcast the message to all clients - this ensures both sides get the update
    // (more reliable than individual emits)
    console.log("Broadcasting new message to all connected clients");
    // Create a plain object with string IDs to avoid MongoDB ObjectId issues
    const messageToSend = {
      ...savedMessage.toObject(),
      senderId: senderIdStr,
      receiverId: receiverIdStr,
      _id: savedMessage._id.toString(),
      createdAt: savedMessage.createdAt.toISOString(),
      updatedAt: savedMessage.updatedAt.toISOString(),
    };

    console.log("MessageToSend details:", {
      sender: messageToSend.senderId,
      receiver: messageToSend.receiverId,
      id: messageToSend._id,
    });

    // First emit to all clients - broadcast approach
    io.emit("newMessage", messageToSend);

    // Then also do targeted emits as backup
    if (receiverSocketId) {
      console.log("Emitting directly to receiver:", receiverSocketId);
      io.to(receiverSocketId).emit("newMessage", messageToSend);
    }

    // Also emit to the sender so they see their own message in real-time
    if (senderSocketId) {
      console.log(
        "Emitting message directly to sender socket:",
        senderSocketId
      );
      io.to(senderSocketId).emit("newMessage", messageToSend);
    }

    res.status(200).json(newMessage);
  } catch (error) {
    console.error("Error in sendMessage controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
