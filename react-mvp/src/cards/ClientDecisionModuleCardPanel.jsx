import { useState } from "react";

import { getStatusLabel } from "../domain/module-card.model.mjs";
import { AppButton, DataPanel, FormFeedback } from "../ui/index.js";
import {
  CLIENT_DECISIONS,
  canClientDecideModuleCard,
} from "./module-card-actions.mjs";
import {
  NOTE_MAX_LENGTH,
  validateClientDecisionInput,
} from "./module-card-form-validation.mjs";

export function ClientDecisionModuleCardPanel({ card, currentUser, onDecide }) {
  const [decision, setDecision] = useState(CLIENT_DECISIONS.APPROVE);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState("");
  const canDecide = canClientDecideModuleCard(card, currentUser.id);
  const requiresNote = decision === CLIENT_DECISIONS.REQUEST_REVISION;

  function handleSubmit(event) {
    event.preventDefault();
    setErrors([]);
    setSuccess("");

    const validationErrors = validateClientDecisionInput({ decision, note });

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const result = onDecide({ decision, note });
      setNote("");
      setSuccess(`${result.card.title} moved to ${getStatusLabel(result.card.status)}.`);
    } catch (submitError) {
      setErrors([submitError.message]);
    }
  }

  return (
    <DataPanel className="client-decision-panel">
      <div>
        <span className="card-kicker">Client decision</span>
        <h2>Approve or request revision</h2>
        <p className="panel-copy">
          {canDecide
            ? `${currentUser.name} can make the client decision for this ModuleCard.`
            : `Current status is ${getStatusLabel(card.status)}. Client decisions are available only from client review.`}
        </p>
      </div>

      {canDecide ? (
        <form className="form-grid" onSubmit={handleSubmit}>
          <fieldset className="form-field span-2 decision-options">
            <legend>Decision</legend>
            <label>
              <input
                checked={decision === CLIENT_DECISIONS.APPROVE}
                name="clientDecision"
                onChange={() => setDecision(CLIENT_DECISIONS.APPROVE)}
                type="radio"
              />
              <span>Approve</span>
            </label>
            <label>
              <input
                checked={decision === CLIENT_DECISIONS.REQUEST_REVISION}
                name="clientDecision"
                onChange={() => setDecision(CLIENT_DECISIONS.REQUEST_REVISION)}
                type="radio"
              />
              <span>Request revision</span>
            </label>
          </fieldset>

          <label className="form-field span-2">
            <span>{requiresNote ? "Revision note" : "Approval note"}</span>
            <textarea
              maxLength={NOTE_MAX_LENGTH}
              onChange={(event) => setNote(event.target.value)}
              required={requiresNote}
              rows="3"
              value={note}
            />
          </label>

          <div className="form-actions">
            <AppButton type="submit">
              {requiresNote ? "Request revision" : "Approve ModuleCard"}
            </AppButton>
          </div>
        </form>
      ) : null}

      <FormFeedback errors={errors} success={success} />
    </DataPanel>
  );
}
