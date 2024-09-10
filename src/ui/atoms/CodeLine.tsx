import { usePlayerColor } from "@/hooks/usePlayerColor";

type Props = {
  editorIds: Array<number> | undefined;
};

export const CodeLine: React.FC<Props> = ({ editorIds }) => {
  const { getPlayerColor } = usePlayerColor();

  return (
    <div className={`flex-1 flex`}>
      {!!editorIds &&
        editorIds.length > 0 &&
        editorIds
          .sort((a, b) => a - b)
          .map((id) => <div key={id} className={`flex-1 h-full ${getPlayerColor(id, true)}`} />)}
    </div>
  );
};
