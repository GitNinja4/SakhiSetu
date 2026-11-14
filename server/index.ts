import 'dotenv/config';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import rawBody from 'fastify-raw-body';
import rateLimit from '@fastify/rate-limit';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

const config = z.object({
  DATABASE_URL: z.string().url(),
  SESSION_SECRET: z.string().min(32),
  APP_ORIGIN: z.string().url().default('http://localhost:5173'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_VERIFY_SERVICE_SID: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  WHATSAPP_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
}).parse(process.env);

const app = Fastify({ logger: true, trustProxy: config.NODE_ENV === 'production' });
const pool = new Pool({ connectionString: config.DATABASE_URL });
const SESSION_COOKIE = 'sakhisetu_session';
const sessionTtlSeconds = 60 * 60 * 8;

await app.register(cookie);
await app.register(rawBody, {
  field: 'rawBody',
  global: false,
  encoding: false,
  runFirst: true,
});
await app.register(jwt, {
  secret: config.SESSION_SECRET,
  cookie: { cookieName: SESSION_COOKIE, signed: false },
  sign: { expiresIn: sessionTtlSeconds },
});
await app.register(rateLimit, {
  global: true,
  max: 120,
  timeWindow: '1 minute',
});

app.setErrorHandler((error, _request, reply) => {
  app.log.error(error);
  const validationError = error instanceof z.ZodError;
  const databaseCode = error && typeof error === 'object' && 'code' in error
    ? String(error.code)
    : '';
  const status = validationError
    ? 400
    : databaseCode === '23505'
      ? 409
      : error && typeof error === 'object' && 'statusCode' in error
        ? Number(error.statusCode)
        : 500;
  const statusCode = Number.isInteger(status) && status >= 400 && status < 600 ? status : 500;
  reply.code(statusCode).send({
    error: statusCode === 500
      ? 'Internal server error'
      : validationError
        ? error.issues[0]?.message || 'Invalid request.'
        : databaseCode === '23505'
          ? 'A record with the same unique value already exists.'
        : error instanceof Error ? error.message : 'Request failed',
  });
});

app.addHook('onRequest', async (request, reply) => {
  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') return;
  if (request.url === '/api/payments/webhook/razorpay') return;
  if (request.headers.origin !== config.APP_ORIGIN) {
    return reply.code(403).send({ error: 'Request origin is not allowed.' });
  }
});

function requireConfigured(...names: string[]) {
  const missing = names.filter((name) => !process.env[name]);
  if (missing.length) {
    const error = new Error(`Service is not configured: ${missing.join(', ')}`);
    Object.assign(error, { statusCode: 503 });
    throw error;
  }
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!/^(91)?[6-9]\d{9}$/.test(digits)) {
    const error = new Error('Enter a valid Indian mobile number.');
    Object.assign(error, { statusCode: 400 });
    throw error;
  }
  return `+91${digits.slice(-10)}`;
}

async function authenticate(request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch {
    return reply.code(401).send({ error: 'Authentication required.' });
  }
}

function authorize(...roles: string[]) {
  return async (request: any, reply: any) => {
    await authenticate(request, reply);
    if (reply.sent) return;
    if (!roles.includes(request.user.role)) {
      return reply.code(403).send({ error: 'This action is not permitted for your role.' });
    }
  };
}

async function withShop<T>(request: any, work: (client: any) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      "SELECT set_config('app.shop_id', $1, true), set_config('app.user_id', $2, true)",
      [request.user.shopId, request.user.userId],
    );
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function setSession(reply: any, user: { userId: string; shopId: string; role: string }) {
  const token = app.jwt.sign(user);
  reply.setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: sessionTtlSeconds,
  });
}

app.get('/api/health', async () => {
  await pool.query('SELECT 1');
  return { status: 'ok' };
});

app.post('/api/auth/otp/send', {
  config: { rateLimit: { max: 5, timeWindow: '10 minutes' } },
}, async (request: any, reply) => {
  requireConfigured('TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_VERIFY_SERVICE_SID');
  const body = z.object({ phone: z.string() }).parse(request.body);
  const phone = normalizePhone(body.phone);
  const url = `https://verify.twilio.com/v2/Services/${config.TWILIO_VERIFY_SERVICE_SID}/Verifications`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.TWILIO_ACCOUNT_SID}:${config.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: phone, Channel: 'sms' }),
  });
  if (!response.ok) {
    app.log.error({ status: response.status }, 'OTP provider rejected send request');
    return reply.code(502).send({ error: 'Could not send verification code.' });
  }
  return reply.code(202).send({ status: 'pending' });
});

app.post('/api/staff/invites', {
  preHandler: authorize('owner'),
  config: { rateLimit: { max: 10, timeWindow: '1 hour' } },
}, async (request: any, reply) => {
  requireConfigured('TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_VERIFY_SERVICE_SID');
  const body = z.object({
    phone: z.string(),
    role: z.enum(['staff', 'accountant']),
  }).parse(request.body);
  const phone = normalizePhone(body.phone);
  await withShop(request, (client) => client.query(
    `INSERT INTO shop_invites (shop_id, phone, role, invited_by)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (shop_id, phone) DO UPDATE SET
       role = EXCLUDED.role,
       invited_by = EXCLUDED.invited_by,
       expires_at = now() + interval '24 hours',
       created_at = now()`,
    [request.user.shopId, phone, body.role, request.user.userId],
  ));
  const url = `https://verify.twilio.com/v2/Services/${config.TWILIO_VERIFY_SERVICE_SID}/Verifications`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.TWILIO_ACCOUNT_SID}:${config.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: phone, Channel: 'sms' }),
  });
  if (!response.ok) {
    app.log.error({ status: response.status }, 'OTP provider rejected staff invitation');
    await withShop(request, (client) => client.query(
      'DELETE FROM shop_invites WHERE shop_id = $1 AND phone = $2',
      [request.user.shopId, phone],
    ));
    return reply.code(502).send({ error: 'Could not send staff invitation code.' });
  }
  return reply.code(202).send({ status: 'pending' });
});

app.post('/api/auth/otp/verify', {
  config: { rateLimit: { max: 8, timeWindow: '10 minutes' } },
}, async (request: any, reply) => {
  requireConfigured('TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_VERIFY_SERVICE_SID');
  const body = z.object({
    phone: z.string(),
    code: z.string().regex(/^\d{4,10}$/),
    ownerName: z.string().trim().min(1).max(120).optional(),
    shopName: z.string().trim().min(1).max(160).optional(),
    category: z.string().trim().max(120).optional(),
    language: z.enum(['en', 'hi', 'bho', 'mai', 'bn']).default('en'),
  }).parse(request.body);
  const phone = normalizePhone(body.phone);
  const url = `https://verify.twilio.com/v2/Services/${config.TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`;
  const verification = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.TWILIO_ACCOUNT_SID}:${config.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: phone, Code: body.code }),
  });
  if (!verification.ok || (await verification.json()).status !== 'approved') {
    return reply.code(401).send({ error: 'The verification code is invalid or expired.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query(
      `SELECT id, shop_id, role FROM auth_find_users($1)`,
      [phone],
    );
    let user = found.rows[0];
    if (found.rows.length > 1) {
      const error = new Error('This number belongs to more than one shop. Contact support.');
      Object.assign(error, { statusCode: 409 });
      throw error;
    }
    if (!user) {
      if (body.ownerName && body.shopName) {
        const created = await client.query(
          `SELECT id, shop_id, role
           FROM auth_create_shop($1, $2, $3, $4, $5)`,
          [phone, body.ownerName, body.shopName, body.category || '', body.language],
        );
        user = created.rows[0];
      } else {
        const invited = await client.query(
          'SELECT id, shop_id, role FROM auth_accept_invite($1)',
          [phone],
        );
        user = invited.rows[0];
      }
      if (!user) {
        const error = new Error('Shop name and owner name are required for sign-up.');
        Object.assign(error, { statusCode: 422 });
        throw error;
      }
    }
    await client.query('COMMIT');
    setSession(reply, { userId: user.id, shopId: user.shop_id, role: user.role });
    return { status: 'authenticated', role: user.role, shopId: user.shop_id };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

app.post('/api/auth/logout', async (_request, reply) => {
  reply.clearCookie(SESSION_COOKIE, { path: '/' });
  return { status: 'signed_out' };
});

app.get('/api/auth/session', { preHandler: authenticate }, async (request: any) => ({
  userId: request.user.userId,
  shopId: request.user.shopId,
  role: request.user.role,
}));

app.get('/api/business-state', { preHandler: authenticate }, async (request: any) => {
  const rows = await withShop(request, async (client) => {
    const [shop, user, products, customers, transactions, auditLogs] = await Promise.all([
      client.query('SELECT * FROM shops WHERE id = $1', [request.user.shopId]),
      client.query('SELECT pin_hash FROM users WHERE id = $1', [request.user.userId]),
      client.query('SELECT * FROM products WHERE shop_id = $1 ORDER BY name', [request.user.shopId]),
      client.query('SELECT * FROM customers WHERE shop_id = $1 ORDER BY name', [request.user.shopId]),
      client.query('SELECT * FROM transactions WHERE shop_id = $1 ORDER BY created_at DESC', [request.user.shopId]),
      client.query('SELECT * FROM audit_logs WHERE shop_id = $1 ORDER BY created_at DESC LIMIT 40', [request.user.shopId]),
    ]);
    return { shop: shop.rows[0], user: user.rows[0], products: products.rows, customers: customers.rows, transactions: transactions.rows, auditLogs: auditLogs.rows };
  });
  if (!rows.shop) {
    const error = new Error('Shop workspace was not found.');
    Object.assign(error, { statusCode: 404 });
    throw error;
  }
  const settings = rows.shop.settings || {};
  return {
    profile: {
      ownerName: rows.shop.owner_name,
      shopName: rows.shop.name,
      category: rows.shop.category,
      phone: rows.shop.phone,
      upiId: settings.upiId || '',
      gstin: settings.gstin || '',
      udyamNo: settings.udyamNo || '',
      language: settings.language || 'en',
      pinEnabled: Boolean(rows.user?.pin_hash),
    },
    offlineMode: false,
    products: rows.products.map((product: any) => ({
      id: product.id,
      sku: product.sku,
      name: product.name,
      category: product.category,
      sellingPrice: Number(product.selling_price),
      costPrice: Number(product.cost_price),
      stock: Number(product.stock),
      minStock: Number(product.min_stock),
      unit: product.unit,
    })),
    customers: rows.customers.map((customer: any) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      totalSpend: Number(customer.total_spend),
      visits: customer.visits,
      creditLimit: Number(customer.credit_limit),
      udhaarBalance: Number(customer.udhaar_balance),
      lastActivity: customer.last_activity,
    })),
    transactions: rows.transactions.map((transaction: any) => ({
      id: transaction.id,
      clientTxnUuid: transaction.client_txn_uuid,
      date: transaction.transaction_date,
      type: transaction.type,
      productId: transaction.product_id,
      itemName: transaction.item_name,
      qty: Number(transaction.qty),
      unitPrice: Number(transaction.unit_price),
      amount: Number(transaction.amount),
      costBasis: Number(transaction.cost_basis),
      gstAmount: Number(transaction.gst_amount),
      paymentMode: transaction.payment_mode,
      upiVerified: transaction.upi_verified,
      customerId: transaction.customer_id,
      customerName: transaction.customer_name,
      synced: true,
      createdAt: new Date(transaction.created_at).getTime(),
    })),
    auditLogs: rows.auditLogs.map((entry: any) => ({
      id: entry.id,
      timestamp: entry.created_at,
      event: entry.event,
      detail: JSON.stringify(entry.detail),
      hash: '',
    })),
  };
});

app.post('/api/auth/pin/set', {
  preHandler: authorize('owner'),
}, async (request: any) => {
  const { pin } = z.object({ pin: z.string().regex(/^\d{4}$/) }).parse(request.body);
  const hash = await bcrypt.hash(pin, 12);
  await withShop(request, (client) => client.query(
    'UPDATE users SET pin_hash = $1 WHERE id = $2 AND shop_id = $3',
    [hash, request.user.userId, request.user.shopId],
  ));
  return { status: 'updated' };
});

app.post('/api/auth/pin/verify', {
  preHandler: authenticate,
  config: { rateLimit: { max: 5, timeWindow: '10 minutes' } },
}, async (request: any, reply) => {
  const { pin } = z.object({ pin: z.string().regex(/^\d{4}$/) }).parse(request.body);
  const row = await withShop(request, async (client) => {
    const result = await client.query(
      'SELECT pin_hash FROM users WHERE id = $1 AND shop_id = $2',
      [request.user.userId, request.user.shopId],
    );
    return result.rows[0];
  });
  if (!row?.pin_hash || !(await bcrypt.compare(pin, row.pin_hash))) {
    return reply.code(401).send({ error: 'Incorrect PIN.' });
  }
  return { status: 'verified' };
});

app.delete('/api/auth/pin', {
  preHandler: authorize('owner'),
}, async (request: any) => {
  await withShop(request, (client) => client.query(
    'UPDATE users SET pin_hash = NULL WHERE id = $1 AND shop_id = $2',
    [request.user.userId, request.user.shopId],
  ));
  return { status: 'disabled' };
});

app.post('/api/products', {
  preHandler: authorize('owner', 'accountant'),
}, async (request: any, reply) => {
  const body = z.object({
    name: z.string().trim().min(1).max(200),
    category: z.string().trim().max(120).default(''),
    sellingPrice: z.number().nonnegative().max(100000000),
    costPrice: z.number().nonnegative().max(100000000),
    stock: z.number().nonnegative().max(1000000).default(0),
    minStock: z.number().nonnegative().max(1000000).default(5),
    unit: z.string().trim().min(1).max(24).default('pcs'),
  }).parse(request.body);
  const product = await withShop(request, async (client) => {
    const result = await client.query(
      `INSERT INTO products (
         shop_id, sku, name, category, selling_price, cost_price, stock, min_stock, unit
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        request.user.shopId, `SKU-${randomUUID()}`, body.name, body.category,
        body.sellingPrice, body.costPrice, body.stock, body.minStock, body.unit,
      ],
    );
    return result.rows[0];
  });
  return reply.code(201).send({
    id: product.id,
    sku: product.sku,
    name: product.name,
    category: product.category,
    sellingPrice: Number(product.selling_price),
    costPrice: Number(product.cost_price),
    stock: Number(product.stock),
    minStock: Number(product.min_stock),
    unit: product.unit,
  });
});

app.post('/api/customers', {
  preHandler: authorize('owner', 'accountant'),
}, async (request: any, reply) => {
  const body = z.object({
    name: z.string().trim().min(1).max(160),
    phone: z.string().optional().default(''),
    creditLimit: z.number().nonnegative().max(100000000).default(2500),
  }).parse(request.body);
  const phone = body.phone ? normalizePhone(body.phone) : '';
  const customer = await withShop(request, async (client) => {
    const result = await client.query(
      `INSERT INTO customers (shop_id, name, phone, credit_limit)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [request.user.shopId, body.name, phone, body.creditLimit],
    );
    return result.rows[0];
  });
  return reply.code(201).send({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    totalSpend: Number(customer.total_spend),
    visits: customer.visits,
    creditLimit: Number(customer.credit_limit),
    udhaarBalance: Number(customer.udhaar_balance),
    lastActivity: customer.last_activity,
  });
});

app.patch('/api/shop/settings', {
  preHandler: authorize('owner'),
}, async (request: any) => {
  const body = z.object({
    ownerName: z.string().trim().min(1).max(120),
    shopName: z.string().trim().min(1).max(160),
    language: z.enum(['en', 'hi', 'bho', 'mai', 'bn']),
    upiId: z.string().trim().max(120),
    gstin: z.string().trim().max(32),
    udyamNo: z.string().trim().max(48),
  }).parse(request.body);
  await withShop(request, (client) => client.query(
    `UPDATE shops
     SET owner_name = $1, name = $2, settings = settings || $3::jsonb, updated_at = now()
     WHERE id = $4`,
    [
      body.ownerName,
      body.shopName,
      JSON.stringify({
        language: body.language,
        upiId: body.upiId,
        gstin: body.gstin,
        udyamNo: body.udyamNo,
      }),
      request.user.shopId,
    ],
  ));
  return { status: 'updated' };
});

app.post('/api/transactions', {
  preHandler: authorize('owner', 'staff', 'accountant'),
}, async (request: any, reply) => {
  const body = z.object({
    clientTxnUuid: z.string().uuid(),
    type: z.enum(['sale', 'expense', 'purchase', 'udhaar_repayment']),
    productId: z.string().uuid().nullable().optional(),
    itemName: z.string().trim().min(1).max(200),
    qty: z.number().positive().max(100000),
    unitPrice: z.number().nonnegative().max(100000000),
    amount: z.number().nonnegative().max(100000000),
    costBasis: z.number().nonnegative().max(100000000).default(0),
    paymentMode: z.string().trim().min(1).max(40).default('Cash'),
    customerId: z.string().uuid().nullable().optional(),
    customerName: z.string().trim().max(160).default('Walk-in Customer'),
    transactionDate: z.string().date().optional(),
  }).parse(request.body);
  if (request.user.role === 'staff' && body.type !== 'sale') {
    return reply.code(403).send({ error: 'Staff members may only record sales.' });
  }

  const calculatedAmount = body.type === 'expense' || body.type === 'udhaar_repayment'
    ? body.amount
    : Math.round(body.qty * body.unitPrice * 100) / 100;
  const gstAmount = body.type === 'sale' ? Math.round(calculatedAmount * 0.05 * 100) / 100 : 0;
  const result = await withShop(request, async (client) => {
    const productResult = body.productId
      ? await client.query(
          'SELECT cost_price, unit FROM products WHERE id = $1 AND shop_id = $2 FOR UPDATE',
          [body.productId, request.user.shopId],
        )
      : null;
    const product = productResult?.rows[0];
    if (body.productId && !product) {
      const error = new Error('Product was not found in this shop.');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }
    let customerId = body.customerId || null;
    const walkInNames = ['walk-in customer', 'सामान्य ग्राहक', 'সাধারণ গ্রাহক'];
    const isWalkInCustomer = walkInNames.includes(body.customerName.toLowerCase());
    if (body.type === 'sale' && body.paymentMode === 'Udhaar' && !customerId && isWalkInCustomer) {
      const error = new Error('Choose or enter a customer before recording Udhaar.');
      Object.assign(error, { statusCode: 422 });
      throw error;
    }
    if (customerId) {
      const customer = await client.query(
        'SELECT id FROM customers WHERE id = $1 AND shop_id = $2 FOR UPDATE',
        [customerId, request.user.shopId],
      );
      if (!customer.rows[0]) {
        const error = new Error('Customer was not found in this shop.');
        Object.assign(error, { statusCode: 404 });
        throw error;
      }
    }
    if (
      body.type === 'sale' &&
      !customerId &&
      body.customerName &&
      !isWalkInCustomer &&
      body.customerName.toLowerCase() !== 'shop expense'
    ) {
      const existing = await client.query(
        `SELECT id FROM customers
         WHERE shop_id = $1 AND lower(name) = lower($2)
         FOR UPDATE`,
        [request.user.shopId, body.customerName],
      );
      if (existing.rows[0]) {
        customerId = existing.rows[0].id;
      } else {
        const created = await client.query(
          `INSERT INTO customers (shop_id, name)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING
           RETURNING id`,
          [request.user.shopId, body.customerName],
        );
        if (created.rows[0]) {
          customerId = created.rows[0].id;
        } else {
          const concurrent = await client.query(
            `SELECT id FROM customers
             WHERE shop_id = $1 AND lower(name) = lower($2)
             FOR UPDATE`,
            [request.user.shopId, body.customerName],
          );
          customerId = concurrent.rows[0]?.id || null;
        }
      }
    }
    const calculatedCostBasis = body.type === 'sale'
      ? product && product.unit !== 'service' ? Math.round(Number(product.cost_price) * body.qty * 100) / 100 : 0
      : body.type === 'purchase' ? calculatedAmount : 0;

    const inserted = await client.query(
      `INSERT INTO transactions (
        shop_id, client_txn_uuid, transaction_date, type, product_id, item_name,
        qty, unit_price, amount, cost_basis, gst_amount, payment_mode,
        customer_id, customer_name, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      ON CONFLICT (shop_id, client_txn_uuid) DO NOTHING
      RETURNING id, client_txn_uuid, amount, cost_basis, gst_amount`,
      [
        request.user.shopId, body.clientTxnUuid, body.transactionDate || new Date(),
        body.type, body.productId || null, body.itemName, body.qty, body.unitPrice,
        calculatedAmount, calculatedCostBasis, gstAmount, body.paymentMode,
        customerId, body.customerName, request.user.userId,
      ],
    );
    if (inserted.rowCount === 0) {
      const existing = await client.query(
        `SELECT id, client_txn_uuid, amount, cost_basis, gst_amount FROM transactions
         WHERE shop_id = $1 AND client_txn_uuid = $2`,
        [request.user.shopId, body.clientTxnUuid],
      );
      return { duplicate: true, transaction: existing.rows[0] };
    }

    if (body.productId && product?.unit !== 'service' && (body.type === 'sale' || body.type === 'purchase')) {
      const delta = body.type === 'sale' ? -body.qty : body.qty;
      const stock = await client.query(
        `UPDATE products
         SET stock = stock + $1, updated_at = now()
         WHERE id = $2 AND shop_id = $3
           AND (stock + $1 >= 0)
         RETURNING id`,
        [delta, body.productId, request.user.shopId],
      );
      if (stock.rowCount !== 1) {
        const error = new Error('Product was not found or has insufficient stock.');
        Object.assign(error, { statusCode: 409 });
        throw error;
      }
    }

    if (customerId && body.type === 'sale') {
      const customer = await client.query(
        `UPDATE customers SET
           total_spend = total_spend + $1,
           visits = visits + 1,
           udhaar_balance = udhaar_balance + CASE WHEN $2 = 'Udhaar' THEN $1 ELSE 0 END,
           last_activity = $3,
           updated_at = now()
         WHERE id = $4 AND shop_id = $5
         RETURNING id`,
        [calculatedAmount, body.paymentMode, body.transactionDate || new Date(), customerId, request.user.shopId],
      );
      if (customer.rowCount !== 1) {
        const error = new Error('Customer was not found in this shop.');
        Object.assign(error, { statusCode: 404 });
        throw error;
      }
    } else if (body.customerId && body.type === 'udhaar_repayment') {
      const customer = await client.query(
        `UPDATE customers SET
           udhaar_balance = GREATEST(0, udhaar_balance - $1),
           last_activity = $2,
           updated_at = now()
         WHERE id = $3 AND shop_id = $4
         RETURNING id`,
        [calculatedAmount, body.transactionDate || new Date(), body.customerId, request.user.shopId],
      );
      if (customer.rowCount !== 1) {
        const error = new Error('Customer was not found in this shop.');
        Object.assign(error, { statusCode: 404 });
        throw error;
      }
    }

    await client.query(
      `INSERT INTO audit_logs (shop_id, actor_user_id, event, detail)
       VALUES ($1, $2, $3, $4)`,
      [request.user.shopId, request.user.userId, `TXN_${body.type.toUpperCase()}`, JSON.stringify({
        transactionId: inserted.rows[0].id,
        clientTxnUuid: body.clientTxnUuid,
      })],
    );
    return { duplicate: false, transaction: inserted.rows[0] };
  });
  return reply.code(result.duplicate ? 200 : 201).send(result);
});

app.get('/api/reports/passport.csv', {
  preHandler: authorize('owner', 'accountant'),
}, async (request: any, reply) => {
  const rows = await withShop(request, async (client) => {
    const result = await client.query(
      `SELECT id, transaction_date, type, item_name, qty, amount, payment_mode, customer_name
       FROM transactions WHERE shop_id = $1 ORDER BY created_at`,
      [request.user.shopId],
    );
    return result.rows;
  });
  const csvCell = (value: unknown) => {
    let text = String(value ?? '');
    if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  const lines = [
    ['ID', 'Date', 'Type', 'Item', 'Qty', 'Amount_INR', 'PaymentMode', 'Party'].map(csvCell).join(','),
    ...rows.map((row: any) => [
      row.id,
      row.transaction_date,
      row.type,
      row.item_name,
      row.qty,
      row.amount,
      row.payment_mode,
      row.customer_name,
    ].map(csvCell).join(',')),
  ];
  return reply
    .header('Content-Type', 'text/csv; charset=utf-8')
    .header('Content-Disposition', 'attachment; filename="SakhiSetu_Financial_Passport.csv"')
    .send(lines.join('\r\n'));
});

app.post('/api/sakhi/parse', {
  preHandler: authenticate,
  config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
}, async (request: any, reply) => {
  requireConfigured('GEMINI_API_KEY');
  const { transcript, language } = z.object({
    transcript: z.string().trim().min(1).max(4000),
    language: z.enum(['en', 'hi', 'bho', 'mai', 'bn']),
  }).parse(request.body);
  const schema = {
    type: 'OBJECT',
    properties: {
      intent: { type: 'STRING', enum: ['sale', 'expense', 'purchase', 'udhaar_repayment', 'question', 'unknown'] },
      item: { type: 'STRING' },
      qty: { type: 'NUMBER' },
      amount: { type: 'NUMBER' },
      party: { type: 'STRING' },
      paymentMode: { type: 'STRING', enum: ['Cash', 'UPI', 'Udhaar', 'Unknown'] },
    },
    required: ['intent', 'item', 'qty', 'amount', 'party', 'paymentMode'],
    propertyOrdering: ['intent', 'item', 'qty', 'amount', 'party', 'paymentMode'],
  };
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(config.GEMINI_API_KEY!)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Extract only the user's intended shop-ledger command. Do not calculate tax or invent values. Language: ${language}. Transcript: ${transcript}` }] }],
        generationConfig: { responseMimeType: 'application/json', responseSchema: schema },
      }),
    },
  );
  if (!response.ok) {
    app.log.error({ status: response.status }, 'Gemini parse request failed');
    return reply.code(502).send({ error: 'The Sakhi parsing service is temporarily unavailable.' });
  }
  const payload: any = await response.json();
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string') {
    return reply.code(502).send({ error: 'The Sakhi parsing service returned an invalid response.' });
  }
  try {
    return { extraction: JSON.parse(text) };
  } catch (error) {
    app.log.error(error, 'Gemini returned invalid JSON');
    return reply.code(502).send({ error: 'The Sakhi parsing service returned invalid data.' });
  }
});

app.post('/api/payments/links', {
  preHandler: authorize('owner', 'staff', 'accountant'),
}, async (request: any, reply) => {
  requireConfigured('RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET');
  const { transactionId } = z.object({ transactionId: z.string().uuid() }).parse(request.body);
  const transaction = await withShop(request, async (client) => {
    const result = await client.query(
      `SELECT id, amount, item_name
       FROM transactions
       WHERE id = $1 AND shop_id = $2
         AND type = 'sale' AND payment_mode = 'UPI' AND upi_verified = false`,
      [transactionId, request.user.shopId],
    );
    if (!result.rows[0]) {
      const error = new Error('Transaction was not found.');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }
    return result.rows[0];
  });
  const amountPaise = Math.round(Number(transaction.amount) * 100);
  if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
    const error = new Error('Transaction amount cannot be used to create a payment link.');
    Object.assign(error, { statusCode: 422 });
    throw error;
  }
  const response = await fetch('https://api.razorpay.com/v1/payment_links', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.RAZORPAY_KEY_ID}:${config.RAZORPAY_KEY_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      description: transaction.item_name,
      reference_id: transaction.id,
      accept_partial: false,
      notify: { sms: false, email: false },
    }),
  });
  const paymentLink: any = await response.json();
  if (!response.ok || typeof paymentLink.id !== 'string' || typeof paymentLink.short_url !== 'string') {
    app.log.error({ status: response.status }, 'Razorpay payment-link creation failed');
    return reply.code(502).send({ error: 'Could not create a payment link.' });
  }
  await withShop(request, (client) => client.query(
    `INSERT INTO payment_orders (shop_id, transaction_id, provider_order_id, amount)
     VALUES ($1, $2, $3, $4)`,
    [request.user.shopId, transactionId, paymentLink.id, transaction.amount],
  ));
  return reply.code(201).send({ paymentLink: paymentLink.short_url });
});

app.post('/api/payments/webhook/razorpay', {
  config: { rawBody: true },
}, async (request: any, reply) => {
  requireConfigured('RAZORPAY_WEBHOOK_SECRET');
  const signature = request.headers['x-razorpay-signature'];
  const rawBody = request.rawBody;
  if (typeof signature !== 'string' || !Buffer.isBuffer(rawBody)) {
    return reply.code(400).send({ error: 'Missing webhook signature or raw payload.' });
  }
  const expected = createHmac('sha256', config.RAZORPAY_WEBHOOK_SECRET!).update(rawBody).digest();
  let actual: Buffer;
  try {
    actual = Buffer.from(signature, 'hex');
  } catch {
    return reply.code(400).send({ error: 'Invalid webhook signature.' });
  }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return reply.code(401).send({ error: 'Invalid webhook signature.' });
  }
  const event: any = JSON.parse(rawBody.toString('utf8'));
  if (event.event !== 'payment_link.paid') return { status: 'ignored' };
  const paymentLink = event.payload?.payment_link?.entity;
  if (
    typeof paymentLink?.id !== 'string' ||
    paymentLink.currency !== 'INR' ||
    !Number.isSafeInteger(paymentLink.amount_paid)
  ) {
    return reply.code(400).send({ error: 'Webhook has invalid payment-link details.' });
  }
  await pool.query('SELECT process_payment_link($1, $2)', [paymentLink.id, paymentLink.amount_paid]);
  return { status: 'processed' };
});

app.addHook('onClose', async () => {
  await pool.end();
});

try {
  await app.listen({ port: Number(process.env.PORT || 3001), host: '0.0.0.0' });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}
