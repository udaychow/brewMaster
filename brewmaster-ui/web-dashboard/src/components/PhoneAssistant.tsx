import React, { useState, useEffect } from 'react';

interface ActiveCall {
  id: string;
  phoneNumber: string;
  duration: string;
  type: 'reservation' | 'order' | 'question';
  status: 'active' | 'completed' | 'transferred';
  aiConfidence: number;
}

interface CallAnalytics {
  totalCallsToday: number;
  reservationsMade: number;
  ordersPlaced: number;
  averageCallTime: string;
  customerSatisfaction: number;
  aiSuccessRate: number;
}

const PhoneAssistant: React.FC = () => {
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([
    {
      id: 'call_001',
      phoneNumber: '+1 (555) 123-4567',
      duration: '2:34',
      type: 'reservation',
      status: 'active',
      aiConfidence: 0.92
    },
    {
      id: 'call_002', 
      phoneNumber: '+1 (555) 987-6543',
      duration: '1:18',
      type: 'order',
      status: 'completed',
      aiConfidence: 0.88
    }
  ]);

  const [analytics, setAnalytics] = useState<CallAnalytics>({
    totalCallsToday: 47,
    reservationsMade: 23,
    ordersPlaced: 18,
    averageCallTime: '3:42',
    customerSatisfaction: 4.6,
    aiSuccessRate: 0.89
  });

  const [testCall, setTestCall] = useState({
    phoneNumber: '',
    message: '',
    response: ''
  });

  const [isTestingCall, setIsTestingCall] = useState(false);

  const handleTestCall = async () => {
    if (!testCall.phoneNumber || !testCall.message) return;
    
    setIsTestingCall(true);
    
    // Simulate AI response (in real app, would call API)
    setTimeout(() => {
      const responses = {
        reservation: "Hello! I'd be happy to help you with a reservation. What date and time were you thinking, and how many people will be joining you?",
        order: "Great! I can help you place a takeout order. We have some fantastic options today. Are you interested in our craft beers to go, or would you like to hear about our food specials?",
        question: "Thanks for calling BrewMaster Brewery! I'm here to help answer any questions about our beers, events, or hours. What would you like to know?"
      };
      
      const intent = testCall.message.toLowerCase().includes('reservation') ? 'reservation' :
                    testCall.message.toLowerCase().includes('order') ? 'order' : 'question';
      
      setTestCall(prev => ({
        ...prev,
        response: responses[intent]
      }));
      setIsTestingCall(false);
    }, 2000);
  };

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setAnalytics(prev => ({
        ...prev,
        totalCallsToday: prev.totalCallsToday + Math.floor(Math.random() * 2),
        reservationsMade: Math.floor(Math.random() * 2) ? prev.reservationsMade + 1 : prev.reservationsMade,
        ordersPlaced: Math.floor(Math.random() * 3) ? prev.ordersPlaced + 1 : prev.ordersPlaced
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
          📞 AI Phone Assistant Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Sarah, your AI assistant, handling calls with brewery charm and intelligence
        </p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-xl border-t-4 border-green-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm">Calls Today</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{analytics.totalCallsToday}</p>
              <p className="text-green-600 text-sm mt-1">+12 from yesterday</p>
            </div>
            <div className="text-4xl">📱</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-xl border-t-4 border-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm">AI Success Rate</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{Math.round(analytics.aiSuccessRate * 100)}%</p>
              <p className="text-blue-600 text-sm mt-1">No human transfer needed!</p>
            </div>
            <div className="text-4xl">🤖</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-xl border-t-4 border-purple-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm">Reservations Made</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{analytics.reservationsMade}</p>
              <p className="text-purple-600 text-sm mt-1">Busy night ahead! 🍺</p>
            </div>
            <div className="text-4xl">📅</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-xl border-t-4 border-orange-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm">Orders Placed</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{analytics.ordersPlaced}</p>
              <p className="text-orange-600 text-sm mt-1">Kitchen staying busy!</p>
            </div>
            <div className="text-4xl">🍔</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Calls */}
        <div className="bg-white rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">🔊</span> Live Calls
          </h2>
          
          {activeCalls.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">☎️</div>
              <p className="text-gray-500">No active calls</p>
              <p className="text-sm text-gray-400">Sarah is ready for the next caller!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeCalls.map(call => (
                <div key={call.id} className={`border-l-4 p-4 rounded-lg ${
                  call.status === 'active' ? 'border-green-400 bg-green-50' :
                  call.status === 'completed' ? 'border-blue-400 bg-blue-50' :
                  'border-red-400 bg-red-50'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {call.type === 'reservation' ? '📅' : 
                         call.type === 'order' ? '🍺' : '❓'}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-800">{call.phoneNumber}</p>
                        <p className="text-sm text-gray-600 capitalize">{call.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-700">{call.duration}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                        <p className="text-xs text-gray-500">{call.status}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">AI Confidence</span>
                      <span className="text-xs font-bold text-gray-700">
                        {Math.round(call.aiConfidence * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          call.aiConfidence > 0.8 ? 'bg-green-500' :
                          call.aiConfidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${call.aiConfidence * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Test Playground */}
        <div className="bg-white rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">🧪</span> Test Sarah AI
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={testCall.phoneNumber}
                onChange={(e) => setTestCall(prev => ({...prev, phoneNumber: e.target.value}))}
                placeholder="+1 (555) 123-4567"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Message
              </label>
              <textarea
                value={testCall.message}
                onChange={(e) => setTestCall(prev => ({...prev, message: e.target.value}))}
                placeholder="Hi, I'd like to make a reservation for tonight..."
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <button
              onClick={handleTestCall}
              disabled={isTestingCall || !testCall.phoneNumber || !testCall.message}
              className={`w-full py-3 px-4 rounded-lg font-semibold ${
                isTestingCall || !testCall.phoneNumber || !testCall.message
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105'
              } transition-all duration-200`}
            >
              {isTestingCall ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sarah is thinking...
                </span>
              ) : (
                '🗣️ Test AI Response'
              )}
            </button>
            
            {testCall.response && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-l-4 border-blue-500">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Sarah's Response:
                </p>
                <p className="text-gray-800 italic">"{testCall.response}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats & Features */}
        <div className="bg-white rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">⚡</span> Sarah's Superpowers
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🧠</span>
                <div>
                  <p className="font-semibold text-gray-800">Natural Language</p>
                  <p className="text-xs text-gray-600">Understands casual speech</p>
                </div>
              </div>
              <span className="text-green-600 font-bold">✓</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📅</span>
                <div>
                  <p className="font-semibold text-gray-800">Smart Booking</p>
                  <p className="text-xs text-gray-600">Checks real availability</p>
                </div>
              </div>
              <span className="text-blue-600 font-bold">✓</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🍺</span>
                <div>
                  <p className="font-semibold text-gray-800">Beer Expert</p>
                  <p className="text-xs text-gray-600">Recommends based on taste</p>
                </div>
              </div>
              <span className="text-purple-600 font-bold">✓</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📱</span>
                <div>
                  <p className="font-semibold text-gray-800">SMS Confirmation</p>
                  <p className="text-xs text-gray-600">Auto-sends confirmations</p>
                </div>
              </div>
              <span className="text-orange-600 font-bold">✓</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-red-100 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚨</span>
                <div>
                  <p className="font-semibold text-gray-800">Smart Transfer</p>
                  <p className="text-xs text-gray-600">Knows when to escalate</p>
                </div>
              </div>
              <span className="text-red-600 font-bold">✓</span>
            </div>
          </div>

          {/* Quick Setup */}
          <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
            <h3 className="font-semibold text-yellow-800 mb-2">🚀 Quick Setup</h3>
            <p className="text-xs text-yellow-700 mb-3">
              Connect your Twilio number to start receiving AI-powered calls:
            </p>
            <div className="text-xs font-mono bg-white p-2 rounded border text-gray-800">
              Webhook URL: /api/phone/webhooks/voice
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneAssistant;