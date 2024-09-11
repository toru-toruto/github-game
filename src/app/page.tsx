"use client";

import { useCodeEdit } from "@/hooks/useCodeEdit";
import { PlayerIcon } from "@/ui/atoms/PlayerIcon";
import { CodePanel } from "@/ui/molecules/CodePanel";
import { useEffect, useMemo } from "react";

export default function Home() {
  const lineNum = 30;

  const playerNum = 4;
  const players = useMemo(() => Array.from({ length: playerNum }), [playerNum]);

  const {
    playerDataList: playerData,
    selectedPlayerId,
    setSelectedPlayerId,
  } = useCodeEdit({
    playerNum,
    lineNum,
  });

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
        <CodePanel lineNum={lineNum} playerData={playerData} />
      </div>
    </div>
  );
}
