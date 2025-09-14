import express from 'express';

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'compliance-service' });
});

const PORT = process.env.PORT || 300      19;
app.listen(PORT, () => {
  console.log(`🚀 compliance-service running on port ${PORT}`);
});
