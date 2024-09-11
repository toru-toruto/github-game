import { PlayerData } from "@/types";
import { useCallback, useEffect, useState } from "react";

type Props = {
  playerNum: number;
  lineNum: number;
};



export const useCodeEdit = ({ playerNum, lineNum }: Props) => {
  const [playerDataList, setPlayerDataList] = useState<Array<PlayerData>>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number>(0);
  // for checking conflicts
  // we can check conflicts by checking timestamps from checkoutTimestamp to now.
  const [timestampList, setTimestampList] = useState<Array<number>>([]);
  // Map<timestamp, Array<updatedLineIndex>>
  const [timestampToLineDataMap, setTimestampToLineDataMap] = useState<Map<number, Array<number>>>(
    new Map()
  );

  // initialize player data
  useEffect(() => {
    const newPlayerData = Array.from({ length: playerNum }).map(
      (_, i) =>
        ({
          id: i,
          checkoutTimestamp: 0,
          status: "NONE",
          updatedLineIndex: [],
          conflictLineIndex: [],
        } as PlayerData)
    );
    setPlayerDataList(newPlayerData);
  }, []);

  const handleCheckout = useCallback(
    (p: PlayerData) => {
      const now = Date.now();
      p.checkoutTimestamp = now;
      setTimestampList((prev) => [...prev, now]);
      // checkout timestamp is not necessary to add to timestampToLineDataMap,
      // because there is no updated line index yet.
      p.status = "WORKING";
    },
    [setTimestampList]
  );

  const handleTryMerge = useCallback(
    (p: PlayerData) => {
      // TODO: check if there is a conflict
      const hasConflict = true;
      if (hasConflict) {
        p.status = "CONFLICT";
        // TODO: set conflict line index
      } else {
        const now = Date.now();
        setTimestampList((prev) => [...prev, now]);
        setTimestampToLineDataMap((prev) => {
          const newMap = new Map(prev);
          newMap.set(now, p.updatedLineIndex);
          return newMap;
        });
        p.status = "NONE";
      }
    },
    [setTimestampList, setTimestampToLineDataMap]
  );

  const handleResolveConflict = useCallback(
    (p: PlayerData) => {
      // TODO: resolve conflict
      const hasConflict = false;
      if (!hasConflict) {
        const now = Date.now();
        setTimestampList((prev) => [...prev, now]);
        setTimestampToLineDataMap((prev) => {
          const newMap = new Map(prev);
          newMap.set(now, p.updatedLineIndex);
          return newMap;
        });
        p.status = "NONE";
      }
    },
    [setTimestampList, setTimestampToLineDataMap]
  );

  const handleEdit = useCallback(
    (p: PlayerData) => {
      // set random index to true
      const index = Math.floor(Math.random() * lineNum);
      p.updatedLineIndex.push(index);
    },
    [selectedPlayerId, setPlayerDataList]
  );

  useEffect(() => {
    // add key press event listener
    const handleKeyDown = (e: KeyboardEvent) => {
      const p = playerDataList[selectedPlayerId];
      if (e.key === "Enter") {
        if (p.status === "NONE") {
          handleCheckout(p);
        } else if (p.status === "WORKING") {
          handleTryMerge(p);
        } else if (p.status === "CONFLICT") {
          handleResolveConflict(p);
        }
      } else {
        if (p.status === "WORKING") {
          handleEdit(p);
        }
      }
      setPlayerDataList((prev) => {
        const newPlayerData = [...prev];
        newPlayerData[selectedPlayerId] = p;
        return newPlayerData;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    playerDataList,
    selectedPlayerId,
    handleCheckout,
    handleTryMerge,
    handleResolveConflict,
    handleEdit,
    setPlayerDataList,
  ]);

  return {
    playerDataList,
    selectedPlayerId,
    setSelectedPlayerId,
  };
};
