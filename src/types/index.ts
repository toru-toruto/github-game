type PlayerStatus = "NONE" | "WORKING" | "CONFLICT";

export type PlayerData = {
  id: number;
  checkoutTimestamp: number;
  status: PlayerStatus;
  updatedLineList: Array<number>;
  conflictLineList: Array<number>;
};
