import express from 'express';
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const PORT = process.env.AGENT_ORCHESTRATOR_PORT || 3004;

// Store active calls
const activeCalls = new Map();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'phone-ai' });
});

// Main phone webhook
app.post('/api/phone/webhooks/voice', (req, res) => {
  const { CallSid, From } = req.body;
  console.log(`📞 Incoming call from ${From}`);
  
  const twiml = new twilio.twiml.VoiceResponse();
  
  twiml.say({
    voice: 'alice',
    language: 'en-US'
  }, "Hello and welcome to BrewMaster Brewery! I'm Sarah, your AI assistant. I can help you make a reservation or place a takeout order. What would you like to do today?");
  
  // Gather speech input
  twiml.gather({
    input: ['speech'],
    timeout: 5,
    action: `/api/phone/webhooks/speech/${CallSid}`,
    method: 'POST'
  });
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// Handle speech input
app.post('/api/phone/webhooks/speech/:callSid', (req, res) => {
  const { SpeechResult } = req.body;
  const { callSid } = req.params;
  
  console.log(`🗣️ Customer said: "${SpeechResult}"`);
  
  const twiml = new twilio.twiml.VoiceResponse();
  
  // Simple keyword-based responses
  const lowerSpeech = (SpeechResult || '').toLowerCase();
  
  if (lowerSpeech.includes('reservation')) {
    twiml.say("Great! I'd be happy to help you with a reservation. What date and time were you thinking, and how many people will be joining you?");
    
    twiml.gather({
      input: ['speech'],
      timeout: 10,
      action: `/api/phone/webhooks/reservation/${callSid}`,
      method: 'POST'
    });
    
  } else if (lowerSpeech.includes('order') || lowerSpeech.includes('takeout')) {
    twiml.say("Perfect! I can help you place a takeout order. We have our famous IPA 6-pack for $18, craft burgers for $14, and loaded nachos for $12. What would you like to order?");
    
    twiml.gather({
      input: ['speech'],
      timeout: 10,
      action: `/api/phone/webhooks/order/${callSid}`,
      method: 'POST'
    });
    
  } else if (lowerSpeech.includes('hours') || lowerSpeech.includes('open')) {
    twiml.say("We're open Monday through Thursday from 4 PM to 10 PM, Friday and Saturday from 2 PM to midnight, and Sunday from 2 PM to 9 PM. Is there anything else I can help you with?");
    
    twiml.gather({
      input: ['speech'],
      timeout: 5,
      action: `/api/phone/webhooks/speech/${callSid}`,
      method: 'POST'
    });
    
  } else {
    twiml.say("I can help you make a reservation or place a takeout order. Which would you prefer?");
    
    twiml.gather({
      input: ['speech'],
      timeout: 5,
      action: `/api/phone/webhooks/speech/${callSid}`,
      method: 'POST'
    });
  }
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// Handle reservation details
app.post('/api/phone/webhooks/reservation/:callSid', (req, res) => {
  const { SpeechResult } = req.body;
  console.log(`📅 Reservation details: "${SpeechResult}"`);
  
  const twiml = new twilio.twiml.VoiceResponse();
  
  // Simple confirmation
  twiml.say("Perfect! I've noted your reservation request. Our team will confirm your booking shortly. You'll receive a text message confirmation. Thank you for choosing BrewMaster Brewery!");
  
  // Send SMS confirmation (if configured)
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const From = req.body.From;
    
    client.messages.create({
      body: `🍺 BrewMaster Brewery: Thank you for your reservation request! We'll confirm your booking shortly. Call us at ${process.env.BREWERY_PHONE} if you need to make changes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: From
    }).catch(err => console.error('SMS error:', err));
  }
  
  twiml.say("Have a wonderful day!");
  twiml.hangup();
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// Handle order details
app.post('/api/phone/webhooks/order/:callSid', (req, res) => {
  const { SpeechResult } = req.body;
  console.log(`🍔 Order details: "${SpeechResult}"`);
  
  const twiml = new twilio.twiml.VoiceResponse();
  
  twiml.say("Excellent choice! Your order has been received. It will be ready for pickup in about 20 minutes. We'll send you a text when it's ready. Your total will be provided at pickup. Thank you!");
  twiml.hangup();
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Phone AI Service running on port ${PORT}`);
  console.log(`📞 Twilio Phone: ${process.env.TWILIO_PHONE_NUMBER}`);
  console.log(`🔌 Webhook URL: http://localhost:${PORT}/api/phone/webhooks/voice`);
  console.log(`\n⚡ Ready to receive calls!`);
});