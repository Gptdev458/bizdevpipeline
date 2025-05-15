-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id UUID,  -- Optional, for ownership
    name TEXT NOT NULL,
    description TEXT,
    rating NUMERIC,
    priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
    status TEXT CHECK (status IN ('potential', 'active', 'on-hold', 'completed', 'archived')),
    is_ian_collaboration BOOLEAN NOT NULL DEFAULT false,
    detailed_ratings_data JSONB
);

-- Tasks table with support for subtasks
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID,  -- Optional, for task assignment
    text TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false,
    parent_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    "order" INTEGER  -- Optional field to define task order
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_is_ian_collaboration ON projects(is_ian_collaboration);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);

-- Row Level Security (Uncomment and modify when implementing authentication)
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies (Uncomment and modify when implementing authentication)
-- CREATE POLICY "Enable read access for all users" ON projects FOR SELECT USING (true);
-- CREATE POLICY "Enable insert for authenticated users only" ON projects FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
-- CREATE POLICY "Enable update for project owners" ON projects FOR UPDATE USING (auth.uid() = user_id);
-- CREATE POLICY "Enable delete for project owners" ON projects FOR DELETE USING (auth.uid() = user_id);

-- Task policies (Uncomment and modify when implementing authentication)
-- CREATE POLICY "Enable read access for all users" ON tasks FOR SELECT USING (true);
-- CREATE POLICY "Enable insert for authenticated users only" ON tasks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
-- CREATE POLICY "Enable update for task owners or project owners" ON tasks FOR UPDATE USING (
--    auth.uid() = user_id OR 
--    auth.uid() IN (SELECT user_id FROM projects WHERE id = tasks.project_id)
-- );
-- CREATE POLICY "Enable delete for task owners or project owners" ON tasks FOR DELETE USING (
--    auth.uid() = user_id OR 
--    auth.uid() IN (SELECT user_id FROM projects WHERE id = tasks.project_id)
-- ); 