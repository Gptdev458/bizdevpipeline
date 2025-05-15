// Tasks related functionality

// Task CRUD operations
async function getTasksByProjectId(projectId) {
    try {
        // In production:
        // return await supabaseService.fetch('tasks', { project_id: projectId });
        
        // For now, find in sample data
        const project = sampleBizDevProjects.find(p => p.id === projectId);
        if (project) {
            console.log('Fetched tasks for project:', project.tasks);
            return project.tasks || [];
        }
        return [];
    } catch (error) {
        console.error(`Error getting tasks for project ${projectId}:`, error);
        return [];
    }
}

async function createTask(projectId, taskData) {
    try {
        // In production:
        // const task = { project_id: projectId, ...taskData };
        // return await supabaseService.insert('tasks', task);
        
        // For now, add to project in sample data
        const project = sampleBizDevProjects.find(p => p.id === projectId);
        if (project) {
            const newTask = {
                id: `task_${projectId}_${Date.now()}`,
                text: taskData.text,
                completed: taskData.completed || false,
                parent_task_id: taskData.parent_task_id || null
            };
            
            if (!project.tasks) {
                project.tasks = [];
            }
            
            project.tasks.push(newTask);
            console.log('Created task:', newTask);
            return newTask;
        }
        throw new Error(`Project with id ${projectId} not found`);
    } catch (error) {
        console.error(`Error creating task for project ${projectId}:`, error);
        throw error;
    }
}

async function updateTask(projectId, taskId, taskData) {
    try {
        // In production:
        // return await supabaseService.update('tasks', taskId, taskData);
        
        // For now, update in project's tasks
        const project = sampleBizDevProjects.find(p => p.id === projectId);
        if (project && project.tasks) {
            const taskIndex = project.tasks.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
                project.tasks[taskIndex] = {
                    ...project.tasks[taskIndex],
                    ...taskData
                };
                console.log('Updated task:', project.tasks[taskIndex]);
                return project.tasks[taskIndex];
            }
            throw new Error(`Task with id ${taskId} not found in project ${projectId}`);
        }
        throw new Error(`Project with id ${projectId} not found or has no tasks`);
    } catch (error) {
        console.error(`Error updating task ${taskId} in project ${projectId}:`, error);
        throw error;
    }
}

async function deleteTask(projectId, taskId) {
    try {
        // In production:
        // return await supabaseService.delete('tasks', taskId);
        
        // For now, remove from project's tasks
        const project = sampleBizDevProjects.find(p => p.id === projectId);
        if (project && project.tasks) {
            const taskIndex = project.tasks.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
                project.tasks.splice(taskIndex, 1);
                console.log(`Deleted task ${taskId} from project ${projectId}`);
                return true;
            }
            throw new Error(`Task with id ${taskId} not found in project ${projectId}`);
        }
        throw new Error(`Project with id ${projectId} not found or has no tasks`);
    } catch (error) {
        console.error(`Error deleting task ${taskId} from project ${projectId}:`, error);
        throw error;
    }
}

// Helper functions for subtasks
async function getSubtasks(projectId, parentTaskId) {
    try {
        // In production:
        // return await supabaseService.fetch('tasks', { 
        //     project_id: projectId,
        //     parent_task_id: parentTaskId 
        // });
        
        // For now, filter from project's tasks
        const project = sampleBizDevProjects.find(p => p.id === projectId);
        if (project && project.tasks) {
            const subtasks = project.tasks.filter(t => t.parent_task_id === parentTaskId);
            console.log(`Fetched subtasks for parent task ${parentTaskId}:`, subtasks);
            return subtasks;
        }
        return [];
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
const taskService = {
    getTasksByProjectId,
    createTask,
    updateTask,
    deleteTask,
    getSubtasks,
    createSubtask
}; 