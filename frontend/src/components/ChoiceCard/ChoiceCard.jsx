import "./ChoiceCard.css";

export function ChoiceCard({ type = "radio", label, description, checked, className = "", ...inputProps }) {
  return (
    <label className={`choice-card ${checked ? "choice-card--checked" : ""} ${className}`.trim()}>
      <input type={type} className="choice-card__input" checked={checked} {...inputProps} />
      <span className="choice-card__text">
        <span className="choice-card__label">{label}</span>
        {description && <span className="choice-card__description">{description}</span>}
      </span>
      <span className="choice-card__check" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7" />
        </svg>
      </span>
    </label>
  );
}
