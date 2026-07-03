import { Logo } from "@/components/dashboard/Logo";
import { TopBar } from "@/components/dashboard/TopBar";

export default function DashboardPage() {
  return (
    <div className="flex h-full min-h-screen bg-background text-foreground">
      {/* Sidebar — placeholder for Phase 2 */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border md:flex">
        <div className="flex h-16 shrink-0 items-center border-b border-border px-6">
          <Logo />
        </div>
        <div className="p-6">
          <h2 className="text-lg font-semibold">Sidebar</h2>
        </div>
      </aside>

      {/* Main column: top bar + content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 p-6">
          <h2 className="text-lg font-semibold">Main</h2>
        </main>
      </div>
    </div>
  );
}