import axios from 'axios';

const BASE = process.env.TEST_API_URL || 'http://localhost:5000';

const endpoints = [
  '/',
  '/health',
  '/health/detailed',
  '/health/validation',
  '/health/endpoints',
  '/api/products',
  '/api/schemes',
  '/api/entrepreneurs'
];

const run = async () => {
  console.log('Running smoke tests against', BASE);
  for (const ep of endpoints) {
    const url = `${BASE}${ep}`;
    try {
      const res = await axios.get(url, { timeout: 5000 });
      const ok = res.status >= 200 && res.status < 400;
      console.log(`${url} -> ${res.status} ${ok ? 'OK' : 'FAIL'}`);
    } catch (err) {
      console.error(`${url} -> ERROR:`, err.message || err);
      process.exitCode = 2;
    }
  }
  console.log('Smoke tests finished');
};

run();
