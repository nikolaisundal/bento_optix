# Supabase Migrations

## How to Apply Migrations

To apply the migrations in this directory to your Supabase database:

### Option 1: Using Supabase Dashboard (Recommended for single migrations)

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of the migration file you want to run
4. Paste it into the SQL Editor
5. Click "Run" to execute the migration

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Initialize Supabase in your project (if not already done)
supabase init

# Link to your remote project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

## Available Migrations

### create_notes_table.sql

Creates the `notes` table for patient notes with the following features:

- **Table Structure:**
  - `id`: UUID primary key
  - `patient_id`: Foreign key to patients table
  - `note_text`: The note content (required)
  - `note_date`: Date of the note (required)
  - `created_at`: Timestamp of creation
  - `updated_at`: Timestamp of last update
  - `deleted_at`: Soft delete timestamp
  - `deleted_by`: User who deleted the note
  - `created_by`: User who created the note

- **Indexes:**
  - Index on `patient_id` for fast lookups by patient
  - Index on `deleted_at` for filtering deleted notes
  - Index on `note_date` for sorting by date

- **Row Level Security (RLS):**
  - Users can view all non-deleted notes
  - Users can only create notes for themselves
  - Users can only update their own notes
  - Users can only soft-delete their own notes

- **Triggers:**
  - Automatically updates `updated_at` timestamp on record updates

## After Running Migrations

After running the migrations, the notes CRUD functionality in the patients page will be fully operational:

- ✅ Create new notes for patients
- ✅ View all notes for a patient (sorted by date, newest first)
- ✅ Edit existing notes
- ✅ Delete notes (soft delete)
