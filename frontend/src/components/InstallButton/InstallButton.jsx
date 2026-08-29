import { usePwaInstall } from "../../lib/usePwaInstall";
import "./InstallButton.css";

export function InstallButton() {
  const { podeInstalar, instalar } = usePwaInstall();
  if (!podeInstalar) return null;

  return (
    <button
      type="button"
      className="install-button"
      onClick={instalar}
      aria-label="Instalar app"
      title="Instalar app"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3v13m0 0-4.5-4.5M12 16l4.5-4.5" />
        <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      </svg>
    </button>
  );
}
