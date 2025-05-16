# BizDev & Collaboration Hub

A web application for managing business development projects and tasks, with a particular focus on collaboration between team members.

## Features

- Track and manage business development projects
- Filter and sort projects based on various criteria
- View and manage detailed rating metrics for business decisions
- Manage tasks and subtasks for each project
- Special views for collaboration projects

## Implementation Status

✅ **Completed:**
- Project structure and setup
- Supabase backend integration
- HTML/CSS structure from mockup
- JavaScript modules with ES modules structure
- CRUD operations for projects and tasks
- UI implementation with tab navigation
- Event handling and form submission
- Real-time data operations with Supabase
- Field name conversion between camelCase (UI) and snake_case (DB)
- Improved task loading
- Enhanced error handling
- Added loading indicators
- Fixed "Add Project" button functionality

⚠️ **In Progress:**
- Testing all functionality
- Bug fixing
- Optimizing performance

🔮 **Future Enhancements:**
- Authentication and user permissions
- Rich text editing for descriptions
- File attachments for projects/tasks
- Calendar integration
- Data export/import capabilities

## Recent Fixes

We've addressed several issues in the latest update:

1. **Fixed field name mismatches**: Added conversion utilities to handle the difference between camelCase (used in JavaScript) and snake_case (used in the database)
   - `isIanCollaboration` ↔ `is_ian_collaboration`
   - `detailedRatings` ↔ `detailed_ratings_data`

2. **Improved task loading**: Tasks are now properly loaded for each project
   - Added a check to ensure each project has a tasks array
   - Tasks are fetched when needed
   - Added loading indicators while tasks are being fetched

3. **Enhanced error handling**:
   - Added clear error messages
   - Implemented retry logic for initialization
   - Added global error handling
   - Improved console logging for debugging

4. **Added user feedback**:
   - Status notifications for key operations
   - Loading indicators
   - Improved error messages

## Technologies Used

- HTML, CSS, JavaScript (vanilla)
- Supabase for backend storage and data operations
- ES Modules for code organization

## Getting Started

1. Clone this repository
2. Ensure you have access to a Supabase project
3. Start a local server: `npx serve`
4. Open the local server URL in your browser (usually http://localhost:3000)

## Project Structure

- `/css` - Stylesheet files
- `/js` - JavaScript modules
  - `app.js` - Main application entry point
  - `supabase.js` - Supabase client configuration and DB operations
  - `projects.js` - Project management functionality
  - `tasks.js` - Task management functionality
  - `ui.js` - UI rendering and event handling
- `/lib` - External libraries
- `/public` - Public assets (images, etc.)

## Database Schema

The application uses a Supabase database with the following tables:

### Projects Table
- `id` - UUID, primary key
- `created_at` - Timestamp
- `user_id` - UUID, owner (optional)
- `name` - Text
- `description` - Text
- `rating` - Numeric
- `priority` - Text (high, medium, low)
- `status` - Text (potential, active, on-hold, completed, archived)
- `is_ian_collaboration` - Boolean
- `detailed_ratings_data` - JSONB

### Tasks Table
- `id` - UUID, primary key
- `created_at` - Timestamp
- `project_id` - UUID, foreign key to projects.id
- `user_id` - UUID, user assigned (optional)
- `text` - Text
- `completed` - Boolean
- `parent_task_id` - UUID, self-reference for subtasks
- `order` - Integer, for task ordering

## Next Steps

1. Test the application thoroughly with the Supabase backend
2. Fix any bugs found during testing
3. Optimize performance for larger data sets
4. Implement user authentication if needed
5. Prepare for deployment 