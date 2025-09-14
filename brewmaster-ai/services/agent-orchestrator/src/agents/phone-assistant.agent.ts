import { BaseAgent } from './base.agent';
import { AgentCapability, AgentMemory } from '../types/agent.types';

interface PhoneCall {
  callId: string;
  phoneNumber: string;
  customerName?: string;
  startTime: Date;
  status: 'active' | 'completed' | 'failed';
  transcript: string[];
  intent?: string;
  reservationDetails?: any;
  orderDetails?: any;
}

export class PhoneAssistantAgent extends BaseAgent {
  private activeCalls: Map<string, PhoneCall> = new Map();
  private customerDatabase: Map<string, any> = new Map();

  constructor() {
    super('phone-assistant', 'Phone Assistant', [
      {
        name: 'handle_reservation_call',
        description: 'Handle incoming reservation calls with natural conversation',
        parameters: {
          phoneNumber: 'string',
          transcript: 'string',
          callId: 'string'
        }
      },
      {
        name: 'handle_order_call',
        description: 'Process takeout/delivery orders over the phone',
        parameters: {
          phoneNumber: 'string',
          transcript: 'string',
          callId: 'string'
        }
      },
      {
        name: 'check_availability',
        description: 'Check table availability for requested date/time',
        parameters: {
          date: 'string',
          time: 'string',
          partySize: 'number'
        }
      },
      {
        name: 'recommend_beers',
        description: 'Recommend beers based on customer preferences',
        parameters: {
          preferences: 'string[]',
          occasion: 'string'
        }
      },
      {
        name: 'transfer_to_human',
        description: 'Transfer complex calls to human staff',
        parameters: {
          reason: 'string',
          urgency: 'low' | 'medium' | 'high'
        }
      }
    ]);
  }

  async handleReservationCall(phoneNumber: string, transcript: string, callId: string): Promise<any> {
    const call = this.activeCalls.get(callId) || {
      callId,
      phoneNumber,
      startTime: new Date(),
      status: 'active' as const,
      transcript: [],
      intent: 'reservation'
    };

    call.transcript.push(transcript);
    this.activeCalls.set(callId, call);

    // Use Claude AI to understand the conversation
    const prompt = `You are Sarah, a friendly phone assistant for BrewMaster Brewery. You're helping a customer make a reservation.

Current conversation:
${call.transcript.join('\n')}

Customer's latest message: "${transcript}"

Respond naturally and helpfully. If you need information, ask politely. If you have enough details, confirm the reservation.

For reservations, you need:
- Name
- Date and time  
- Party size
- Any special requests

Current availability (for context):
- Tonight: Available after 7 PM
- Tomorrow: Fully booked until 8:30 PM
- Weekend: Limited spots, book soon!

Respond as Sarah would speak on the phone. Be warm, professional, and enthusiastic about craft beer and great food!`;

    try {
      const response = await this.generateResponse(prompt, {
        maxTokens: 200,
        temperature: 0.7
      });

      // Parse response for structured data
      const reservationData = this.extractReservationDetails(call.transcript.join(' '));
      if (reservationData.isComplete) {
        call.reservationDetails = reservationData;
        call.status = 'completed';
        
        // Create reservation in system
        await this.createReservation(reservationData);
      }

      return {
        response: response.content,
        needsMoreInfo: !reservationData.isComplete,
        reservationDetails: reservationData,
        suggestedActions: this.getSuggestedActions(call)
      };

    } catch (error) {
      console.error('Phone assistant error:', error);
      return {
        response: "I'm having some technical difficulties. Let me transfer you to one of our team members who can help you right away.",
        needsTransfer: true,
        error: error.message
      };
    }
  }

  async handleOrderCall(phoneNumber: string, transcript: string, callId: string): Promise<any> {
    const call = this.activeCalls.get(callId) || {
      callId,
      phoneNumber,
      startTime: new Date(),
      status: 'active' as const,
      transcript: [],
      intent: 'order'
    };

    call.transcript.push(transcript);
    this.activeCalls.set(callId, call);

    const prompt = `You are Sarah from BrewMaster Brewery taking a takeout order. Be friendly and efficient.

Our popular items:
🍺 BEERS TO GO:
- IPA 6-pack ($18) - "Hoppy & citrusy"
- Stout 4-pack ($16) - "Rich & creamy" 
- Lager 6-pack ($15) - "Crisp & refreshing"

🍔 FOOD:
- Brewery Burger ($14) - "Angus beef, aged cheddar"
- Beer-battered Fish & Chips ($16) - "Fresh cod, house fries"
- Loaded Nachos ($12) - "Perfect for sharing"
- Pretzel Bites ($8) - "With beer cheese"

Current conversation:
${call.transcript.join('\n')}

Customer says: "${transcript}"

Respond naturally, suggest popular items, ask about pickup time, and calculate totals when ready.`;

    try {
      const response = await this.generateResponse(prompt, {
        maxTokens: 250,
        temperature: 0.7
      });

      const orderData = this.extractOrderDetails(call.transcript.join(' '));
      if (orderData.isComplete) {
        call.orderDetails = orderData;
        call.status = 'completed';
        
        // Create order in system
        await this.createOrder(orderData);
      }

      return {
        response: response.content,
        needsMoreInfo: !orderData.isComplete,
        orderDetails: orderData,
        estimatedTotal: this.calculateOrderTotal(orderData.items || [])
      };

    } catch (error) {
      return {
        response: "Let me transfer you to someone who can help with your order right away!",
        needsTransfer: true
      };
    }
  }

  private extractReservationDetails(transcript: string): any {
    // Use regex and NLP to extract reservation details
    const nameMatch = transcript.match(/(?:name|i'm|this is)\s+(?:is\s+)?(\w+(?:\s+\w+)?)/i);
    const dateMatch = transcript.match(/(?:tonight|tomorrow|(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|(?:\d{1,2}\/\d{1,2}))/i);
    const timeMatch = transcript.match(/(\d{1,2}(?::\d{2})?\s*(?:pm|am|p\.m\.|a\.m\.))/i);
    const partySizeMatch = transcript.match(/(?:party of|table for|group of|\b)(\d{1,2})(?:\s+people|persons)?/i);

    const name = nameMatch ? nameMatch[1] : null;
    const date = dateMatch ? dateMatch[0] : null;
    const time = timeMatch ? timeMatch[0] : null;
    const partySize = partySizeMatch ? parseInt(partySizeMatch[1]) : null;

    return {
      name,
      date,
      time,
      partySize,
      isComplete: !!(name && date && time && partySize),
      confidence: this.calculateConfidence([name, date, time, partySize])
    };
  }

  private extractOrderDetails(transcript: string): any {
    const items: any[] = [];
    
    // Look for beer orders
    const ipMatch = transcript.match(/(\d+)\s*(?:six|6)?\s*pack[s]?\s*(?:of\s*)?ipa/i);
    if (ipMatch) items.push({ name: 'IPA 6-pack', quantity: parseInt(ipMatch[1]) || 1, price: 18 });

    const stoutMatch = transcript.match(/(\d+)?\s*stout/i);
    if (stoutMatch) items.push({ name: 'Stout 4-pack', quantity: parseInt(stoutMatch[1]) || 1, price: 16 });

    // Look for food orders
    const burgerMatch = transcript.match(/(\d+)?\s*burger[s]?/i);
    if (burgerMatch) items.push({ name: 'Brewery Burger', quantity: parseInt(burgerMatch[1]) || 1, price: 14 });

    const nachosMatch = transcript.match(/(\d+)?\s*nachos/i);
    if (nachosMatch) items.push({ name: 'Loaded Nachos', quantity: parseInt(nachosMatch[1]) || 1, price: 12 });

    // Extract pickup time
    const pickupTimeMatch = transcript.match(/(?:pickup|pick up|ready).*?(\d{1,2}(?::\d{2})?\s*(?:pm|am))/i);
    const pickupTime = pickupTimeMatch ? pickupTimeMatch[1] : null;

    return {
      items,
      pickupTime,
      isComplete: items.length > 0 && !!pickupTime,
      confidence: items.length > 0 ? 0.8 : 0.3
    };
  }

  private calculateOrderTotal(items: any[]): number {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  private calculateConfidence(fields: (string | number | null)[]): number {
    const validFields = fields.filter(f => f !== null).length;
    return validFields / fields.length;
  }

  private async createReservation(details: any): Promise<void> {
    // In a real system, this would call the reservation API
    console.log('Creating reservation:', details);
  }

  private async createOrder(details: any): Promise<void> {
    // In a real system, this would call the order API
    console.log('Creating order:', details);
  }

  private getSuggestedActions(call: PhoneCall): string[] {
    const actions = [];
    
    if (call.intent === 'reservation' && !call.reservationDetails?.isComplete) {
      actions.push('Ask for missing reservation details');
    }
    
    if (call.transcript.some(t => t.toLowerCase().includes('special'))) {
      actions.push('Note special requests');
    }
    
    if (call.transcript.length > 10) {
      actions.push('Consider transferring to human for complex request');
    }

    return actions;
  }

  async checkAvailability(date: string, time: string, partySize: number): Promise<any> {
    // Mock availability checker - in real app would check database
    const availability = {
      'tonight': { available: true, nextSlot: '7:00 PM' },
      'tomorrow': { available: false, nextSlot: '8:30 PM' },
      'friday': { available: true, nextSlot: '6:00 PM' },
      'saturday': { available: true, nextSlot: '5:30 PM' }
    };

    const dateKey = date.toLowerCase();
    return availability[dateKey] || { available: true, nextSlot: time };
  }

  async recommendBeers(preferences: string[], occasion: string): Promise<any> {
    const recommendations = {
      'hoppy': ['IPA', 'Double IPA'],
      'dark': ['Stout', 'Porter'],
      'light': ['Lager', 'Wheat Beer'],
      'celebration': ['Champagne Beer', 'Seasonal Special'],
      'dinner': ['Amber Ale', 'Brown Ale'],
      'casual': ['Lager', 'Pilsner']
    };

    const suggested = preferences.flatMap(pref => 
      recommendations[pref.toLowerCase()] || []
    );

    return {
      recommendations: [...new Set(suggested)],
      reasoning: `Based on your preference for ${preferences.join(', ')} and the ${occasion} occasion`
    };
  }

  async getCallHistory(phoneNumber: string): Promise<PhoneCall[]> {
    // In real app, would query database
    return Array.from(this.activeCalls.values())
      .filter(call => call.phoneNumber === phoneNumber);
  }
}

export default PhoneAssistantAgent;