import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

class ApiService {
  private token: string | null = null;
  private ws: WebSocket | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
    this.initWebSocket();
  }

  // WebSocket for real-time updates
  initWebSocket() {
    this.ws = new WebSocket('ws://localhost:3000/ws');
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      if (this.token) {
        this.ws?.send(JSON.stringify({ type: 'auth', token: this.token }));
      }
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleRealtimeUpdate(data);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected, reconnecting in 5s...');
      setTimeout(() => this.initWebSocket(), 5000);
    };
  }

  handleRealtimeUpdate(data: any) {
    // Dispatch custom events for different update types
    switch (data.type) {
      case 'order_update':
        window.dispatchEvent(new CustomEvent('order_update', { detail: data.payload }));
        break;
      case 'inventory_update':
        window.dispatchEvent(new CustomEvent('inventory_update', { detail: data.payload }));
        break;
      case 'reservation_update':
        window.dispatchEvent(new CustomEvent('reservation_update', { detail: data.payload }));
        break;
      case 'customer_update':
        window.dispatchEvent(new CustomEvent('customer_update', { detail: data.payload }));
        break;
      default:
        console.log('Unknown update type:', data.type);
    }
  }

  // Authentication
  async login(email: string, password: string) {
    const response = await axios.post(`${API_BASE}/auth/login`, { email, password });
    this.token = response.data.token;
    if (this.token) {
      localStorage.setItem('token', this.token);
    }
    return response.data;
  }

  // Dashboard Stats
  async getDashboardStats() {
    return axios.get(`${API_BASE}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${this.token}` }
    }).then(res => res.data);
  }

  // Live Brewery Status
  async getBreweryStatus() {
    return axios.get(`${API_BASE}/brewery/status`, {
      headers: { Authorization: `Bearer ${this.token}` }
    }).then(res => res.data);
  }

  // Production & Inventory
  async getBeerInventory() {
    return axios.get(`${API_BASE}/production/inventory`, {
      headers: { Authorization: `Bearer ${this.token}` }
    }).then(res => res.data);
  }

  async getBatches() {
    return axios.get(`${API_BASE}/production/batches`, {
      headers: { Authorization: `Bearer ${this.token}` }
    }).then(res => res.data);
  }

  // Events & Reservations
  async getUpcomingEvents() {
    return axios.get(`${API_BASE}/events/upcoming`, {
      headers: { Authorization: `Bearer ${this.token}` }
    }).then(res => res.data);
  }

  async getReservations(date?: string) {
    return axios.get(`${API_BASE}/reservations`, {
      params: { date },
      headers: { Authorization: `Bearer ${this.token}` }
    }).then(res => res.data);
  }

  async createReservation(reservation: any) {
    return axios.post(`${API_BASE}/reservations`, reservation, {
      headers: { Authorization: `Bearer ${this.token}` }
    }).then(res => res.data);
  }

  // Orders
  async getActiveOrders() {
    return axios.get(`${API_BASE}/orders/active`, {
      headers: { Authorization: `Bearer ${this.token}` }
    }).then(res => res.data);
  }

  async createOrder(order: any) {
    return axios.post(`${API_BASE}/orders`, order, {
      headers: { Authorization: `Bearer ${this.token}` }
    }).then(res => res.data);
  }

  // Customer Analytics
  async getCustomerMetrics() {
    return axios.get(`${API_BASE}/customers/metrics`, {
      headers: { Authorization: `Bearer ${this.token}` }
    }).then(res => res.data);
  }

  // AI Agent Interactions
  async sendToAIAgent(agentType: string, message: string) {
    return axios.post(`${API_BASE}/ai/chat`, {
      agentType,
      message
    }, {
      headers: { Authorization: `Bearer ${this.token}` }
    }).then(res => res.data);
  }

  // Voice Call Handler for Reservations
  async handlePhoneReservation(phoneNumber: string, transcript: string) {
    return axios.post(`${API_BASE}/ai/phone-reservation`, {
      phoneNumber,
      transcript
    }, {
      headers: { Authorization: `Bearer ${this.token}` }
    }).then(res => res.data);
  }
}

export default new ApiService();