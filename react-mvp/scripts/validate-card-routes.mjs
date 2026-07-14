import assert from "node:assert/strict";

import { mvpSeed } from "../src/data/mvp-seed.mjs";
import {
  ROLES,
  getActivityForCard,
  getCardById,
  getCardsForRole,
  getCommentsForCard,
  sortCardsByDueDate,
} from "../src/domain/module-card.model.mjs";

const admin = mvpSeed.users.find((user) => user.role === ROLES.ADMIN);
const workers = mvpSeed.users.filter((user) => user.role === ROLES.WORKER);
const client = mvpSeed.users.find((user) => user.role === ROLES.CLIENT);

const adminCards = getCardsForRole(mvpSeed.moduleCards, ROLES.ADMIN, admin.id);
const clientCards = getCardsForRole(mvpSeed.moduleCards, ROLES.CLIENT, client.id);
const workerCards = workers.map((worker) => ({
  worker,
  cards: getCardsForRole(mvpSeed.moduleCards, ROLES.WORKER, worker.id),
}));

assert.equal(adminCards.length, 7);
assert.equal(clientCards.length, 7);
assert.deepEqual(
  workerCards.map((entry) => entry.cards.length),
  [3, 3],
);

assert.equal(getCardById(adminCards, "card-003").title, "Authentication build");
assert.equal(getCardById(workerCards[0].cards, "card-003"), null);
assert.equal(getCardById(clientCards, "card-004").status, "revision_requested");

assert.equal(getCommentsForCard(mvpSeed.comments, "card-004").length, 1);
assert.equal(getActivityForCard(mvpSeed.activities, "card-002").length, 1);

const sortedDueDates = sortCardsByDueDate(adminCards).map((card) => card.dueDate);
assert.deepEqual(sortedDueDates, [...sortedDueDates].sort());

console.log(
  JSON.stringify(
    {
      ok: true,
      adminCards: adminCards.length,
      clientCards: clientCards.length,
      workerCards: workerCards.map((entry) => ({
        userId: entry.worker.id,
        cards: entry.cards.length,
      })),
    },
    null,
    2,
  ),
);
