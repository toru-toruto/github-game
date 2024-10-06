"use client";

import { useWebRtcMultiConnection } from "@/fetchers/useWebRtcMultiConnection";
import { GameView } from "@/ui/molecules/GameView";
import { RoomSelectView } from "@/ui/molecules/RoomSelectView";

export default function Home() {
  const { roomId, myPlayerId, onMessageReceivedRef, createRoom, joinRoomById, sendMessage } =
    useWebRtcMultiConnection();

  return (
    <>
      {!roomId ? (
        <RoomSelectView createRoom={createRoom} joinRoomById={joinRoomById} />
      ) : (
        <GameView
          roomId={roomId!}
          myPlayerId={myPlayerId}
          onMessageReceivedRef={onMessageReceivedRef}
          sendMessage={sendMessage}
        />
      )}
    </>
  );
}
