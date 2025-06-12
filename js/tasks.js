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

        // Start with basic project filter
        const filters = { project_id: projectId };
        
        // Try to add parent_task_id filter, but handle gracefully if column doesn't exist
        try {
            if (parentId === null) {
                // For top-level tasks (Kanban board), try to filter for null parent_task_id
                // If this column doesn't exist, we'll catch the error and fetch all tasks instead
                filters.parent_task_id = null;
            } else {
                filters.parent_task_id = parentId;
            }
            
            const data = await supabaseService.fetch('tasks', filters);
            console.log(`Retrieved ${data.length} tasks for project ${projectId}, parentId: ${parentId}`);
            return data;
            
        } catch (parentFilterError) {
            console.log('parent_task_id column might not exist, trying without parent filter:', parentFilterError);
            
            // If parent_task_id column doesn't exist, just fetch all tasks for the project
            if (parentFilterError.message && parentFilterError.message.includes('parent_task_id')) {
                console.log('Fetching all tasks for project (no parent_task_id column)');
                const data = await supabaseService.fetch('tasks', { project_id: projectId });
                console.log(`Retrieved ${data.length} tasks for project ${projectId} (no parent filtering)`);
                return data;
            } else {
                throw parentFilterError; // Re-throw if it's a different error
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

        // Create the basic task first without Kanban-specific fields
        const basicTask = { 
            project_id: projectId, 
            text: dataForSupabase.text || dataForSupabase.title || 'Untitled',
            description: dataForSupabase.description || '',
            completed: dataForSupabase.completed || false
        };
        
        // Only add parentTaskId if it was provided
        if (dataForSupabase.parentTaskId) {
            basicTask.parent_task_id = dataForSupabase.parentTaskId;
        }

        console.log('Creating task with basic data:', basicTask);
        
        try {
            // First try with basic fields only
            const newTask = await supabaseService.insert('tasks', basicTask);
            console.log('Task created successfully with basic fields:', newTask);
            
            // If successful and we have Kanban fields to add, try updating with them
            if (dataForSupabase.status || dataForSupabase.position !== undefined) {
                console.log('Attempting to add Kanban fields...');
                try {
                    const kanbanUpdate = {};
                    if (dataForSupabase.status) kanbanUpdate.status = dataForSupabase.status;
                    if (dataForSupabase.position !== undefined) kanbanUpdate.position = dataForSupabase.position;
                    
                    await supabaseService.update('tasks', newTask.id, kanbanUpdate);
                    console.log('Kanban fields added successfully');
                    
                    // Return updated task with Kanban fields
                    return { ...newTask, ...kanbanUpdate };
                } catch (kanbanError) {
                    console.log('Kanban fields failed to add (columns might not exist), but task created:', kanbanError);
                    // Return the basic task even if Kanban fields failed
                    return { ...newTask, status: dataForSupabase.status || 'todo' };
                }
            }
            
            return { ...newTask, status: dataForSupabase.status || 'todo' };
            
        } catch (error) {
            console.error('Error creating basic task:', error);
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