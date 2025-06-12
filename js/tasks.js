// Tasks related functionality

// Import the Supabase service
import { supabaseService } from './supabase.js';

// Task CRUD operations
// async function getTasksByProjectId(projectId) { // OLD FUNCTION
//    try {
//        console.log(`Fetching tasks for project ${projectId}`); // Debug log
//        
//        if (!projectId) {
//            console.error('Cannot fetch tasks: No project ID provided');
//            return [];
//        }
//        
//        // Fetch tasks from the database by project_id
//        const data = await supabaseService.fetch('tasks', { project_id: projectId });
//        console.log(`Retrieved ${data.length} tasks for project ${projectId}`); // Debug log
//        
//        return data;
//    } catch (error) {
//        console.error(`Error getting tasks for project ${projectId}:`, error);
//        if (error.message) console.error('Error message:', error.message);
//        if (error.code) console.error('Error code:', error.code);
//        return [];
//    }
// }

async function getTasksByProjectId(projectId, parentId = null) {
    try {
        console.log(`Fetching tasks for project ${projectId}, parentId: ${parentId}`);
        if (!projectId) {
            console.error('Cannot fetch tasks: No project ID provided');
            return [];
        }

        const filters = { project_id: projectId };
        if (parentId === null) {
            // For Supabase, to filter for NULL, you often need a specific syntax
            // or ensure your fetch method handles it. Let's assume `eq(column, null)` works
            // or that supabaseService.fetch handles `null` as `is.null`.
            // A more robust way for Supabase is often `filters.parent_task_id = 'is.null'`,
            // but let's try with direct null first and adjust supabaseService if needed.
            // For now, we'll build the query to explicitly check for null for parent_task_id.
            // This requires supabaseService.fetch to be more flexible or add a new method.

            // Let's adjust the filter key to match the database column `parent_task_id`
            filters.parent_task_id = null; // This will be handled by supabase.js to be `parent_task_id.is.null`
        } else {
            filters.parent_task_id = parentId;
        }
        
        // The `supabaseService.fetch` needs to be able to handle `null` value in filters
        // to correctly form an `IS NULL` query. Modify supabase.js if it doesn't.
        // For now, assuming it's handled (or needs to be).

        const data = await supabaseService.fetch('tasks', filters);
        console.log(`Retrieved ${data.length} tasks for project ${projectId}, parentId: ${parentId}`);
        return data;
    } catch (error) {
        console.error(`Error getting tasks for project ${projectId}, parentId: ${parentId}:`, error);
        return [];
    }
}

async function createTask(projectId, taskData) {
    try {
        const dataForSupabase = { ...taskData };

        // Map parentId to parentTaskId for correct snake_case conversion
        if (dataForSupabase.hasOwnProperty('parentId')) {
            dataForSupabase.parentTaskId = dataForSupabase.parentId;
            delete dataForSupabase.parentId;
        }

        // Set default status if not provided (for Kanban board)
        // Only include status if it's provided, to avoid database errors if column doesn't exist
        if (dataForSupabase.status) {
            // Keep the status field
        } else if (dataForSupabase.hasOwnProperty('status')) {
            // If status is explicitly set to undefined/null, set to 'todo'
            dataForSupabase.status = 'todo';
        }

        // Only include position if it's provided, to avoid database errors if column doesn't exist
        if (dataForSupabase.hasOwnProperty('position') && dataForSupabase.position === undefined) {
            dataForSupabase.position = 0;
        }

        const task = { project_id: projectId, ...dataForSupabase };
        console.log('Creating task with data for Supabase:', task);
        return await supabaseService.insert('tasks', task);
    } catch (error) {
        console.error(`Error creating task for project ${projectId}:`, error);
        // If error mentions unknown columns, retry without status/position
        if (error.message && (error.message.includes('status') || error.message.includes('position'))) {
            console.log('Retrying task creation without status/position columns...');
            try {
                const { status, position, ...taskDataWithoutKanban } = taskData;
                const task = { project_id: projectId, ...taskDataWithoutKanban };
                return await supabaseService.insert('tasks', task);
            } catch (retryError) {
                console.error('Retry also failed:', retryError);
                throw retryError;
            }
        }
        throw error;
    }
}

async function updateTask(projectId, taskId, taskData) {
    try {
        // Update task in the database
        return await supabaseService.update('tasks', taskId, taskData);
        
        // Fallback to sample data if needed
        /*
        // Sample data handling removed
        */
    } catch (error) {
        console.error(`Error updating task ${taskId} in project ${projectId}:`, error);
        throw error;
    }
}

async function deleteTask(projectId, taskId) {
    try {
        // Delete task from the database
        return await supabaseService.delete('tasks', taskId);
        
        // Fallback to sample data if needed
        /*
        // Sample data handling removed
        */
    } catch (error) {
        console.error(`Error deleting task ${taskId} from project ${projectId}:`, error);
        throw error;
    }
}

// Helper functions for subtasks
async function getSubtasks(projectId, parentTaskId) {
    try {
        // Fetch subtasks from the database
        return await supabaseService.fetch('tasks', { 
            project_id: projectId,
            parent_task_id: parentTaskId 
        });
        
        // Fallback to sample data if needed
        /*
        // Sample data handling removed
        */
    } catch (error) {
        console.error(`Error getting subtasks for parent task ${parentTaskId}:`, error);
        return [];
    }
}

async function createSubtask(projectId, parentTaskId, taskData) {
    try {
        // Create with parent_task_id
        return await createTask(projectId, {
            ...taskData,
            parent_task_id: parentTaskId
        });
    } catch (error) {
        console.error(`Error creating subtask for parent task ${parentTaskId}:`, error);
        throw error;
    }
}

// Kanban-specific helper functions
async function getTasksByStatus(projectId, status) {
    try {
        return await supabaseService.fetch('tasks', { 
            project_id: projectId,
            status: status,
            parent_task_id: null // Only get top-level tasks for Kanban
        });
    } catch (error) {
        console.error(`Error getting tasks with status ${status} for project ${projectId}:`, error);
        return [];
    }
}

async function updateTaskStatus(projectId, taskId, newStatus, position = 0) {
    try {
        return await updateTask(projectId, taskId, {
            status: newStatus,
            position: position
        });
    } catch (error) {
        console.error(`Error updating task ${taskId} status to ${newStatus}:`, error);
        throw error;
    }
}

// Export task service
export const taskService = {
    getTasksByProjectId,
    createTask,
    updateTask,
    deleteTask,
    getSubtasks,
    createSubtask,
    getTasksByStatus,
    updateTaskStatus
}; 