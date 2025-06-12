// Projects related functionality

// Import the supabase service
import { supabaseService } from './supabase.js';

// Order settings for sorting
const priorityOrder = { high: 1, medium: 2, low: 3 };
const statusOrder = { potential: 1, active: 2, 'on-hold': 3, completed: 4, archived: 5 };

// Project CRUD operations
async function getProjects(filters = {}, sortBy = null) {
    try {
        console.log('Getting projects with filters:', filters, 'sort:', sortBy); // Debug log
        if (window.debugLog) window.debugLog(`Getting projects with filters: ${JSON.stringify(filters)}`);
        
        // Use the supabase service to fetch real data
        const data = await supabaseService.fetch('projects', filters, sortBy);
        console.log('Received project data from database:', data.length, 'projects', data); // Debug log
        if (window.debugLog) window.debugLog(`Raw project data received: ${data.length} projects`);
        
        // Ensure all projects have proper structure
        const processedData = data.map(project => {
            // Log raw project data for debugging
            if (window.debugLog) window.debugLog(`Processing raw project: ${JSON.stringify(project)}`);
            
            // Force camelCase for key fields
            const processed = {
                id: project.id || `proj_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                name: project.name || 'Untitled Project',
                description: project.description || '',
                rating: typeof project.rating === 'number' ? project.rating : 0,
                priority: project.priority || 'medium',
                status: project.status || 'potential',
                isIanCollaboration: Boolean(project.isIanCollaboration || project.is_ian_collaboration || false),
                detailedRatingsData: project.detailedRatingsData || project.detailed_ratings_data || {},
            };
            
            // Ensure we don't have both camelCase and snake_case versions of the same property
            // to avoid confusion in the rest of the application
            if (window.debugLog) window.debugLog(`Processed project: ${processed.name} (${processed.id}), isIanCollaboration: ${processed.isIanCollaboration}`);
            return processed;
        });
        
        if (window.debugLog) window.debugLog(`Processed ${processedData.length} projects`);
        
        // Always apply custom sorting for consistency
        if (processedData.length > 0) {
            if (window.debugLog) window.debugLog(`Sorting projects by ${sortBy}`);
            
            if (typeof sortBy === 'string') {
                return sortProjects(processedData, sortBy);
            } else if (typeof sortBy === 'object' && sortBy !== null) {
                // Convert object sortBy to string format for our sortProjects function
                const direction = sortBy.ascending ? 'asc' : 'desc';
                const sortByString = `${sortBy.column}_${direction}`;
                return sortProjects(processedData, sortByString);
            }
        }
        
        return processedData;
    } catch (error) {
        console.error('Error getting projects:', error);
        if (window.debugLog) window.debugLog(`ERROR getting projects: ${error.message}`);
        return [];
    }
}

async function getProjectById(id) {
    try {
        // Get project from the database
        const result = await supabaseService.fetch('projects', { id }, null);
        return result[0] || null;
    } catch (error) {
        console.error(`Error getting project with id ${id}:`, error);
        return null;
    }
}

async function createProject(projectData) {
    try {
        console.log('Creating new project:', projectData); // Debug log
        
        // Validate required fields
        if (!projectData.name) {
            throw new Error('Project name is required');
        }
        
        if (typeof projectData.rating !== 'number' || isNaN(projectData.rating) || projectData.rating < 0 || projectData.rating > 5) {
            throw new Error('Project rating must be a number between 0 and 5');
        }
        
        // Make sure we have valid values for optional fields
        const validatedProject = {
            name: projectData.name.trim(),
            description: projectData.description || '',
            rating: projectData.rating,
            priority: ['high', 'medium', 'low'].includes(projectData.priority) ? projectData.priority : 'medium',
            status: ['potential', 'active', 'on-hold', 'completed', 'archived'].includes(projectData.status) ? projectData.status : 'potential',
            isIanCollaboration: !!projectData.isIanCollaboration,
            detailedRatingsData: projectData.detailedRatingsData || {}
        };
        
        console.log('Validated project data:', validatedProject); // Debug log
        
        // Create project in the database
        const result = await supabaseService.insert('projects', validatedProject);
        
        if (!result) {
            throw new Error('No result returned from database after insert');
        }
        
        console.log('Project created successfully:', result); // Debug log
        
        if (window.debugLog) {
            window.debugLog(`Created project: ${result.name} (${result.id})`);
        }
        
        return result;
    } catch (error) {
        console.error('Error creating project:', error);
        // Log more detailed error information
        if (error.message) console.error('Error message:', error.message);
        if (error.code) console.error('Error code:', error.code);
        if (error.details) console.error('Error details:', error.details);
        
        // Show user-visible error
        if (typeof window.showStatus === 'function') {
            window.showStatus(`Failed to create project: ${error.message || 'Unknown error'}`, true);
        }
        
        throw error;
    }
}

async function updateProject(id, projectData) {
    try {
        // Update project in the database
        return await supabaseService.update('projects', id, projectData);
    } catch (error) {
        console.error(`Error updating project with id ${id}:`, error);
        throw error;
    }
}

async function deleteProject(id) {
    try {
        // Delete project from the database
        return await supabaseService.delete('projects', id);
    } catch (error) {
        console.error(`Error deleting project with id ${id}:`, error);
        throw error;
    }
}

// Sorting and filtering helpers
function sortProjects(projects, sortBy) {
    return [...projects].sort((a, b) => {
        switch (sortBy) {
            case 'rating_desc': return b.rating - a.rating;
            case 'rating_asc': return a.rating - b.rating;
            case 'priority': return (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99);
            case 'status': return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
            case 'name_asc': return a.name.localeCompare(b.name);
            case 'name_desc': return b.name.localeCompare(a.name);
            default: return 0;
        }
    });
}

// Rating calculations
function calculateOverallRating(detailedRatings) {
    if (!detailedRatings || typeof detailedRatings !== 'object' || Object.keys(detailedRatings).length === 0) return 0;

    let sum = 0;
    let count = 0;

    for (const key in detailedRatings) {
        // Ensure the value is a number and treat it as a rating
        const ratingValue = parseFloat(detailedRatings[key]);
        if (typeof ratingValue === 'number' && !isNaN(ratingValue)) {
            sum += ratingValue;
            count++;
        }
    }

    if (count === 0) return 0;
    return Number((sum / count).toFixed(2)); // Return average, rounded
}

// Export project service
export const projectService = {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    sortProjects,
    calculateOverallRating,
    
    // Validate project data structure
    validateProject: function(project) {
        if (!project) return { isValid: false, error: 'Project is null or undefined' };
        
        const requiredFields = ['id', 'name'];
        const missingFields = requiredFields.filter(field => !project[field]);
        
        if (missingFields.length > 0) {
            return {
                isValid: false,
                error: `Missing required fields: ${missingFields.join(', ')}`,
                project
            };
        }
        
        // Ensure all required fields have valid types/values
        const validations = [
            { field: 'rating', check: (val) => typeof val === 'number' && !isNaN(val), fix: () => 0 },
            { field: 'priority', check: (val) => typeof val === 'string', fix: () => 'medium' },
            { field: 'status', check: (val) => typeof val === 'string', fix: () => 'potential' },
            { field: 'description', check: (val) => val === null || typeof val === 'string', fix: () => '' },
            { 
                field: 'isIanCollaboration', 
                check: (val) => typeof val === 'boolean', 
                fix: (project) => {
                    // Handle both camelCase and snake_case versions
                    return Boolean(project.isIanCollaboration || project.is_ian_collaboration || false);
                }
            },
            { 
                field: 'detailedRatingsData', 
                check: (val) => val === null || typeof val === 'object', 
                fix: () => ({})
            }
        ];
        
        let fixed = false;
        let fixedProject = { ...project };
        
        for (const validation of validations) {
            if (!validation.check(project[validation.field])) {
                fixed = true;
                fixedProject[validation.field] = validation.fix(project);
            }
        }
        
        // Special handling for mixed case issues between isIanCollaboration and is_ian_collaboration
        if (project.is_ian_collaboration !== undefined && project.isIanCollaboration === undefined) {
            fixed = true;
            fixedProject.isIanCollaboration = Boolean(project.is_ian_collaboration);
        }
        
        // Special handling for mixed case issues between detailedRatingsData and detailed_ratings_data
        if (project.detailed_ratings_data !== undefined && project.detailedRatingsData === undefined) {
            fixed = true;
            fixedProject.detailedRatingsData = project.detailed_ratings_data || {};
        }
        
        return {
            isValid: true,
            wasFixed: fixed,
            project: fixed ? fixedProject : project
        };
    }
}; 