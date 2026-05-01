import { format } from "date-fns";
import { useRef, useState } from "react";
import ContextMenu from "./ContextMenu";

export default function Sidebar({
  chats,
  onSelect,
  currentChatId,
  presenceUpdates,
  onLoadMore,
  hasMore,
  isLoading,
  onDeleteConversation
}) {
  const timerRef = useRef(null);

  const [menu, setMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    conversationId: null
  });

  const handleScroll = (e) => {
    const bottom =
      e.target.scrollHeight - Math.ceil(e.target.scrollTop) <=
      e.target.clientHeight + 5;

    if (bottom && hasMore && !isLoading && onLoadMore) {
      onLoadMore();
    }
  };

  const openMenu = (e, conversationId) => {
    e.preventDefault();

    setMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      conversationId
    });
  };

  const handleTouchStart = (e, id) => {
    const touch = e.touches[0];

    timerRef.current = setTimeout(() => {
      setMenu({
        visible: true,
        x: touch.clientX,
        y: touch.clientY,
        conversationId: id
      });
    }, 600); // long press
  };

  const handleTouchEnd = () => {
    clearTimeout(timerRef.current);
  };

  const handleDelete = () => {
    if (!menu.conversationId) return;

    onDeleteConversation(menu.conversationId);

    setMenu({ visible: false, x: 0, y: 0, conversationId: null });
  };

  return (
    <div
      className="flex-1 overflow-y-auto no-scrollbar pb-4 relative"
      onScroll={handleScroll}
    >
      {chats.map((c) => {
        const isSelected = c._id === currentChatId;
        const other = c.otherUser || { username: "Unknown" };

        const presence = presenceUpdates[other._id];
        const isOnline = presence ? presence.isOnline : other.isOnline;

        return (
          <div
            key={c._id}
            onClick={() => onSelect(c)}
            onContextMenu={(e) => openMenu(e, c._id)}
            onTouchStart={(e) => handleTouchStart(e, c._id)}
            onTouchEnd={handleTouchEnd}
            className={`flex items-center gap-3 px-3 py-3 mx-2 mt-1 rounded-xl cursor-pointer ${
              isSelected ? "bg-[#3390ec1a]" : "hover:bg-gray-100"
            }`}
          >
            {/* Avatar */}
            <div className={`relative w-12 h-12 ${isSelected ? 'bg-[#3390ec]' : 'bg-gray-200'} rounded-full flex items-center justify-center ${isSelected ? 'text-white' : 'text-gray-600'} font-medium overflow-hidden`}>
              {other.avatar ? (
                <img src={other.avatar} className="w-full h-full object-cover rounded-full" />
              ) : (
                other.username[0]
              )}
            </div>

            {/* Chat Info */}
            <div className="flex-1">
              <div className="flex justify-between">
                <span className={`font-semibold ${isSelected ? 'text-[#3390ec]' : 'text-[#222]'}`}>{other.username}</span>
                <span className="text-[12px] text-gray-400">
                  {c.lastMessage?.createdAt &&
                    format(new Date(c.lastMessage.createdAt), "HH:mm")}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-gray-400 truncate">
                  {c.lastMessage?.text || "Start chatting"}
                </span>

                {c.unreadCount > 0 && (
                  <span className="bg-[#3390ec] text-white px-2 rounded-full text-xs">
                    {c.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Floating Context Menu */}
      <ContextMenu 
        visible={menu.visible}
        x={menu.x}
        y={menu.y}
        onClose={() => setMenu({ ...menu, visible: false })}
        onDelete={handleDelete}
        label="Delete Chat"
      />

      {isLoading && <p className="text-center text-sm">Loading...</p>}
    </div>
  );
}