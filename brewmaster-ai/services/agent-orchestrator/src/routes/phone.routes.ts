import { Router } from 'express';
import TwilioIntegration from '../integrations/twilio.integration';

const router = Router();
const twilioService = new TwilioIntegration();

// Twilio webhook endpoints
router.post('/webhooks/voice', async (req, res) => {
  await twilioService.handleIncomingCall(req, res);
});

router.post('/webhooks/speech/:callSid', async (req, res) => {
  await twilioService.handleSpeechInput(req, res);
});

router.post('/webhooks/transcription/:callSid', (req, res) => {
  const { CallSid, TranscriptionText } = req.body;
  console.log(`📝 Transcription for ${CallSid}: "${TranscriptionText}"`);
  res.status(200).send('OK');
});

// Call status webhooks
router.post('/webhooks/call-status', (req, res) => {
  const { CallSid, CallStatus, Duration } = req.body;
  console.log(`📞 Call ${CallSid} status: ${CallStatus}, duration: ${Duration}s`);
  res.status(200).send('OK');
});

// API endpoints for dashboard
router.get('/calls/analytics', async (req, res) => {
  try {
    const { timeRange } = req.query;
    const analytics = await twilioService.getCallAnalytics(timeRange as string);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get call analytics' });
  }
});

router.get('/calls/active', (req, res) => {
  // Return list of currently active calls
  res.json({
    activeCalls: 3,
    calls: [
      {
        id: 'call_001',
        from: '+1555-123-4567',
        startTime: new Date(),
        type: 'reservation',
        status: 'in_progress'
      },
      {
        id: 'call_002', 
        from: '+1555-234-5678',
        startTime: new Date(Date.now() - 120000),
        type: 'order',
        status: 'completed'
      }
    ]
  });
});

// Test endpoint for development
router.post('/test-call', async (req, res) => {
  const { phoneNumber, message } = req.body;
  
  // Simulate a phone call for testing
  const testResponse = await twilioService['phoneAssistant'].handleReservationCall(
    phoneNumber,
    message,
    `test_${Date.now()}`
  );
  
  res.json(testResponse);
});

export default router;