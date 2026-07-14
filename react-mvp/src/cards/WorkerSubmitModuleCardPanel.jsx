import { useState } from "react";

import { getStatusLabel } from "../domain/module-card.model.mjs";
import { AppButton, DataPanel, FormFeedback } from "../ui/index.js";
import { canWorkerSubmitForAdminReview } from "./module-card-actions.mjs";
import {
  NOTE_MAX_LENGTH,
  validateOptionalNote,
} from "./module-card-form-validation.mjs";

export function WorkerSubmitModuleCardPanel({ card, currentUser, onSubmit }) {
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState("");
  const canSubmit = canWorkerSubmitForAdminReview(card, currentUser.id);

  function handleSubmit(event) {
    event.preventDefault();
    setErrors([]);
    setSuccess("");

    const validationErrors = validateOptionalNote(note, "Submission note");

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const result = onSubmit({ note });
      setNote("");
      setSuccess(`${result.card.title} submitted for admin review.`);
    } catch (submitError) {
      setErrors([submitError.message]);
    }
  }

  return (
    <DataPanel className="worker-submit-panel">
      <div>
        <span className="card-kicker">Worker submit</span>
        <h2>Submit for admin review</h2>
        <p className="panel-copy">
          {canSubmit
            ? "QC is ready. Send this ModuleCard to the admin review queue."
            : `Current status is ${getStatusLabel(card.status)}. Submit becomes available after QC is passed at 100%.`}
        </p>
      </div>

      {canSubmit ? (
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="form-field span-2">
            <span>Submission note</span>
            <textarea
              maxLength={NOTE_MAX_LENGTH}
              onChange={(event) => setNote(event.target.value)}
              rows="3"
              value={note}
            />
          </label>

          <div className="form-actions">
            <AppButton type="submit">Submit to admin review</AppButton>
          </div>
        </form>
      ) : null}

      <FormFeedback errors={errors} success={success} />
    </DataPanel>
  );
}
