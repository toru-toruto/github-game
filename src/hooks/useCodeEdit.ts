import { useCallback, useEffect, useState } from "react";

type Props = {
  playerNum: number;
  lineNum: number;
};

type PlayerStatus = "NONE" | "WORKING" | "CONFLICT";

type PlayerData = {
  id: number;
  checkoutTimestamp: number;
  status: PlayerStatus;
};

export const useCodeEdit = ({ playerNum, lineNum }: Props) => {
  const [playerData, setPlayerData] = useState<Array<PlayerData>>([]);

  const [selectedPlayerId, setSelectedPlayerId] = useState<number>(0);
  const [lineDataMap, setLineDataMap] = useState<Map<number, Array<number>>>(new Map());

  

  // initialize player data
  useEffect(() => {
    const newPlayerData = Array.from({ length: playerNum }).map(
      (_, i) =>
        ({
          id: i,
          checkoutTimestamp: 0,
          status: "NONE",
        } as PlayerData)
    );
    setPlayerData(newPlayerData);
  }, []);

  const handleEdit = useCallback(
    (index: number) => {
      setLineDataMap((prev) => {
        const newMap = new Map(prev);
        // if index is not in map, add it
        if (!newMap.has(index)) {
          newMap.set(index, []);
        }
        // if selected player number is not in the array, add it
        if (!newMap.get(index)?.includes(selectedPlayerId)) {
          newMap.get(index)?.push(selectedPlayerId);
        }
        return newMap;
      });
    },
    [selectedPlayerId, setLineDataMap]
  );

  useEffect(() => {
    // add key press event listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        const p = playerData[selectedPlayerId];
        if (p.status === "NONE") {
          p.checkoutTimestamp = Date.now();
          p.status = "WORKING";
        } else if (p.status === "WORKING") {
          // check if there is a conflict
          // if there is, set status to CONFLICT
          // if not, set status to NONE
        } else if (p.status === "CONFLICT") {
          // resolve conflict
          // if all conflicts are resolved, set status to NONE
        }
      } else {
        // set random index to true
        handleEdit(Math.floor(Math.random() * lineNum));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedPlayerId]);

  return {
    lineDataMap,
    selectedPlayerId,
    setSelectedPlayerId,
  };
};
