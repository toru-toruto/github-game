"use client";

import { useWebRtcConnection } from "@/fetchers/useWebRtcConnection";
import { useState } from "react";

export default function TestWebrtc() {
  const {
    connectionId: connectionId,
    createConnection: createConnection,
    joinConnectionById: joinConnectionById,
    hangUp,
    sendMessage,
  } = useWebRtcConnection();
  const [inputConnectionId, setConnectionName] = useState("");
  const [message, setMessage] = useState("");

  return (
    <div>
      <h1>Test WebRTC</h1>
      <div>
        <input
          type="button"
          value="Create Connection"
          className="btn btn-primary"
          onClick={createConnection}
        />
      </div>
      <div>
        <input
          type="text"
          placeholder="Connection ID"
          className="input input-bordered"
          value={inputConnectionId}
          onChange={(event) => {
            setConnectionName(event.target.value);
          }}
        />
        <input
          type="button"
          value="Join Connection"
          className="btn btn-primary"
          onClick={() => {
            if (!inputConnectionId) {
              alert("Please enter a connection name");
              return;
            }
            joinConnectionById(inputConnectionId);
            setConnectionName("");
          }}
        />
      </div>
      <div>
        <input type="button" value="Hang Up" className="btn btn-primary" onClick={hangUp} />
      </div>
      <div>
        <p>Connection ID: {connectionId}</p>
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
