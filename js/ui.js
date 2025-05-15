// UI related functionality

// Helper Functions
function getPriorityClass(priority) { 
    return `priority-${priority.toLowerCase()}`; 
}

function getStatusClass(status) { 
    return `status-${status.toLowerCase().replace(' ', '-')}`; 
}

// Modal Functions
function openModal(modalId) { 
    document.getElementById(modalId).style.display = "block"; 
}

function closeModal(modalId) { 
    document.getElementById(modalId).style.display = "none"; 
}

// Rendering Functions
function renderTasks(tasks, taskListEl, projectId) {
    taskListEl.innerHTML = ''; // Clear before re-render
    
    if (!tasks || tasks.length === 0) {
        taskListEl.innerHTML = '<li><em>No tasks yet.</em></li>';
        return;
    }
    
    tasks.forEach(task => {
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
            }
        });

        const label = document.createElement('label');
        label.setAttribute('for', `task-${task.id}`);
        label.textContent = task.text;

        taskItem.appendChild(checkbox);
        taskItem.appendChild(label);
        taskListEl.appendChild(taskItem);
    });
}

function renderDetailedRatings(project, container) {
    container.innerHTML = ''; // Clear previous
    
    if (!project.detailedRatings || Object.keys(project.detailedRatings).length === 0) {
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

    for (const key in project.detailedRatings) {
        const item = project.detailedRatings[key];
        const div = document.createElement('div');
        
        if (key === 'runway') {
            div.innerHTML = `<strong>Runway:</strong> <span>${item || 'N/A'} months</span>`;
        } else if (item && typeof item.value !== 'undefined' && typeof item.weight !== 'undefined') {
            div.innerHTML = `<strong>${ratingsMap[key] || key}:</strong> <span>${item.value === null ? 'N/A' : item.value}/5</span> (Weight: <span>${item.weight * 100}%</span>)`;
        }
        
        grid.appendChild(div);
    }
    
    container.appendChild(grid);
}

function renderProject(project) {
    const projectCard = document.createElement('div');
    projectCard.className = 'project-card';
    projectCard.dataset.projectId = project.id;

    const projectRow = document.createElement('div');
    projectRow.className = 'project-row';
    projectRow.innerHTML = `
        <div class="project-name-cell">
            <span class="ian-collab-indicator">${project.isIanCollaboration ? '🤝' : ''}</span>
            <span class="project-name">${project.name}</span>
        </div>
        <div class="project-rating">${project.rating.toFixed(1)}</div>
        <div class="project-priority"><span class="badge ${getPriorityClass(project.priority)}">${project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}</span></div>
        <div class="project-status"><span class="badge ${getStatusClass(project.status)}">${project.status.charAt(0).toUpperCase() + project.status.slice(1)}</span></div>
        <div class="expand-icon">►</div>
    `;

    const detailsWrapper = document.createElement('div');
    detailsWrapper.className = 'project-details-wrapper';

    const detailsContent = document.createElement('div');
    detailsContent.className = 'project-details-content';

    detailsContent.innerHTML = `<p><strong>Description:</strong> ${project.description || "N/A"}</p>`;

    // Detailed Ratings Toggle & Container
    const detailedRatingsToggle = document.createElement('a');
    detailedRatingsToggle.className = 'detailed-ratings-toggle';
    detailedRatingsToggle.textContent = 'Show Detailed Ratings ▼';
    detailedRatingsToggle.href = '#';
    
    const detailedRatingsContainer = document.createElement('div');
    detailedRatingsContainer.className = 'detailed-ratings-container';

    detailedRatingsToggle.addEventListener('click', (e) => {
        e.preventDefault();
        detailedRatingsContainer.classList.toggle('visible');
        detailedRatingsToggle.textContent = detailedRatingsContainer.classList.contains('visible') ? 
            'Hide Detailed Ratings ▲' : 'Show Detailed Ratings ▼';
        
        if (detailedRatingsContainer.classList.contains('visible')) {
            renderDetailedRatings(project, detailedRatingsContainer);
        }
    });
    
    detailsContent.appendChild(detailedRatingsToggle);
    detailsContent.appendChild(detailedRatingsContainer);

    // Tasks Section
    const tasksTitle = document.createElement('h4');
    tasksTitle.textContent = 'Tasks:';
    
    const taskListEl = document.createElement('ul');
    taskListEl.className = 'task-list';
    
    renderTasks(project.tasks, taskListEl, project.id);
    
    const addTaskArea = document.createElement('div');
    addTaskArea.className = 'add-task-area';
    
    const addTaskInput = document.createElement('input');
    addTaskInput.type = 'text';
    addTaskInput.placeholder = 'New task description...';
    
    const addTaskButton = document.createElement('button');
    addTaskButton.textContent = 'Add Task';
    addTaskButton.className = 'btn btn-primary btn-sm';

    addTaskButton.onclick = async () => {
        const taskText = addTaskInput.value.trim();
        if (taskText) {
            try {
                await taskService.createTask(project.id, { text: taskText });
                // Re-fetch and re-render tasks
                const tasks = await taskService.getTasksByProjectId(project.id);
                renderTasks(tasks, taskListEl, project.id);
                addTaskInput.value = '';
            } catch (error) {
                console.error('Error adding task:', error);
                alert('Failed to add task. Please try again.');
            }
        }
    };
    
    addTaskArea.appendChild(addTaskInput);
    addTaskArea.appendChild(addTaskButton);

    detailsContent.appendChild(tasksTitle);
    detailsContent.appendChild(taskListEl);
    detailsContent.appendChild(addTaskArea);
    
    detailsWrapper.appendChild(detailsContent);
    projectCard.appendChild(projectRow);
    projectCard.appendChild(detailsWrapper);

    projectRow.addEventListener('click', (e) => {
        // Prevent toggle if clicking on an interactive element within the row
        if (e.target.closest('button, a, input, select')) return;
        projectCard.classList.toggle('expanded');
    });

    return projectCard;
}

async function renderProjectList(dataSourceKey, containerId, sortBy, filterIanCollab) {
    const container = document.getElementById(containerId);
    container.innerHTML = ''; // Clear existing projects

    try {
        // Fetch projects based on source and filters
        let filters = {};
        
        if (dataSourceKey === 'bizdev' && !filterIanCollab) {
            // If in BizDev view and "Show Ian's Collaboration Projects" is unchecked
            filters.isIanCollaboration = false;
        } else if (dataSourceKey === 'ian') {
            // The "Ian Collaboration" tab always shows only Ian's projects
            filters.isIanCollaboration = true;
        }
        
        // Get projects with filters and sorting
        const projects = await projectService.getProjects(filters, sortBy);
        
        if (projects.length === 0) {
            container.innerHTML = "<p style='padding: 15px; text-align:center; color: #6c757d;'>No projects to display with current filters.</p>";
        } else {
            projects.forEach(project => {
                container.appendChild(renderProject(project));
            });
        }
    } catch (error) {
        console.error('Error rendering project list:', error);
        container.innerHTML = "<p style='padding: 15px; text-align:center; color: #721c24;'>Error loading projects. Please refresh the page or try again later.</p>";
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
            const showIan = document.getElementById('showIanCollabToggle').checked;
            renderProjectList('bizdev', 'bizdev-project-list', bizDevSortBy, showIan);

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
            const showIan = (dataSourceKey === 'bizdev') ? 
                document.getElementById('showIanCollabToggle').checked : true;
            
            renderProjectList(dataSourceKey, listId, sortBy, showIan);
        });
    });

    // "Show Ian Collaboration" Toggle
    const showIanCollabToggle = document.getElementById('showIanCollabToggle');
    showIanCollabToggle.addEventListener('change', () => {
        const bizDevSortBy = document.getElementById('sort-bizdev').value;
        renderProjectList('bizdev', 'bizdev-project-list', bizDevSortBy, showIanCollabToggle.checked);
    });

    // Add Project Form Submission
    document.getElementById('addProjectForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const newProject = {
            name: document.getElementById('newProjectName').value,
            description: document.getElementById('newProjectDescription').value,
            rating: parseFloat(document.getElementById('newProjectRating').value),
            priority: document.getElementById('newProjectPriority').value,
            status: document.getElementById('newProjectStatus').value,
            isIanCollaboration: document.getElementById('newProjectIanCollab').checked,
            tasks: [],
            detailedRatings: {} // Initialize empty, can be filled later
        };
        
        try {
            await projectService.createProject(newProject);
            closeModal('addProjectModal');
            this.reset(); // Reset the form
            
            // Re-render the currently active list
            const activeTab = document.querySelector('.tab-button.active').dataset.tab;
            if (activeTab === 'bizdev') {
                const bizDevSortBy = document.getElementById('sort-bizdev').value;
                const showIan = document.getElementById('showIanCollabToggle').checked;
                renderProjectList('bizdev', 'bizdev-project-list', bizDevSortBy, showIan);
            } else { // Ian collab tab
                const ianSortBy = document.getElementById('sort-ian').value;
                renderProjectList('ian', 'ian-collab-project-list', ianSortBy, true);
            }
        } catch (error) {
            console.error('Error creating project:', error);
            alert('Failed to create project. Please try again.');
        }
    });

    // Close modal if clicked outside content
    window.onclick = function(event) {
        const modal = document.getElementById('addProjectModal');
        if (event.target == modal) {
            closeModal('addProjectModal');
        }
    };
}

// Export UI service
const uiService = {
    renderProjectList,
    setupEventListeners,
    openModal,
    closeModal
}; 