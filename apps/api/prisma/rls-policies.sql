-- ================================================
-- Row Level Security (RLS) Policies for Supabase
-- ================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_campaigns ENABLE ROW LEVEL SECURITY;

-- ================================================
-- USERS TABLE POLICIES
-- ================================================

-- Users can read their own data
CREATE POLICY "Users can view own data"
ON users
FOR SELECT
USING (auth.uid()::text = id);

-- Users can update their own data
CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
USING (auth.uid()::text = id);

-- Allow service role to do anything (for backend operations)
CREATE POLICY "Service role has full access to users"
ON users
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ================================================
-- FACEBOOK_TOKENS TABLE POLICIES
-- ================================================

-- Users can only see their own tokens
CREATE POLICY "Users can view own facebook tokens"
ON facebook_tokens
FOR SELECT
USING (auth.uid()::text = "userId");

-- Users can insert their own tokens
CREATE POLICY "Users can insert own facebook tokens"
ON facebook_tokens
FOR INSERT
WITH CHECK (auth.uid()::text = "userId");

-- Users can update their own tokens
CREATE POLICY "Users can update own facebook tokens"
ON facebook_tokens
FOR UPDATE
USING (auth.uid()::text = "userId");

-- Users can delete their own tokens
CREATE POLICY "Users can delete own facebook tokens"
ON facebook_tokens
FOR DELETE
USING (auth.uid()::text = "userId");

-- Service role full access
CREATE POLICY "Service role has full access to facebook tokens"
ON facebook_tokens
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ================================================
-- FACEBOOK_AD_ACCOUNTS TABLE POLICIES
-- ================================================

-- Users can view ad accounts linked to their tokens
CREATE POLICY "Users can view own facebook ad accounts"
ON facebook_ad_accounts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM facebook_tokens
    WHERE facebook_tokens.id = facebook_ad_accounts."tokenId"
    AND facebook_tokens."userId" = auth.uid()::text
  )
);

-- Users can insert ad accounts linked to their tokens
CREATE POLICY "Users can insert own facebook ad accounts"
ON facebook_ad_accounts
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM facebook_tokens
    WHERE facebook_tokens.id = facebook_ad_accounts."tokenId"
    AND facebook_tokens."userId" = auth.uid()::text
  )
);

-- Users can update their own ad accounts
CREATE POLICY "Users can update own facebook ad accounts"
ON facebook_ad_accounts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM facebook_tokens
    WHERE facebook_tokens.id = facebook_ad_accounts."tokenId"
    AND facebook_tokens."userId" = auth.uid()::text
  )
);

-- Users can delete their own ad accounts
CREATE POLICY "Users can delete own facebook ad accounts"
ON facebook_ad_accounts
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM facebook_tokens
    WHERE facebook_tokens.id = facebook_ad_accounts."tokenId"
    AND facebook_tokens."userId" = auth.uid()::text
  )
);

-- Service role full access
CREATE POLICY "Service role has full access to facebook ad accounts"
ON facebook_ad_accounts
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ================================================
-- FACEBOOK_CAMPAIGNS TABLE POLICIES
-- ================================================

-- Users can view campaigns from their ad accounts
CREATE POLICY "Users can view own facebook campaigns"
ON facebook_campaigns
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM facebook_ad_accounts
    JOIN facebook_tokens ON facebook_tokens.id = facebook_ad_accounts."tokenId"
    WHERE facebook_ad_accounts.id = facebook_campaigns."adAccountId"
    AND facebook_tokens."userId" = auth.uid()::text
  )
);

-- Users can insert campaigns to their ad accounts
CREATE POLICY "Users can insert own facebook campaigns"
ON facebook_campaigns
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM facebook_ad_accounts
    JOIN facebook_tokens ON facebook_tokens.id = facebook_ad_accounts."tokenId"
    WHERE facebook_ad_accounts.id = facebook_campaigns."adAccountId"
    AND facebook_tokens."userId" = auth.uid()::text
  )
);

-- Users can update their own campaigns
CREATE POLICY "Users can update own facebook campaigns"
ON facebook_campaigns
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM facebook_ad_accounts
    JOIN facebook_tokens ON facebook_tokens.id = facebook_ad_accounts."tokenId"
    WHERE facebook_ad_accounts.id = facebook_campaigns."adAccountId"
    AND facebook_tokens."userId" = auth.uid()::text
  )
);

-- Users can delete their own campaigns
CREATE POLICY "Users can delete own facebook campaigns"
ON facebook_campaigns
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM facebook_ad_accounts
    JOIN facebook_tokens ON facebook_tokens.id = facebook_ad_accounts."tokenId"
    WHERE facebook_ad_accounts.id = facebook_campaigns."adAccountId"
    AND facebook_tokens."userId" = auth.uid()::text
  )
);

-- Service role full access
CREATE POLICY "Service role has full access to facebook campaigns"
ON facebook_campaigns
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ================================================
-- GRANT PERMISSIONS
-- ================================================

-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant to service role
GRANT ALL ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
