"use client";

import { useWebRtcMultiConnection } from "@/fetchers/useWebRtcMultiConnection";
import { useCallback, useEffect, useState } from "react";

export default function TestWebrtcMulti() {
  const [messageLogs, setMessageLogs] = useState<string[]>([]);

  const handleMessageReceived = useCallback(
    (message: string) => {
      setMessageLogs((prev) => [...prev, message]);
    },
    [setMessageLogs]
  );

  const { roomId, createRoom, joinRoomById, sendMessage, registerOnMessageReceived } =
    useWebRtcMultiConnection();
  const [inputRoomId, setRoomId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    registerOnMessageReceived(handleMessageReceived);
  }, [registerOnMessageReceived, handleMessageReceived]);

  return (
    <div>
      {!roomId ? (
        <>
          <button className="btn btn-primary" onClick={createRoom}>
            Create Room
          </button>
          <div>
            <input
              type="text"
              value={inputRoomId}
              onChange={(event) => setRoomId(event.target.value)}
            />
            <button className="btn btn-primary" onClick={() => joinRoomById(inputRoomId)}>
              Join Room
            </button>
          </div>
        </>
      ) : (
        <></>
      )}
      <div>
        <input
          type="text"
          placeholder="Message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <button
          className="btn btn-primary"
          onClick={() => {
            sendMessage(message);
            setMessageLogs((prev) => [...prev, message]);
            setMessage("");
          }}
        >
          Send Message
        </button>
      </div>
      <div>
        {messageLogs.map((message, index) => (
          <div key={index}>{message}</div>
        ))}
      </div>
    </div>
  );
}
