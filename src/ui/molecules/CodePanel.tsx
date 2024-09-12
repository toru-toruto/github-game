import { PlayerData } from "@/types";
import { CodeLine } from "../atoms/CodeLine";

type Props = {
  lineNum: number;
  playerData: Array<PlayerData>;
  selectedPlayerId: number;
};

export const CodePanel: React.FC<Props> = ({ lineNum, playerData, selectedPlayerId }) => {
  return (
    <>
      {Array.from({ length: lineNum }).map((_, i) => {
        if (selectedPlayerId !== -1 && playerData[selectedPlayerId].status === "CONFLICT") {
          const isConflict = playerData[selectedPlayerId].conflictLineList.includes(i);
          return <CodeLine key={i} editorIds={isConflict ? [selectedPlayerId] : undefined} />;
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
