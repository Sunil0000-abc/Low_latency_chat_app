import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";
import ContextMenu from "./ContextMenu";

export default function ChatWindow({ messages, currentUserId, isTyping, currentChatId, onDeleteMessage }) {
  const [menu, setMenu] = useState({ visible: false, x: 0, y: 0, messageId: null });
  const [animatingOutIds, setAnimatingOutIds] = useState(new Set());
  const bottomRef = useRef(null);
  const isNearBottom = useRef(true);

  const handleOpenMenu = (x, y, id) => {
    setMenu({ visible: true, x, y, messageId: id });
  };

  const handleConfirmDelete = () => {
    const id = menu.messageId;
    if (!id) return;

    // Add to animating set
    setAnimatingOutIds(prev => new Set(prev).add(id));
    
    // Close menu immediately
    setMenu({ ...menu, visible: false });

    // Delay the actual deletion to let animation finish
    setTimeout(() => {
      if (onDeleteMessage) {
        onDeleteMessage(id);
      }
      setAnimatingOutIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300); // matches CSS duration
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // Check if user is within 150px of the bottom
    isNearBottom.current = scrollHeight - scrollTop - clientHeight < 150;
  };

  // Scroll to bottom when entering a new chat section
  useEffect(() => {
    bottomRef.current?.scrollIntoView();
    isNearBottom.current = true;
  }, [currentChatId]);

  // Auto-scroll on new message ONLY if user is already at the bottom
  useEffect(() => {
    if (isNearBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  return (
    <div 
      className="flex-1 p-4 md:p-6 overflow-y-auto bg-[#e7ecef]" 
      onScroll={handleScroll}
    >
      <div className="w-full max-w-3xl mx-auto flex flex-col min-h-full">
        <div className="flex-1" /> {/* Spacer to push messages to bottom */}
        {messages.length === 0 && (
          <div className="text-center my-8 text-[13px] text-gray-500 bg-white/60 inline-block px-4 py-1.5 rounded-full mx-auto shadow-sm backdrop-blur-sm self-center">
            Messages are end-to-end encrypted. Say hello!
          </div>
        )}
        {messages.map((m, i) => (
          <MessageBubble
            key={m._id || i}
            messageId={m._id}
            text={m.text}
            status={m.status}
            isOwn={m.from === "me" || m.from === currentUserId}
            time={m.createdAt}
            fileData={m.fileData}
            onOpenMenu={handleOpenMenu}
            isDeleting={animatingOutIds.has(m._id)}
          />
        ))}

        {isTyping && (
          <div className="flex w-full justify-start mb-4 group px-1">
            <div className="bg-white text-[#222] rounded-xl rounded-tl-none px-4 py-4 flex items-center gap-1.5 shadow-sm relative ml-2 border border-[#e6e6e6]">
              <span className="absolute top-0 -left-2 w-3 h-3 text-white">
                <svg viewBox="0 0 8 13" width="8" height="13" fill="currentColor">
                  <path d="M1.533 3.568L8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z"></path>
                </svg>
              </span>
              <div className="w-[6px] h-[6px] rounded-full bg-[#3390ec] animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-[6px] h-[6px] rounded-full bg-[#3390ec] animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-[6px] h-[6px] rounded-full bg-[#3390ec] animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} className="h-4" />
      </div>

      <ContextMenu 
        visible={menu.visible}
        x={menu.x}
        y={menu.y}
        onClose={() => setMenu({ ...menu, visible: false })}
        onDelete={handleConfirmDelete}
      />
    </div>
  );
}