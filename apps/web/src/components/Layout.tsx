import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useUIStore } from '../stores/ui.store';

export function Layout() {
  const { sidebarOpen, closeSidebar } = useUIStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={closeSidebar} />
        )}
        <Sidebar />
        <main
          className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'} ml-0`}
        >
          <div className="p-4 sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
