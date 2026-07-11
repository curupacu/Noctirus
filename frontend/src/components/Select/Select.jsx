import "../Input/Input.css";
import "./Select.css";

export function Select({ label, id, children, ...props }) {
  return (
    <div className="input-group">
      {label && (
        <label className="input-label" htmlFor={id}>
          {label}
        </label>
      )}
      <select id={id} className="select" {...props}>
        {children}
      </select>
    </div>
  );
}
