import { useState, useRef, useEffect } from "react";
import { Send, Mic, Paperclip, Loader } from "lucide-react";
import { getUploadUrl, uploadFileToS3 } from "../services/api";

export default function MessageInput({ onSend, socket, currentChat }) {
  const [text, setText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isRecording]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (text.trim()) {
      onSend(text.trim(), null);
      setText("");
      if (socket && currentChat) {
        socket.emit("stop_typing", { 
          to: currentChat.participants.find(p => p !== JSON.parse(atob(localStorage.getItem('token').split('.')[1]))._id), 
          conversationId: currentChat._id 
        });
      }
    }
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e) => {
    setText(e.target.value);
    
    if (socket && currentChat) {
      const receiver = currentChat.participants.find(p => p !== JSON.parse(atob(localStorage.getItem('token').split('.')[1]))._id);
      socket.emit("typing", { to: receiver, conversationId: currentChat._id });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stop_typing", { to: receiver, conversationId: currentChat._id });
      }, 2000);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const { uploadUrl, fileUrl, key } = await getUploadUrl(file.name, file.type);
      await uploadFileToS3(uploadUrl, file);
      
      const fileData = {
         fileUrl,
         fileKey: key,
         fileName: file.name,
         mimeType: file.type
      };

      onSend("", fileData);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload file");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], `audio_record_${Date.now()}.webm`, { type: 'audio/webm' });
        
        try {
          setIsUploading(true);
          const { uploadUrl, fileUrl, key } = await getUploadUrl(file.name, file.type);
          await uploadFileToS3(uploadUrl, file);
          
          const fileData = {
            fileUrl,
            fileKey: key,
            fileName: file.name,
            mimeType: file.type
          };
          onSend("", fileData);
        } catch (err) {
          console.error("Audio upload failed", err);
          alert("Failed to upload audio message");
        } finally {
          setIsUploading(false);
          setRecordingTime(0);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied", err);
      alert("Please allow microphone access to record voice messages.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] bg-white border-t border-[#e6e6e6] z-10 flex-shrink-0">
      <div className="max-w-3xl mx-auto flex items-center gap-2 md:gap-3">
        <button 
        className={`transition-colors ${isRecording ? "text-[#f15c6d] animate-pulse" : "text-gray-400 hover:text-gray-200"}`}
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onMouseLeave={stopRecording}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
        title="Hold to record"
      >
        <Mic size={24} />
      </button>
      
      <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
      <button 
        className="text-gray-400 hover:text-gray-200 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading || isRecording}
      >
        {isUploading ? <Loader size={24} className="animate-spin" /> : <Paperclip size={24} className="transform -rotate-45" />}
      </button>

      <div className="flex-1 bg-[#f4f4f5] rounded-xl border border-transparent focus-within:border-[#3390ec] transition-all flex items-center min-h-[48px]">
        {isRecording ? (
          <div className="w-full flex items-center justify-between px-4 text-[#f15c6d]">
            <span className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-[#f15c6d] animate-pulse"></div>
               Recording...
            </span>
            <span className="font-mono">{formatTime(recordingTime)}</span>
          </div>
        ) : (
          <input
            ref={inputRef}
            className="w-full bg-transparent p-3 text-[16px] outline-none text-[#222] placeholder-gray-400"
            placeholder="Write a message..."
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            disabled={isUploading}
          />
        )}
      </div>

      <button 
        onClick={handleSubmit}
        disabled={!text.trim() || isUploading || isRecording}
        className={`p-3 rounded-full flex items-center justify-center transition-all ${
          text.trim() && !isRecording 
            ? 'bg-[#3390ec] hover:bg-[#2b80d4] text-white shadow-md transform scale-100' 
            : 'bg-transparent text-gray-500 scale-90'
        }`}
      >
        <Send size={20} className={text.trim() ? "ml-1" : ""} />
      </button>
      </div>
    </div>
  );
}