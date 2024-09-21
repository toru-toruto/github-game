"use client";

import { useWebRtcConnection } from "@/fetchers/useWebRtcConnection";
import { useState } from "react";

export default function TestWebrtc() {
  const { roomId, createRoom, joinRoomById, hangUp, sendMessage } = useWebRtcConnection();
  const [inputRoomId, setRoomName] = useState("");
  const [message, setMessage] = useState("");

  return (
    <div>
      <h1>Test WebRTC</h1>
      <div>
        <input type="button" value="Create Room" className="btn btn-primary" onClick={createRoom} />
      </div>
      <div>
        <input
          type="text"
          placeholder="Room ID"
          className="input input-bordered"
          value={inputRoomId}
          onChange={(event) => {
            setRoomName(event.target.value);
          }}
        />
        <input
          type="button"
          value="Join Room"
          className="btn btn-primary"
          onClick={() => {
            if (!inputRoomId) {
              alert("Please enter a room name");
              return;
            }
            joinRoomById(inputRoomId);
            setRoomName("");
          }}
        />
      </div>
      <div>
        <input type="button" value="Hang Up" className="btn btn-primary" onClick={hangUp} />
      </div>
      <div>
        <p>Room ID: {roomId}</p>
      </div>
      <div>
        <input
          type="text"
          placeholder="Message"
          className="input input-bordered"
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
          }}
        />
        <input
          type="button"
          value="Send Message"
          className="btn btn-primary"
          onClick={() => {
            if (!message) {
              alert("Please enter message");
              return;
            }
            sendMessage(message);
            setMessage("");
          }}
        />
      </div>
    </div>
  );
}
