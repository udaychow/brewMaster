# BrewMaster Phone Service Deployment

## Railway Deployment

### Step 1: Deploy to Railway

1. **Go to [Railway.app](https://railway.app)** and sign up/login
2. **Create New Project** → **Deploy from GitHub**
3. **Connect your GitHub repo** containing this code
4. **Select the `services/agent-orchestrator` folder** as root

### Step 2: Configure Environment Variables

In Railway dashboard, add these environment variables:

```
NODE_ENV=production
AGENT_ORCHESTRATOR_PORT=3004
TWILIO_ACCOUNT_SID=AC340ee391de99522194f658f875c71e72
TWILIO_AUTH_TOKEN=93b3a7ea1e1745e22ec088a645999672
TWILIO_PHONE_NUMBER=+18339820514
BREWERY_PHONE=+18339820514
```

### Step 3: Configure Build Settings

Railway should automatically detect:
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Port**: `3004`

### Step 4: Get Production URL

After deployment, Railway will provide a URL like:
```
https://brewmaster-phone-production-abc123.up.railway.app
```

### Step 5: Update Twilio Webhook

1. Go to [Twilio Console](https://console.twilio.com)
2. Navigate to **Phone Numbers** → **Manage** → **Active numbers**
3. Click your number (+18339820514)
4. Set webhook URL to:
   ```
   https://your-railway-url.up.railway.app/api/phone/webhooks/voice
   ```
5. Set HTTP method to **POST**
6. Save configuration

## Alternative: Render Deployment

1. Go to [Render.com](https://render.com)
2. Create **Web Service** from GitHub
3. Set **Build Command**: `npm run build`
4. Set **Start Command**: `npm start`
5. Add environment variables from above

## Testing Production

Call **+18339820514** and verify:
- ✅ Call connects successfully
- ✅ Sarah AI assistant responds
- ✅ Speech recognition works
- ✅ Reservations and orders are handled
- ✅ SMS confirmations are sent

## Monitoring

Check Railway/Render logs for:
- Incoming call logs: `📞 Incoming call from...`
- Speech processing: `🗣️ Customer said...`
- Errors or issues

## Scaling

Railway auto-scales based on usage. For high call volume:
- Upgrade to Railway Pro ($5/month)
- Consider load balancing for multiple instances