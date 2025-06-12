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

// Helper function to close all custom selects except the current one
function closeAllCustomSelects(currentOptionsContainer = null) {
    const allOptionsContainers = document.querySelectorAll('.custom-select-options');
    allOptionsContainers.forEach(container => {
        if (container !== currentOptionsContainer) {
            container.style.display = 'none';
            // Note: This simplified version does not remove document event listeners 
            // that might have been added by other dropdowns. A more robust solution 
            // might involve a single global click listener or better state management for open dropdowns.
        }
    });
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
async function renderTasks(tasks, taskListEl, projectId, parentId = null, level = 0) {
    // console.log(`[renderTasks] Called for projectId: ${projectId}, parentId: ${parentId}, level: ${level}. taskListEl connected: ${taskListEl?.isConnected}. Tasks received:`, tasks);
    
    if (!taskListEl || !taskListEl.isConnected) {
        console.error('[renderTasks] taskListEl is null or not connected. Cannot render tasks.');
        return;
    }
    
    // Clear only if it's the top-level call for this specific list element, to avoid clearing sub-lists being repopulated.
    // For sub-task refreshes, the specific sub-list UL will be cleared before rendering into it.
    if (level === 0) {
        taskListEl.innerHTML = ''; 
    }

    if (!tasks || tasks.length === 0) {
        if (level === 0) { // Only show "No tasks yet" for the main list
            // console.log('[renderTasks] No tasks or empty tasks array for top level.');
            taskListEl.innerHTML = '<li><em>No tasks yet. Add one above!</em></li>';
        }
        return;
    }
    
    // console.log(`[renderTasks] Rendering ${tasks.length} tasks for parent ${parentId} at level ${level}.`);
    
    for (const task of tasks) {
        try {
            const taskItem = document.createElement('li');
            taskItem.className = task.completed ? 'completed' : '';
            taskItem.dataset.taskId = task.id;
            taskItem.style.marginLeft = `${level * 25}px`; // Indentation for subtasks

            const taskContentWrapper = document.createElement('div');
            taskContentWrapper.className = 'task-content-wrapper';

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
                    e.target.checked = !e.target.checked; // Revert UI change
                    showStatus('Failed to update task. Please try again.', true);
                }
            });

            const label = document.createElement('label');
            label.setAttribute('for', `task-${task.id}`);
            label.textContent = task.text || 'Unnamed Task';

            // Add Subtask Button
            const addSubtaskBtn = document.createElement('button');
            addSubtaskBtn.textContent = '+';
            addSubtaskBtn.className = 'btn btn-secondary btn-xs add-subtask-button';
            taskContentWrapper.appendChild(addSubtaskBtn);

            // Delete Task Button - Should be part of the taskContentWrapper
            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = '&times;'; // Using a multiplication sign as an X icon
            deleteButton.className = 'btn btn-danger btn-xs delete-task-button';
            deleteButton.title = 'Delete task'; // Tooltip
            taskContentWrapper.appendChild(deleteButton); // Append to the wrapper

            taskItem.appendChild(taskContentWrapper); // Append the whole wrapper to taskItem

            deleteButton.addEventListener('click', async (e) => {
                e.stopPropagation(); // Prevent task row click or other parent events
                if (confirm(`Are you sure you want to delete this task: "${task.text}"?\nThis action cannot be undone and will also delete all its subtasks.`)) {
                    try {
                        showStatus('Deleting task...', false);
                        // We need to recursively delete subtasks from the UI if the backend doesn't cascade or for immediate UI update.
                        // However, taskService.deleteTask should handle backend deletion including cascades if set up.
                        // For UI, removing the parent taskItem is usually enough if subtasks are children in DOM.
                        await taskService.deleteTask(projectId, task.id);
                        taskItem.remove(); // Remove the task item from the DOM
                        showStatus('Task and its subtasks deleted successfully!', false);
                    } catch (error) {
                        console.error('Error deleting task:', error);
                        showStatus('Failed to delete task: ' + (error.message || 'Unknown error'), true);
                    }
                }
            });

            taskContentWrapper.appendChild(checkbox);
            taskContentWrapper.appendChild(label);

            // Subtask Form (initially hidden)
            const subtaskForm = document.createElement('form');
            subtaskForm.className = 'add-task-form subtask-form'; // Add subtask-form for specific styling
            subtaskForm.style.display = 'none';
            subtaskForm.style.marginLeft = '20px'; // Indent form slightly
            subtaskForm.innerHTML = `
                <input type="text" placeholder="New subtask..." required class="subtask-input">
                <button type="submit" class="btn btn-primary btn-xs">Save</button>
                <button type="button" class="btn btn-tertiary btn-xs cancel-subtask">Cancel</button>
            `;
            taskItem.appendChild(subtaskForm);

            addSubtaskBtn.addEventListener('click', () => {
                subtaskForm.style.display = subtaskForm.style.display === 'none' ? 'flex' : 'none';
                if(subtaskForm.style.display === 'flex') {
                    subtaskForm.querySelector('.subtask-input').focus();
                }
            });
            subtaskForm.querySelector('.cancel-subtask').addEventListener('click', () => {
                subtaskForm.style.display = 'none';
                subtaskForm.reset();
            });

            const subtaskListEl = document.createElement('ul');
            subtaskListEl.className = 'task-list-bizdev subtask-list'; // Add class for specific styling if needed
            taskItem.appendChild(subtaskListEl);

            subtaskForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const subtaskInput = subtaskForm.querySelector('.subtask-input');
                const subtaskText = subtaskInput.value.trim();
                if (subtaskText) {
                    try {
                        showStatus('Adding subtask...', false);
                        await taskService.createTask(projectId, { text: subtaskText, completed: false, parentId: task.id });
                        subtaskInput.value = '';
                        subtaskForm.style.display = 'none';
                        // Refresh this task's subtasks
                        const updatedSubtasks = await taskService.getTasksByProjectId(projectId, task.id);
                        subtaskListEl.innerHTML = ''; // Clear previous subtasks before re-rendering
                        await renderTasks(updatedSubtasks, subtaskListEl, projectId, task.id, level + 1);
                        showStatus('Subtask added successfully!', false);
                    } catch (error) {
                        console.error('Error adding subtask:', error);
                        showStatus('Failed to add subtask: ' + (error.message || 'Unknown error'), true);
                    }
                }
            });

            if (taskListEl.isConnected) {
                taskListEl.appendChild(taskItem);
            } else {
                console.error('Cannot append task item - taskListEl is not connected to DOM');
                // return; // Stop if parent list detached
            }

            // Fetch and render subtasks for the current task
            // Check if task.id exists, which it should for any existing task
            if (task.id) { 
                try {
                    const subtasks = await taskService.getTasksByProjectId(projectId, task.id);
                    if (subtasks && subtasks.length > 0) {
                         // Ensure subtaskListEl is connected before rendering into it.
                        if (subtaskListEl.isConnected) {
                            await renderTasks(subtasks, subtaskListEl, projectId, task.id, level + 1);
                        } else {
                            console.warn(`Subtask list for task ${task.id} is not connected to DOM. Skipping subtask rendering.`);
                        }
                    }
                } catch (fetchSubtasksError) {
                    console.error(`Error fetching subtasks for task ${task.id}:`, fetchSubtasksError);
                    if (subtaskListEl.isConnected) {
                        subtaskListEl.innerHTML = '<li><em>Error loading subtasks.</em></li>';
                    }
                }
            }

        } catch (taskError) {
            console.error('Error rendering a task item:', taskError, task);
            // Potentially skip this task but continue with others
            const errorLi = document.createElement('li');
            errorLi.textContent = 'Error rendering this task.';
            errorLi.style.color = 'red';
            if (taskListEl.isConnected) taskListEl.appendChild(errorLi);
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
            strategicFit: "Strategic Fit",
            insiderSupport: "Insider Support",
            stabilityClarity: "Stability & Clarity",
            effort: "Effort",
            timing: "Timing"
        };

        for (const key in project.detailedRatingsData) {
            const itemValue = project.detailedRatingsData[key]; // Simplified: value is directly under key
            const div = document.createElement('div');
            const itemValueOrNA = (itemValue === null || itemValue === undefined) ? 'N/A' : itemValue;
            
            if (ratingsMap[key]) { // Check if it's a mapped criterion
                div.innerHTML = `<strong>${ratingsMap[key]}:</strong> <span>${itemValueOrNA}/5</span>`;
            }
            // Potentially skip unmapped keys or handle them differently if necessary
            if (div.innerHTML) { // Only append if content was set
                 grid.appendChild(div);
            }
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

// Function to populate and handle the edit detailed ratings form
function populateEditRatingsForm(project, formDiv, viewDiv, editButton, projectCard) {
    formDiv.innerHTML = ''; // Clear previous form content

    const form = document.createElement('form');
    form.className = 'edit-ratings-form'; 

    const ratingsMap = {
        revenuePotential: "Revenue Potential", 
        strategicFit: "Strategic Fit",
        insiderSupport: "Insider Support",
        stabilityClarity: "Stability & Clarity",
        effort: "Effort",
        timing: "Timing"
    };

    const currentRatings = project.detailedRatingsData || {};

    for (const key in ratingsMap) {
        const criterionDiv = document.createElement('div');
        criterionDiv.className = 'rating-criterion form-group';

        const label = document.createElement('label');
        label.textContent = ratingsMap[key];
        label.htmlFor = `rating-${key}-${project.id}`;
        criterionDiv.appendChild(label);

        const valueInput = document.createElement('input');
        valueInput.type = 'number';
        valueInput.id = `rating-${key}-${project.id}`;
        valueInput.name = key; // MODIFIED: Name is just the key
        valueInput.min = "1"; 
        valueInput.max = "5"; 
        valueInput.step = "0.5"; 
        valueInput.value = currentRatings[key] !== undefined ? currentRatings[key] : '3'; 
        criterionDiv.appendChild(valueInput);

        form.appendChild(criterionDiv);
    }



    // Action Buttons
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'form-actions';
    const saveButton = document.createElement('button');
    saveButton.type = 'submit';
    saveButton.className = 'btn btn-primary btn-sm';
    saveButton.textContent = 'Save Ratings';
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'btn btn-secondary btn-sm';
    cancelButton.textContent = 'Cancel';
    actionsDiv.appendChild(saveButton);
    actionsDiv.appendChild(cancelButton);
    form.appendChild(actionsDiv);
    formDiv.appendChild(form);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const newRatingsData = {};

        for (const key in ratingsMap) {
            newRatingsData[key] = parseFloat(formData.get(key)) || 0; // MODIFIED: Get by key directly
        } 

        try {
            showStatus('Saving ratings...', false);
            await projectService.updateProject(project.id, { detailedRatingsData: newRatingsData });
            project.detailedRatingsData = newRatingsData; 
            
            if (projectService.calculateOverallRating) {
                project.rating = projectService.calculateOverallRating(project.detailedRatingsData);
                const ratingCell = projectCard.querySelector('.project-row .project-rating-cell');
                if (ratingCell) {
                    const ratingDisplay = ratingCell.querySelector('.rating-display');
                    if (ratingDisplay) {
                        ratingDisplay.textContent = project.rating !== null && project.rating !== undefined ? project.rating.toFixed(2) : '0.00';
                    }
                }
            }

            renderDetailedRatings(project, viewDiv);
            formDiv.style.display = 'none';
            viewDiv.style.display = 'block';
            editButton.style.display = 'inline-block';
            showStatus('Detailed ratings updated successfully!', false);
        } catch (error) {
            console.error('Error updating detailed ratings:', error);
            showStatus('Failed to update ratings: ' + (error.message || 'Unknown error'), true);
        }
    });

    cancelButton.addEventListener('click', () => {
        formDiv.style.display = 'none';
        viewDiv.style.display = 'block';
        editButton.style.display = 'inline-block'; 
    });
}

// Enhanced createProjectCard function - extracted from renderProject
function createProjectCard(project) {
    try {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        projectCard.dataset.projectId = project.id;

        const projectRow = document.createElement('div');
        projectRow.className = 'project-row';

        // Conditionally add Rating Cell FIRST for BizDev projects
        if (!project.isIanCollaboration) {
            const ratingCell = document.createElement('div');
            ratingCell.className = 'project-rating-cell editable-rating-cell';
            
            // Create rating display element
            const ratingDisplay = document.createElement('div');
            ratingDisplay.className = 'rating-display';
            ratingDisplay.textContent = project.rating !== null && typeof project.rating !== 'undefined' ? project.rating.toFixed(2) : '0.00';
            ratingDisplay.style.cursor = 'pointer';
            ratingDisplay.title = 'Click to edit rating';
            
            // Create rating input element (initially hidden)
            const ratingInput = document.createElement('input');
            ratingInput.type = 'number';
            ratingInput.className = 'rating-input';
            ratingInput.min = '0';
            ratingInput.max = '5';
            ratingInput.step = '0.01';
            ratingInput.value = project.rating !== null && typeof project.rating !== 'undefined' ? project.rating.toFixed(2) : '0.00';
            ratingInput.style.display = 'none';
            ratingInput.style.width = '70px';
            
            // Function to switch to edit mode
            const enterEditMode = () => {
                ratingDisplay.style.display = 'none';
                ratingInput.style.display = 'inline-block';
                ratingInput.focus();
                ratingInput.select();
            };
            
            // Function to exit edit mode and save
            const exitEditMode = async (save = true) => {
                if (save) {
                    const newRating = parseFloat(ratingInput.value);
                    if (isNaN(newRating) || newRating < 0 || newRating > 5) {
                        showStatus('Rating must be a number between 0 and 5', true);
                        ratingInput.focus();
                        return;
                    }
                    
                    try {
                        // Update the project rating
                        await handleInlineEdit(project.id, 'rating', newRating, projectCard);
                        ratingDisplay.textContent = newRating.toFixed(2);
                        showStatus('Rating updated successfully!');
                    } catch (error) {
                        console.error('Error updating rating:', error);
                        showStatus('Failed to update rating', true);
                        // Revert to original value
                        ratingInput.value = project.rating !== null && typeof project.rating !== 'undefined' ? project.rating.toFixed(2) : '0.00';
                    }
                }
                
                ratingInput.style.display = 'none';
                ratingDisplay.style.display = 'inline-block';
            };
            
            // Event listeners
            ratingDisplay.addEventListener('click', enterEditMode);
            
            ratingInput.addEventListener('blur', () => exitEditMode(true));
            
            ratingInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    exitEditMode(true);
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    // Revert to original value
                    ratingInput.value = project.rating !== null && typeof project.rating !== 'undefined' ? project.rating.toFixed(2) : '0.00';
                    exitEditMode(false);
                }
            });
            
            ratingCell.appendChild(ratingDisplay);
            ratingCell.appendChild(ratingInput);
            projectRow.appendChild(ratingCell);
        }

        // Name Cell (always present)
        const nameCell = document.createElement('div');
        nameCell.className = 'project-name-cell';
        nameCell.innerHTML = `
            <span class="ian-collab-indicator">${project.isIanCollaboration ? '🤝' : ''}</span>
            <span class="project-name">${project.name}</span>
        `;
        const expandIcon = document.createElement('span');
        expandIcon.className = 'expand-icon';
        expandIcon.textContent = '▶';
        nameCell.appendChild(expandIcon);
        projectRow.appendChild(nameCell); // Append Name Cell AFTER rating (if rating exists)
        
        // Priority Cell (now a custom dropdown)
        const priorityCell = document.createElement('div');
        priorityCell.className = 'project-priority-cell custom-select-container'; // Added common class

        const prioritySelectedDisplay = document.createElement('div');
        prioritySelectedDisplay.className = 'custom-select-selected priority-selected-display';
        prioritySelectedDisplay.tabIndex = 0; // Make it focusable
        prioritySelectedDisplay.setAttribute('aria-haspopup', 'listbox'); // ARIA
        prioritySelectedDisplay.setAttribute('aria-expanded', 'false'); // ARIA

        const priorityOptionsContainer = document.createElement('div');
        priorityOptionsContainer.className = 'custom-select-options priority-options-container'; // Hidden by default via CSS
        priorityOptionsContainer.setAttribute('role', 'listbox'); // ARIA

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
            optionDiv.setAttribute('role', 'option'); // ARIA
            optionDiv.addEventListener('click', async () => {
                updatePriorityDisplay(p.value);
                priorityOptionsContainer.style.display = 'none';
                // Call existing handleInlineEdit, projectCard is in the outer scope of createProjectCard
                await handleInlineEdit(project.id, 'priority', p.value, projectCard);
            });
            priorityOptionsContainer.appendChild(optionDiv);
        });

        updatePriorityDisplay(project.priority); // Set initial display

        prioritySelectedDisplay.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent click from immediately closing due to document listener
            const isHidden = priorityOptionsContainer.style.display === 'none' || !priorityOptionsContainer.style.display;
            // Close other dropdowns
            closeAllCustomSelects(priorityOptionsContainer);
            priorityOptionsContainer.style.display = isHidden ? 'block' : 'none';
            prioritySelectedDisplay.setAttribute('aria-expanded', isHidden ? 'true' : 'false'); // ARIA
            if (isHidden) {
                document.addEventListener('click', handleClickOutsidePriority);
            } else {
                document.removeEventListener('click', handleClickOutsidePriority);
                prioritySelectedDisplay.setAttribute('aria-expanded', 'false'); // Ensure reset if closed by toggle
            }
        });
        
        // Basic keyboard accessibility for opening
        prioritySelectedDisplay.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                const isHidden = priorityOptionsContainer.style.display === 'none' || !priorityOptionsContainer.style.display;
                closeAllCustomSelects(priorityOptionsContainer);
                priorityOptionsContainer.style.display = isHidden ? 'block' : 'none';
                prioritySelectedDisplay.setAttribute('aria-expanded', isHidden ? 'true' : 'false'); // ARIA
                if (isHidden) {
                    document.addEventListener('click', handleClickOutsidePriority);
                } else {
                    document.removeEventListener('click', handleClickOutsidePriority);
                    prioritySelectedDisplay.setAttribute('aria-expanded', 'false'); // Ensure reset if closed by toggle
                }
            }
        });

        function handleClickOutsidePriority(event) {
            if (!priorityCell.contains(event.target)) {
                priorityOptionsContainer.style.display = 'none';
                prioritySelectedDisplay.setAttribute('aria-expanded', 'false'); // ARIA
                document.removeEventListener('click', handleClickOutsidePriority);
            }
        }

        priorityCell.appendChild(prioritySelectedDisplay);
        priorityCell.appendChild(priorityOptionsContainer);
        projectRow.appendChild(priorityCell);

        // Status Cell (now a custom dropdown)
        const statusCell = document.createElement('div');
        statusCell.className = 'project-status-cell custom-select-container'; // Added common class

        const statusSelectedDisplay = document.createElement('div');
        statusSelectedDisplay.className = 'custom-select-selected status-selected-display';
        statusSelectedDisplay.tabIndex = 0; // Make it focusable
        statusSelectedDisplay.setAttribute('aria-haspopup', 'listbox'); // ARIA
        statusSelectedDisplay.setAttribute('aria-expanded', 'false'); // ARIA

        const statusOptionsContainer = document.createElement('div');
        statusOptionsContainer.className = 'custom-select-options status-options-container'; // Hidden by default via CSS
        statusOptionsContainer.setAttribute('role', 'listbox'); // ARIA

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
            optionDiv.setAttribute('role', 'option'); // ARIA
            optionDiv.addEventListener('click', async () => {
                updateStatusDisplay(s.value);
                statusOptionsContainer.style.display = 'none';
                await handleInlineEdit(project.id, 'status', s.value, projectCard);
            });
            statusOptionsContainer.appendChild(optionDiv);
        });

        updateStatusDisplay(project.status); // Set initial display

        statusSelectedDisplay.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent click from immediately closing
            const isHidden = statusOptionsContainer.style.display === 'none' || !statusOptionsContainer.style.display;
            // Close other dropdowns
            closeAllCustomSelects(statusOptionsContainer);
            statusOptionsContainer.style.display = isHidden ? 'block' : 'none';
            statusSelectedDisplay.setAttribute('aria-expanded', isHidden ? 'true' : 'false'); // ARIA
            if (isHidden) {
                document.addEventListener('click', handleClickOutsideStatus);
            } else {
                document.removeEventListener('click', handleClickOutsideStatus);
                statusSelectedDisplay.setAttribute('aria-expanded', 'false'); // Ensure reset if closed by toggle
            }
        });
        
        statusSelectedDisplay.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                const isHidden = statusOptionsContainer.style.display === 'none' || !statusOptionsContainer.style.display;
                closeAllCustomSelects(statusOptionsContainer);
                statusOptionsContainer.style.display = isHidden ? 'block' : 'none';
                statusSelectedDisplay.setAttribute('aria-expanded', isHidden ? 'true' : 'false'); // ARIA
                if (isHidden) {
                    document.addEventListener('click', handleClickOutsideStatus);
                } else {
                    document.removeEventListener('click', handleClickOutsideStatus);
                    statusSelectedDisplay.setAttribute('aria-expanded', 'false'); // Ensure reset if closed by toggle
                }
            }
        });

        function handleClickOutsideStatus(event) {
            if (!statusCell.contains(event.target)) {
                statusOptionsContainer.style.display = 'none';
                statusSelectedDisplay.setAttribute('aria-expanded', 'false'); // ARIA
                document.removeEventListener('click', handleClickOutsideStatus);
            }
        }

        statusCell.appendChild(statusSelectedDisplay);
        statusCell.appendChild(statusOptionsContainer);
        projectRow.appendChild(statusCell);
        
        projectCard.appendChild(projectRow);

        // Event listener for expansion - Moved to projectRow for better click target
        projectRow.addEventListener('click', (event) => {
            // Prevent toggling if the click was on an interactive element
            if (event.target.closest('.custom-select-container, .inline-edit-select, input, select, a, button')) {
                return;
            }

            projectCard.classList.toggle('expanded');
            const detailsWrapper = projectCard.querySelector('.project-details-wrapper');
            const currentExpandIcon = projectRow.querySelector('.expand-icon'); // Get the icon

            if (detailsWrapper) {
                if (projectCard.classList.contains('expanded')) {
                    detailsWrapper.style.display = 'block'; 
                    if (currentExpandIcon) currentExpandIcon.textContent = '▼'; // Expanded state
                } else {
                    detailsWrapper.style.display = 'none';
                    if (currentExpandIcon) currentExpandIcon.textContent = '▶'; // Collapsed state
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
        detailsWrapper.style.display = 'none'; // EXPLICITLY HIDE INITIALLY

        // 1. Create Tab Navigation
        const nav = document.createElement('div');
        nav.className = 'project-details-nav';

        const buttonsInfo = [ // Renamed from 'buttons' to avoid conflict if any local var named 'buttons'
            { id: 'tasks', text: 'Tasks', paneId: 'tasks-pane-' + project.id, alwaysVisible: true },
            { id: 'description', text: 'Description', paneId: 'description-pane-' + project.id, alwaysVisible: true },
            { id: 'detailed-ratings', text: 'Detailed Ratings', paneId: 'detailed-ratings-pane-' + project.id, alwaysVisible: false }, // Renamed from 'insights'
            { id: 'settings', text: 'Settings', paneId: 'settings-pane-' + project.id, alwaysVisible: true }
        ];

        // 2. Create Tab Panes container
        const panesContainer = document.createElement('div');
        panesContainer.className = 'project-details-panes'; // A wrapper for all panes

        let firstVisibleButton = null;
        buttonsInfo.forEach((btnInfo) => {
            if (!btnInfo.alwaysVisible && project.isIanCollaboration) {
                return; // Skip creating this tab for collab projects if not alwaysVisible
            }

            const button = document.createElement('button');
            button.className = 'details-nav-button';
            button.textContent = btnInfo.text;
            button.dataset.paneTarget = btnInfo.paneId;
            nav.appendChild(button);

            if (!firstVisibleButton) {
                firstVisibleButton = button; // Store the first button that is actually added
            }

            const pane = document.createElement('div');
            pane.className = 'details-tab-pane';
            pane.id = btnInfo.paneId;
            panesContainer.appendChild(pane);
        });
        
        // Activate the first visible tab and pane
        if (firstVisibleButton) {
            firstVisibleButton.classList.add('active');
            const firstPaneId = firstVisibleButton.dataset.paneTarget;
            const firstPane = panesContainer.querySelector('#' + firstPaneId);
            if (firstPane) {
                firstPane.classList.add('active-pane');
            }
        }

        detailsWrapper.appendChild(nav);
        detailsWrapper.appendChild(panesContainer);

        // Event listener for tab navigation
        nav.addEventListener('click', (e) => {
            if (e.target.classList.contains('details-nav-button')) {
                const targetButton = e.target;
                const paneId = targetButton.dataset.paneTarget;

                // Deactivate all buttons and panes
                nav.querySelectorAll('.details-nav-button').forEach(btn => btn.classList.remove('active'));
                panesContainer.querySelectorAll('.details-tab-pane').forEach(p => p.classList.remove('active-pane'));

                // Activate clicked button and corresponding pane
                targetButton.classList.add('active');
                const targetPane = panesContainer.querySelector('#' + paneId);
                if (targetPane) {
                    targetPane.classList.add('active-pane');
                }
            }
        });

        // --- Populate Panes ---

        // 3. Tasks Pane
        const tasksPane = panesContainer.querySelector('#tasks-pane-' + project.id);
        if (tasksPane) {
            const tasksContainer = document.createElement('div');
            tasksContainer.className = 'project-tasks-bizdev project-detail-item'; // Keep existing class for now
            tasksContainer.innerHTML = '<h3>Tasks</h3>';
            const taskListEl = document.createElement('ul');
            taskListEl.className = 'task-list-bizdev';
            taskListEl.innerHTML = '<li>Loading tasks...</li>';
            tasksContainer.appendChild(taskListEl);

            const addTaskForm = document.createElement('form');
            addTaskForm.className = 'add-task-form top-level-task-form'; // Differentiate top-level form
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
                        await taskService.createTask(project.id, { text: taskText, completed: false, parentId: null }); // Explicitly null for top-level
                        taskInput.value = ''; 
                        const updatedTasks = await taskService.getTasksByProjectId(project.id, null); // Fetch top-level tasks
                        await renderTasks(updatedTasks, taskListEl, project.id, null, 0); // Rerender top-level tasks
                        showStatus('Task added successfully!', false);
                    } catch (error) {
                        console.error('Error adding task:', error);
                        showStatus('Failed to add task: ' + (error.message || 'Unknown error'), true);
                    }
                }
            });
            tasksPane.appendChild(tasksContainer);

            // Fetch and render tasks (existing logic, ensured taskListEl is from the correct pane)
            if (project && project.id && taskService && typeof taskService.getTasksByProjectId === 'function') {
                 taskService.getTasksByProjectId(project.id, null) // Fetch top-level tasks initially
                    .then(tasks => {
                        if (taskListEl && taskListEl.isConnected) { // Check if still in DOM
                            renderTasks(tasks, taskListEl, project.id, null, 0); // Initial render with level 0
                        }
                    })
                    .catch(error => {
                        console.error(`Error fetching tasks for project ${project.id} in new tab structure:`, error);
                        if (taskListEl && taskListEl.isConnected) {
                           taskListEl.innerHTML = '<li><i>Error loading tasks. Check console.</i></li>';
                        }
                    });
            }
        }

        // NEW: Description Pane
        const descriptionPane = panesContainer.querySelector('#description-pane-' + project.id);
        if (descriptionPane) {
            const descriptionContainer = document.createElement('div');
            descriptionContainer.className = 'project-description-editor project-detail-item';
            
            const descriptionTitle = document.createElement('h3');
            descriptionTitle.textContent = 'Project Description';
            descriptionContainer.appendChild(descriptionTitle);

            const descriptionTextarea = document.createElement('textarea');
            descriptionTextarea.className = 'project-description-textarea'; // Add a class for styling
            descriptionTextarea.value = project.description || '';
            descriptionTextarea.placeholder = 'Enter project description...';
            descriptionContainer.appendChild(descriptionTextarea);

            const saveDescriptionButton = document.createElement('button');
            saveDescriptionButton.textContent = 'Save Description';
            saveDescriptionButton.className = 'btn btn-primary btn-sm save-description-button'; // Add class for styling/spacing
            descriptionContainer.appendChild(saveDescriptionButton);

            saveDescriptionButton.addEventListener('click', async () => {
                const newDescription = descriptionTextarea.value.trim();
                try {
                    showStatus('Saving description...', false);
                    await projectService.updateProject(project.id, { description: newDescription });
                    project.description = newDescription; // Update local project object
                    showStatus('Description updated successfully!', false);
                } catch (error) {
                    console.error('Error updating project description:', error);
                    showStatus('Failed to update description: ' + (error.message || 'Unknown error'), true);
                }
            });
            descriptionPane.appendChild(descriptionContainer);
        }

        // 4. Detailed Ratings Pane (formerly Insights)
        const detailedRatingsPane = panesContainer.querySelector('#detailed-ratings-pane-' + project.id); // Use new ID
        if (detailedRatingsPane && !project.isIanCollaboration) { // Check if pane exists (it won't for collab)
            const ratingsTitle = document.createElement('h3');
            ratingsTitle.textContent = 'Detailed Ratings'; // Updated title
            detailedRatingsPane.appendChild(ratingsTitle);

            const viewDetailedRatingsDiv = document.createElement('div');
            viewDetailedRatingsDiv.className = 'view-detailed-ratings project-detail-item';
            detailedRatingsPane.appendChild(viewDetailedRatingsDiv);
            renderDetailedRatings(project, viewDetailedRatingsDiv); // Initial render

            const editRatingsButton = document.createElement('button');
            editRatingsButton.className = 'btn btn-secondary btn-sm btn-edit-ratings';
            editRatingsButton.textContent = 'Edit Detailed Ratings';
            detailedRatingsPane.appendChild(editRatingsButton);

            const editDetailedRatingsFormDiv = document.createElement('div');
            editDetailedRatingsFormDiv.className = 'edit-detailed-ratings-form project-detail-item';
            editDetailedRatingsFormDiv.style.display = 'none'; // Initially hidden
            detailedRatingsPane.appendChild(editDetailedRatingsFormDiv);

            editRatingsButton.addEventListener('click', () => {
                viewDetailedRatingsDiv.style.display = 'none';
                editDetailedRatingsFormDiv.style.display = 'block';
                editRatingsButton.style.display = 'none'; // Hide edit button when form is visible
                populateEditRatingsForm(project, editDetailedRatingsFormDiv, viewDetailedRatingsDiv, editRatingsButton, projectCard);
            });
        }

        // 5. Settings Pane
        const settingsPane = panesContainer.querySelector('#settings-pane-' + project.id);
        if (settingsPane) {
            const settingsHeading = document.createElement('h3'); // Use a consistent variable name
            settingsHeading.textContent = 'Project Settings';
            settingsPane.appendChild(settingsHeading);

            // Collaboration Section
            const collaborationContainer = document.createElement('div');
            collaborationContainer.className = 'project-detail-item settings-section'; // Added generic section class
            const collaborationTitle = document.createElement('h4');
            collaborationTitle.textContent = 'Collaboration Status';
            collaborationContainer.appendChild(collaborationTitle);
            
            const collabLabel = document.createElement('label');
            collabLabel.htmlFor = `collab-checkbox-${project.id}`;
            collabLabel.textContent = 'Mark as Collaboration Project: '; // Updated label
            const collabCheckbox = document.createElement('input');
            collabCheckbox.type = 'checkbox';
            collabCheckbox.id = `collab-checkbox-${project.id}`;
            collabCheckbox.className = 'inline-edit-checkbox';
            collabCheckbox.checked = project.isIanCollaboration || false;
            collabCheckbox.dataset.field = 'isIanCollaboration';
            collabCheckbox.addEventListener('change', async (e) => {
                await handleInlineEdit(project.id, 'isIanCollaboration', e.target.checked, projectCard);
                const indicator = projectCard.querySelector('.project-row .ian-collab-indicator');
                if (indicator) indicator.textContent = e.target.checked ? '🤝' : '';
            });
            collaborationContainer.appendChild(collabLabel);
            collaborationContainer.appendChild(collabCheckbox);
            settingsPane.appendChild(collaborationContainer);

            // Danger Zone - Delete Project Button
            const dangerZoneContainer = document.createElement('div');
            dangerZoneContainer.className = 'project-detail-item danger-zone settings-section'; // Added generic section class
            const dangerZoneTitle = document.createElement('h4');
            dangerZoneTitle.textContent = 'Danger Zone';
            dangerZoneContainer.appendChild(dangerZoneTitle);
            const deleteProjectButton = document.createElement('button');
            deleteProjectButton.textContent = 'Delete This Project';
            deleteProjectButton.className = 'btn btn-danger btn-sm';
            deleteProjectButton.addEventListener('click', async () => {
                if (confirm(`Are you sure you want to delete the project "${project.name}"? This action cannot be undone.`)) {
                    try {
                        await projectService.deleteProject(project.id);
                        if (projectCard && projectCard.parentNode) projectCard.remove();
                        showStatus('Project deleted successfully!', false);
                    } catch (error) {
                        console.error(`Error deleting project ${project.id}:`, error);
                        showStatus(`Failed to delete project: ` + (error.message || 'Unknown error'), true);
                    }
                }
            });
            dangerZoneContainer.appendChild(deleteProjectButton);
            settingsPane.appendChild(dangerZoneContainer);
        }

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
    
    // Apply class for styling collab list differently
    if (dataSourceKey === 'ian') {
        container.classList.add('collab-list-view');
    } else {
        container.classList.remove('collab-list-view');
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
            
            renderProjectList(dataSourceKey, listId, sortBy, dataSourceKey === 'ian'); // Pass correct filterIanCollab
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
        
        const form = event.target;
        const name = document.getElementById('newProjectName').value.trim();
        if (!name) {
            showStatus('Project name is required', true);
            return;
        }
        const ratingValue = parseFloat(document.getElementById('newProjectRating').value);
        // Allow N/A or empty rating for collaboration projects during creation
        const isCollabProject = document.getElementById('newProjectIanCollab').checked;
        if (!isCollabProject && (isNaN(ratingValue) || ratingValue < 0 || ratingValue > 5)) {
            showStatus('Rating must be between 0 and 5 for BizDev projects', true);
            return;
        }

        try {
            const newProject = {
                name: name, // Use validated name
                description: document.getElementById('newProjectDescription').value,
                rating: isNaN(ratingValue) || !document.getElementById('newProjectRating').value ? null : ratingValue,
                priority: document.getElementById('newProjectPriority').value,
                status: document.getElementById('newProjectStatus').value,
                isIanCollaboration: document.getElementById('newProjectIanCollab').checked,
                detailedRatingsData: {} // Initialize empty, can be filled later
            };
            
            // showStatus('Creating project...', false); // Optional: immediate feedback
            const createdProject = await projectService.createProject(newProject);
            
            closeModal('addProjectModal');
            form.reset(); // Reset the form using the form reference
            showStatus('Project added successfully!', false); // Success feedback
            
            // Determine which list to refresh based on the new project's collaboration status
            if (isCollabProject) {
                renderProjectList('ian', 'ian-collab-project-list', document.getElementById('sort-ian').value, true);
            } else {
                renderProjectList('bizdev', 'bizdev-project-list', document.getElementById('sort-bizdev').value, false);
            }

        } catch (error) {
            console.error('Error creating project:', error);
            showStatus('Failed to create project: ' + (error.message || 'Unknown error'), true); // Use showStatus
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