"use client";

import { useGithubSystem } from "@/hooks/useGithubSystem";
import { HandleMessageReceived } from "@/types";
import { PlayerIcon } from "@/ui/atoms/PlayerIcon";
import { CodePanel } from "@/ui/molecules/CodePanel";
import { useEffect, useMemo } from "react";

type Props = {
  roomId: string;
  myPlayerId: number;
  onMessageReceivedRef?: React.MutableRefObject<HandleMessageReceived | undefined>;
  sendMessage: (message: string) => void;
};

export const GameView: React.FC<Props> = ({
  roomId,
  myPlayerId,
  onMessageReceivedRef,
  sendMessage,
}) => {
  const lineNum = 100;
  const { playerDataList, handleMessageReceived } = useGithubSystem({
    lineNum,
    myPlayerId,
    sendMessage,
  });
  const players = useMemo(() => playerDataList, [playerDataList]);

  useEffect(() => {
    onMessageReceivedRef!.current = handleMessageReceived;
  }, [onMessageReceivedRef?.current, handleMessageReceived]);

  const directionText = useMemo(() => {
    switch (playerDataList[myPlayerId]?.status) {
      case "NONE":
        return "Press ENTER key to checkout.";
      case "WORKING":
        return "Press any key to commit, or ENTER key to try to merge.";
      case "CONFLICT":
        return "Press ENTER key to resolve a conflicted line.";
      default:
        return "Press ENTER key to checkout.";
    }
  }, [playerDataList, myPlayerId]);

  return (
    <div className="h-screen bg-white flex">
      <div className="w-auto h-full bg-green-400 grid grid-rows-4 gap-4 py-4 pl-4">
        {players.map((player, i) => (
          <PlayerIcon key={player.id} playerId={player.id} isActive={player.id === myPlayerId} />
        ))}
      </div>
      <div className={`grow h-full bg-green-100 flex flex-col`}>
        <CodePanel lineNum={lineNum} playerData={playerDataList} myPlayerId={myPlayerId} />
      </div>
      <div className="absolute text-black">
        <p>
          {`player: ${myPlayerId}, status: ${playerDataList[myPlayerId]?.status}, ${directionText}`}
        </p>
      </div>
    </div>
  );
};
