-- Create strategies table
CREATE TABLE IF NOT EXISTS strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  budget_distribution JSONB DEFAULT '{"awareness": 15, "consideration": 25, "conversion": 60}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE
);

-- Create index on organization_id for faster queries
CREATE INDEX IF NOT EXISTS idx_strategies_organization_id ON strategies(organization_id);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_strategies_user_id ON strategies(user_id);

-- Enable Row Level Security
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see strategies from their organization
CREATE POLICY "Users can view strategies from their organization"
  ON strategies
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

-- Create policy to allow users to create strategies
CREATE POLICY "Users can create strategies"
  ON strategies
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Create policy to allow users to update their own strategies
CREATE POLICY "Users can update their own strategies"
  ON strategies
  FOR UPDATE
  USING (user_id = auth.uid());

-- Create policy to allow users to delete their own strategies
CREATE POLICY "Users can delete their own strategies"
  ON strategies
  FOR DELETE
  USING (user_id = auth.uid());

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_strategies_updated_at
  BEFORE UPDATE ON strategies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
