"use client";

export default function GhostButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="ghost-trigger" onClick={onClick} title="Ghost Mode" aria-label="Start Ghost Mode">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2C7.58 2 4 5.58 4 10v10l3-2 2.5 2 2.5-2 2.5 2 2.5-2 3 2V10c0-4.42-3.58-8-8-8Z" />
        <circle cx="9" cy="10" r="0.9" fill="currentColor" stroke="none" />
        <circle cx="15" cy="10" r="0.9" fill="currentColor" stroke="none" />
      </svg>
      <span className="ghost-trigger-label">Ghost Mode</span>
    </button>
  );
}
