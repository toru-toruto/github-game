import { CodeLine } from "../atoms/CodeLine";

type Props = {
  playerId: number;
  lineNum: number;
  lineDataMap: Map<number, Array<number>>;
};

export const CodePanel: React.FC<Props> = ({ lineNum, lineDataMap }) => {
  return (
    <>
      {Array.from({ length: lineNum }).map((_, i) => (
        <CodeLine key={i} editorIds={lineDataMap.get(i)} />
      ))}
    </>
  );
};
