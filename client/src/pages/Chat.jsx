import { useEffect, useState, useRef } from "react";
import Logo from "../components/Logo";
import useSocket from "../services/socket";
import { getChats, searchUsers, createConversation, getMessages,deleteConversation, deleteMessage } from "../services/api";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/Chatwindow";
import MessageInput from "../components/MessageInput";
import SearchBar from "../components/Searchbar";
import { LogOut, MessageSquare } from "lucide-react";
import { encryptMessage, decryptMessage } from "../utils/encryption";
import { useNavigate } from "react-router-dom";

export default function Chat() {
  const socket = useSocket();
  const navigate = useNavigate();

  const [chats, setChats] = useState([]);
  const [hasMoreChats, setHasMoreChats] = useState(true);
  const [chatSkip, setChatSkip] = useState(0);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 
  const [presenceUpdates, setPresenceUpdates] = useState({});
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async (isLoadMore = false) => {
    try {
      setIsLoadingChats(true);
      const currentSkip = isLoadMore === true ? chatSkip : 0;

      if (!isLoadMore) {
        const cached = localStorage.getItem("cache_chats");
        if (cached) setChats(JSON.parse(cached));
      }

      const data = await getChats(currentSkip, 15);
      
      const safeData = Array.isArray(data) ? data : [];
      
      // Decrypt the lastMessage snippet for the sidebar
      safeData.forEach(chat => {
        if (chat.lastMessage && chat.lastMessage.text) {
          chat.lastMessage.text = decryptMessage(chat.lastMessage.text);
        }
      });

      if (safeData.length < 15) {
        setHasMoreChats(false);
      } else {
        setHasMoreChats(true);
      }

      setChats(prev => {
        const newChats = isLoadMore === true ? [...prev, ...safeData] : safeData;
        const uniqueChats = Array.from(new Map(newChats.map(item => [item._id, item])).values());
        
        if (!isLoadMore) {
          localStorage.setItem("cache_chats", JSON.stringify(uniqueChats));
        }
        return uniqueChats;
      });

      setChatSkip(currentSkip + data.length);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingChats(false);
    }
  };

  useEffect(() => {
    if (!socket) return;
    
    const handleReceive = (msg) => {
      // Decrypt incoming message
      if (msg.text) {
        msg.text = decryptMessage(msg.text);
      }
      
      const clientReceivedAt = Date.now();

      if (msg.clientSentAt && msg.serverReceivedAt) {
            const totalLatency = clientReceivedAt - msg.clientSentAt;
            const clientToServer = msg.serverReceivedAt - msg.clientSentAt;
            const serverToClient = clientReceivedAt - msg.serverReceivedAt;

            console.log("📡 Total:", totalLatency, "ms");
            console.log("📡 Client to Server:", clientToServer, "ms");
            console.log("📡 Server to Client:", serverToClient, "ms");

            // console.log("📡 Total:", totalLatency, "ms");
        }
      setMessages((prev) => [...prev, msg]);
      
      const conversationId = msg.conversationId;
      const amIActiveChat = currentChat && currentChat._id === conversationId;
      if (amIActiveChat) {
        socket.emit("mark_seen", { conversationId, fromUserId: msg.from });
      } else {
        socket.emit("mark_delivered", { conversationId, fromUserId: msg.from });
      }

      setChats(prevChats => {
         const chatIndex = prevChats.findIndex(c => c._id === conversationId);
         if (chatIndex > -1) {
            const updatedChat = { ...prevChats[chatIndex], lastMessage: msg };
            if (!amIActiveChat) {
               updatedChat.unreadCount = (updatedChat.unreadCount || 0) + 1;
            } else {
               updatedChat.unreadCount = 0;
            }
            const newChats = [...prevChats];
            newChats.splice(chatIndex, 1);
            newChats.unshift(updatedChat);
            return newChats;
         }
         // If chat not found, maybe trigger loadChats? For simplicity, we can just return prevChats
         return prevChats;
      });
    };
    
    const handlePresence = (status) => {
      setPresenceUpdates(prev => ({...prev, [status.userId]: status}));
    };

    const handleTyping = (data) => {
      if (currentChat && data.conversationId === currentChat._id) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = (data) => {
      if (currentChat && data.conversationId === currentChat._id) {
        setIsTyping(false);
      }
    };

    const handleMessagesDelivered = (data) => {
      setMessages(prev => prev.map(m => m.conversationId === data.conversationId && m.status === 'sent' ? { ...m, status: 'delivered' } : m));
    };

    const handleMessagesSeen = (data) => {
      setMessages(prev => prev.map(m => m.conversationId === data.conversationId && m.status !== 'seen' ? { ...m, status: 'seen' } : m));
    };

    const handleMessageDeleted = (data) => {
      setMessages((prev) => prev.filter((m) => m._id !== data.messageId));
      
      // Update last message in chat list if needed
      setChats(prevChats => prevChats.map(c => {
        if (c._id === data.conversationId && c.lastMessage?._id === data.messageId) {
          // If the last message was deleted, we ideally fetch the new last message,
          // but for optimistic UI simplicity, we can just clear the text
          return { ...c, lastMessage: { ...c.lastMessage, text: "Message deleted" } };
        }
        return c;
      }));
    };

    socket.on("receive_message", handleReceive);
    socket.on("user_presence", handlePresence);
    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);
    socket.on("messages_delivered", handleMessagesDelivered);
    socket.on("messages_seen", handleMessagesSeen);
    socket.on("messageDeleted", handleMessageDeleted);

    return () => {
      socket.off("receive_message", handleReceive);
      socket.off("user_presence", handlePresence);
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
      socket.off("messages_delivered", handleMessagesDelivered);
      socket.off("messages_seen", handleMessagesSeen);
      socket.off("messageDeleted", handleMessageDeleted);
    };
  }, [socket, currentChat]);

  // Synchronize messages to local storage whenever they update
  useEffect(() => {
    if (currentChat && messages.length > 0) {
      localStorage.setItem(`cache_messages_${currentChat._id}`, JSON.stringify(messages));
    }
  }, [messages, currentChat]);

  const openChat = async (chat) => {
    setCurrentChat(chat);
    setChats(prev => prev.map(c => c._id === chat._id ? { ...c, unreadCount: 0 } : c));
    try {
      const cached = localStorage.getItem(`cache_messages_${chat._id}`);
      if (cached) setMessages(JSON.parse(cached));
      else setMessages([]);

      const msgs = await getMessages(chat._id);
      
      // Decrypt loaded chat messages
      msgs.forEach(m => {
        if (m.text) {
          m.text = decryptMessage(m.text);
        }
      });
      
      setMessages(msgs);
      localStorage.setItem(`cache_messages_${chat._id}`, JSON.stringify(msgs));
      
      // Mark messages as seen when opening the chat
      const meObj = JSON.parse(atob(localStorage.getItem('token').split('.')[1]));
      const receiver = chat.participants.find(p => p !== meObj._id);
      socket.emit("mark_seen", { conversationId: chat._id, fromUserId: receiver });
      
    } catch (e) {
      console.error(e);
      setMessages([]);
    }
    if (window.innerWidth < 768) setIsSidebarOpen(false); // Mobile auto close sidebar
  };

  const handleDeleteConversation = async (conversationId) => {
  // Save previous state (for rollback)
  const prevChats = chats;

  // ✅ Optimistic UI
  setChats(prev => prev.filter(c => c._id !== conversationId));

  // If currently open chat is deleted → reset UI
  if (currentChat?._id === conversationId) {
    setCurrentChat(null);
    setMessages([]);
  }

  // Remove cached messages
  localStorage.removeItem(`cache_messages_${conversationId}`);
  await deleteConversation(conversationId);
  loadChats();
};

  const handleDeleteMessage = async (messageId) => {
    // Optimistic UI
    setMessages(prev => prev.filter(m => m._id !== messageId));
    
    // API call
    const res = await deleteMessage(messageId);
    if (!res && currentChat) {
      // Rollback if failed (simple refetch)
      const msgs = await getMessages(currentChat._id);
      setMessages(msgs);
    }
  };

  const handleUserSelect = async (user) => {
    try {
      const convo = await createConversation(user._id);
      const existing = chats.find(c => c._id === convo._id);
      if (!existing) loadChats(); // refresh if new
      openChat(convo);
    } catch(e) {
      console.error(e);
    }
  };

  const sendMessage = (text, fileData = null) => {
    if (!currentChat) return;

    const meObj = JSON.parse(atob(localStorage.getItem('token').split('.')[1]));
    const receiver = currentChat.participants.find(p => p !== meObj._id);

    const msg = {
      to: receiver,
      text: encryptMessage(text),
      conversationId: currentChat._id,
      clientSentAt: Date.now(),
      ...(fileData && { fileData })
    };

    socket.emit("send_message", msg);
    console.log(msg);
    
    // Use plain text for the local UI optimistic update instead of encrypted text
    const localMsg = { ...msg, text: text, from: "me", status: "sent", createdAt: new Date() };
    setMessages((prev) => [...prev, localMsg]);

    setChats(prevChats => {
         const chatIndex = prevChats.findIndex(c => c._id === currentChat._id);
         if (chatIndex > -1) {
            const updatedChat = { ...prevChats[chatIndex], lastMessage: localMsg };
            const newChats = [...prevChats];
            newChats.splice(chatIndex, 1);
            newChats.unshift(updatedChat);
            return newChats;
         }
         return prevChats;
    });
  };

  const logout = () => {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith("cache_")) {
        localStorage.removeItem(key);
      }
    }
    localStorage.removeItem("token");
    window.dispatchEvent(new Event('storage'));
    navigate("/login");
  };

  // Resolve current chat header user info mappings
  const other = currentChat?.otherUser || { username: currentChat?.participants?.join(', ') || 'Unknown' };
  const presence = presenceUpdates[other._id] || {};
  const isOnline = presence.isOnline !== undefined ? presence.isOnline : other.isOnline;

  const meObj = localStorage.getItem('token') ? JSON.parse(atob(localStorage.getItem('token').split('.')[1])) : {};

  return (
    <div className="h-screen w-full flex bg-white overflow-hidden text-[#222] font-sans relative">
      {/* Sidebar Section */}
      <div className={`flex flex-col w-full md:w-[320px] lg:w-[400px] bg-white border-r border-[#e6e6e6] transition-all duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} absolute md:relative inset-y-0 left-0 z-20 md:z-auto`}>
        {/* Profile Header */}
        <div className="h-16 px-4 bg-white border-b border-[#e6e6e6] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 bg-[#3390ec] rounded-full flex items-center justify-center text-white font-bold shadow-sm uppercase overflow-hidden">
               {meObj.avatar ? <img src={meObj.avatar} className="w-full h-full object-cover rounded-full" /> : meObj.username?.substring(0, 1)}
            </div>
            <span className="font-semibold text-[17px] tracking-tight text-[#222]">Chats</span>
          </div>
          <button onClick={logout} className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-gray-100">
            <LogOut size={20} />
          </button>
        </div>

        <SearchBar onSelect={handleUserSelect} />
        <Sidebar 
          chats={chats} 
          onSelect={openChat} 
          currentChatId={currentChat?._id} 
          presenceUpdates={presenceUpdates} 
          onLoadMore={() => loadChats(true)}
          hasMore={hasMoreChats}
          isLoading={isLoadingChats}
          onDeleteConversation={handleDeleteConversation}
        />
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-[#f4f4f5] relative ${isSidebarOpen ? "hidden md:flex" : "flex"}`}>
        {currentChat ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-3 md:px-4 bg-white border-b border-[#e6e6e6] flex items-center gap-3 md:gap-4 flex-shrink-0 z-10 w-full relative">
              <button 
                className="md:hidden p-2 -ml-1 text-gray-400 hover:text-[#3390ec]"
                onClick={() => setIsSidebarOpen(true)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="relative w-9 h-9 md:w-10 md:h-10 bg-[#3390ec] text-white rounded-full flex items-center justify-center font-bold tracking-wide shadow-sm uppercase overflow-hidden flex-shrink-0">
                {other.avatar ? (
                  <img src={other.avatar} alt={other.username} className="w-full h-full object-cover rounded-full" />
                ) : (
                  other.username.substring(0, 1)
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-[15px] md:text-[16px] text-[#222] truncate">{other.username}</span>
                {isOnline ? (
                  <span className="text-[12px] md:text-[13px] text-[#3390ec] font-medium">Online</span>
                ) : (
                  <span className="text-[12px] md:text-[13px] text-gray-400">Offline</span>
                )}
              </div>
            </div>

            {/* Chat Window */}
            <ChatWindow messages={messages} currentUserId={meObj._id} isTyping={isTyping} currentChatId={currentChat._id} onDeleteMessage={handleDeleteMessage} />
            {/* Input */}
            <MessageInput onSend={sendMessage} socket={socket} currentChat={currentChat} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="mb-6 drop-shadow-xl opacity-80">
              <Logo size={128} />
            </div>
            <h2 className="text-2xl font-semibold text-[#222] mb-3 tracking-tight">Select a Chat</h2>
            <p className="text-gray-500 max-w-sm text-[15px]">Select a user from the sidebar or search for a new contact to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
}