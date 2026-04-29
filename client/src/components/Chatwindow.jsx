import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

export default function ChatWindow({ messages, currentUserId, isTyping, currentChatId }) {
  const bottomRef = useRef(null);
  const isNearBottom = useRef(true);

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
      className="flex-1 p-4 md:p-6 overflow-y-auto space-y-3 bg-[#0b141a]" 
      onScroll={handleScroll}
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231f2a30' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
    >
      <div className="w-full max-w-3xl mx-auto flex flex-col space-y-2 pb-2">
        {messages.length === 0 && (
          <div className="text-center my-8 text-sm text-gray-500 bg-[#1f2c34] inline-block px-4 py-2 rounded-lg mx-auto shadow-sm">
            Messages are end-to-end encrypted. Say hello!
          </div>
        )}
        {messages.map((m, i) => (
          <MessageBubble
            key={i}
            text={m.text}
            status={m.status}
            isOwn={m.from === "me" || m.from === currentUserId}
            time={m.createdAt}
            fileData={m.fileData}
          />
        ))}

        {isTyping && (
          <div className="flex w-full justify-start mb-1 group">
            <div className="bg-[#202c33] text-[#e9edef] rounded-lg rounded-tl-none px-4 py-3 flex items-center gap-1 shadow-sm relative ml-3">
              <span className="absolute top-0 -left-2 w-3 h-3 text-[#202c33]">
                <svg viewBox="0 0 8 13" width="8" height="13" fill="currentColor">
                  <path d="M1.533 3.568L8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z"></path>
                </svg>
              </span>
              <div className="w-[6px] h-[6px] rounded-full bg-[#00a884] animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-[6px] h-[6px] rounded-full bg-[#00a884] animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-[6px] h-[6px] rounded-full bg-[#00a884] animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
}