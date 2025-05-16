// Tasks related functionality

// Import the Supabase service
import { supabaseService } from './supabase.js';

// Task CRUD operations
async function getTasksByProjectId(projectId) {
    try {
        console.log(`Fetching tasks for project ${projectId}`); // Debug log
        
        if (!projectId) {
            console.error('Cannot fetch tasks: No project ID provided');
            return [];
        }
        
        // Fetch tasks from the database by project_id
        const data = await supabaseService.fetch('tasks', { project_id: projectId });
        console.log(`Retrieved ${data.length} tasks for project ${projectId}`); // Debug log
        
        return data;
    } catch (error) {
        console.error(`Error getting tasks for project ${projectId}:`, error);
        if (error.message) console.error('Error message:', error.message);
        if (error.code) console.error('Error code:', error.code);
        return [];
    }
}

async function createTask(projectId, taskData) {
    try {
        // Create task in the database
        const task = { project_id: projectId, ...taskData };
        return await supabaseService.insert('tasks', task);
        
        // Fallback to sample data if needed
        /*
        // Sample data handling removed
        */
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

// Export task service
export const taskService = {
    getTasksByProjectId,
    createTask,
    updateTask,
    deleteTask,
    getSubtasks,
    createSubtask
}; 