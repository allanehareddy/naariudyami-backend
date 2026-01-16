import axios from 'axios';

const API = process.env.TEST_API_URL || 'http://localhost:5000/api';

const log = (title, obj) => console.log(`\n=== ${title} ===\n`, typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2));

const wait = ms => new Promise(r => setTimeout(r, ms));

const run = async () => {
  try {
    console.log('Integration test starting against', API);

    // 1) Register a woman (entrepreneur)
    const timestamp = Date.now();
    const woman = { name: `test_woman_${timestamp}`, password: 'TestPass123!', role: 'woman', village: 'TestVillage' };
    const regW = await axios.post(`${API}/auth/register`, woman).catch(e => e.response || e);
    log('Register woman', regW.data || regW.statusText || regW);

    // 2) Login woman
    const loginW = await axios.post(`${API}/auth/login`, { name: woman.name, password: woman.password, role: woman.role });
    const tokenWoman = loginW.data?.data?.token;
    log('Login woman token present', !!tokenWoman);

    // 3) Create product as woman
    const productPayload = { name: 'Test Product', description: 'Integration test product', category: 'test', price: 100 };
    const createProd = await axios.post(`${API}/products`, productPayload, { headers: { Authorization: `Bearer ${tokenWoman}` } });
    const product = createProd.data?.data?.product;
    log('Create product', product || createProd.data || createProd.status);

    // 4) Get products
    const listProds = await axios.get(`${API}/products`);
    log('List products count', listProds.data?.count);

    // 5) Get product by id
    if (product?.id || product?._id) {
      const id = product.id || product._id;
      const getP = await axios.get(`${API}/products/${id}`);
      log('Get product by id', getP.data?.data?.product?.id || getP.data);

      // 6) Predict price
      const pred = await axios.post(`${API}/products/${id}/predict-price`, {}, { headers: { Authorization: `Bearer ${tokenWoman}` } });
      log('Predict price', pred.data);

      // 7) Delete product
      const del = await axios.delete(`${API}/products/${id}`, { headers: { Authorization: `Bearer ${tokenWoman}` } });
      log('Delete product', del.data?.message || del.data);
    }

    // 8) Register customer and create a request to the entrepreneur
    const customer = { name: `test_customer_${timestamp}`, password: 'TestPass123!', role: 'customer' };
    await axios.post(`${API}/auth/register`, customer).catch(() => {});
    const loginC = await axios.post(`${API}/auth/login`, { name: customer.name, password: customer.password, role: customer.role });
    const tokenCustomer = loginC.data?.data?.token;
    log('Login customer token present', !!tokenCustomer);

    // Create request to the entrepreneur (use woman id if available)
    const womanId = loginW.data?.data?.user?.id || loginW.data?.data?.user?._id;
    if (womanId) {
      const reqCreate = await axios.post(`${API}/requests`, { entrepreneurId: womanId, message: 'I want your product' }, { headers: { Authorization: `Bearer ${tokenCustomer}` } });
      const createdRequest = reqCreate.data?.data?.request;
      log('Create request', createdRequest || reqCreate.data);

      // Entrepreneur fetches their requests
      const getReqs = await axios.get(`${API}/requests`, { headers: { Authorization: `Bearer ${tokenWoman}` } });
      log('Entrepreneur requests count', getReqs.data?.count);

      // Entrepreneur updates request status
      if (createdRequest?.id || createdRequest?._id) {
        const rid = createdRequest.id || createdRequest._id;
        const patch = await axios.patch(`${API}/requests/${rid}`, { status: 'accepted' }, { headers: { Authorization: `Bearer ${tokenWoman}` } });
        log('Update request status', patch.data?.data?.request?.status || patch.data);
      }
    }

    // 9) Schemes
    const schemes = await axios.get(`${API}/schemes`);
    log('Schemes count', schemes.data?.count || 0);

    // 10) Hub stats (requires auth)
    const hubStats = await axios.get(`${API}/hub/stats/villages`, { headers: { Authorization: `Bearer ${tokenWoman}` } }).catch(e => e.response || e);
    log('Hub stats', hubStats.data || hubStats.statusText || hubStats);

    // 11) AI endpoints (simple caption generation) — may use fallbacks
    const caption = await axios.post(`${API}/ai/caption/generate`, { text: 'Handmade scarf' }, { headers: { Authorization: `Bearer ${tokenWoman}` } }).catch(e => e.response || e);
    log('AI caption generate', caption.data || caption.statusText || caption);

    console.log('\nIntegration test finished');
  } catch (err) {
    console.error('Integration test failed:', err?.response?.data || err.message || err);
    process.exitCode = 2;
  }
};

run();
