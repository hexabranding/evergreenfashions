import mongoose from 'mongoose';
import 'dotenv/config';

const BASE = process.env.API_BASE || 'http://localhost:5000/api';
const results = [];
const check = (name, cond, extra = '') => {
  results.push(`${cond ? 'PASS' : 'FAIL'} - ${name}${extra ? ` (${extra})` : ''}`);
  if (!cond) process.exitCode = 1;
};

async function req(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

const login = await req('POST', '/api/auth/login', { email: 'customer@evergreen.com', password: 'customer123' });
check('login', login.status === 200, `status ${login.status}`);
const token = login.data?.token;
if (!token) throw new Error('no token');

const products = await req('GET', '/api/products', null, token);
const product = (Array.isArray(products.data) ? products.data : products.data?.products || [])
  .find((p) => (p.inventory || []).some((i) => i.stock > 0));
check('product found', !!product, product?._id);

const inv = product.inventory.find((i) => i.stock > 0);
const shipping = {
  firstName: 'Smoke', lastName: 'Test', email: 'smoke@test.dev',
  phone: '+91 98765 43210', address: '1 Test St', city: 'Paris', zip: '75001', country: 'France',
};

const created = await req('POST', '/api/orders', {
  items: [{ productId: product._id, quantity: 1, size: inv.size, color: product.colors?.[0] || null }],
  shipping, payment: { method: 'card' },
}, token);
check('order created', created.status === 201, `status ${created.status} ${JSON.stringify(created.data).slice(0, 200)}`);
const orderId = created.data?._id;
check('phone stored in shipping', created.data?.shipping?.phone === shipping.phone);
check('phoneVerified defaults false', created.data?.phoneVerified === false);

const otpReq = await req('POST', `/api/orders/${orderId}/confirm-otp/request`, {}, token);
check('otp requested', otpReq.status === 200, `status ${otpReq.status}`);
check('dev otp returned', otpReq.data?.developmentOtp === '123456', otpReq.data?.developmentOtp);

const bad = await req('POST', `/api/orders/${orderId}/confirm-otp/verify`, { otp: '000000' }, token);
check('wrong otp rejected', bad.status === 401, `status ${bad.status}`);

const good = await req('POST', `/api/orders/${orderId}/confirm-otp/verify`, { otp: '123456' }, token);
check('otp verified', good.status === 200 && good.data?.phoneVerified === true, `status ${good.status}`);

const again = await req('POST', `/api/orders/${orderId}/confirm-otp/request`, {}, token);
check('second request says already verified', again.status === 200 && again.data?.phoneVerified === true, JSON.stringify(again.data));

const mine = await req('GET', '/api/orders', null, token);
const listed = (Array.isArray(mine.data) ? mine.data : []).find((o) => o._id === orderId);
check('order listed with phoneVerified', listed?.phoneVerified === true);

// Other users cannot touch the order
const adminLogin = await req('POST', '/api/auth/login', { email: 'admin@evergreen.com', password: 'admin123' });
check('admin login', adminLogin.status === 200);
const notOwner = await req('POST', `/api/orders/${orderId}/confirm-otp/request`, {}, adminLogin.data?.token);
check('admin allowed (role bypass)', notOwner.status === 200, `status ${notOwner.status}`);
const otherUser = await req('POST', '/api/auth/register', {
  firstName: 'Other', lastName: 'User', email: `smoke-other-${Date.now()}@test.dev`, password: 'password123',
});
const forbidden = await req('POST', `/api/orders/${orderId}/confirm-otp/request`, {}, otherUser.data?.token);
check('non-owner blocked', forbidden.status === 403, `status ${forbidden.status}`);

// Cleanup: remove test order, restore stock, remove temp user
await mongoose.connect(process.env.MONGODB_URI);
const Order = mongoose.connection.collection('orders');
const del = await Order.deleteOne({ _id: orderId });
check('cleanup: order removed', del.deletedCount === 1);
await mongoose.connection.collection('products').updateOne(
  { _id: product._id, 'inventory.size': inv.size },
  { $inc: { 'inventory.$.stock': 1 } }
);
const leftover = await Order.findOne({ 'shipping.email': 'smoke@test.dev' });
check('cleanup: no leftover test orders', !leftover);
await mongoose.connection.collection('users').deleteMany({ email: /smoke-other-.*@test\.dev/ });
await mongoose.disconnect();

console.log(results.join('\n'));
console.log(process.exitCode ? 'SMOKE TEST FAILED' : 'SMOKE TEST PASSED');
