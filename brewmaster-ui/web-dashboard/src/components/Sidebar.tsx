import React from 'react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  currentView: string;
  setCurrentView: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, currentView, setCurrentView }) => {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: '🏠', description: 'Home sweet brewery' },
    { id: 'production', name: 'Production', icon: '🍺', description: 'Brewing magic happens here' },
    { id: 'inventory', name: 'Inventory', icon: '📦', description: 'Stock & supplies' },
    { id: 'taproom', name: 'Taproom', icon: '🍻', description: 'Where friends gather' },
    { id: 'customers', name: 'Customers', icon: '👥', description: 'Our beloved patrons' },
    { id: 'events', name: 'Events', icon: '🎉', description: 'Party planning central' },
    { id: 'finance', name: 'Finance', icon: '💰', description: 'Show me the money!' },
    { id: 'compliance', name: 'Compliance', icon: '📋', description: 'Keeping it legal' },
    { id: 'ai-assistant', name: 'AI Assistant', icon: '🤖', description: 'Your brewing buddy' },
    { id: 'phone-assistant', name: 'Phone AI', icon: '📞', description: 'Sarah handles calls!' },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 z-50 h-full bg-gradient-to-b from-amber-900 to-amber-800 text-white transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-20'
      } overflow-hidden`}>
        
        {/* Logo Section */}
        <div className="p-4 border-b border-amber-700">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${!isOpen && 'justify-center'}`}>
              <span className="text-3xl">🍺</span>
              {isOpen && (
                <div className="ml-3">
                  <h1 className="text-xl font-bold">BrewMaster AI</h1>
                  <p className="text-xs text-amber-200">Craft Beer Paradise</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 rounded hover:bg-amber-700 transition-colors"
            >
              {isOpen ? '◀' : '▶'}
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="mt-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full px-4 py-3 flex items-center hover:bg-amber-700 transition-colors ${
                currentView === item.id ? 'bg-amber-700 border-l-4 border-yellow-400' : ''
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              {isOpen && (
                <div className="ml-3 text-left">
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-xs text-amber-200">{item.description}</div>
                </div>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom Section - Brewery Status */}
        {isOpen && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-amber-700">
            <div className="text-center">
              <div className="text-2xl mb-2">🍻</div>
              <p className="text-sm text-amber-200">Brewery Status</p>
              <p className="text-lg font-bold text-green-400">OPEN</p>
              <p className="text-xs text-amber-300 mt-1">Happy Hour: 4-6 PM</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;