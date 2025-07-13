import { X, Trash2 } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useState } from "react";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser, deleteChat } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!selectedUser) return null;

  const handleDeleteChat = async () => {
    setIsDeleting(true);
    try {
      await deleteChat(selectedUser._id);
      setShowDeleteConfirm(false);
      // Don't close the chat automatically, let user see it's empty
    } catch (error) {
      console.error("Error deleting chat:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img
                src={selectedUser.profilePic || "/avatar.png"}
                alt={selectedUser.fullName}
              />
            </div>
          </div>
          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {onlineUsers.includes(String(selectedUser._id))
                ? "Online"
                : "Offline"}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {/* Delete chat button */}
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-circle btn-sm opacity-70"
            >
              <Trash2 size={16} />
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
            >
              <li>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-error hover:bg-error hover:text-error-content"
                >
                  <Trash2 size={16} />
                  Delete Chat
                </button>
              </li>
            </ul>
          </div>

          {/* Close button */}
          <button
            className="btn btn-ghost btn-circle btn-sm opacity-70"
            onClick={() => {
              console.log("Closing chat");
              setSelectedUser(null);
            }}
          >
            <X />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Delete Chat</h3>
            <p className="py-4">
              Are you sure you want to delete this chat with{" "}
              {selectedUser.fullName}? This action cannot be undone and will
              delete all messages.
            </p>
            <div className="modal-action">
              <button
                className="btn"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className={`btn btn-error ${isDeleting ? "loading" : ""}`}
                onClick={handleDeleteChat}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Chat"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ChatHeader;
