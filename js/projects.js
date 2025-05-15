// Projects related functionality

// Sample data for development (will be removed when connected to Supabase)
let sampleBizDevProjects = [
    {
        id: 'proj1',
        name: 'Client Alpha Acquisition',
        rating: 4.8,
        priority: 'high',
        status: 'active',
        description: 'Pursuing a large contract with Client Alpha. Focus on building relationship and understanding their needs.',
        isIanCollaboration: false,
        tasks: [
            { id: 't1_1', text: 'Initial contact & intro call', completed: true },
            { id: 't1_2', text: 'Prepare detailed proposal', completed: false },
        ],
        detailedRatings: {
            revenuePotential: { value: 5, weight: 0.3 }, 
            insiderSupport: { value: 4, weight: 0.2 },
            strategicFitEvolve: { value: 5, weight: 0.15 }, 
            strategicFitVerticals: { value: 4, weight: 0.1 },
            clarityClient: { value: 3, weight: 0.05 }, 
            clarityUs: { value: 4, weight: 0.05 },
            effortPotentialClient: { value: 3, weight: 0.05 }, 
            effortExistingClient: { value: null, weight: 0 }, // N/A
            timingPotentialClient: { value: 5, weight: 0.1 }, 
            runway: 12 // months
        }
    },
    {
        id: 'proj2',
        name: 'New Market Research - Europe',
        rating: 4.2,
        priority: 'medium',
        status: 'potential',
        description: 'Exploring potential for expansion into the European market. Identify key countries and competitors.',
        isIanCollaboration: false,
        tasks: [ 
            { id: 't2_1', text: 'Identify top 3 target countries', completed: false } 
        ],
        detailedRatings: { 
            revenuePotential: { value: 4, weight: 0.3 },
            insiderSupport: { value: 3, weight: 0.2 },
            strategicFitEvolve: { value: 5, weight: 0.15 },
            strategicFitVerticals: { value: 4, weight: 0.1 },
            runway: 6
        }
    },
    {
        id: 'ian_proj1',
        name: 'CTO Club Engagement Support',
        rating: 4.5,
        priority: 'high',
        status: 'active',
        description: 'IK to support JS in CTO Club activities. Increase visibility and networking.',
        isIanCollaboration: true,
        tasks: [
            { id: 'it1_1', text: 'Research upcoming CTO Club events', completed: true },
            { id: 'it1_2', text: 'Draft talking points for JS for next event', completed: false },
        ],
        detailedRatings: { 
            revenuePotential: { value: 3, weight: 0.1 }, 
            insiderSupport: { value: 5, weight: 0.3 },
            strategicFitEvolve: { value: 4, weight: 0.2 },
            runway: 6 
        }
    },
    {
        id: 'ian_proj2',
        name: 'TechSummit 2024 Logistics',
        rating: 4.9,
        priority: 'high',
        status: 'potential',
        description: 'Plan and execute presence at TechSummit 2024. IK to manage logistics and pre-event marketing.',
        isIanCollaboration: true,
        tasks: [],
        detailedRatings: { 
            revenuePotential: { value: 5, weight: 0.3 },
            insiderSupport: { value: 4, weight: 0.2 },
            strategicFitEvolve: { value: 5, weight: 0.15 },
            runway: 9
        }
    }
];

// Order settings for sorting
const priorityOrder = { high: 1, medium: 2, low: 3 };
const statusOrder = { potential: 1, active: 2, 'on-hold': 3, completed: 4, archived: 5 };

// Project CRUD operations
async function getProjects(filters = {}, sortBy = null) {
    try {
        // In production, this would use the supabaseService.fetch:
        // return await supabaseService.fetch('projects', filters, sortBy);
        
        // For now, return filtered and sorted sample data
        let projects = [...sampleBizDevProjects];
        
        // Apply filters
        if (filters.isIanCollaboration !== undefined) {
            projects = projects.filter(p => p.isIanCollaboration === filters.isIanCollaboration);
        }
        
        // Apply sorting
        if (sortBy) {
            projects = sortProjects(projects, sortBy);
        }
        
        console.log('Fetched projects:', projects);
        return projects;
    } catch (error) {
        console.error('Error getting projects:', error);
        return [];
    }
}

async function getProjectById(id) {
    try {
        // In production:
        // return await supabaseService.fetch('projects', { id }, null)[0];
        
        // For now, find in sample data
        const project = sampleBizDevProjects.find(p => p.id === id);
        console.log('Fetched project by ID:', project);
        return project || null;
    } catch (error) {
        console.error(`Error getting project with id ${id}:`, error);
        return null;
    }
}

async function createProject(projectData) {
    try {
        // In production:
        // return await supabaseService.insert('projects', projectData);
        
        // For now, add to sample data
        const newProject = {
            id: `proj_${Date.now()}`,
            ...projectData,
            tasks: projectData.tasks || []
        };
        sampleBizDevProjects.push(newProject);
        console.log('Created project:', newProject);
        return newProject;
    } catch (error) {
        console.error('Error creating project:', error);
        throw error;
    }
}

async function updateProject(id, projectData) {
    try {
        // In production:
        // return await supabaseService.update('projects', id, projectData);
        
        // For now, update in sample data
        const index = sampleBizDevProjects.findIndex(p => p.id === id);
        if (index !== -1) {
            // Keep tasks if not provided in update
            const tasks = projectData.tasks || sampleBizDevProjects[index].tasks;
            
            // Update project
            sampleBizDevProjects[index] = {
                ...sampleBizDevProjects[index],
                ...projectData,
                tasks
            };
            console.log('Updated project:', sampleBizDevProjects[index]);
            return sampleBizDevProjects[index];
        }
        throw new Error(`Project with id ${id} not found`);
    } catch (error) {
        console.error(`Error updating project with id ${id}:`, error);
        throw error;
    }
}

async function deleteProject(id) {
    try {
        // In production:
        // return await supabaseService.delete('projects', id);
        
        // For now, remove from sample data
        const index = sampleBizDevProjects.findIndex(p => p.id === id);
        if (index !== -1) {
            sampleBizDevProjects.splice(index, 1);
            console.log(`Deleted project with id ${id}`);
            return true;
        }
        throw new Error(`Project with id ${id} not found`);
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
    if (!detailedRatings) return 0;
    
    let totalWeight = 0;
    let weightedSum = 0;
    
    for (const key in detailedRatings) {
        const item = detailedRatings[key];
        if (item && typeof item.value === 'number' && typeof item.weight === 'number') {
            totalWeight += item.weight;
            weightedSum += item.value * item.weight;
        }
    }
    
    if (totalWeight === 0) return 0;
    return Number((weightedSum / totalWeight).toFixed(1));
}

// Export project service
const projectService = {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    sortProjects,
    calculateOverallRating
}; 