import { Activity, CardStatus } from "../../generated/prisma/client.js";

export interface IActivityRepo {
  create: (data: {
    cardId: number;
    actorId: number;
    type: string;
    fromStatus?: CardStatus;
    toStatus?: CardStatus;
    note?: string;
  }) => Promise<Activity>;
}
