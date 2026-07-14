import { useMemo, useState } from "react";

import { PRIORITIES, getRoleLabel } from "../domain/module-card.model.mjs";
import { AppButton, DataPanel, EmptyStatePanel, FormFeedback } from "../ui/index.js";
import { validateAdminCreateInput } from "./module-card-form-validation.mjs";

const defaultForm = {
  title: "",
  summary: "",
  phase: "Build",
  priority: "normal",
  assigneeId: "",
  dueDate: getDefaultDueDate(),
  estimateHours: 8,
  deliverable: "",
};

export function AdminCreateModuleCardPanel({ currentUser, onCreate, workers }) {
  const initialForm = useMemo(
    () => ({
      ...defaultForm,
      assigneeId: workers[0]?.id ?? "",
    }),
    [workers],
  );
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState([]);
  const [createdMessage, setCreatedMessage] = useState("");

  function updateField(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setErrors([]);
    setCreatedMessage("");

    const validationErrors = validateAdminCreateInput(form, { workers });

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const result = onCreate(form);
      const workerName =
        workers.find((worker) => worker.id === result.card.assigneeId)?.name ??
        "selected worker";

      setCreatedMessage(`${result.card.title} assigned to ${workerName}.`);
      setForm({
        ...initialForm,
        title: "",
        summary: "",
        deliverable: "",
      });
    } catch (submitError) {
      setErrors([submitError.message]);
    }
  }

  if (workers.length === 0) {
    return (
      <EmptyStatePanel
        copy="Add a worker seed account before creating a new ModuleCard."
        title="No workers are available"
      />
    );
  }

  return (
    <DataPanel className="create-card-panel">
      <div>
        <span className="card-kicker">Admin create</span>
        <h2>Create and assign a ModuleCard</h2>
        <p className="panel-copy">
          {currentUser.name} can add one scoped task and assign it to a worker.
        </p>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Title</span>
          <input
            onChange={(event) => updateField("title", event.target.value)}
            required
            type="text"
            value={form.title}
          />
        </label>

        <label className="form-field span-2">
          <span>Summary</span>
          <textarea
            onChange={(event) => updateField("summary", event.target.value)}
            required
            rows="3"
            value={form.summary}
          />
        </label>

        <label className="form-field">
          <span>Phase</span>
          <input
            onChange={(event) => updateField("phase", event.target.value)}
            required
            type="text"
            value={form.phase}
          />
        </label>

        <label className="form-field">
          <span>Priority</span>
          <select
            onChange={(event) => updateField("priority", event.target.value)}
            value={form.priority}
          >
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span>Worker</span>
          <select
            onChange={(event) => updateField("assigneeId", event.target.value)}
            required
            value={form.assigneeId}
          >
            {workers.map((worker) => (
              <option key={worker.id} value={worker.id}>
                {worker.name} - {getRoleLabel(worker.role)}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span>Due date</span>
          <input
            onChange={(event) => updateField("dueDate", event.target.value)}
            required
            type="date"
            value={form.dueDate}
          />
        </label>

        <label className="form-field">
          <span>Estimate hours</span>
          <input
            min="1"
            onChange={(event) => updateField("estimateHours", event.target.value)}
            required
            type="number"
            value={form.estimateHours}
          />
        </label>

        <label className="form-field span-2">
          <span>Deliverable</span>
          <input
            onChange={(event) => updateField("deliverable", event.target.value)}
            required
            type="text"
            value={form.deliverable}
          />
        </label>

        <FormFeedback errors={errors} success={createdMessage} />

        <div className="form-actions">
          <AppButton type="submit">Create and assign</AppButton>
        </div>
      </form>
    </DataPanel>
  );
}

function getDefaultDueDate() {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  return dueDate.toISOString().slice(0, 10);
}
