# BizDev & Collaboration Hub

A lightweight, web-based tool designed to provide a clear, scannable, and actionable overview of all active and potential Business Development initiatives. This tool addresses the shortcomings of a Notion-based workflow by separating strategic items from tactical tasks.

## Features

- **Dual View System**: Separate tabs for "BizDev Overview" and "Ian Collaboration Focus"
- **Project Management**: Create, view, and manage BizDev projects with details like name, description, rating, priority, and status
- **Task Management**: Add tasks to projects, mark them as complete, and support for subtasks
- **Detailed Ratings**: View granular component ratings that contribute to the overall project rating
- **Filtering & Sorting**: Toggle to show/hide different project types, sort by various criteria

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla JS)
- **Backend**: Supabase (PostgreSQL, Real-time updates)

## Project Structure

- `index.html`: Main HTML file
- `css/`: Stylesheets
  - `styles.css`: Main stylesheet
- `js/`: JavaScript files
  - `app.js`: Main application entry point
  - `supabase.js`: Supabase client configuration and database operations
  - `projects.js`: Project-related functionality
  - `tasks.js`: Task-related functionality
  - `ui.js`: UI rendering and event handling
- `public/`: Static assets (not used in current version)
- `lib/`: Library code (not used in current version)

## Setup Instructions

### Local Development

1. Clone the repository
2. Open `index.html` in a web browser

### Production Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Create the database tables according to the schema in `dbschema.md`
3. Uncomment the Supabase CDN script in `index.html`
4. Update the Supabase URL and anon key in `js/supabase.js`
5. Uncomment the Supabase client initialization code in `js/supabase.js`
6. Deploy to a static hosting provider like Netlify, Vercel, or GitHub Pages

## Database Schema

The application uses a PostgreSQL database with the following tables:

### projects

- `id`: UUID (Primary key)
- `created_at`: Timestamp
- `user_id`: UUID (Optional, for ownership)
- `name`: Text
- `description`: Text
- `rating`: Numeric
- `priority`: Text ('high', 'medium', 'low')
- `status`: Text ('potential', 'active', 'on-hold', 'completed', 'archived')
- `is_ian_collaboration`: Boolean
- `detailed_ratings_data`: JSONB

### tasks

- `id`: UUID (Primary key)
- `created_at`: Timestamp
- `project_id`: UUID (Foreign key to projects)
- `user_id`: UUID (Optional, for task assignment)
- `text`: Text
- `completed`: Boolean
- `parent_task_id`: UUID (Self-reference for subtasks)
- `order`: Integer (Optional, for task ordering)

## Future Enhancements

- User authentication and permissions
- Rich text editing for descriptions
- File attachments for projects/tasks
- Calendar integration
- Data export/import capabilities 