"use client";

import { useWebRtcMultiConnection } from "@/fetchers/useWebRtcMultiConnection";
import { GameView } from "@/ui/molecules/GameView";
import { RoomSelectView } from "@/ui/molecules/RoomSelectView";

export default function Home() {
  const { roomId, playerId, createRoom, joinRoomById, sendMessage, registerOnMessageReceived } =
    useWebRtcMultiConnection();

  return (
    <>
      {!roomId ? (
        <RoomSelectView createRoom={createRoom} joinRoomById={joinRoomById} />
      ) : (
        <GameView
          roomId={roomId}
          playerId={playerId}
          registerOnMessageReceived={registerOnMessageReceived}
        />
      )}
    </>
  );
}
