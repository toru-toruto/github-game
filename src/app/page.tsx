"use client";

import { Player } from "@/ui/atoms/Player";
import { useMemo, useState } from "react";

export default function Home() {
  const [activeNum, setActiveNum] = useState(0);

  const playerNum = 4;
  const players = useMemo(() => Array.from({ length: playerNum }), [playerNum]);

  return (
    <div className="h-screen bg-white flex">
      <div className="w-auto h-full bg-green-400 grid grid-rows-4 gap-4 py-4 pl-4">
        {players.map((_, i) => (
          <Player key={i} num={i} isActive={i === activeNum} setActiveNum={setActiveNum} />
        ))}
      </div>
      <div className="grow h-full bg-green-100"></div>
    </div>
  );
}
