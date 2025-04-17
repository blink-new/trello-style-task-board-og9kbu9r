
-- Create boards table
CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create columns table
CREATE TABLE IF NOT EXISTS columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cards table
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  column_id UUID REFERENCES columns(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create card_tags junction table
CREATE TABLE IF NOT EXISTS card_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(card_id, tag_id)
);

-- Create RLS policies
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_tags ENABLE ROW LEVEL SECURITY;

-- Board policies
CREATE POLICY "Users can create their own boards" 
ON boards FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own boards" 
ON boards FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own boards" 
ON boards FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own boards" 
ON boards FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Column policies
CREATE POLICY "Users can create columns in their boards" 
ON columns FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM boards 
    WHERE boards.id = columns.board_id 
    AND boards.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view columns in their boards" 
ON columns FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM boards 
    WHERE boards.id = columns.board_id 
    AND boards.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update columns in their boards" 
ON columns FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM boards 
    WHERE boards.id = columns.board_id 
    AND boards.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete columns in their boards" 
ON columns FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM boards 
    WHERE boards.id = columns.board_id 
    AND boards.user_id = auth.uid()
  )
);

-- Card policies
CREATE POLICY "Users can create cards in their columns" 
ON cards FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM columns
    JOIN boards ON columns.board_id = boards.id
    WHERE columns.id = cards.column_id 
    AND boards.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view cards in their columns" 
ON cards FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM columns
    JOIN boards ON columns.board_id = boards.id
    WHERE columns.id = cards.column_id 
    AND boards.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update cards in their columns" 
ON cards FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM columns
    JOIN boards ON columns.board_id = boards.id
    WHERE columns.id = cards.column_id 
    AND boards.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete cards in their columns" 
ON cards FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM columns
    JOIN boards ON columns.board_id = boards.id
    WHERE columns.id = cards.column_id 
    AND boards.user_id = auth.uid()
  )
);

-- Tag policies
CREATE POLICY "Users can create tags for their boards" 
ON tags FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM boards 
    WHERE boards.id = tags.board_id 
    AND boards.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view tags for their boards" 
ON tags FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM boards 
    WHERE boards.id = tags.board_id 
    AND boards.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update tags for their boards" 
ON tags FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM boards 
    WHERE boards.id = tags.board_id 
    AND boards.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete tags for their boards" 
ON tags FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM boards 
    WHERE boards.id = tags.board_id 
    AND boards.user_id = auth.uid()
  )
);

-- Card tags policies
CREATE POLICY "Users can manage card tags for their cards" 
ON card_tags FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM cards
    JOIN columns ON cards.column_id = columns.id
    JOIN boards ON columns.board_id = boards.id
    WHERE cards.id = card_tags.card_id 
    AND boards.user_id = auth.uid()
  )
);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
CREATE TRIGGER update_boards_updated_at
BEFORE UPDATE ON boards
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_columns_updated_at
BEFORE UPDATE ON columns
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_cards_updated_at
BEFORE UPDATE ON cards
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();