import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PhoneAssistant from './components/PhoneAssistant';
import './index.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');

  const renderCurrentView = () => {
    switch (currentView) {
      case 'phone-assistant':
        return <PhoneAssistant />;
      case 'dashboard':
      default:
        return <Dashboard sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />;
    }
  };

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen}
        currentView={currentView}
        setCurrentView={setCurrentView}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {renderCurrentView()}
      </div>
    </div>
  );
}

export default App;