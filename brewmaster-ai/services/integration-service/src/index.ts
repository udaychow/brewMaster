import express from 'express';

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'integration-service' });
});

const PORT = process.env.PORT || 300      20;
app.listen(PORT, () => {
  console.log(`🚀 integration-service running on port ${PORT}`);
});
