import { Dispatch, SetStateAction, useMemo } from "react";

type Props = {
  num: number;
  isActive: boolean;
  setActiveNum: Dispatch<SetStateAction<number>>;
};

export const Player: React.FC<Props> = ({ num, isActive, setActiveNum }) => {
  const iconColor = useMemo(() => {
    if (num === 0) {
      if (isActive) return "bg-red-500";
      return "bg-red-50";
    } else if (num === 1) {
      if (isActive) return "bg-blue-500";
      return "bg-blue-50";
    } else if (num === 2) {
      if (isActive) return "bg-green-500";
      return "bg-green-50";
    } else if (num === 3) {
      if (isActive) return "bg-yellow-500";
      return "bg-yellow-50";
    }
  }, [num, isActive]);

  return (
    <div className="relative w-full h-full flex flex-col justify-center">
      <div
        className={`aspect-square w-[120px] max-h-full rounded-full border-4 border-slate-500 ${iconColor}`}
        onClick={() => setActiveNum(num)}
      ></div>
    </div>
  );
};
