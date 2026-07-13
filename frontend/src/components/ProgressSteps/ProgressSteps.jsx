import "./ProgressSteps.css";

export function ProgressSteps({ steps, currentIndex }) {
  return (
    <ol className="progress-steps">
      {steps.map((step, i) => {
        const state = i < currentIndex ? "done" : i === currentIndex ? "current" : "upcoming";
        return (
          <li key={step} className={`progress-steps__item progress-steps__item--${state}`}>
            <span className="progress-steps__dot" aria-hidden="true" />
            <span className="progress-steps__label">{step}</span>
          </li>
        );
      })}
    </ol>
  );
}
