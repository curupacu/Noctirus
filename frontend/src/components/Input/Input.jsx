import "./Input.css";

export function Input({ label, id, error, ...props }) {
  return (
    <div className="input-group">
      {label && (
        <label className="input-label" htmlFor={id}>
          {label}
        </label>
      )}
      <input id={id} className="input" {...props} />
      {error && <span className="input-error">{error}</span>}
    </div>
  );
}
