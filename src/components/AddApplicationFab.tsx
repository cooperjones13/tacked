function IconPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 2.5V15.5M2.5 9H15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function AddApplicationFab({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      aria-label="Add application"
      title="Add application"
      className="group fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-30 flex items-center h-12 px-3.5 rounded-full bg-accent-btn text-white shadow-card-drag hover:bg-accent-btn-hover transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
    >
      <IconPlus />
      <span className="hidden sm:inline-block sm:max-w-0 sm:group-hover:max-w-[9.5rem] sm:overflow-hidden sm:whitespace-nowrap sm:transition-[max-width] sm:duration-200 text-[13px] font-medium">
        <span className="pl-2">New application</span>
      </span>
    </button>
  )
}
