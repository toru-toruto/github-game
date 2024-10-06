import { useWebRtcMultiConnection } from "@/fetchers/useWebRtcMultiConnection";
import { HandleMessageReceived, PlayerData } from "@/types";
import { useCallback, useEffect, useState } from "react";

type Props = {
  lineNum: number;
  myPlayerId: number;
  sendMessage: (message: string) => void;
};

type ReceivedMessage =
  | {
      type: "SIMPLE_MESSAGE";
      value: {
        message: string;
      };
    }
  | {
      type: "NOTIFY_PLAYER_ID";
      value: {
        playerId: number;
      };
    };

export const useGithubSystem = ({ lineNum, myPlayerId, sendMessage }: Props) => {
  const [playerDataList, setPlayerDataList] = useState<Array<PlayerData>>([]);
  // const [selectedPlayerId, setSelectedPlayerId] = useState<number>(-1);
  // for checking conflicts
  // we can check conflicts by checking timestamps from checkoutTimestamp to now.
  const [timestampList, setTimestampList] = useState<Array<number>>([]);
  // Map<timestamp, Array<updatedLineIndex>>
  const [timestampToLineDataMap, setTimestampToLineDataMap] = useState<Map<number, Array<number>>>(
    new Map()
  );

  useEffect(() => {
    console.log(myPlayerId);
    if (myPlayerId === -1) return;
    setPlayerDataList((prev) => {
      if (prev.find((p) => p.id === myPlayerId)) {
        return prev;
      }
      const newPlayerData: PlayerData = {
        id: myPlayerId,
        checkoutTimestamp: 0,
        status: "NONE",
        updatedLineList: [],
        conflictLineList: [],
      };
      const sortedNewPlayerDataList = [...prev, newPlayerData].sort((a, b) => a.id - b.id);
      return sortedNewPlayerDataList;
    });
  }, [myPlayerId]);

  const handleMessageReceived: HandleMessageReceived = useCallback(
    (message: string) => {
      console.log(message);
      if (!message) return;
      const receivedMessage = JSON.parse(message) as ReceivedMessage;
      if (!receivedMessage) return;

      switch (receivedMessage.type) {
        case "SIMPLE_MESSAGE":
          console.log(receivedMessage.value.message);
          break;
        case "NOTIFY_PLAYER_ID":
          setPlayerDataList((prev) => {
            if (prev.find((p) => p.id === receivedMessage.value.playerId)) {
              return prev;
            }
            const newPlayerData: PlayerData = {
              id: receivedMessage.value.playerId,
              checkoutTimestamp: 0,
              status: "NONE",
              updatedLineList: [],
              conflictLineList: [],
            };
            const sortedNewPlayerDataList = [...prev, newPlayerData].sort((a, b) => a.id - b.id);
            return sortedNewPlayerDataList;
          });
          break;
      }
    },
    [setPlayerDataList]
  );

  // initialize player data
  // useEffect(() => {
  //   const newPlayerData = Array.from({ length: playerNum }).map(
  //     (_, i) =>
  //       ({
  //         id: i,
  //         checkoutTimestamp: 0,
  //         status: "NONE",
  //         updatedLineList: [],
  //         conflictLineList: [],
  //       } as PlayerData)
  //   );
  //   setPlayerDataList(newPlayerData);
  //   setSelectedPlayerId(0);
  // }, [playerNum]);

  const handleCheckout = useCallback(
    (p: PlayerData) => {
      const now = Date.now();
      p.checkoutTimestamp = now;
      setTimestampList((prev) => [...prev, now]);
      // checkout timestamp is not necessary to add to timestampToLineDataMap,
      // because there is no updated line index yet.
      p.status = "WORKING";
      console.log(`Checkout id: ${p.id}, checkoutTimestamp: ${p.checkoutTimestamp}`);
    },
    [setTimestampList]
  );

  const detectConflict = useCallback(
    (p: PlayerData) => {
      const from = p.checkoutTimestamp;
      const to = Date.now();
      const timestamps = timestampList.filter((t) => t > from && t < to);
      const lineDataList = timestamps.map((t) => timestampToLineDataMap.get(t));
      console.log(timestampToLineDataMap.get(timestamps[0]));
      // console.log(from, to, timestamps, lineDataList);
      console.log(
        `DetectConflict id: ${p.id}, from: ${from}, to: ${to}, timestamps: ${timestamps}, lineDataList: ${lineDataList}`
      );
      const conflictLineSet = new Set<number>();
      lineDataList.forEach((lineData) => {
        lineData?.forEach((line) => {
          if (p.updatedLineList.includes(line)) conflictLineSet.add(line);
        });
      });
      p.conflictLineList = Array.from(conflictLineSet);
      return p.conflictLineList.length > 0;
    },
    [timestampList, timestampToLineDataMap]
  );

  const merge = useCallback(
    (p: PlayerData) => {
      const now = Date.now();
      console.log(`Merge id: ${p.id}, mergeTimestamp: ${now}`);
      setTimestampList((prev) => [...prev, now]);
      console.log(p.updatedLineList);
      const updatedLineList = p.updatedLineList;
      setTimestampToLineDataMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(now, updatedLineList);
        return newMap;
      });
      p.updatedLineList = [];
      console.log(p.updatedLineList);
      // p.conflictLineList = [];
      // p.checkoutTimestamp = 0;
      p.status = "NONE";
    },
    [setTimestampList, setTimestampToLineDataMap]
  );

  const handleTryMerge = useCallback(
    (p: PlayerData) => {
      const hasConflict = detectConflict(p);
      if (hasConflict) {
        p.status = "CONFLICT";
      } else {
        merge(p);
      }
    },
    [detectConflict, merge]
  );

  const handleResolveConflict = useCallback(
    (p: PlayerData) => {
      // resolve conflict
      p.conflictLineList.pop();
      // if there is no conflict, change status to NONE
      if (p.conflictLineList.length === 0) {
        merge(p);
      }
    },
    [merge]
  );

  const handleEdit = useCallback(
    (p: PlayerData) => {
      // set random index to true
      const index = Math.floor(Math.random() * lineNum);
      p.updatedLineList.push(index);
    },
    [lineNum]
  );

  useEffect(() => {
    // add key press event listener
    const handleKeyDown = (e: KeyboardEvent) => {
      const p = playerDataList[myPlayerId];
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
        newPlayerData[myPlayerId] = p;
        return newPlayerData;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    playerDataList,
    myPlayerId,
    handleCheckout,
    handleTryMerge,
    handleResolveConflict,
    handleEdit,
    setPlayerDataList,
  ]);

  return {
    playerDataList,
    handleMessageReceived,
  };
};
