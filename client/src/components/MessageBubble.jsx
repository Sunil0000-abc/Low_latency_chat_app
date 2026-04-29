import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Check, CheckCheck, Download, FileText, File as FileIcon, Play, Pause, Trash2 } from "lucide-react";
import { getDownloadUrl } from "../services/api";

const CustomAudioPlayer = ({ src, isOwn }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [bars] = useState(() => Array.from({ length: 25 }, () => Math.random() * 60 + 20));

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const setAudioData = () => {
      if (isFinite(audio.duration)) setDuration(audio.duration);
    };
    const setAudioTime = () => setCurrentTime(audio.currentTime);
    const setAudioEnd = () => setIsPlaying(false);

    audio.addEventListener("loadedmetadata", setAudioData);
    audio.addEventListener("durationchange", setAudioData);
    audio.addEventListener("timeupdate", setAudioTime);
    audio.addEventListener("ended", setAudioEnd);

    return () => {
      audio.removeEventListener("loadedmetadata", setAudioData);
      audio.removeEventListener("durationchange", setAudioData);
      audio.removeEventListener("timeupdate", setAudioTime);
      audio.removeEventListener("ended", setAudioEnd);
    };
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const progress = duration ? (currentTime / duration) : 0;

  return (
    <div className="flex items-center gap-3 bg-transparent py-[8px] w-[260px]">
      <audio ref={audioRef} src={src} preload="metadata" />
      
      <button 
        onClick={togglePlay} 
        className={`border-[2.5px] rounded-full p-[5px] flex-shrink-0 transition-transform active:scale-95 bg-transparent ${isOwn ? 'text-white border-white' : 'text-[#00a884] border-[#00a884]'}`}
      >
        {isPlaying ? <Pause fill="currentColor" size={14} /> : <Play fill="currentColor" size={14} className="ml-0.5" />}
      </button>
      
      <div 
        className="flex flex-1 items-center justify-between gap-[3px] h-6 relative cursor-pointer"
        onClick={(e) => {
          if (!duration || !audioRef.current) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const newProgress = clickX / rect.width;
          audioRef.current.currentTime = newProgress * duration;
        }}
      >
        {bars.map((h, i) => {
           const isPlayed = (i / bars.length) <= progress;
           return (
             <div 
               key={i} 
               style={{ height: `${h}%` }} 
               className={`w-[3px] rounded-full transition-colors duration-75 ${
                 isPlayed 
                   ? (isOwn ? 'bg-white' : 'bg-[#00a884]') 
                   : (isOwn ? 'bg-white/40' : 'bg-gray-500')
               }`}
             />
           );
        })}
      </div>
      
      <span className={`text-[13px] font-bold select-none flex-shrink-0 min-w-[30px] text-right ${isOwn ? 'text-white' : 'text-[#00a884]'}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
        {formatTime(currentTime > 0 ? currentTime : duration)}
      </span>
    </div>
  );
};

export default function MessageBubble({ messageId, text, isOwn, time, status, fileData, onDeleteMessage }) {
  const formattedTime = time ? format(new Date(time), "HH:mm") : format(new Date(), "HH:mm");
  const [signedUrl, setSignedUrl] = useState(null);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const timerRef = useRef(null);

  const [menu, setMenu] = useState({
    visible: false,
    x: 0,
    y: 0
  });

  // Close menu on outside click
  useEffect(() => {
    const close = () => setMenu({ ...menu, visible: false });
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menu]);

  const openMenu = (e) => {
    if (!isOwn || !messageId) return;
    e.preventDefault();
    setMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleTouchStart = (e) => {
    if (!isOwn || !messageId) return;
    const touch = e.touches[0];

    timerRef.current = setTimeout(() => {
      setMenu({
        visible: true,
        x: touch.clientX,
        y: touch.clientY
      });
    }, 600); // long press
  };

  const handleTouchEnd = () => {
    clearTimeout(timerRef.current);
  };

  const handleDelete = () => {
    if (onDeleteMessage && messageId) {
      onDeleteMessage(messageId);
    }
    setMenu({ visible: false, x: 0, y: 0 });
  };

  useEffect(() => {
    if (fileData && (fileData.mimeType?.startsWith("image/") || fileData.mimeType?.startsWith("audio/"))) {
      setIsFetchingUrl(true);
      getDownloadUrl(fileData.fileKey)
        .then(res => setSignedUrl(res.url))
        .catch(err => console.error(err))
        .finally(() => setIsFetchingUrl(false));
    }
  }, [fileData]);

  const handleDownload = async () => {
    try {
      const { url } = await getDownloadUrl(fileData.fileKey);
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.download = fileData.fileName || "download";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      alert("Failed to get download link");
    }
  };

  const isImage = fileData?.mimeType?.startsWith("image/");
  const isAudio = fileData?.mimeType?.startsWith("audio/");

  return (
    <div 
      className={`flex w-full ${isOwn ? "justify-end origin-bottom-right" : "justify-start origin-bottom-left"} mb-1 group animate-message-pop`}
      onContextMenu={openMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className={`relative max-w-[85%] md:max-w-md px-3 pt-2 pb-6 rounded-lg text-[15px] shadow-sm
          ${isOwn 
            ? "bg-[#005c4b] text-[#e9edef] rounded-tr-none" 
            : "bg-[#202c33] text-[#e9edef] rounded-tl-none"
          }`}
      >
        <span className={`absolute top-0 w-3 h-3 ${isOwn ? "-right-2 text-[#005c4b]" : "-left-2 text-[#202c33]"}`}>
          {isOwn ? (
            <svg viewBox="0 0 8 13" width="8" height="13" fill="currentColor">
               <path d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z"></path>
            </svg>
          ) : (
            <svg viewBox="0 0 8 13" width="8" height="13" fill="currentColor">
              <path d="M1.533 3.568L8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z"></path>
            </svg>
          )}
        </span>

        {fileData && (
          <div className="mb-1">
            {isAudio ? (
              <div className="mb-1">
                {signedUrl ? (
                  <CustomAudioPlayer src={signedUrl} isOwn={isOwn} />
                ) : (
                  <div className={`w-[260px] h-[52px] bg-transparent flex items-center justify-center text-sm ${isOwn ? 'text-white' : 'text-[#00a884]'}`}>
                    {isFetchingUrl ? "Loading..." : "Error"}
                  </div>
                )}
              </div>
            ) : isImage ? (
              <div className="rounded-lg overflow-hidden border border-gray-600 mb-1 max-w-[250px] relative">
                {signedUrl ? (
                  <img src={signedUrl} alt={fileData.fileName} className="w-full object-cover" />
                ) : (
                  <div className="w-[200px] h-[150px] bg-black/20 flex items-center justify-center text-sm text-gray-300">
                    {isFetchingUrl ? "Loading Image..." : "Image Error"}
                  </div>
                )}
                <button 
                  onClick={handleDownload} 
                  className="absolute bottom-2 right-2 bg-black/50 p-2 rounded-full hover:bg-black/80 transition-colors"
                >
                  <Download size={16} className="text-white" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-black/20 p-3 rounded-lg w-full max-w-[300px] border border-gray-700/50">
                <div className="bg-[#00a884] p-3 rounded-full flex-shrink-0">
                  <FileText size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <span className="text-sm font-medium truncate">{fileData.fileName}</span>
                  <span className="text-[11px] text-gray-300/80">{fileData.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'}</span>
                </div>
                <button 
                  onClick={handleDownload}
                  className="p-2 hover:bg-black/20 rounded-full transition-colors flex-shrink-0 text-gray-300"
                >
                  <Download size={20} />
                </button>
              </div>
            )}
          </div>
        )}

        {text && (
          <p className="leading-snug break-words" style={{ wordBreak: 'break-word' }}>
            {text}
          </p>
        )}

        <div className="absolute right-2 bottom-1 flex items-center gap-1">
          <span className="text-[11px] text-gray-300 drop-shadow-sm select-none">
            {formattedTime}
          </span>
          {isOwn && (
            <>
              {status === "seen" ? (
                <CheckCheck size={14} className="text-[#53bdeb]" /> // Blue tick
              ) : status === "delivered" ? (
                <CheckCheck size={14} className="text-gray-300" />
              ) : (
                <Check size={14} className="text-gray-300" />
              )}
            </>
          )}
        </div>
      </div>

      {/* 🔥 Floating Delete Menu */}
      {menu.visible && (
        <div
          style={{
            top: menu.y,
            left: menu.x
          }}
          className="fixed z-50 bg-[#202c33] rounded-lg shadow-lg border border-gray-700 min-w-[150px]"
        >
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-400 hover:bg-[#2a3942]"
          >
            <Trash2 size={16} />
            Delete Message
          </button>
        </div>
      )}
    </div>
  );
}
