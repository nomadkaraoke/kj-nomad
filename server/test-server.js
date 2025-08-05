// Minimal test server to debug the hanging issue
import express from 'express';
const app = express();

app.get('/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({ message: 'Server is working!' });
});

app.get('/', (req, res) => {
  console.log('Root endpoint hit');
  res.send('Hello World!');
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Test server listening on port ${PORT}`);
});