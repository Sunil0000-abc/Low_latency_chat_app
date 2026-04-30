import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function useSocket() {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = io("/", {
      auth: { token: localStorage.getItem("token") },
    });

    setSocket(s);

    return () => s.disconnect();
  }, []);

  return socket;
}
