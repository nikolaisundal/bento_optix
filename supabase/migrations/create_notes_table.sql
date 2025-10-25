-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  note_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID REFERENCES auth.users(id),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notes_patient_id ON notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_notes_deleted_at ON notes(deleted_at);
CREATE INDEX IF NOT EXISTS idx_notes_note_date ON notes(note_date);

-- Enable Row Level Security
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create policies for notes table
-- Users can view all non-deleted notes
CREATE POLICY "Users can view non-deleted notes" ON notes
  FOR SELECT
  USING (deleted_at IS NULL);

-- Users can insert their own notes
CREATE POLICY "Users can insert notes" ON notes
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Users can update their own notes
CREATE POLICY "Users can update notes" ON notes
  FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Users can soft delete their own notes
CREATE POLICY "Users can delete notes" ON notes
  FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_notes_updated_at();
