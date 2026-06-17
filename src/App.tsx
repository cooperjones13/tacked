import { useBoard } from './hooks/useBoard'
import { Board } from './components/Board'

function App() {
  const { applications, moveApplication } = useBoard()

  return (
    <div className="h-screen bg-canvas flex flex-col overflow-hidden">
      <header className="border-b border-border px-6 py-4 flex items-center shrink-0">
        <span className="text-[17px] font-semibold text-ink tracking-tight">Onward</span>
      </header>
      <main className="flex-1 p-6 flex flex-col overflow-hidden">
        <Board applications={applications} onMove={moveApplication} />
      </main>
    </div>
  )
}

export default App
