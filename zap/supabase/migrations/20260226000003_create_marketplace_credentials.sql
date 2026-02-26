-- Create marketplace_credentials table
-- Stores encrypted affiliate credentials for Shopee, Mercado Livre, Amazon
-- One row per tenant with all marketplaces

CREATE TABLE marketplace_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,

  -- Shopee: affiliate_id is public, api_key is encrypted
  shopee_affiliate_id TEXT,
  shopee_api_key TEXT,

  -- Mercado Livre: account_tag is public, token is encrypted
  mercadolivre_account_tag TEXT,
  mercadolivre_token TEXT,
  mercadolivre_token_expires_at TIMESTAMP,

  -- Amazon: associates_id is public, account_id is optional
  amazon_associates_id TEXT,
  amazon_account_id TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE marketplace_credentials ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy
CREATE POLICY "Users access only their credentials"
  ON marketplace_credentials
  FOR ALL
  TO authenticated
  USING (tenant_id = auth.uid()::uuid);

-- Service role unrestricted (for API backend)
CREATE POLICY "Service role unrestricted"
  ON marketplace_credentials
  FOR ALL
  TO service_role
  USING (true);

-- Index for tenant lookups
CREATE INDEX idx_marketplace_credentials_tenant_id ON marketplace_credentials(tenant_id);
