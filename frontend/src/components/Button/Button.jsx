import "./Button.css";

export function Button({ variant = "primary", className = "", children, ...props }) {
  return (
    <button className={`button button--${variant}${className ? ` ${className}` : ""}`} {...props}>
      {children}
    </button>
  );
}
