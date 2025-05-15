Supabase Database Schema (Markdown)
Table 1: projects
This table stores the main BizDev initiatives or opportunities.

Column Name	Data Type	Constraints & Notes	Description
id	uuid	PRIMARY KEY, DEFAULT uuid_generate_v4()	Unique identifier for the project.
created_at	timestamptz	DEFAULT now(), NOT NULL	Timestamp of when the project was created.
user_id	uuid	REFERENCES auth.users(id) (Optional, for ownership)	ID of the user who created/owns the project.
name	text	NOT NULL	Name of the project/opportunity.
description	text		Detailed description of the project.
rating	numeric		Overall calculated or manually set rating (e.g., 0.0 to 5.0).
priority	text	CHECK (priority IN ('high', 'medium', 'low'))	Priority level: 'high', 'medium', 'low'.
status	text	CHECK (status IN ('potential', 'active', 'on-hold', 'completed', 'archived'))	Current status of the project.
is_ian_collaboration	boolean	DEFAULT false, NOT NULL	True if this is a project specifically for Ian's collaboration.
detailed_ratings_data	jsonb		JSON object storing granular ratings (Revenue Potential, Weights, Runway etc.)

Table 2: tasks
This table stores tasks associated with projects. It also supports subtasks via a self-referencing foreign key.

Column Name	Data Type	Constraints & Notes	Description
id	uuid	PRIMARY KEY, DEFAULT uuid_generate_v4()	Unique identifier for the task.
created_at	timestamptz	DEFAULT now(), NOT NULL	Timestamp of when the task was created.
project_id	uuid	REFERENCES projects(id) ON DELETE CASCADE, NOT NULL	Foreign key linking to the projects table.
user_id	uuid	REFERENCES auth.users(id) (Optional, for task assignment)	ID of the user this task might be assigned to.
text	text	NOT NULL	The description of the task.
completed	boolean	DEFAULT false, NOT NULL	True if the task is completed.
parent_task_id	uuid	REFERENCES tasks(id) ON DELETE SET NULL (or CASCADE)	Foreign key for subtasks, referencing another task ID in this table.
order	integer		Optional field to define task order within a project/parent task.


Example for detailed_ratings_data (JSONB in projects table):

{
  "revenuePotential": { "value": 5, "weight": 0.3 },
  "insiderSupport": { "value": 4, "weight": 0.2 },
  "strategicFitEvolve": { "value": 5, "weight": 0.15 },
  "strategicFitVerticals": { "value": 4, "weight": 0.1 },
  "clarityClient": { "value": 3, "weight": 0.05 },
  "clarityUs": { "value": 4, "weight": 0.05 },
  "effortPotentialClient": { "value": 3, "weight": 0.05 },
  "effortExistingClient": { "value": null, "weight": 0.0 },
  "timingPotentialClient": { "value": 5, "weight": 0.1 },
  "runway": 12
}

Enums: For priority and status, you could also create custom PostgreSQL ENUM types for better data integrity if preferred over CHECK constraints.

user_id: This is good for future-proofing if you want to assign ownership or responsibility. If it's always a shared tool between JS & IK, you might initially omit it or have a default user. Supabase Auth would manage users.

ON DELETE CASCADE for tasks.project_id: Ensures that if a project is deleted, all its associated tasks are also deleted.

parent_task_id ON DELETE behavior: SET NULL means if a parent task is deleted, its subtasks become top-level tasks (or orphaned). CASCADE would delete subtasks if their parent is deleted. Choose based on desired behavior.

Indexes: Supabase automatically creates indexes on primary keys and foreign keys. Consider adding indexes on projects.user_id, projects.is_ian_collaboration, tasks.user_id, tasks.project_id, tasks.parent_task_id if these are frequently used in WHERE clauses for filtering/sorting.
