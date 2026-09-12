import { Outlet } from "react-router-dom";

import ErrorBoundary from "../components/ui/ErrorBoundary";
import PageContainer from "../components/layout/PageContainer";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

export default function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Topbar />
        <main>
          <PageContainer>
            <ErrorBoundary title="This page is unavailable">
              <Outlet />
            </ErrorBoundary>
          </PageContainer>
        </main>
      </div>
    </div>
  );
}
