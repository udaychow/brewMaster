import twilio from 'twilio';
import { PhoneAssistantAgent } from '../agents/phone-assistant.agent';

export class TwilioIntegration {
  private client: any;
  private phoneAssistant: PhoneAssistantAgent;
  private activeCalls: Map<string, any> = new Map();

  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.phoneAssistant = new PhoneAssistantAgent();
  }

  // Handle incoming phone calls
  async handleIncomingCall(req: any, res: any) {
    const { CallSid, From, To } = req.body;
    
    console.log(`📞 Incoming call from ${From} (CallSid: ${CallSid})`);
    
    // Initialize call tracking
    this.activeCalls.set(CallSid, {
      callSid: CallSid,
      from: From,
      to: To,
      startTime: new Date(),
      status: 'active',
      context: 'greeting'
    });

    // Create TwiML response
    const twiml = new twilio.twiml.VoiceResponse();
    
    // Friendly greeting with brewery personality
    const greeting = "Hello and thank you for calling BrewMaster Brewery! I'm Sarah, your AI assistant. I can help you make a reservation, place a takeout order, or answer questions about our beers and events. What can I help you with today?";
    
    twiml.say({
      voice: 'alice',
      language: 'en-US'
    }, greeting);

    // Start recording for transcription
    twiml.record({
      timeout: 10,
      transcribe: true,
      transcribeCallback: `/webhooks/transcription/${CallSid}`,
      playBeep: false,
      maxLength: 30
    });

    // If no response, gather input
    twiml.gather({
      timeout: 10,
      speechTimeout: 3,
      input: 'speech',
      action: `/webhooks/speech/${CallSid}`,
      method: 'POST'
    });

    res.type('text/xml');
    res.send(twiml.toString());
  }

  // Handle speech input from caller
  async handleSpeechInput(req: any, res: any) {
    const { CallSid, SpeechResult } = req.body;
    const callData = this.activeCalls.get(CallSid);
    
    console.log(`🗣️ Speech from ${callData?.from}: "${SpeechResult}"`);

    if (!callData || !SpeechResult) {
      return this.handleError(res, "Sorry, I didn't catch that. Could you please repeat?");
    }

    try {
      // Determine intent and route to appropriate handler
      const intent = this.determineIntent(SpeechResult);
      let response;

      switch (intent) {
        case 'reservation':
          response = await this.phoneAssistant.handleReservationCall(
            callData.from,
            SpeechResult,
            CallSid
          );
          break;
        
        case 'order':
          response = await this.phoneAssistant.handleOrderCall(
            callData.from,
            SpeechResult, 
            CallSid
          );
          break;
          
        case 'question':
          response = await this.handleGeneralQuestion(SpeechResult);
          break;
          
        default:
          response = await this.handleGeneralConversation(SpeechResult, callData);
      }

      // Update call context
      callData.lastResponse = response.response;
      callData.context = intent;
      this.activeCalls.set(CallSid, callData);

      // Create TwiML response
      const twiml = new twilio.twiml.VoiceResponse();

      if (response.needsTransfer) {
        twiml.say("Let me connect you with one of our team members right away.");
        twiml.dial(process.env.STAFF_PHONE_NUMBER || '+1234567890');
      } else if (response.needsMoreInfo) {
        twiml.say(response.response);
        
        // Continue gathering input
        twiml.gather({
          timeout: 15,
          speechTimeout: 3,
          input: 'speech',
          action: `/webhooks/speech/${CallSid}`,
          method: 'POST'
        });
      } else {
        // Conversation complete
        twiml.say(response.response);
        
        if (response.reservationDetails?.isComplete) {
          twiml.say("Perfect! Your reservation has been confirmed. You'll receive a confirmation text shortly. We look forward to seeing you!");
          this.sendConfirmationSMS(callData.from, response.reservationDetails);
        } else if (response.orderDetails?.isComplete) {
          twiml.say(`Great! Your order total is $${response.estimatedTotal}. We'll have it ready for pickup. Thanks for choosing BrewMaster Brewery!`);
          this.sendOrderConfirmationSMS(callData.from, response.orderDetails);
        }
        
        twiml.say("Have a fantastic day and cheers!");
        twiml.hangup();
      }

      res.type('text/xml');
      res.send(twiml.toString());

    } catch (error) {
      console.error('Error handling speech:', error);
      this.handleError(res, "I'm experiencing some technical difficulties. Let me transfer you to our team.");
    }
  }

  // Determine caller's intent from speech
  private determineIntent(speech: string): string {
    const lowerSpeech = speech.toLowerCase();
    
    const reservationKeywords = ['reservation', 'book', 'table', 'reserve', 'tonight', 'tomorrow', 'party of'];
    const orderKeywords = ['order', 'takeout', 'pickup', 'delivery', 'food', 'beer', 'burger'];
    const questionKeywords = ['what', 'when', 'where', 'how', 'hours', 'menu', 'events'];

    if (reservationKeywords.some(keyword => lowerSpeech.includes(keyword))) {
      return 'reservation';
    } else if (orderKeywords.some(keyword => lowerSpeech.includes(keyword))) {
      return 'order';
    } else if (questionKeywords.some(keyword => lowerSpeech.includes(keyword))) {
      return 'question';
    }
    
    return 'general';
  }

  // Handle general questions about the brewery
  private async handleGeneralQuestion(question: string): Promise<any> {
    const breweryInfo = {
      hours: "We're open Monday through Thursday 4 PM to 10 PM, Friday and Saturday 2 PM to midnight, and Sunday 2 PM to 9 PM.",
      location: "We're located at 123 Craft Beer Lane in downtown. There's plenty of parking available.",
      events: "We have trivia night every Tuesday, live music on Fridays, and beer tastings on Saturdays. Check our website for the full calendar!",
      beers: "We have 8 rotating taps featuring our signature IPA, creamy stout, crisp lager, and seasonal specials. All brewed fresh on-site!",
      food: "Our kitchen serves brewery classics like beer-battered fish and chips, gourmet burgers, loaded nachos, and artisanal pretzels."
    };

    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('hours') || lowerQuestion.includes('open')) {
      return { response: breweryInfo.hours, needsMoreInfo: false };
    } else if (lowerQuestion.includes('location') || lowerQuestion.includes('address')) {
      return { response: breweryInfo.location, needsMoreInfo: false };
    } else if (lowerQuestion.includes('event') || lowerQuestion.includes('music')) {
      return { response: breweryInfo.events, needsMoreInfo: false };
    } else if (lowerQuestion.includes('beer') || lowerQuestion.includes('tap')) {
      return { response: breweryInfo.beers, needsMoreInfo: false };
    } else if (lowerQuestion.includes('food') || lowerQuestion.includes('menu')) {
      return { response: breweryInfo.food, needsMoreInfo: false };
    }
    
    return { 
      response: "That's a great question! For detailed information, I'd recommend checking our website or speaking with our staff. Is there anything else I can help you with today?",
      needsMoreInfo: false 
    };
  }

  // Handle general conversation
  private async handleGeneralConversation(speech: string, callData: any): Promise<any> {
    // Route based on context or keywords
    if (callData.context === 'greeting' || speech.toLowerCase().includes('help')) {
      return {
        response: "I'd be happy to help! I can assist with making a reservation, placing a takeout order, or answering questions about our brewery. What would you like to do?",
        needsMoreInfo: true
      };
    }
    
    return {
      response: "I'm here to help with reservations, takeout orders, or questions about BrewMaster Brewery. What can I assist you with?",
      needsMoreInfo: true
    };
  }

  // Send SMS confirmation
  private async sendConfirmationSMS(to: string, reservationDetails: any) {
    try {
      await this.client.messages.create({
        body: `🍺 BrewMaster Brewery Reservation Confirmed! 
        
Name: ${reservationDetails.name}
Date: ${reservationDetails.date}
Time: ${reservationDetails.time}
Party: ${reservationDetails.partySize} people

See you soon! Call us at ${process.env.BREWERY_PHONE} with any changes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to
      });
      console.log(`📱 Confirmation SMS sent to ${to}`);
    } catch (error) {
      console.error('Failed to send SMS:', error);
    }
  }

  // Send order confirmation SMS
  private async sendOrderConfirmationSMS(to: string, orderDetails: any) {
    try {
      const itemsList = orderDetails.items.map((item: any) => 
        `${item.quantity}x ${item.name} - $${item.price * item.quantity}`
      ).join('\n');

      await this.client.messages.create({
        body: `🍺 BrewMaster Brewery Order Confirmed!

${itemsList}

Pickup: ${orderDetails.pickupTime}
Total: $${this.calculateTotal(orderDetails.items)}

We'll text you when it's ready!`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to
      });
    } catch (error) {
      console.error('Failed to send order SMS:', error);
    }
  }

  private calculateTotal(items: any[]): number {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  // Handle errors gracefully
  private handleError(res: any, message: string) {
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say(message);
    twiml.dial(process.env.STAFF_PHONE_NUMBER || '+1234567890');
    
    res.type('text/xml');
    res.send(twiml.toString());
  }

  // Get call analytics
  async getCallAnalytics(timeRange: string = '24h'): Promise<any> {
    const calls = Array.from(this.activeCalls.values());
    
    return {
      totalCalls: calls.length,
      reservationCalls: calls.filter(c => c.context === 'reservation').length,
      orderCalls: calls.filter(c => c.context === 'order').length,
      averageCallDuration: 0, // Would calculate from actual call data
      successfulReservations: 0, // Track completed reservations
      successfulOrders: 0, // Track completed orders
      commonQuestions: this.getCommonQuestions(calls)
    };
  }

  private getCommonQuestions(calls: any[]): string[] {
    // Analyze call transcripts to identify common questions
    return ['Hours of operation', 'Beer selection', 'Event schedules'];
  }
}

export default TwilioIntegration;