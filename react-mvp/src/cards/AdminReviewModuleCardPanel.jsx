import { useState } from "react";

import { getStatusLabel } from "../domain/module-card.model.mjs";
import { AppButton, DataPanel, FormFeedback } from "../ui/index.js";
import { canAdminSendToClientReview } from "./module-card-actions.mjs";
import {
  NOTE_MAX_LENGTH,
  validateOptionalNote,
} from "./module-card-form-validation.mjs";

export function AdminReviewModuleCardPanel({ card, currentUser, onSend }) {
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState("");
  const canSend = canAdminSendToClientReview(card);

  function handleSubmit(event) {
    event.preventDefault();
    setErrors([]);
    setSuccess("");

    const validationErrors = validateOptionalNote(note, "Client note");

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const result = onSend({ note });
      setNote("");
      setSuccess(`${result.card.title} sent to client review.`);
    } catch (submitError) {
      setErrors([submitError.message]);
    }
  }

  return (
    <DataPanel className="admin-review-panel">
      <div>
        <span className="card-kicker">Admin review</span>
        <h2>Send to client review</h2>
        <p className="panel-copy">
          {canSend
            ? `${currentUser.name} can send this ModuleCard to the client review queue.`
            : `Current status is ${getStatusLabel(card.status)}. Client review send is available only from admin review.`}
        </p>
      </div>

      {canSend ? (
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="form-field span-2">
            <span>Client note</span>
            <textarea
              maxLength={NOTE_MAX_LENGTH}
              onChange={(event) => setNote(event.target.value)}
              rows="3"
              value={note}
            />
          </label>

          <div className="form-actions">
            <AppButton type="submit">Send to client review</AppButton>
          </div>
        </form>
      ) : null}

      <FormFeedback errors={errors} success={success} />
    </DataPanel>
  );
}
