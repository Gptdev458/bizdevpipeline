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

        // Try both column naming conventions - the database seems to use 'projectId' (camelCase)
        // but our code has been trying to use 'project_id' (snake_case)
        
        try {
            // First try with camelCase projectId (what the database actually has)
            console.log('Trying to fetch with projectId (camelCase)...');
            const filters = { projectId: projectId };
            
            // Only add parent filter if we need it and handle gracefully
            if (parentId !== null) {
                // Try both parent column naming conventions
                filters.parentTaskId = parentId; // camelCase first
            }
            
            const data = await supabaseService.fetch('tasks', filters);
            console.log(`Retrieved ${data.length} tasks with camelCase projectId`);
            
            if (data.length > 0) {
                return data;
            }
            
            // If no results with camelCase, try snake_case
            console.log('No results with camelCase, trying snake_case...');
            const snakeFilters = { project_id: projectId };
            if (parentId !== null) {
                snakeFilters.parent_task_id = parentId;
            }
            
            const snakeData = await supabaseService.fetch('tasks', snakeFilters);
            console.log(`Retrieved ${snakeData.length} tasks with snake_case project_id`);
            return snakeData;
            
        } catch (error) {
            console.error('Error in task fetching:', error);
            
            // Final fallback - try to get all tasks and filter in memory
            console.log('Trying fallback - fetch all tasks and filter...');
            try {
                const allTasks = await supabaseService.fetch('tasks', {});
                console.log('Fetched all tasks:', allTasks.length);
                
                // Filter by project ID (try both field names)
                const filtered = allTasks.filter(task => 
                    task.projectId === projectId || 
                    task.project_id === projectId ||
                    task.id === projectId
                );
                console.log(`Filtered to ${filtered.length} tasks for project ${projectId}`);
                return filtered;
                
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
                return [];
            }
        }
        
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

        // Create the basic task with only the fields that exist in the database
        // Based on the debug output, the database has: id, text, projectId, completed, createdAt
        // But NOT: description, status, position, parent_task_id
        
        const basicTask = { 
            projectId: projectId,  // Use camelCase projectId to match database
            text: dataForSupabase.text || dataForSupabase.title || 'Untitled',
            completed: dataForSupabase.completed || false
        };
        
        // Only add fields if they were explicitly provided and we know they exist
        // Don't add description since it doesn't exist in the schema
        
        console.log('Creating task with minimal data:', basicTask);
        
        try {
            // Try with basic fields only
            const newTask = await supabaseService.insert('tasks', basicTask);
            console.log('Task created successfully with basic fields:', newTask);
            
            // Return the task with the status field added for Kanban compatibility
            return { 
                ...newTask, 
                status: dataForSupabase.status || 'todo',
                description: dataForSupabase.description || '' // Add to memory only, not database
            };
            
        } catch (error) {
            console.error('Error creating basic task:', error);
            
            // If projectId doesn't work, try project_id
            if (error.message && error.message.includes('projectId')) {
                console.log('Retrying with snake_case project_id...');
                const snakeTask = {
                    project_id: projectId,
                    text: dataForSupabase.text || dataForSupabase.title || 'Untitled',
                    completed: dataForSupabase.completed || false
                };
                
                const retryTask = await supabaseService.insert('tasks', snakeTask);
                return { 
                    ...retryTask, 
                    status: dataForSupabase.status || 'todo',
                    description: dataForSupabase.description || ''
                };
            }
            
            throw error;
        }
        
    } catch (error) {
        console.error(`Error creating task for project ${projectId}:`, error);
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