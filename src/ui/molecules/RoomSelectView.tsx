import { useState } from "react";

type Props = {
  createRoom: () => void;
  joinRoomById: (roomId: string) => void;
};

export const RoomSelectView: React.FC<Props> = ({ createRoom, joinRoomById }) => {
  const [inputRoomId, setRoomId] = useState("");

  return (
    <div>
      <div>
        <button className="btn btn-primary" onClick={createRoom}>
          Create Room
        </button>
      </div>
      <div className="pt-4">
        <input
          type="text"
          value={inputRoomId}
          onChange={(event) => setRoomId(event.target.value)}
        />
        <button className="btn btn-primary" onClick={() => joinRoomById(inputRoomId)}>
          Join Room
        </button>
      </div>
    </div>
  );
};
