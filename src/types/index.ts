type PlayerStatus = "NONE" | "WORKING" | "CONFLICT";

export type PlayerData = {
  id: number;
  checkoutTimestamp: number;
  status: PlayerStatus;
  updatedLineIndex: Array<number>;
  conflictLineIndex: Array<number>;
};
