import { useEffect, useState } from "react";

type Props = {
  lineNum: number;
};

export const useCodeEdit = ({ lineNum }: Props) => {
  const [selectedPlayerNum, setSelectedPlayerNum] = useState<number>(0);
  const [lineDataMap, setLineDataMap] = useState<Map<number, Array<number>>>(new Map());

  useEffect(() => {
    // add key press event listener
    const handleKeyDown = (e: KeyboardEvent) => {
      // set random index to true
      handleEdit(Math.floor(Math.random() * lineNum));
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedPlayerNum]);

  const handleEdit = (index: number) => {
    setLineDataMap((prev) => {
      const newMap = new Map(prev);
      // if index is not in map, add it
      if (!newMap.has(index)) {
        newMap.set(index, []);
      }
      // if selected player number is not in the array, add it
      if (!newMap.get(index)?.includes(selectedPlayerNum)) {
        newMap.get(index)?.push(selectedPlayerNum);
      }
      return newMap;
    });
  };

  return {
    lineDataMap,
    selectedPlayerId: selectedPlayerNum,
    setSelectedPlayerId: setSelectedPlayerNum,
  };
};
