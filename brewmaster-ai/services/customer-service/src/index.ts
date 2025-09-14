import express from 'express';

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'customer-service' });
});

const PORT = process.env.PORT || 300      17;
app.listen(PORT, () => {
  console.log(`🚀 customer-service running on port ${PORT}`);
});
