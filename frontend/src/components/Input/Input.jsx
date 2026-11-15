import "./Input.css";

export function Input({ label, id, error, ...props }) {
  return (
    <div className="input-group">
      {label && (
        <label className="input-label" htmlFor={id}>
          {label}
        </label>
      )}
      <input
        id={id}
        className="input"
        aria-invalid={error ? true : undefined}
        aria-describedby={error && id ? `${id}-erro` : undefined}
        {...props}
      />
      {error && (
        <span className="input-error" id={id ? `${id}-erro` : undefined}>
          {error}
        </span>
      )}
    </div>
  );
}
