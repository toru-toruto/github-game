"use client";

import { useGithubSystem } from "@/hooks/useGithubSystem";
import { PlayerIcon } from "@/ui/atoms/PlayerIcon";
import { CodePanel } from "@/ui/molecules/CodePanel";
import { useMemo } from "react";

export default function Home() {
  const lineNum = 100;

  const playerNum = 4;
  const players = useMemo(() => Array.from({ length: playerNum }), [playerNum]);

  const {
    playerDataList: playerData,
    selectedPlayerId,
    setSelectedPlayerId,
  } = useGithubSystem({
    playerNum,
    lineNum,
  });

  const directionText = useMemo(() => {
    switch (playerData[selectedPlayerId]?.status) {
      case "NONE":
        return "Press ENTER key to checkout.";
      case "WORKING":
        return "Press any key to commit, or ENTER key to try to merge.";
      case "CONFLICT":
        return "Press ENTER key to resolve a conflicted line.";
      default:
        return "Press ENTER key to checkout.";
    }
  }, [playerData, selectedPlayerId]);

  return (
    <div className="h-screen bg-white flex">
      <div className="w-auto h-full bg-green-400 grid grid-rows-4 gap-4 py-4 pl-4">
        {players.map((_, i) => (
          <PlayerIcon
            key={i}
            playerId={i}
            isActive={i === selectedPlayerId}
            setSelectedPlayerNum={setSelectedPlayerId}
          />
        ))}
      </div>
      <div className={`grow h-full bg-green-100 flex flex-col`}>
        <CodePanel lineNum={lineNum} playerData={playerData} selectedPlayerId={selectedPlayerId} />
      </div>
      <div className="absolute text-black">
        <p>
          {`player: ${selectedPlayerId}, status: ${playerData[selectedPlayerId]?.status}, ${directionText}`}
        </p>
      </div>
    </div>
  );
}
