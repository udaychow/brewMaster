import React, { useState, useEffect } from 'react';

interface DashboardProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeBeers, setActiveBeers] = useState(12);
  const [happyCustomers, setHappyCustomers] = useState(324);
  const [kegsOnTap, setKegsOnTap] = useState(8);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      // Simulate live updates
      setHappyCustomers(prev => prev + Math.floor(Math.random() * 3));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const beerStyles = [
    { name: 'IPA', amount: 45, color: 'bg-orange-500', emoji: '🍊', status: 'Hoppy & Fresh!' },
    { name: 'Stout', amount: 30, color: 'bg-gray-800', emoji: '☕', status: 'Dark & Creamy' },
    { name: 'Lager', amount: 60, color: 'bg-yellow-500', emoji: '🌾', status: 'Crisp & Clean' },
    { name: 'Wheat', amount: 35, color: 'bg-amber-400', emoji: '🌽', status: 'Smooth & Cloudy' },
  ];

  const upcomingEvents = [
    { date: 'Tonight', event: 'Trivia Night', emoji: '🧠', attendees: 45, status: 'Filling Fast!' },
    { date: 'Friday', event: 'Live Music', emoji: '🎸', attendees: 120, status: 'Almost Sold Out!' },
    { date: 'Saturday', event: 'Beer Tasting', emoji: '🍺', attendees: 30, status: 'Spots Available' },
    { date: 'Sunday', event: 'Family Brunch', emoji: '🥞', attendees: 60, status: 'Reservations Open' },
  ];

  const funFacts = [
    "🍺 Our IPA won 'Best Hop Head's Dream' award!",
    "👨‍👩‍👧‍👦 Over 1,000 families celebrated here last year",
    "🎉 We've hosted 247 birthday parties",
    "🐕 Yes, we're dog-friendly! 🐾",
    "🍔 Our pretzel pairs perfectly with everything",
  ];

  const [currentFact, setCurrentFact] = useState(0);
  
  useEffect(() => {
    const factTimer = setInterval(() => {
      setCurrentFact(prev => (prev + 1) % funFacts.length);
    }, 4000);
    return () => clearInterval(factTimer);
  }, []);

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-amber-900 flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded hover:bg-amber-100"
              >
                ☰
              </button>
              Welcome to Your Brewery Kingdom! 🏰
            </h1>
            <p className="text-amber-700 mt-2">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              {' • '}
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-amber-600">Today's Mood:</p>
            <p className="text-2xl font-bold text-amber-800">Hoppy! 😄</p>
          </div>
        </div>
      </div>

      {/* Fun Fact Banner */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl p-4 mb-6 shadow-lg transform hover:scale-105 transition-transform">
        <p className="text-white text-lg font-semibold text-center animate-pulse">
          {funFacts[currentFact]}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-xl hover:shadow-2xl transition-shadow border-t-4 border-orange-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm">On Tap Right Now</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{kegsOnTap}</p>
              <p className="text-green-600 text-sm mt-1">All Fresh! ✨</p>
            </div>
            <div className="text-4xl">🍺</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-xl hover:shadow-2xl transition-shadow border-t-4 border-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm">Happy Customers Today</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{happyCustomers}</p>
              <p className="text-blue-600 text-sm mt-1">+{Math.floor(Math.random() * 20) + 10} per hour</p>
            </div>
            <div className="text-4xl">😊</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-xl hover:shadow-2xl transition-shadow border-t-4 border-green-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm">Today's Revenue</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">$4,827</p>
              <p className="text-green-600 text-sm mt-1">↑ 23% vs yesterday</p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-xl hover:shadow-2xl transition-shadow border-t-4 border-purple-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm">Tables Occupied</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">18/24</p>
              <p className="text-purple-600 text-sm mt-1">Peak time! 🔥</p>
            </div>
            <div className="text-4xl">🪑</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Beer Inventory */}
        <div className="bg-white rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">🍻</span> What's Brewing?
          </h2>
          <div className="space-y-4">
            {beerStyles.map((beer) => (
              <div key={beer.name} className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{beer.emoji}</span>
                    <div>
                      <p className="font-semibold text-gray-800">{beer.name}</p>
                      <p className="text-xs text-gray-500">{beer.status}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-700">{beer.amount}L</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${beer.color} transition-all duration-1000`}
                    style={{ width: `${(beer.amount / 60) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">🎉</span> Upcoming Fun
          </h2>
          <div className="space-y-4">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="border-l-4 border-orange-400 pl-4 py-2 hover:bg-orange-50 transition-colors rounded">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{event.emoji}</span>
                    <div>
                      <p className="font-semibold text-gray-800">{event.event}</p>
                      <p className="text-sm text-gray-600">{event.date}</p>
                      <p className="text-xs text-gray-500">{event.attendees} attending</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    event.status.includes('Sold Out') ? 'bg-red-100 text-red-600' :
                    event.status.includes('Filling') ? 'bg-yellow-100 text-yellow-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    {event.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* The Vibe Board */}
        <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">🎭</span> The Vibe Check
          </h2>
          
          <div className="space-y-4">
            {/* Current Atmosphere */}
            <div className="bg-white bg-opacity-70 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Current Atmosphere:</p>
              <div className="flex items-center gap-2">
                <div className="text-3xl animate-bounce">🎵</div>
                <div>
                  <p className="font-bold text-purple-800">Lively & Fun!</p>
                  <p className="text-xs text-gray-600">Jazz playlist on • Laughter level: High</p>
                </div>
              </div>
            </div>

            {/* Social Media Buzz */}
            <div className="bg-white bg-opacity-70 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Social Media Love:</p>
              <div className="flex gap-3 text-2xl">
                <span className="hover:scale-125 transition-transform cursor-pointer">📸</span>
                <span className="hover:scale-125 transition-transform cursor-pointer">❤️</span>
                <span className="hover:scale-125 transition-transform cursor-pointer">⭐</span>
                <span className="hover:scale-125 transition-transform cursor-pointer">🔥</span>
              </div>
              <p className="text-xs text-gray-600 mt-2">147 check-ins today!</p>
            </div>

            {/* Staff Mood */}
            <div className="bg-white bg-opacity-70 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Team Spirit:</p>
              <div className="flex -space-x-2">
                {['😄', '😎', '🤗', '😊', '🥳'].map((emoji, i) => (
                  <div key={i} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl border-2 border-purple-300">
                    {emoji}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2">Everyone's killing it today!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Live Feed */}
      <div className="mt-6 bg-white rounded-xl p-6 shadow-xl">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">📺</span> Live from the Brewery Floor
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <div className="text-3xl mb-2">🍺</div>
            <p className="text-sm font-semibold text-gray-700">Table 7</p>
            <p className="text-xs text-gray-600">Just ordered flight</p>
            <p className="text-xs text-blue-600 mt-1">2 min ago</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <div className="text-3xl mb-2">🎂</div>
            <p className="text-sm font-semibold text-gray-700">Birthday Alert!</p>
            <p className="text-xs text-gray-600">Table 12 celebrating</p>
            <p className="text-xs text-green-600 mt-1">Send complimentary!</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
            <div className="text-3xl mb-2">🍕</div>
            <p className="text-sm font-semibold text-gray-700">Kitchen Update</p>
            <p className="text-xs text-gray-600">Pizza special selling fast</p>
            <p className="text-xs text-orange-600 mt-1">Only 5 left!</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <div className="text-3xl mb-2">⭐</div>
            <p className="text-sm font-semibold text-gray-700">5-Star Review!</p>
            <p className="text-xs text-gray-600">"Best brewery ever!"</p>
            <p className="text-xs text-purple-600 mt-1">Just posted</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;