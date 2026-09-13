import React, { useState } from 'react';
import { SystemProvider } from './context/SystemContext';
import { Sidebar, ActiveModule } from './components/Sidebar';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

// Views
import { DashboardView } from './views/DashboardView';
import { CompaniesView } from './views/CompaniesView';
import { BranchesView } from './views/BranchesView';
import { CollaboratorsView } from './views/CollaboratorsView';
import { InvoicesView } from './views/InvoicesView';
import { OccurrencesView } from './views/OccurrencesView';
import { LossDamagesView } from './views/LossDamagesView';
import { ShortagesView } from './views/ShortagesView';
import { TasksView } from './views/TasksView';
import { ScheduleView } from './views/ScheduleView';
import { ReportsView } from './views/ReportsView';
import { SpreadsheetsView } from './views/SpreadsheetsView';
import { AuditsView } from './views/AuditsView';

const MainContent: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardView onNavigate={(mod) => setActiveModule(mod as ActiveModule)} />;
      case 'cadastro_empresas':
        return <CompaniesView />;
      case 'cadastro_filiais':
        return <BranchesView />;
      case 'colaboradores':
        return <CollaboratorsView />;
      case 'controle_notas':
        return <InvoicesView />;
      case 'ocorrencias':
        return <OccurrencesView />;
      case 'controle_perdas_avarias':
        return <LossDamagesView />;
      case 'falta_produtos':
        return <ShortagesView />;
      case 'tarefas':
      case 'organizacao_tarefas':
        return <TasksView />;
      case 'agenda':
        return <ScheduleView />;
      case 'relatorios':
        return <ReportsView />;
      case 'planilhas':
        return <SpreadsheetsView />;
      case 'auditoria':
        return <AuditsView />;
      default:
        return <DashboardView onNavigate={(mod) => setActiveModule(mod as ActiveModule)} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 font-sans text-slate-900 antialiased selection:bg-red-200 selection:text-red-900">
      {/* Sidebar Navigation */}
      <Sidebar
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Wrapper shifting based on sidebar collapsed state */}
      <div
        className={`flex-1 flex flex-col transition-all duration-200 ease-in-out ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
        }`}
      >
        {/* Top Header */}
        <Header
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          setMobileOpen={setMobileOpen}
        />

        {/* Content Area */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderModule()}
        </main>

        {/* Status Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <SystemProvider>
      <MainContent />
    </SystemProvider>
  );
}
