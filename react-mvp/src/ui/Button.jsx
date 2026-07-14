import { Link } from "react-router-dom";

const buttonClasses = {
  primary: "primary-button",
  secondary: "secondary-button",
  text: "text-button",
};

const linkClasses = {
  primary: "primary-link",
  secondary: "secondary-button",
  text: "text-button as-link",
};

export function AppButton({
  children,
  className = "",
  type = "button",
  variant = "primary",
  ...props
}) {
  return (
    <button
      className={joinClassNames(buttonClasses[variant], className)}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

export function AppLink({ children, className = "", to, variant = "primary", ...props }) {
  return (
    <Link
      className={joinClassNames(linkClasses[variant], className)}
      to={to}
      {...props}
    >
      {children}
    </Link>
  );
}

function joinClassNames(...values) {
  return values.filter(Boolean).join(" ");
}
