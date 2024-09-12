export const usePlayerColor = () => {
  const getPlayerColor = (playerId: number, isActive: boolean) => {
    if (playerId === 0) {
      if (isActive) return "bg-red-500";
      return "bg-red-50";
    } else if (playerId === 1) {
      if (isActive) return "bg-blue-500";
      return "bg-blue-50";
    } else if (playerId === 2) {
      if (isActive) return "bg-green-500";
      return "bg-green-50";
    } else if (playerId === 3) {
      if (isActive) return "bg-yellow-500";
      return "bg-yellow-50";
    } else {
      return "bg-gray-50";
    }
  };

  return { getPlayerColor };
};
