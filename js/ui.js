// UI related functionality

// Import services
import { projectService } from './projects.js';
import { taskService } from './tasks.js';

// Create UI service object with methods directly attached
const uiService = {
    renderProjectList: null, // Will be defined below
    setupEventListeners: null, // Will be defined below
    debugDomIssues: null, // Will be defined below
};

// Modal Functions to be exported directly
function openModal(modalId) { 
    document.getElementById(modalId).style.display = "block"; 
}

function closeModal(modalId) { 
    document.getElementById(modalId).style.display = "none"; 
}

// Helper Functions
function getPriorityClass(priority) { 
    return `priority-${priority.toLowerCase()}`; 
}

function getStatusClass(status) { 
    return `status-${status.toLowerCase().replace(' ', '-')}`; 
}

// Debug utility function to diagnose DOM node issues
function debugDomIssues(container, projectId) {
    try {
        // Check if the container exists and is connected to the DOM
        if (!container) {
            return { success: false, error: 'Container is null or undefined' };
        }
        
        if (!container.isConnected) {
            return { success: false, error: 'Container is not connected to DOM' };
        }
        
        // Check for any project cards in the container
        const projectCards = container.querySelectorAll('.project-card');
        
        // Look for the specific project card if an ID was provided
        if (projectId) {
            const projectCard = container.querySelector(`[data-project-id="${projectId}"]`);
            if (!projectCard) {
                return { success: false, error: `Project card for ID ${projectId} not found` };
            }
            
            // Check if the project card has all expected children
            const hasProjectRow = !!projectCard.querySelector('.project-row');
            const hasDetailsWrapper = !!projectCard.querySelector('.project-details-wrapper');
            
            if (!hasProjectRow || !hasDetailsWrapper) {
                return { 
                    success: false, 
                    error: `Project card for ID ${projectId} is missing required elements`,
                    details: { hasProjectRow, hasDetailsWrapper }
                };
            }
        }
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Rendering Functions
function renderTasks(tasks, taskListEl, projectId) {
    console.log(`[renderTasks] Called for projectId: ${projectId}. taskListEl connected: ${taskListEl?.isConnected}. Tasks received:`, tasks);
    try {
        // First clear the list, including any loading indicators
        if (taskListEl && taskListEl.isConnected) {
            taskListEl.innerHTML = ''; 
        } else {
            console.error('[renderTasks] taskListEl is null or not connected before clearing.');
            return; // Cannot proceed
        }
        
        // Handle empty tasks case
        if (!tasks || tasks.length === 0) {
            console.log('[renderTasks] No tasks or empty tasks array.');
            taskListEl.innerHTML = '<li><em>No tasks yet.</em></li>';
            return;
        }
        
        console.log(`[renderTasks] Rendering ${tasks.length} tasks.`);
        
        // Create all task items
        tasks.forEach(task => {
            try {
                const taskItem = document.createElement('li');
                taskItem.className = task.completed ? 'completed' : '';
                taskItem.dataset.taskId = task.id;

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = task.completed;
                checkbox.id = `task-${task.id}`;
                checkbox.addEventListener('change', async (e) => {
                    try {
                        await taskService.updateTask(projectId, task.id, { completed: e.target.checked });
                        taskItem.classList.toggle('completed', e.target.checked);
                    } catch (error) {
                        console.error('Error updating task completion:', error);
                        // Revert UI change in case of error
                        e.target.checked = !e.target.checked;
                        alert('Failed to update task. Please try again.');
                    }
                });

                const label = document.createElement('label');
                label.setAttribute('for', `task-${task.id}`);
                label.textContent = task.text || 'Unnamed Task';

                // Add elements to the DOM
                taskItem.appendChild(checkbox);
                taskItem.appendChild(label);
                if (taskListEl.isConnected) {
                    taskListEl.appendChild(taskItem);
                } else {
                    console.error('Cannot append task item - taskListEl is not connected to DOM');
                }
            } catch (taskError) {
                console.error('Error rendering task:', taskError);
                // Skip this task but continue with others
            }
        });
    } catch (error) {
        console.error('Error in renderTasks:', error);
        // Provide a fallback if rendering completely fails
        try {
            taskListEl.innerHTML = '<li><em>Error loading tasks.</em></li>';
        } catch (fallbackError) {
            console.error('Could not even render fallback message:', fallbackError);
        }
    }
}

function renderDetailedRatings(project, container) {
    try {
        container.innerHTML = ''; // Clear previous
        
        if (!project.detailedRatingsData || Object.keys(project.detailedRatingsData).length === 0) {
            container.innerHTML = '<em>No detailed ratings available.</em>';
            return;
        }
        
        const grid = document.createElement('div');
        grid.className = 'detailed-ratings-grid';

        const ratingsMap = {
            revenuePotential: "Revenue Potential", 
            insiderSupport: "Insider Support",
            strategicFitEvolve: "Strategic Fit (Evolve)", 
            strategicFitVerticals: "Strategic Fit (Verticals)",
            clarityClient: "Clarity (Client)", 
            clarityUs: "Clarity (Us)",
            effortPotentialClient: "Effort (Potential Client)", 
            effortExistingClient: "Effort (Existing Client)",
            timingPotentialClient: "Timing (Potential Client)"
        };

        for (const key in project.detailedRatingsData) {
            const item = project.detailedRatingsData[key];
            const div = document.createElement('div');
            
            if (key === 'runway') {
                div.innerHTML = `<strong>Runway:</strong> <span>${item || 'N/A'} months</span>`;
            } else if (item && typeof item.value !== 'undefined' && typeof item.weight !== 'undefined') {
                div.innerHTML = `<strong>${ratingsMap[key] || key}:</strong> <span>${item.value === null ? 'N/A' : item.value}/5</span> (Weight: <span>${item.weight * 100}%</span>)`;
            }
            
            grid.appendChild(div);
        }
        
        container.appendChild(grid);
    } catch (error) {
        console.error('Error rendering detailed ratings:', error);
        try {
            container.innerHTML = '<em>Error loading detailed ratings.</em>';
        } catch (fallbackError) {
            console.error('Could not render fallback detailed ratings:', fallbackError);
        }
    }
}

// Enhanced createProjectCard function - extracted from renderProject
function createProjectCard(project) {
    try {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        projectCard.dataset.projectId = project.id;

        const projectRow = document.createElement('div');
        projectRow.className = 'project-row';

        // Name Cell
        const nameCell = document.createElement('div');
        nameCell.className = 'project-name-cell';
        nameCell.innerHTML = `
            <span class="ian-collab-indicator">${project.isIanCollaboration ? '🤝' : ''}</span>
            <span class="project-name">${project.name}</span>
        `;
        projectRow.appendChild(nameCell);

        // Rating Cell (remains the same)
        const ratingCell = document.createElement('div');
        ratingCell.className = 'project-rating';
        ratingCell.textContent = project.rating !== null && typeof project.rating !== 'undefined' ? project.rating.toFixed(2) : 'N/A';
        projectRow.appendChild(ratingCell);

        // Priority Cell (now a custom dropdown)
        const priorityCell = document.createElement('div');
        priorityCell.className = 'project-priority-cell custom-select-container'; // Added common class

        const prioritySelectedDisplay = document.createElement('div');
        prioritySelectedDisplay.className = 'custom-select-selected priority-selected-display';
        prioritySelectedDisplay.tabIndex = 0; // Make it focusable

        const priorityOptionsContainer = document.createElement('div');
        priorityOptionsContainer.className = 'custom-select-options priority-options-container'; // Hidden by default via CSS

        const priorities = [
            { value: 'high', text: 'High', colorClass: 'option-priority-high' },
            { value: 'medium', text: 'Medium', colorClass: 'option-priority-medium' },
            { value: 'low', text: 'Low', colorClass: 'option-priority-low' }
        ];

        const updatePriorityDisplay = (priorityValue) => {
            const selectedPriority = priorities.find(p => p.value === priorityValue);
            prioritySelectedDisplay.textContent = selectedPriority ? selectedPriority.text : 'Select Priority';
            // Clear previous background classes and apply new one
            prioritySelectedDisplay.classList.remove('bg-priority-low', 'bg-priority-medium', 'bg-priority-high');
            if (priorityValue) {
                prioritySelectedDisplay.classList.add(`bg-priority-${priorityValue.toLowerCase()}`);
            }
        };

        priorities.forEach(p => {
            const optionDiv = document.createElement('div');
            optionDiv.className = `custom-select-option ${p.colorClass}`;
            optionDiv.dataset.value = p.value;
            optionDiv.textContent = p.text;
            optionDiv.addEventListener('click', async () => {
                updatePriorityDisplay(p.value);
                priorityOptionsContainer.style.display = 'none';
                // Call existing handleInlineEdit, projectCard is in the outer scope of createProjectCard
                await handleInlineEdit(project.id, 'priority', p.value, projectCard);
            });
            priorityOptionsContainer.appendChild(optionDiv);
        });

        updatePriorityDisplay(project.priority); // Set initial display

        prioritySelectedDisplay.addEventListener('click', () => {
            const isHidden = priorityOptionsContainer.style.display === 'none' || !priorityOptionsContainer.style.display;
            priorityOptionsContainer.style.display = isHidden ? 'block' : 'none';
        });
        
        // Basic keyboard accessibility for opening
        prioritySelectedDisplay.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const isHidden = priorityOptionsContainer.style.display === 'none' || !priorityOptionsContainer.style.display;
                priorityOptionsContainer.style.display = isHidden ? 'block' : 'none';
            }
        });

        priorityCell.appendChild(prioritySelectedDisplay);
        priorityCell.appendChild(priorityOptionsContainer);
        projectRow.appendChild(priorityCell);

        // Status Cell (now a custom dropdown)
        const statusCell = document.createElement('div');
        statusCell.className = 'project-status-cell custom-select-container'; // Added common class

        const statusSelectedDisplay = document.createElement('div');
        statusSelectedDisplay.className = 'custom-select-selected status-selected-display';
        statusSelectedDisplay.tabIndex = 0; // Make it focusable

        const statusOptionsContainer = document.createElement('div');
        statusOptionsContainer.className = 'custom-select-options status-options-container'; // Hidden by default via CSS

        const statuses = [
            { value: 'potential', text: 'Potential', colorClass: 'option-status-potential' },
            { value: 'active', text: 'Active', colorClass: 'option-status-active' },
            { value: 'on-hold', text: 'On Hold', colorClass: 'option-status-on-hold' },
            { value: 'completed', text: 'Completed', colorClass: 'option-status-completed' },
            { value: 'archived', text: 'Archived', colorClass: 'option-status-archived' }
        ];

        const updateStatusDisplay = (statusValue) => {
            const selectedStatus = statuses.find(s => s.value === statusValue);
            statusSelectedDisplay.textContent = selectedStatus ? selectedStatus.text : 'Select Status';
            // Clear previous background classes and apply new one
            statuses.forEach(s => statusSelectedDisplay.classList.remove(`bg-status-${s.value.toLowerCase().replace(' ', '-')}`));
            if (statusValue) {
                statusSelectedDisplay.classList.add(`bg-status-${statusValue.toLowerCase().replace(' ', '-')}`);
            }
        };

        statuses.forEach(s => {
            const optionDiv = document.createElement('div');
            optionDiv.className = `custom-select-option ${s.colorClass}`;
            optionDiv.dataset.value = s.value;
            optionDiv.textContent = s.text;
            optionDiv.addEventListener('click', async () => {
                updateStatusDisplay(s.value);
                statusOptionsContainer.style.display = 'none';
                await handleInlineEdit(project.id, 'status', s.value, projectCard);
            });
            statusOptionsContainer.appendChild(optionDiv);
        });

        updateStatusDisplay(project.status); // Set initial display

        statusSelectedDisplay.addEventListener('click', () => {
            const isHidden = statusOptionsContainer.style.display === 'none' || !statusOptionsContainer.style.display;
            statusOptionsContainer.style.display = isHidden ? 'block' : 'none';
        });
        
        statusSelectedDisplay.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const isHidden = statusOptionsContainer.style.display === 'none' || !statusOptionsContainer.style.display;
                statusOptionsContainer.style.display = isHidden ? 'block' : 'none';
            }
        });

        statusCell.appendChild(statusSelectedDisplay);
        statusCell.appendChild(statusOptionsContainer);
        projectRow.appendChild(statusCell);
        
        projectCard.appendChild(projectRow);

        // Event listener for expansion - Moved to projectRow for better click target
        projectRow.addEventListener('click', (event) => {
            // Prevent toggling if the click was on an interactive element like a select
            if (event.target.tagName === 'SELECT' || event.target.tagName === 'INPUT' || event.target.tagName === 'A' || event.target.closest('.inline-edit-select')) {
                return;
            }

            projectCard.classList.toggle('expanded');
            const detailsWrapper = projectCard.querySelector('.project-details-wrapper');
            if (detailsWrapper) {
                if (projectCard.classList.contains('expanded')) {
                    detailsWrapper.style.display = 'block'; // Or 'grid', 'flex' as appropriate
                } else {
                    detailsWrapper.style.display = 'none';
                }
            }
        });

        return projectCard;
    } catch (error) {
        console.error('Error creating project card:', error);
        return null;
    }
}

// Helper function for inline editing
async function handleInlineEdit(projectId, field, value, projectCardElement) {
    try {
        const updatedData = { [field]: value };
        await projectService.updateProject(projectId, updatedData);
        showStatus(`Project ${field} updated successfully!`);

        // Efficiently re-render only the affected card
        // First, get the latest project data
        const updatedProjectData = await projectService.getProjectById(projectId);
        if (updatedProjectData) {
            const newCard = await renderProject(updatedProjectData); // renderProject is async
            if (projectCardElement.parentNode && newCard) {
                projectCardElement.parentNode.replaceChild(newCard, projectCardElement);
            } else {
                 // Fallback to full list re-render if parent is not found (should not happen)
                console.warn('Could not find parent for project card, falling back to full list re-render');
                const activeTabElement = document.querySelector('.tab-button.active');
                if (activeTabElement) {
                    const activeTab = activeTabElement.dataset.tab;
                    if (activeTab === 'bizdev') {
                        uiService.renderProjectList('bizdev', 'bizdev-project-list', document.getElementById('sort-bizdev').value, false);
                    } else if (activeTab === 'ian-collab') {
                        uiService.renderProjectList('ian', 'ian-collab-project-list', document.getElementById('sort-ian').value, true);
                    }
                }
            }
        }
    } catch (error) {
        console.error(`Error updating project ${field}:`, error);
        showStatus(`Failed to update project ${field}: ` + (error.message || 'Unknown error'), true);
        // Optionally, revert the UI change here if needed
    }
}

// Create project details separate from the card
function createProjectDetails(project, projectCard) {
    try {
        const detailsWrapper = document.createElement('div');
        detailsWrapper.className = 'project-details-wrapper';
        detailsWrapper.style.display = 'none'; // Initially hidden

        // Tasks Section
        const tasksContainer = document.createElement('div');
        tasksContainer.className = 'project-tasks-bizdev project-detail-item';
        tasksContainer.innerHTML = '<h3>Tasks</h3>';
        const taskListEl = document.createElement('ul');
        taskListEl.className = 'task-list-bizdev';
        taskListEl.innerHTML = '<li>Loading tasks...</li>'; // Initial loading message
        tasksContainer.appendChild(taskListEl);

        // Form to Add New Task
        const addTaskForm = document.createElement('form');
        addTaskForm.className = 'add-task-form';
        const taskInput = document.createElement('input');
        taskInput.type = 'text';
        taskInput.placeholder = 'New task...';
        taskInput.required = true;
        const addTaskButton = document.createElement('button');
        addTaskButton.type = 'submit';
        addTaskButton.textContent = 'Add Task';
        addTaskButton.className = 'btn btn-secondary btn-sm';

        addTaskForm.appendChild(taskInput);
        addTaskForm.appendChild(addTaskButton);
        tasksContainer.appendChild(addTaskForm);
        
        addTaskForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const taskText = taskInput.value.trim();
            if (taskText) {
                try {
                    const newTask = await taskService.createTask(project.id, { text: taskText, completed: false });
                    taskInput.value = ''; // Clear input
                    // Re-fetch and render tasks for this project - CORRECTED METHOD NAME
                    const updatedTasks = await taskService.getTasksByProjectId(project.id);
                    renderTasks(updatedTasks, taskListEl, project.id); // Pass projectId
                    // showStatusMessage('Task added successfully!', 'success'); // showStatusMessage is not defined here, handle later if needed
                    console.log('Task added successfully!'); // Temporary log
                } catch (error) {
                    console.error('Error adding task:', error);
                    // showStatusMessage('Failed to add task.', 'error'); // showStatusMessage is not defined here
                    console.error('Failed to add task.'); // Temporary log
                }
            }
        });

        detailsWrapper.appendChild(tasksContainer);

        console.log(`[createProjectDetails] About to fetch tasks for projectId: ${project?.id}. taskListEl created.`);
        if (taskService) {
            console.log('[createProjectDetails] Inspecting taskService object keys:', Object.keys(taskService));
        } else {
            console.log('[createProjectDetails] taskService object is null or undefined.');
        }

        // Fetch and render tasks when details are first created - CORRECTED METHOD NAME in condition and call
        if (project && project.id && taskService && typeof taskService.getTasksByProjectId === 'function') {
            try {
                taskService.getTasksByProjectId(project.id)
                    .then(tasks => {
                        console.log(`[createProjectDetails] Task promise resolved for projectId: ${project.id}. Tasks:`, tasks, `Is taskListEl connected: ${taskListEl?.isConnected}`);
                        if (taskListEl && taskListEl.isConnected) {
                            renderTasks(tasks, taskListEl, project.id);
                        } else {
                            console.warn('[createProjectDetails] taskListEl no longer connected to DOM for task rendering after promise resolved.');
                        }
                    })
                    .catch(error => {
                        console.error(`[createProjectDetails] Task promise rejected for projectId: ${project.id}. Error:`, error, `Is taskListEl connected: ${taskListEl?.isConnected}`);
                        if (taskListEl && taskListEl.isConnected) {
                            taskListEl.innerHTML = '<li><i>Error loading tasks. Check console.</i></li>';
                        }
                    });
            } catch (taskServiceCallError) {
                console.error(`[createProjectDetails] Error directly calling taskService.getTasksByProjectId for projectId: ${project.id}:`, taskServiceCallError);
                if (taskListEl && taskListEl.isConnected) {
                    taskListEl.innerHTML = '<li><i>Critical error initiating task loading. Check console.</i></li>';
                }
            }
        } else {
            // Enhanced logging to see the state of each part of the condition
            console.error('[createProjectDetails] Condition for fetching tasks failed with following states:', {
                'project': project,
                'project && project.id': project && project.id, // Evaluate this part directly
                'typeof project.id': typeof project?.id,
                'taskService': taskService,
                'typeof taskService.getTasksByProjectId': typeof taskService?.getTasksByProjectId,
                // Log the full original condition parts for clarity
                'condition_project': !!project,
                'condition_project_id': !!(project && project.id),
                'condition_taskService': !!taskService,
                'condition_getTasks_is_function': typeof taskService?.getTasksByProjectId === 'function' // CORRECTED METHOD NAME here too
            });
            if (taskListEl && taskListEl.isConnected) {
                taskListEl.innerHTML = '<li><i>Could not load tasks due to an internal condition check. See console.</i></li>';
            }
        }

        // Detailed Ratings Section
        const detailedRatingsContainer = document.createElement('div');
        detailedRatingsContainer.className = 'detailed-ratings-container project-detail-item'; // Add common class
        detailedRatingsContainer.innerHTML = '<h3>Detailed Ratings</h3>';
        const ratingsContent = document.createElement('div'); // Actual content holder
        detailedRatingsContainer.appendChild(ratingsContent);
        detailsWrapper.appendChild(detailedRatingsContainer);
        renderDetailedRatings(project, ratingsContent); // Render into the content holder

        // Collaboration Checkbox Section
        const collaborationContainer = document.createElement('div');
        collaborationContainer.className = 'project-collaboration-details project-detail-item';
        collaborationContainer.innerHTML = '<h3>Collaboration</h3>';

        const collabLabel = document.createElement('label');
        collabLabel.htmlFor = `collab-checkbox-${project.id}`;
        collabLabel.textContent = 'Is Ian Collaboration? ';
        const collabCheckbox = document.createElement('input');
        collabCheckbox.type = 'checkbox';
        collabCheckbox.id = `collab-checkbox-${project.id}`;
        collabCheckbox.className = 'inline-edit-checkbox';
        collabCheckbox.checked = project.isIanCollaboration || false;
        collabCheckbox.dataset.field = 'isIanCollaboration';

        collabCheckbox.addEventListener('change', async (e) => {
            handleInlineEdit(project.id, 'isIanCollaboration', e.target.checked, projectCard);
            // Update indicator in the main row as well
            const indicator = projectCard.querySelector('.project-row .ian-collab-indicator');
            if (indicator) {
                indicator.textContent = e.target.checked ? '🤝' : '';
            }
        });
        
        collaborationContainer.appendChild(collabLabel);
        collaborationContainer.appendChild(collabCheckbox);
        detailsWrapper.appendChild(collaborationContainer);

        // Danger Zone - Delete Project Button
        const dangerZoneContainer = document.createElement('div');
        dangerZoneContainer.className = 'project-detail-item danger-zone';
        dangerZoneContainer.innerHTML = '<h3>Danger Zone</h3>';

        const deleteProjectButton = document.createElement('button');
        deleteProjectButton.textContent = 'Delete This Project';
        deleteProjectButton.className = 'btn btn-danger btn-sm'; // Style as a small danger button
        deleteProjectButton.addEventListener('click', async () => {
            if (confirm(`Are you sure you want to delete the project "${project.name}"? This action cannot be undone.`)) {
                try {
                    await projectService.deleteProject(project.id);
                    console.log(`Project "${project.name}" (ID: ${project.id}) deleted successfully.`);
                    // Remove the project card from the UI
                    if (projectCard && projectCard.parentNode) {
                        projectCard.remove(); // Modern way to remove element
                    }
                    // Optionally, show a more persistent success message via a proper status system
                } catch (error) {
                    console.error(`Error deleting project ${project.id}:`, error);
                    alert(`Failed to delete project "${project.name}". Please try again or check the console.`);
                }
            }
        });
        dangerZoneContainer.appendChild(deleteProjectButton);
        detailsWrapper.appendChild(dangerZoneContainer);

        return detailsWrapper;
    } catch (error) {
        console.error(`Error creating project details for ${project?.id}:`, error);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'project-details-wrapper error';
        // errorDiv.style.display = 'none'; // Will be shown by expand logic
        errorDiv.innerHTML = '<p>Error loading details.</p>'; // This is the message shown
        return errorDiv;
    }
}

async function renderProject(project) {
    try {
        const validation = projectService.validateProject(project);
        
        if (!validation.isValid) {
            console.error(`Invalid project data for ${project.id}: ${validation.error}`);
            throw new Error(`Invalid project data: ${validation.error}`);
        }
        
        if (validation.wasFixed) {
            project = validation.project;
        }

        const projectCard = createProjectCard(project);
        if (!projectCard) {
            throw new Error(`Failed to create project card for project: ${project.id}`);
        }
        
        // Create and append details (initially hidden by CSS or style.display = 'none')
        const detailsWrapper = createProjectDetails(project, projectCard); // Pass projectCard
        projectCard.appendChild(detailsWrapper);
        
        return projectCard;
    } catch (error) {
        console.error(`Error rendering project ${project?.id}:`, error);
        
        try {
            const errorCard = document.createElement('div');
            errorCard.className = 'project-card error';
            errorCard.innerHTML = `
                <div class="project-row">
                    <div class="project-name-cell">
                        <span class="project-name">Error: ${project?.name || 'Unknown Project'}</span>
                    </div>
                    <div class="project-status"><span class="badge status-error">Error</span></div>
                </div>
            `;
            return errorCard;
        } catch (fallbackError) {
            console.error('Failed to create fallback error card:', fallbackError);
            const div = document.createElement('div');
            div.textContent = 'Error rendering project';
            return div;
        }
    }
}

async function renderProjectList(dataSourceKey, containerId, sortBy, filterIanCollab) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container element with ID "${containerId}" not found`);
        return;
    }
    
    container.innerHTML = ''; // Clear existing projects
    
    // Add loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-projects';
    loadingIndicator.innerHTML = '<p>Loading projects...</p>';
    container.appendChild(loadingIndicator);

    try {
        // Fetch projects based on source and filters
        let filters = {};
        
        if (dataSourceKey === 'bizdev') {
            filters.isIanCollaboration = false;
        } else if (dataSourceKey === 'ian') {
            filters.isIanCollaboration = true;
        }

        // Get status filter if applicable
        if (dataSourceKey === 'bizdev') {
            const statusFilterElement = document.getElementById('filter-status-bizdev');
            if (statusFilterElement) {
                const statusValue = statusFilterElement.value;
                if (statusValue && statusValue !== 'all') {
                    filters.status = statusValue;
                }
            }
        } else if (dataSourceKey === 'ian') {
            const statusFilterElement = document.getElementById('filter-status-ian');
            if (statusFilterElement) {
                const statusValue = statusFilterElement.value;
                if (statusValue && statusValue !== 'all') {
                    filters.status = statusValue;
                }
            }
        }
        
        // Get projects with filters and sorting
        let projects = [];
        try {
            projects = await projectService.getProjects(filters, sortBy);
        } catch (projectsError) {
            console.error('Error fetching projects:', projectsError);
            
            // Try emergency direct fetch if normal fetch fails
            window.useDirectFetch = true;
            projects = await projectService.getProjects(filters, sortBy);
            
            if (projects && projects.length > 0) {
            } else {
                throw new Error(`Failed to fetch projects: ${projectsError.message}`);
            }
        }
        
        // Clear the loading indicator
        container.innerHTML = '';
        
        if (!projects || projects.length === 0) {
            container.innerHTML = `
                <div style='padding: 15px; text-align:center;'>
                    <p style='color: #6c757d;'>No projects to display with current filters.</p>
                </div>
            `;
        } else {
            const projectElements = await Promise.all(projects.map(project => renderProject(project)));
            projectElements.forEach(projectElement => {
                if (projectElement) {
                    container.appendChild(projectElement);
                }
            });
            
            // Verify DOM content after rendering
            const actualDomCount = container.querySelectorAll('.project-card:not(.error)').length; // Exclude error cards from count
            
            // If there's a mismatch, log an error
            if (actualDomCount !== projects.length) {
                const errorDomCount = container.querySelectorAll('.project-card.error').length;
                console.warn(`DOM count mismatch - Rendered: ${actualDomCount}, Expected: ${projects.length}, Errors: ${errorDomCount}`);
            }
        }
    } catch (error) {
        console.error('Error rendering project list:', error);
        
        // Show more detailed error in the UI
        container.innerHTML = `
            <div style='padding: 15px; text-align:center;'>
                <p style='color: #721c24; margin-bottom: 10px;'>
                    Error loading projects: ${error.message || 'Unknown error'}
                </p>
            </div>
        `;
    }
}

// Event Listeners Setup
function setupEventListeners() {
    // Tab Functionality
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(button.dataset.tab).classList.add('active');
            
            // Re-render lists on tab change
            const bizDevSortBy = document.getElementById('sort-bizdev').value;
            renderProjectList('bizdev', 'bizdev-project-list', bizDevSortBy, false);

            const ianSortBy = document.getElementById('sort-ian').value;
            renderProjectList('ian', 'ian-collab-project-list', ianSortBy, true);
        });
    });

    // Sorting Event Listeners
    document.querySelectorAll('.sort-controls select').forEach(selectElement => {
        selectElement.addEventListener('change', (event) => {
            const sortBy = event.target.value;
            const listId = event.target.dataset.listId;
            const dataSourceKey = event.target.dataset.source;
            const showIan = (dataSourceKey === 'bizdev') ? false : true;
            
            renderProjectList(dataSourceKey, listId, sortBy, showIan);
        });
    });

    // Status Filter Event Listener (for BizDev tab)
    const statusFilterBizDev = document.getElementById('filter-status-bizdev');
    if (statusFilterBizDev) {
        statusFilterBizDev.addEventListener('change', (event) => {
            const sortBy = document.getElementById('sort-bizdev').value;
            renderProjectList('bizdev', 'bizdev-project-list', sortBy, false);
        });
    }

    // Status Filter Event Listener (for Ian Collab tab)
    const statusFilterIan = document.getElementById('filter-status-ian');
    if (statusFilterIan) {
        statusFilterIan.addEventListener('change', (event) => {
            const sortBy = document.getElementById('sort-ian').value;
            renderProjectList('ian', 'ian-collab-project-list', sortBy, true);
        });
    }

    // Add button to open modal
    const addProjectBtn = document.querySelector('.list-controls .btn-primary');
    if (addProjectBtn && addProjectBtn.id !== 'addTaskCollabBtn') {
        addProjectBtn.addEventListener('click', () => {
            document.getElementById('newProjectIanCollab').checked = false;
            openModal('addProjectModal');
        });
    } else if (!addProjectBtn) {
        console.error('Add Project button not found for BizDev tab');
    }

    // Add New Task button for Collaboration tab event listener
    const addTaskCollabButton = document.getElementById('addTaskCollabBtn');
    if (addTaskCollabButton) {
        addTaskCollabButton.addEventListener('click', () => {
            document.getElementById('addProjectForm').reset();
            document.getElementById('newProjectIanCollab').checked = true;
            openModal('addProjectModal');
        });
    }

    // Close button in modal
    document.getElementById('closeAddProjectModal').addEventListener('click', () => {
        closeModal('addProjectModal');
    });

    // Add Project Form Submission
    document.getElementById('addProjectForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        
        try {
            const newProject = {
                name: document.getElementById('newProjectName').value,
                description: document.getElementById('newProjectDescription').value,
                rating: parseFloat(document.getElementById('newProjectRating').value),
                priority: document.getElementById('newProjectPriority').value,
                status: document.getElementById('newProjectStatus').value,
                isIanCollaboration: document.getElementById('newProjectIanCollab').checked,
                detailedRatingsData: {} // Initialize empty, can be filled later
            };
            
            const createdProject = await projectService.createProject(newProject);
            
            closeModal('addProjectModal');
            this.reset(); // Reset the form
            
            // Re-render the currently active list
            const activeTab = document.querySelector('.tab-button.active').dataset.tab;
            
            if (activeTab === 'bizdev') {
                const bizDevSortBy = document.getElementById('sort-bizdev').value;
                await renderProjectList('bizdev', 'bizdev-project-list', bizDevSortBy, false);
            } else { // Ian collab tab
                const ianSortBy = document.getElementById('sort-ian').value;
                await renderProjectList('ian', 'ian-collab-project-list', ianSortBy, true);
            }
        } catch (error) {
            console.error('Error creating project:', error);
            if (error.message) console.error('Error message:', error.message);
            if (error.code) console.error('Error code:', error.code);
            if (error.details) console.error('Error details:', error.details);
            alert('Failed to create project. Please try again.');
        }
    });

    // Cancel button in form
    document.querySelector('.form-actions .btn-secondary').addEventListener('click', () => {
        closeModal('addProjectModal');
    });

    // Close modal if clicked outside content
    window.onclick = function(event) {
        const modal = document.getElementById('addProjectModal');
        if (event.target == modal) {
            closeModal('addProjectModal');
        }
    };
}

// Assign functions to uiService
uiService.renderProjectList = renderProjectList;
uiService.setupEventListeners = setupEventListeners;
uiService.debugDomIssues = debugDomIssues;

// Export UI service and modal functions
export { uiService, openModal, closeModal }; 