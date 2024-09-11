import { PlayerData } from "@/types";
import { CodeLine } from "../atoms/CodeLine";
import { useMemo } from "react";

type Props = {
  lineNum: number;
  playerData: Array<PlayerData>;
};

export const CodePanel: React.FC<Props> = ({ lineNum, playerData }) => {
  return (
    <>
      {Array.from({ length: lineNum }).map((_, i) => {
        const editorIds = playerData.filter((p) => p.updatedLineIndex.includes(i)).map((p) => p.id);
        return <CodeLine key={i} editorIds={editorIds} />;
      })}
    </>
  );
};
