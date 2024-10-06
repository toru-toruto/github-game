import { PlayerData } from "@/types";
import { CodeLine } from "../atoms/CodeLine";

type Props = {
  lineNum: number;
  playerData: Array<PlayerData>;
  myPlayerId: number;
};

export const CodePanel: React.FC<Props> = ({ lineNum, playerData, myPlayerId }) => {
  return (
    <>
      {Array.from({ length: lineNum }).map((_, i) => {
        if (myPlayerId !== -1 && playerData[myPlayerId]?.status === "CONFLICT") {
          const isConflict = playerData[myPlayerId].conflictLineList.includes(i);
          return <CodeLine key={i} editorIds={isConflict ? [myPlayerId] : undefined} />;
        } else {
          const editorIds = playerData
            .filter((p) => p.updatedLineList.includes(i))
            .map((p) => p.id);
          return <CodeLine key={i} editorIds={editorIds} />;
        }
      })}
    </>
  );
};
