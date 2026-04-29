import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function useSocket() {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = io("http://localhost:5001", {
      auth: { token: localStorage.getItem("token") },
    });

    setSocket(s);

    return () => s.disconnect();
  }, []);

  return socket;
}