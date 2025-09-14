import express from 'express';

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'notification-service' });
});

const PORT = process.env.PORT || 300      21;
app.listen(PORT, () => {
  console.log(`🚀 notification-service running on port ${PORT}`);
});
