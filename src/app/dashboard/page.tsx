import { Sidebar } from "@/components/dashboard/Sidebar";
import { SidebarProvider } from "@/components/dashboard/sidebar-context";
import { TopBar } from "@/components/dashboard/TopBar";

export default function DashboardPage() {
  return (
    <SidebarProvider>
      <div className="flex h-full min-h-screen bg-background text-foreground">
        <Sidebar />

        {/* Main column: top bar + content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1 p-6">
            {/* Main content — placeholder for Phase 3 */}
            <h2 className="text-lg font-semibold">Main</h2>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}