"use client";

import { useWebRtcConnection } from "@/fetchers/useWebRtcConnection";
import { useWebRtcMultiConnection } from "@/fetchers/useWebRtcMultiConnection";
import { useState } from "react";

export default function TestWebrtcMulti() {
  const { createRoom, joinRoomById } = useWebRtcMultiConnection();
  const [inputRoomId, setRoomId] = useState("");

  return (
    <div>
      <button className="btn btn-primary" onClick={createRoom}>
        Create Room
      </button>
      <input type="text" value={inputRoomId} onChange={(event) => setRoomId(event.target.value)} />
      <button className="btn btn-primary" onClick={() => joinRoomById(inputRoomId)}>
        Join Room
      </button>
    </div>
  );
}
