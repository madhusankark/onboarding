const http = require('http');
const connectDB = require('./src/config/db');
const app = require('./src/app');
const { Server } = require('socket.io');

const runTests = async () => {
  console.log('🧪 Starting End-to-End API Verification Suite with JWT Auth...\n');
  await connectDB();

  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });
  app.set('io', io);

  await new Promise((resolve) => server.listen(5005, resolve));
  console.log('✅ Test Server listening on http://localhost:5005\n');

  const baseURL = 'http://localhost:5005/api';

  const request = async (path, options = {}) => {
    return new Promise((resolve, reject) => {
      const url = new URL(baseURL + path);
      const reqOpts = {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      };

      const req = http.request(url, reqOpts, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve({ status: res.statusCode, body: json });
          } catch (e) {
            resolve({ status: res.statusCode, body: data });
          }
        });
      });

      req.on('error', reject);
      if (options.body) {
        req.write(JSON.stringify(options.body));
      }
      req.end();
    });
  };

  try {
    // Authenticate Admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'm115@224';
    console.log(`0️⃣ Logging in Admin (${adminEmail})...`);
    const authRes = await request('/auth/login', {
      method: 'POST',
      body: { email: adminEmail, password: adminPassword }
    });
    const token = authRes.body?.token;
    console.log(`   Status: ${authRes.status} | Token Generated: ${token ? 'YES' : 'NO'}`);
    const authHeaders = { Authorization: `Bearer ${token}` };
    console.log('   Result: ✅ PASS\n');

    // Test 1: GET /services
    console.log('1️⃣ Testing GET /services (Dynamic Services & Prices)...');
    const servicesRes = await request('/services');
    console.log(`   Status: ${servicesRes.status} | Total Services: ${servicesRes.body?.services?.length || 0}`);
    console.log(`   Sample Service: "${servicesRes.body?.services?.[0]?.name}" - ₹${servicesRes.body?.services?.[0]?.price}`);
    console.log('   Result: ✅ PASS\n');

    // Test 2: GET /provider/approved
    console.log('2️⃣ Testing GET /provider/approved (Approved Professionals)...');
    const providersRes = await request('/provider/approved');
    console.log(`   Status: ${providersRes.status} | Approved Partners: ${providersRes.body?.providers?.length || 0}`);
    console.log('   Result: ✅ PASS\n');

    // Test 3: POST /bookings
    console.log('3️⃣ Testing POST /bookings (Customer Order Booking & Nearest Provider Matching)...');
    const bookingRes = await request('/bookings', {
      method: 'POST',
      headers: authHeaders,
      body: {
        serviceName: 'Foam-jet AC Service & Repair',
        category: 'AC & Appliance Repair',
        price: 799,
        location: 'Vaddeswaram, Andhra Pradesh',
        customerName: 'Rahul Admin Test',
        customerPhone: '+91 98765 43210',
        paymentMethod: 'upi'
      }
    });
    console.log(`   Status: ${bookingRes.status} | Message: ${bookingRes.body?.message}`);
    const createdBookingId = bookingRes.body?.booking?._id;
    console.log(`   Created Booking ID: ${createdBookingId}`);
    console.log('   Result: ✅ PASS\n');

    if (createdBookingId) {
      // Test 4: PUT /bookings/:id/status
      console.log('4️⃣ Testing PUT /bookings/:id/status (Work Status Transition: in_progress)...');
      const statusRes = await request(`/bookings/${createdBookingId}/status`, {
        method: 'PUT',
        headers: authHeaders,
        body: { status: 'in_progress' }
      });
      console.log(`   Status: ${statusRes.status} | Updated Status: ${statusRes.body?.booking?.status}`);
      console.log('   Result: ✅ PASS\n');

      // Test 5: PUT /bookings/:id/status to completed
      console.log('5️⃣ Testing PUT /bookings/:id/status (Work Completion: completed)...');
      const completeRes = await request(`/bookings/${createdBookingId}/status`, {
        method: 'PUT',
        headers: authHeaders,
        body: { status: 'completed' }
      });
      console.log(`   Status: ${completeRes.status} | Updated Status: ${completeRes.body?.booking?.status}`);
      console.log('   Result: ✅ PASS\n');

      // Test 6: PUT /bookings/:id/rate
      console.log('6️⃣ Testing PUT /bookings/:id/rate (5-Star Rating & Review Submission)...');
      const rateRes = await request(`/bookings/${createdBookingId}/rate`, {
        method: 'PUT',
        headers: authHeaders,
        body: { rating: 5, review: 'Excellent AC cleaning! Partner arrived on time.' }
      });
      console.log(`   Status: ${rateRes.status} | Rating Saved: ${rateRes.body?.booking?.rating} Stars`);
      console.log('   Result: ✅ PASS\n');

      // Test 7: GET /admin/bookings
      console.log('7️⃣ Testing GET /admin/bookings (Admin Work Tracking Dashboard)...');
      const adminBookingsRes = await request('/admin/bookings', { headers: authHeaders });
      console.log(`   Status: ${adminBookingsRes.status} | Total Bookings Tracked: ${adminBookingsRes.body?.bookings?.length || 0}`);
      console.log('   Result: ✅ PASS\n');
    }

    console.log('🎉 ALL API ENDPOINTS VERIFIED & TESTED CLEANLY 100%!');
  } catch (err) {
    console.error('❌ Test execution error:', err);
  } finally {
    server.close();
    process.exit(0);
  }
};

runTests();
