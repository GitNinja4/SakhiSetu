CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT '',
  owner_name text NOT NULL DEFAULT '',
  phone text NOT NULL UNIQUE,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  phone text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'staff', 'accountant')),
  pin_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shop_id, phone),
  UNIQUE (shop_id, id)
);

CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  sku text NOT NULL DEFAULT '',
  name text NOT NULL,
  category text NOT NULL DEFAULT '',
  selling_price numeric(12,2) NOT NULL DEFAULT 0 CHECK (selling_price >= 0),
  cost_price numeric(12,2) NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
  stock numeric(12,3) NOT NULL DEFAULT 0,
  min_stock numeric(12,3) NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
  unit text NOT NULL DEFAULT 'pcs',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shop_id, sku),
  UNIQUE (shop_id, id)
);

CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  total_spend numeric(12,2) NOT NULL DEFAULT 0,
  visits integer NOT NULL DEFAULT 0,
  credit_limit numeric(12,2) NOT NULL DEFAULT 0,
  udhaar_balance numeric(12,2) NOT NULL DEFAULT 0,
  last_activity date,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shop_id, id)
);

CREATE TABLE shop_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  phone text NOT NULL,
  role text NOT NULL CHECK (role IN ('staff', 'accountant')),
  invited_by uuid NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shop_id, phone),
  FOREIGN KEY (shop_id, invited_by) REFERENCES users(shop_id, id)
);

CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  client_txn_uuid uuid NOT NULL,
  transaction_date date NOT NULL DEFAULT current_date,
  type text NOT NULL CHECK (type IN ('sale', 'expense', 'purchase', 'udhaar_repayment')),
  product_id uuid,
  item_name text NOT NULL,
  qty numeric(12,3) NOT NULL DEFAULT 1 CHECK (qty > 0),
  unit_price numeric(12,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  cost_basis numeric(12,2) NOT NULL DEFAULT 0 CHECK (cost_basis >= 0),
  gst_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (gst_amount >= 0),
  payment_mode text NOT NULL DEFAULT 'Cash',
  upi_verified boolean NOT NULL DEFAULT false,
  customer_id uuid,
  customer_name text NOT NULL DEFAULT 'Walk-in Customer',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shop_id, client_txn_uuid),
  UNIQUE (shop_id, id),
  FOREIGN KEY (shop_id, product_id) REFERENCES products(shop_id, id),
  FOREIGN KEY (shop_id, customer_id) REFERENCES customers(shop_id, id),
  FOREIGN KEY (shop_id, created_by) REFERENCES users(shop_id, id)
);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  actor_user_id uuid,
  event text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (shop_id, actor_user_id) REFERENCES users(shop_id, id)
);

CREATE TABLE payment_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  transaction_id uuid NOT NULL,
  provider_order_id text NOT NULL UNIQUE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'paid', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (shop_id, transaction_id) REFERENCES transactions(shop_id, id)
);

CREATE INDEX transactions_shop_created_idx ON transactions (shop_id, created_at DESC);
CREATE INDEX customers_shop_name_idx ON customers (shop_id, name);
CREATE UNIQUE INDEX customers_shop_name_ci_idx ON customers (shop_id, lower(name));

CREATE OR REPLACE FUNCTION app_current_shop_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(current_setting('app.shop_id', true), '')::uuid
$$;

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'users', 'products', 'customers', 'shop_invites',
    'transactions', 'audit_logs', 'payment_orders'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format(
      'CREATE POLICY shop_isolation ON %I USING (shop_id = app_current_shop_id()) WITH CHECK (shop_id = app_current_shop_id())',
      table_name
    );
  END LOOP;
END
$$;

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY shop_self_read ON shops
  FOR SELECT USING (id = app_current_shop_id());

CREATE POLICY shop_self_update ON shops
  FOR UPDATE USING (id = app_current_shop_id())
  WITH CHECK (id = app_current_shop_id());

CREATE OR REPLACE FUNCTION auth_find_users(phone_input text)
RETURNS TABLE (id uuid, shop_id uuid, role text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT u.id, u.shop_id, u.role
  FROM users u
  WHERE u.phone = phone_input
  ORDER BY u.created_at
  LIMIT 2
$$;

CREATE OR REPLACE FUNCTION auth_create_shop(
  phone_input text,
  owner_name_input text,
  shop_name_input text,
  category_input text,
  language_input text
)
RETURNS TABLE (id uuid, shop_id uuid, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_shop_id uuid := gen_random_uuid();
  new_user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO shops (id, name, category, owner_name, phone, settings)
  VALUES (
    new_shop_id,
    shop_name_input,
    category_input,
    owner_name_input,
    phone_input,
    jsonb_build_object('language', language_input)
  );

  INSERT INTO users (id, shop_id, phone, role)
  VALUES (new_user_id, new_shop_id, phone_input, 'owner');

  RETURN QUERY SELECT new_user_id, new_shop_id, 'owner'::text;
END
$$;

REVOKE ALL ON FUNCTION auth_find_users(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION auth_create_shop(text, text, text, text, text) FROM PUBLIC;

CREATE OR REPLACE FUNCTION auth_accept_invite(phone_input text)
RETURNS TABLE (id uuid, shop_id uuid, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  invite_record shop_invites%ROWTYPE;
  invite_count integer;
  new_user_id uuid := gen_random_uuid();
BEGIN
  SELECT count(*) INTO invite_count
  FROM shop_invites
  WHERE phone = phone_input AND expires_at > now();

  IF invite_count <> 1 THEN
    RETURN;
  END IF;

  SELECT * INTO invite_record
  FROM shop_invites
  WHERE phone = phone_input AND expires_at > now()
  LIMIT 1
  FOR UPDATE;

  INSERT INTO users (id, shop_id, phone, role)
  VALUES (new_user_id, invite_record.shop_id, phone_input, invite_record.role);

  DELETE FROM shop_invites WHERE id = invite_record.id;
  RETURN QUERY SELECT new_user_id, invite_record.shop_id, invite_record.role;
END
$$;

REVOKE ALL ON FUNCTION auth_accept_invite(text) FROM PUBLIC;

CREATE OR REPLACE FUNCTION process_payment_link(link_id text, paid_amount_paise bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  paid_order payment_orders%ROWTYPE;
BEGIN
  UPDATE payment_orders
  SET status = 'paid'
  WHERE provider_order_id = link_id
    AND status = 'created'
    AND amount = paid_amount_paise::numeric / 100
  RETURNING * INTO paid_order;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  UPDATE transactions
  SET upi_verified = true
  WHERE id = paid_order.transaction_id AND shop_id = paid_order.shop_id;

  RETURN true;
END
$$;

REVOKE ALL ON FUNCTION process_payment_link(text, bigint) FROM PUBLIC;
