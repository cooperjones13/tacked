import { useState } from 'react'
import { useBoard } from './hooks/useBoard'
import { Board } from './components/Board'
import { AddApplicationDrawer } from './components/AddApplicationDrawer'
import { ApplicationDetail } from './components/ApplicationDetail'

function App() {
  const { applications, moveApplication, addApplication } = useBoard()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedApp = selectedId ? (applications.find(a => a.id === selectedId) ?? null) : null

  if (selectedApp) {
    return (
      <ApplicationDetail
        application={selectedApp}
        onBack={() => setSelectedId(null)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <header className="sticky top-0 z-10 bg-canvas border-b border-border px-6 py-4 flex items-center justify-between shrink-0">
        <span className="text-[17px] font-semibold text-ink tracking-tight">Onward</span>
        <button
          onClick={() => setDrawerOpen(true)}
          className="px-4 py-2 rounded-button bg-accent text-white text-[13px] font-medium hover:bg-accent-hover transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          + Add application
        </button>
      </header>
      <main className="flex-1 p-6">
        <Board
          applications={applications}
          onMove={moveApplication}
          onSelect={setSelectedId}
        />
      </main>
      <AddApplicationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onAdd={addApplication}
      />
    </div>
  )
}

export default App
