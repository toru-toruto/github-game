import { usePlayerColor } from "@/hooks/usePlayerColor";
import { Dispatch, SetStateAction, useMemo } from "react";

type Props = {
  playerId: number;
  isActive: boolean;
  setSelectedPlayerNum: Dispatch<SetStateAction<number>>;
};

export const PlayerIcon: React.FC<Props> = ({
  playerId,
  isActive,
  setSelectedPlayerNum: setActiveNum,
}) => {
  const { getPlayerColor } = usePlayerColor();

  return (
    <div className="relative w-full h-full flex flex-col justify-center">
      <div
        className={`aspect-square w-[120px] max-h-full rounded-full border-4 border-slate-500 ${getPlayerColor(
          playerId,
          isActive
        )}`}
        onClick={() => setActiveNum(playerId)}
      ></div>
    </div>
  );
};
