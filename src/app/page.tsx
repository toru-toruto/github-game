"use client";

import { useCodeEdit } from "@/hooks/useCodeEdit";
import { Player } from "@/ui/atoms/Player";
import { CodePanel } from "@/ui/molecules/CodePanel";
import { useMemo } from "react";

export default function Home() {
  const lineNum = 30;
  const { lineDataMap, selectedPlayerId, setSelectedPlayerId } = useCodeEdit({ lineNum });

  const playerNum = 4;
  const players = useMemo(() => Array.from({ length: playerNum }), [playerNum]);

  return (
    <div className="h-screen bg-white flex">
      <div className="w-auto h-full bg-green-400 grid grid-rows-4 gap-4 py-4 pl-4">
        {players.map((_, i) => (
          <Player
            key={i}
            playerId={i}
            isActive={i === selectedPlayerId}
            setSelectedPlayerNum={setSelectedPlayerId}
          />
        ))}
      </div>
      <div className={`grow h-full bg-green-100 flex flex-col`}>
        <CodePanel playerId={selectedPlayerId} lineNum={lineNum} lineDataMap={lineDataMap} />
      </div>
    </div>
  );
}
