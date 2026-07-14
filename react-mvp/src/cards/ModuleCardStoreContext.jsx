import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { mvpSeed } from "../data/mvp-seed.mjs";
import { ROLES } from "../domain/module-card.model.mjs";
import {
  buildAdminClientReviewSend,
  buildAssignedModuleCard,
  buildClientModuleCardDecision,
  buildWorkerAdminReviewSubmission,
  buildWorkerModuleCardUpdate,
} from "./module-card-actions.mjs";
import {
  readStoredModuleCardStore,
  saveModuleCardStoreState,
} from "./module-card-store.service.mjs";

const ModuleCardStoreContext = createContext(null);
const defaultClient = mvpSeed.users.find((user) => user.role === ROLES.CLIENT);

export function ModuleCardStoreProvider({ children }) {
  const [initialStoreState] = useState(() => readStoredModuleCardStore());
  const [moduleCards, setModuleCards] = useState(
    () => initialStoreState.moduleCards,
  );
  const [comments, setComments] = useState(() => initialStoreState.comments);
  const [activities, setActivities] = useState(
    () => initialStoreState.activities,
  );
  const nextLocalAdminSendNumber = useRef(
    initialStoreState.counters.nextLocalAdminSendNumber,
  );
  const nextLocalCardNumber = useRef(
    initialStoreState.counters.nextLocalCardNumber,
  );
  const nextLocalClientDecisionNumber = useRef(
    initialStoreState.counters.nextLocalClientDecisionNumber,
  );
  const nextLocalWorkerSubmitNumber = useRef(
    initialStoreState.counters.nextLocalWorkerSubmitNumber,
  );
  const nextLocalWorkerUpdateNumber = useRef(
    initialStoreState.counters.nextLocalWorkerUpdateNumber,
  );

  useEffect(() => {
    saveModuleCardStoreState({
      moduleCards,
      comments,
      activities,
      counters: {
        nextLocalAdminSendNumber: nextLocalAdminSendNumber.current,
        nextLocalCardNumber: nextLocalCardNumber.current,
        nextLocalClientDecisionNumber: nextLocalClientDecisionNumber.current,
        nextLocalWorkerSubmitNumber: nextLocalWorkerSubmitNumber.current,
        nextLocalWorkerUpdateNumber: nextLocalWorkerUpdateNumber.current,
      },
    });
  }, [activities, comments, moduleCards]);

  const createAssignedModuleCard = useCallback((input, createdBy) => {
    const result = buildAssignedModuleCard({
      clientId: defaultClient.id,
      createdBy,
      input,
      nextNumber: nextLocalCardNumber.current,
    });

    nextLocalCardNumber.current += 1;
    setModuleCards((currentCards) => [...currentCards, result.card]);
    setActivities((currentActivities) => [...currentActivities, result.activity]);

    return result;
  }, []);

  const updateWorkerModuleCard = useCallback(
    (cardId, input, actorId) => {
      const card = moduleCards.find((currentCard) => currentCard.id === cardId);
      const result = buildWorkerModuleCardUpdate({
        actorId,
        card,
        input,
        nextNumber: nextLocalWorkerUpdateNumber.current,
      });

      nextLocalWorkerUpdateNumber.current += 1;
      setModuleCards((currentCards) =>
        currentCards.map((currentCard) =>
          currentCard.id === cardId ? result.card : currentCard,
        ),
      );
      setActivities((currentActivities) => [...currentActivities, result.activity]);

      if (result.comment) {
        setComments((currentComments) => [...currentComments, result.comment]);
      }

      return result;
    },
    [moduleCards],
  );

  const submitWorkerModuleCard = useCallback(
    (cardId, input, actorId) => {
      const card = moduleCards.find((currentCard) => currentCard.id === cardId);
      const result = buildWorkerAdminReviewSubmission({
        actorId,
        card,
        nextNumber: nextLocalWorkerSubmitNumber.current,
        note: input?.note,
      });

      nextLocalWorkerSubmitNumber.current += 1;
      setModuleCards((currentCards) =>
        currentCards.map((currentCard) =>
          currentCard.id === cardId ? result.card : currentCard,
        ),
      );
      setActivities((currentActivities) => [...currentActivities, result.activity]);

      if (result.comment) {
        setComments((currentComments) => [...currentComments, result.comment]);
      }

      return result;
    },
    [moduleCards],
  );

  const sendAdminModuleCardToClientReview = useCallback(
    (cardId, input, actorId) => {
      const card = moduleCards.find((currentCard) => currentCard.id === cardId);
      const result = buildAdminClientReviewSend({
        actorId,
        card,
        nextNumber: nextLocalAdminSendNumber.current,
        note: input?.note,
      });

      nextLocalAdminSendNumber.current += 1;
      setModuleCards((currentCards) =>
        currentCards.map((currentCard) =>
          currentCard.id === cardId ? result.card : currentCard,
        ),
      );
      setActivities((currentActivities) => [...currentActivities, result.activity]);

      if (result.comment) {
        setComments((currentComments) => [...currentComments, result.comment]);
      }

      return result;
    },
    [moduleCards],
  );

  const decideClientModuleCard = useCallback(
    (cardId, input, actorId) => {
      const card = moduleCards.find((currentCard) => currentCard.id === cardId);
      const result = buildClientModuleCardDecision({
        actorId,
        card,
        decision: input?.decision,
        nextNumber: nextLocalClientDecisionNumber.current,
        note: input?.note,
      });

      nextLocalClientDecisionNumber.current += 1;
      setModuleCards((currentCards) =>
        currentCards.map((currentCard) =>
          currentCard.id === cardId ? result.card : currentCard,
        ),
      );
      setActivities((currentActivities) => [...currentActivities, result.activity]);

      if (result.comment) {
        setComments((currentComments) => [...currentComments, result.comment]);
      }

      return result;
    },
    [moduleCards],
  );

  const value = useMemo(
    () => ({
      activities,
      comments,
      createAssignedModuleCard,
      decideClientModuleCard,
      moduleCards,
      sendAdminModuleCardToClientReview,
      submitWorkerModuleCard,
      updateWorkerModuleCard,
    }),
    [
      activities,
      comments,
      createAssignedModuleCard,
      decideClientModuleCard,
      moduleCards,
      sendAdminModuleCardToClientReview,
      submitWorkerModuleCard,
      updateWorkerModuleCard,
    ],
  );

  return (
    <ModuleCardStoreContext.Provider value={value}>
      {children}
    </ModuleCardStoreContext.Provider>
  );
}

export function useModuleCardStore() {
  const context = useContext(ModuleCardStoreContext);

  if (!context) {
    throw new Error("useModuleCardStore must be used within ModuleCardStoreProvider");
  }

  return context;
}
