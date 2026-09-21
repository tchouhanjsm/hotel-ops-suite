import { useState } from "react";
import { Outlet } from "react-router-dom";

import PageContainer from "../components/layout/PageContainer";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import ErrorBoundary from "../components/ui/ErrorBoundary";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="hos-app-bg min-h-screen">
      <div className="flex min-h-screen">
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onToggle={() => setCollapsed((value) => !value)}
          onCloseMobile={() => setMobileOpen(false)}
        />

        <div className="min-w-0 flex-1">
          <Topbar onMenuClick={() => setMobileOpen(true)} />

          <main>
            <PageContainer>
              <ErrorBoundary title="This page is unavailable">
                <Outlet />
              </ErrorBoundary>
            </PageContainer>
          </main>
        </div>
      </div>
    </div>
  );
}
