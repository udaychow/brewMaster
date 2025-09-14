import { useState, useEffect, useCallback } from 'react';
import ApiService from '../services/api';

export interface BreweryStats {
  kegsOnTap: number;
  happyCustomers: number;
  todayRevenue: number;
  tablesOccupied: number;
  totalTables: number;
  averageRating: number;
  activeOrders: number;
}

export interface BeerInventory {
  id: string;
  name: string;
  type: string;
  amount: number;
  capacity: number;
  color: string;
  emoji: string;
  status: string;
  temperature?: number;
  abv?: number;
}

export interface LiveEvent {
  id: string;
  date: string;
  event: string;
  emoji: string;
  attendees: number;
  maxCapacity: number;
  status: string;
  ticketsRemaining: number;
}

export interface RealtimeUpdate {
  type: 'order' | 'reservation' | 'inventory' | 'customer' | 'event';
  timestamp: string;
  data: any;
}

export const useRealTimeData = () => {
  const [stats, setStats] = useState<BreweryStats>({
    kegsOnTap: 8,
    happyCustomers: 324,
    todayRevenue: 4827,
    tablesOccupied: 18,
    totalTables: 24,
    averageRating: 4.8,
    activeOrders: 12
  });

  const [beerInventory, setBeerInventory] = useState<BeerInventory[]>([
    { id: '1', name: 'IPA', type: 'IPA', amount: 45, capacity: 60, color: 'bg-orange-500', emoji: '🍊', status: 'Hoppy & Fresh!', temperature: 4, abv: 6.5 },
    { id: '2', name: 'Stout', type: 'Stout', amount: 30, capacity: 50, color: 'bg-gray-800', emoji: '☕', status: 'Dark & Creamy', temperature: 6, abv: 4.8 },
    { id: '3', name: 'Lager', type: 'Lager', amount: 60, capacity: 70, color: 'bg-yellow-500', emoji: '🌾', status: 'Crisp & Clean', temperature: 3, abv: 4.2 },
    { id: '4', name: 'Wheat', type: 'Wheat Beer', amount: 35, capacity: 50, color: 'bg-amber-400', emoji: '🌽', status: 'Smooth & Cloudy', temperature: 4, abv: 5.1 }
  ]);

  const [upcomingEvents, setUpcomingEvents] = useState<LiveEvent[]>([
    { id: '1', date: 'Tonight', event: 'Trivia Night', emoji: '🧠', attendees: 45, maxCapacity: 60, status: 'Filling Fast!', ticketsRemaining: 15 },
    { id: '2', date: 'Friday', event: 'Live Music', emoji: '🎸', attendees: 120, maxCapacity: 150, status: 'Almost Sold Out!', ticketsRemaining: 30 },
    { id: '3', date: 'Saturday', event: 'Beer Tasting', emoji: '🍺', attendees: 30, maxCapacity: 40, status: 'Spots Available', ticketsRemaining: 10 },
    { id: '4', date: 'Sunday', event: 'Family Brunch', emoji: '🥞', attendees: 60, maxCapacity: 80, status: 'Reservations Open', ticketsRemaining: 20 }
  ]);

  const [recentUpdates, setRecentUpdates] = useState<RealtimeUpdate[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      // In a real app, these would be actual API calls
      // const [statsData, inventoryData, eventsData] = await Promise.all([
      //   ApiService.getDashboardStats(),
      //   ApiService.getBeerInventory(), 
      //   ApiService.getUpcomingEvents()
      // ]);
      
      // For now, simulate loading with slight delays
      setTimeout(() => setIsConnected(true), 1000);
      
      // Simulate real-time updates every few seconds
      const interval = setInterval(() => {
        // Simulate customer count increasing
        setStats(prev => ({
          ...prev,
          happyCustomers: prev.happyCustomers + Math.floor(Math.random() * 3),
          todayRevenue: prev.todayRevenue + Math.floor(Math.random() * 50),
          activeOrders: Math.max(5, prev.activeOrders + Math.floor(Math.random() * 6) - 2)
        }));

        // Simulate beer levels changing
        setBeerInventory(prev => prev.map(beer => ({
          ...beer,
          amount: Math.max(5, beer.amount + Math.floor(Math.random() * 4) - 1)
        })));

        // Simulate event attendee changes
        setUpcomingEvents(prev => prev.map(event => ({
          ...event,
          attendees: Math.min(event.maxCapacity, event.attendees + Math.floor(Math.random() * 3))
        })));

        setLastUpdate(new Date());
      }, 5000);

      return () => clearInterval(interval);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }, []);

  // Handle real-time updates from WebSocket
  useEffect(() => {
    const handleOrderUpdate = (event: CustomEvent) => {
      const update: RealtimeUpdate = {
        type: 'order',
        timestamp: new Date().toISOString(),
        data: event.detail
      };
      setRecentUpdates(prev => [update, ...prev.slice(0, 9)]);
      
      // Update stats based on order
      if (event.detail.type === 'new_order') {
        setStats(prev => ({ ...prev, activeOrders: prev.activeOrders + 1 }));
      }
    };

    const handleReservationUpdate = (event: CustomEvent) => {
      const update: RealtimeUpdate = {
        type: 'reservation',
        timestamp: new Date().toISOString(),
        data: event.detail
      };
      setRecentUpdates(prev => [update, ...prev.slice(0, 9)]);
    };

    const handleInventoryUpdate = (event: CustomEvent) => {
      const update: RealtimeUpdate = {
        type: 'inventory',
        timestamp: new Date().toISOString(),
        data: event.detail
      };
      setRecentUpdates(prev => [update, ...prev.slice(0, 9)]);
      
      // Update beer inventory
      if (event.detail.beerId) {
        setBeerInventory(prev => prev.map(beer => 
          beer.id === event.detail.beerId 
            ? { ...beer, amount: event.detail.newAmount }
            : beer
        ));
      }
    };

    // Listen for WebSocket events
    window.addEventListener('order_update', handleOrderUpdate as EventListener);
    window.addEventListener('reservation_update', handleReservationUpdate as EventListener);
    window.addEventListener('inventory_update', handleInventoryUpdate as EventListener);

    return () => {
      window.removeEventListener('order_update', handleOrderUpdate as EventListener);
      window.removeEventListener('reservation_update', handleReservationUpdate as EventListener);
      window.removeEventListener('inventory_update', handleInventoryUpdate as EventListener);
    };
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Manual refresh function
  const refreshData = useCallback(async () => {
    try {
      // In real app, reload from APIs
      await loadInitialData();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  }, [loadInitialData]);

  return {
    stats,
    beerInventory,
    upcomingEvents,
    recentUpdates,
    isConnected,
    lastUpdate,
    refreshData,
    setStats,
    setBeerInventory,
    setUpcomingEvents
  };
};