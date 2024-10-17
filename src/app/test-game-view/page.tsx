"use client";

import { useGithubSystem } from "@/hooks/useGithubSystem";
import { HandleMessageReceived } from "@/types";
import { PlayerIcon } from "@/ui/atoms/PlayerIcon";
import { CodePanel } from "@/ui/molecules/CodePanel";
import { useEffect, useMemo, useState } from "react";

const GameView: React.FC = () => {
  const lineNum = 100;

  const playerNum = 4;
  const players = useMemo(() => Array.from({ length: playerNum }), [playerNum]);

  const myPlayerId = 0;

  const {
    playerDataList: playerData,
    // selectedPlayerId,
    // setSelectedPlayerId,
    handleMessageReceived,
  } = useGithubSystem({
    // playerNum,
    lineNum,
    myPlayerId,
    sendMessage: () => {},
  });

  const directionText = useMemo(() => {
    switch (playerData[myPlayerId]?.status) {
      case "NONE":
        return "Press ENTER key to checkout.";
      case "WORKING":
        return "Press any key to commit, or ENTER key to try to merge.";
      case "CONFLICT":
        return "Press ENTER key to resolve a conflicted line.";
      default:
        return "Press ENTER key to checkout.";
    }
  }, [playerData, myPlayerId]);

  return (
    <div className="h-screen bg-white flex">
      <div className="w-auto h-full bg-green-400 grid grid-rows-4 gap-4 py-4 pl-4">
        {players.map((_, i) => (
          <PlayerIcon
            key={i}
            playerId={i}
            isActive={i === myPlayerId}
            // setSelectedPlayerNum={setSelectedPlayerId}
          />
        ))}
      </div>
      <div className={`grow h-full bg-green-100 flex flex-col`}>
        <CodePanel lineNum={lineNum} playerData={playerData} myPlayerId={myPlayerId} />
      </div>
      <div className="absolute text-black">
        <p>
          {`player: ${myPlayerId}, status: ${playerData[myPlayerId]?.status}, ${directionText}`}
        </p>
      </div>
    </div>
  );
};

export default GameView;
