-- Add status column to tasks table for Kanban board functionality
-- This column tracks which Kanban column (todo, doing, waiting, done) a task is in

ALTER TABLE tasks 
ADD COLUMN status TEXT CHECK (status IN ('todo', 'doing', 'waiting', 'done')) DEFAULT 'todo';

-- Update any existing tasks to have 'todo' status if they don't have one
UPDATE tasks SET status = 'todo' WHERE status IS NULL;

-- Make the status column not null after setting default values
ALTER TABLE tasks ALTER COLUMN status SET NOT NULL;

-- Add an index for better query performance on status
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Add a comment to document the column
COMMENT ON COLUMN tasks.status IS 'Kanban board status: todo, doing, waiting, or done'; 