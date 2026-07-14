import { getRoleLabel } from "../domain/module-card.model.mjs";

export function AccountOption({ checked, onChange, user }) {
  return (
    <label className={checked ? "account-option is-selected" : "account-option"}>
      <input
        checked={checked}
        name="seed-user"
        onChange={onChange}
        type="radio"
        value={user.id}
      />
      <span>
        <strong>{user.name}</strong>
        <small>{getRoleLabel(user.role)}</small>
        <small>{user.email}</small>
      </span>
    </label>
  );
}
