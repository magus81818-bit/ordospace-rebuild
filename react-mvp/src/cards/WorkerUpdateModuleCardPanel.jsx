import { useEffect, useState } from "react";

import { QC_STATUS, getStatusLabel } from "../domain/module-card.model.mjs";
import { AppButton, DataPanel, FormFeedback } from "../ui/index.js";
import { canWorkerUpdateCard } from "./module-card-actions.mjs";
import {
  NOTE_MAX_LENGTH,
  validateWorkerUpdateInput,
} from "./module-card-form-validation.mjs";

export function WorkerUpdateModuleCardPanel({ card, currentUser, onUpdate }) {
  const [form, setForm] = useState(() => getWorkerFormFromCard(card));
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState("");
  const isEditable = canWorkerUpdateCard(card, currentUser.id);

  useEffect(() => {
    setForm(getWorkerFormFromCard(card));
  }, [card.id, card.loggedHours, card.progress, card.qcStatus]);

  function updateField(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setErrors([]);
    setSuccess("");

    const validationErrors = validateWorkerUpdateInput(form, card);

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const result = onUpdate(form);
      setForm({
        ...getWorkerFormFromCard(result.card),
        note: "",
      });
      setSuccess(
        `${result.card.title} updated to ${result.card.progress}% and ${getStatusLabel(
          result.card.status,
        )}.`,
      );
    } catch (submitError) {
      setErrors([submitError.message]);
    }
  }

  if (!isEditable) {
    return (
      <DataPanel className="worker-update-panel">
        <div>
          <span className="card-kicker">Worker update</span>
          <h2>No worker update available</h2>
          <p className="panel-copy">
            This ModuleCard is currently {getStatusLabel(card.status)} and is
            outside the worker update window.
          </p>
        </div>
      </DataPanel>
    );
  }

  return (
    <DataPanel className="worker-update-panel">
      <div>
        <span className="card-kicker">Worker update</span>
        <h2>Update progress and QC</h2>
        <p className="panel-copy">
          {currentUser.name} can record progress, QC state, and one team note.
        </p>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="form-field span-2">
          <span>Progress</span>
          <div className="range-row">
            <input
              max="100"
              min="0"
              onChange={(event) => updateField("progress", event.target.value)}
              type="range"
              value={form.progress}
            />
            <strong>{form.progress}%</strong>
          </div>
        </label>

        <label className="form-field">
          <span>Logged hours</span>
          <input
            min="0"
            onChange={(event) => updateField("loggedHours", event.target.value)}
            step="0.5"
            type="number"
            value={form.loggedHours}
          />
        </label>

        <label className="form-field">
          <span>QC status</span>
          <select
            onChange={(event) => updateField("qcStatus", event.target.value)}
            value={form.qcStatus}
          >
            {Object.values(QC_STATUS).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field span-2">
          <span>Team note</span>
          <textarea
            maxLength={NOTE_MAX_LENGTH}
            onChange={(event) => updateField("note", event.target.value)}
            rows="3"
            value={form.note}
          />
        </label>

        <FormFeedback errors={errors} success={success} />

        <div className="form-actions">
          <AppButton type="submit">Save worker update</AppButton>
        </div>
      </form>
    </DataPanel>
  );
}

function getWorkerFormFromCard(card) {
  return {
    loggedHours: card.loggedHours,
    note: "",
    progress: card.progress,
    qcStatus: card.qcStatus,
  };
}
