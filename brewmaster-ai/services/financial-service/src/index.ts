import express from 'express';

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'financial-service' });
});

const PORT = process.env.PORT || 300      18;
app.listen(PORT, () => {
  console.log(`🚀 financial-service running on port ${PORT}`);
});
