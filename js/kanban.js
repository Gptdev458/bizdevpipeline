// Kanban Board functionality
// Simple Trello-like board with 4 columns: To Do, Doing, Waiting Feedback, Done

import { taskService } from './tasks.js';

// Robust status display function
function showStatus(message, isError = false) {
    console.log(`[Kanban Status] ${isError ? 'ERROR:' : 'INFO:'} ${message}`);
    
    // Try global showStatus first
    if (typeof window.showStatus === 'function') {
        try {
            window.showStatus(message, isError);
            return;
        } catch (e) {
            console.log('Global showStatus failed, using console only:', e);
        }
    }
    
    // Fallback to console
    if (isError) {
        console.error('Kanban Error:', message);
    } else {
        console.log('Kanban Info:', message);
    }
}

// Kanban board configuration
const BOARD_COLUMNS = [
    { id: 'todo', title: 'To Do', color: '#e3f2fd' },
    { id: 'doing', title: 'Doing', color: '#fff3e0' },
    { id: 'waiting', title: 'Waiting Feedback', color: '#fce4ec' },
    { id: 'done', title: 'Done', color: '#e8f5e8' }
];

// Store instances for each container to avoid global state conflicts
const kanbanInstances = new Map();
// Make instances globally accessible for debugging
window.kanbanInstances = kanbanInstances;

// Initialize embedded Kanban board
window.initEmbeddedKanban = function(project, container) {
    console.log('=== INIT EMBEDDED KANBAN CALLED ===');
    console.log('Project:', project);
    console.log('Container:', container);
    console.log('Container connected to DOM:', container ? container.isConnected : 'no container');
    
    if (!container) {
        console.error('No container provided to initEmbeddedKanban');
        return;
    }
    
    if (!project || !project.id) {
        console.error('No valid project provided to initEmbeddedKanban');
        return;
    }
    
    // Create instance-specific data
    const instance = {
        projectId: project.id,
        container: container,
        boardData: {
            'todo': [],
            'doing': [],
            'waiting': [],
            'done': []
        },
        isEmbeddedMode: true
    };
    
    // Store instance using both container and project ID as keys for easier access
    kanbanInstances.set(container, instance);
    kanbanInstances.set(project.id, instance);
    
    console.log('Setting embedded mode. projectId:', instance.projectId);
    
    // Create kanban board HTML structure inside the container
    const kanbanHTML = `
        <div class="kanban-board" data-project-id="${project.id}">
            <div class="kanban-column" data-status="todo">
                <div class="column-header todo-header">
                    <h3>To Do <span class="task-count">0</span></h3>
                    <button class="add-card-btn" data-status="todo" data-project-id="${project.id}">+ Add Card</button>
                </div>
                <div class="cards-container" data-status="todo"></div>
            </div>
            <div class="kanban-column" data-status="doing">
                <div class="column-header doing-header">
                    <h3>Doing <span class="task-count">0</span></h3>
                    <button class="add-card-btn" data-status="doing" data-project-id="${project.id}">+ Add Card</button>
                </div>
                <div class="cards-container" data-status="doing"></div>
            </div>
            <div class="kanban-column" data-status="waiting">
                <div class="column-header waiting-header">
                    <h3>Waiting Feedback <span class="task-count">0</span></h3>
                    <button class="add-card-btn" data-status="waiting" data-project-id="${project.id}">+ Add Card</button>
                </div>
                <div class="cards-container" data-status="waiting"></div>
            </div>
            <div class="kanban-column" data-status="done">
                <div class="column-header done-header">
                    <h3>Done <span class="task-count">0</span></h3>
                    <button class="add-card-btn" data-status="done" data-project-id="${project.id}">+ Add Card</button>
                </div>
                <div class="cards-container" data-status="done"></div>
            </div>
        </div>
    `;
    
    console.log('Setting innerHTML for container...');
    container.innerHTML = kanbanHTML;
    
    // Verify DOM structure was created
    console.log('Verifying DOM structure...');
    const board = container.querySelector('.kanban-board');
    const columns = container.querySelectorAll('.kanban-column');
    const containers = container.querySelectorAll('.cards-container');
    const buttons = container.querySelectorAll('.add-card-btn');
    
    console.log('DOM verification results:', {
        board: !!board,
        columns: columns.length,
        containers: containers.length,
        buttons: buttons.length
    });
    
    if (columns.length !== 4) {
        console.error('DOM structure not created properly!');
        console.log('Container HTML after setting:', container.innerHTML.substring(0, 200) + '...');
        return;
    }
    
    console.log('✅ DOM structure created successfully');
    
    // Load tasks and render board
    console.log('Calling loadTasksAndRender...');
    loadTasksAndRender(instance);
};

// Show Kanban board (existing modal mode)
window.showKanbanBoard = function(project) {
    const kanbanView = document.getElementById('kanban-view');
    if (!kanbanView) {
        console.error('Kanban view container not found');
        return;
    }
    
    // Create instance for modal mode
    const instance = {
        projectId: project.id,
        container: kanbanView.querySelector('#kanban-container'),
        boardData: {
            'todo': [],
            'doing': [],
            'waiting': [],
            'done': []
        },
        isEmbeddedMode: false
    };
    
    // Store instance using kanban view as key
    kanbanInstances.set(kanbanView, instance);
    
    // Update project title
    const projectTitle = kanbanView.querySelector('.kanban-header h2');
    if (projectTitle) {
        projectTitle.textContent = `${project.title || project.name || 'Project'} - Kanban Board`;
    }
    
    // Create the board structure in the kanban-container
    const kanbanContainer = kanbanView.querySelector('#kanban-container');
    if (kanbanContainer) {
        const kanbanHTML = `
            <div class="kanban-board" data-project-id="${project.id}">
                <div class="kanban-column" data-status="todo">
                    <div class="column-header todo-header">
                        <h3>To Do <span class="task-count">0</span></h3>
                        <button class="add-card-btn" data-status="todo" data-project-id="${project.id}">+ Add Card</button>
                    </div>
                    <div class="cards-container" data-status="todo"></div>
                </div>
                <div class="kanban-column" data-status="doing">
                    <div class="column-header doing-header">
                        <h3>Doing <span class="task-count">0</span></h3>
                        <button class="add-card-btn" data-status="doing" data-project-id="${project.id}">+ Add Card</button>
                    </div>
                    <div class="cards-container" data-status="doing"></div>
                </div>
                <div class="kanban-column" data-status="waiting">
                    <div class="column-header waiting-header">
                        <h3>Waiting Feedback <span class="task-count">0</span></h3>
                        <button class="add-card-btn" data-status="waiting" data-project-id="${project.id}">+ Add Card</button>
                    </div>
                    <div class="cards-container" data-status="waiting"></div>
                </div>
                <div class="kanban-column" data-status="done">
                    <div class="column-header done-header">
                        <h3>Done <span class="task-count">0</span></h3>
                        <button class="add-card-btn" data-status="done" data-project-id="${project.id}">+ Add Card</button>
                    </div>
                    <div class="cards-container" data-status="done"></div>
                </div>
            </div>
        `;
        kanbanContainer.innerHTML = kanbanHTML;
    }
    
    // Show the kanban view
    kanbanView.style.display = 'block';
    
    // Load tasks and render board
    loadTasksAndRender(instance);
};

// Hide Kanban board (modal mode only)
window.hideKanbanBoard = function() {
    const kanbanView = document.getElementById('kanban-view');
    if (kanbanView) {
        kanbanView.style.display = 'none';
        // Remove instance when hiding
        kanbanInstances.delete(kanbanView);
    }
};

// Initialize Kanban board
export async function initKanbanBoard(projectId) {
    // This is for backwards compatibility - create a temp instance
    const tempContainer = document.createElement('div');
    const instance = {
        projectId: projectId,
        container: tempContainer,
        boardData: {
            'todo': [],
            'doing': [],
            'waiting': [],
            'done': []
        },
        isEmbeddedMode: false
    };
    
    await loadBoardData(instance);
    renderBoard(instance);
    setupEventListeners(instance);
}

// Load all tasks and organize by status
async function loadBoardData(instance) {
    try {
        showStatus('Loading board data...', false);
        
        // Get all tasks for the project
        const tasks = await taskService.getTasksByProjectId(instance.projectId);
        
        // Initialize board data structure
        instance.boardData = {};
        BOARD_COLUMNS.forEach(column => {
            instance.boardData[column.id] = [];
        });
        
        // Organize tasks by status
        console.log('Organizing tasks by status...');
        tasks.forEach((task, index) => {
            console.log(`Task ${index}:`, {
                id: task.id,
                text: task.text,
                title: task.title,
                status: task.status,
                projectId: task.projectId
            });
            
            // Ensure task has correct project ID
            task.projectId = instance.projectId;
            
            // Fix the status - if undefined/null, set it to 'todo' and update the task object
            const status = task.status || 'todo';
            task.status = status; // IMPORTANT: Update the task object itself
            
            if (instance.boardData[status]) {
                instance.boardData[status].push(task);
                console.log(`Added task to ${status} column`);
            } else {
                console.log(`Unknown status ${status}, adding to todo`);
                task.status = 'todo'; // Update task status to todo if unknown status
                instance.boardData['todo'].push(task); // Fallback to todo
                console.log('Added task to todo column');
            }
        });
        
        showStatus('Board loaded successfully', false);
    } catch (error) {
        console.error('Error loading board data:', error);
        showStatus('Error loading board data', true);
    }
}

// Load tasks and render board
async function loadTasksAndRender(instance) {
    console.log('loadTasksAndRender called with projectId:', instance.projectId);
    
    if (!instance.projectId) {
        console.error('No project ID available for loading tasks');
        showStatus('Error: No project selected', true);
        return;
    }
    
    try {
        showStatus('Loading tasks...', false);
        console.log('Calling taskService.getTasksByProjectId...');
        
        // Try to fetch tasks with detailed logging
        const tasks = await taskService.getTasksByProjectId(instance.projectId, null);
        console.log('Raw tasks received:', tasks);
        console.log('Number of tasks:', tasks ? tasks.length : 'null/undefined');
        
        // Initialize empty board data structure
        instance.boardData = {
            'todo': [],
            'doing': [],
            'waiting': [],
            'done': []
        };
        console.log('Initialized empty board data:', instance.boardData);
        
        // Check if we actually got tasks
        if (!tasks || !Array.isArray(tasks)) {
            console.log('No tasks array received, using empty board');
            renderBoard(instance);
            setupEventListeners(instance);
            showStatus('No tasks found - you can add new ones using the + Add Card buttons', false);
            return;
        }
        
        if (tasks.length === 0) {
            console.log('Empty tasks array received');
            renderBoard(instance);
            setupEventListeners(instance);
            showStatus('No tasks found - you can add new ones using the + Add Card buttons', false);
            return;
        }
        
        // Organize tasks by status
        console.log('Organizing tasks by status...');
        tasks.forEach((task, index) => {
            console.log(`Task ${index}:`, {
                id: task.id,
                text: task.text,
                title: task.title,
                status: task.status,
                projectId: task.projectId
            });
            
            // Ensure task has correct project ID
            task.projectId = instance.projectId;
            
            // Fix the status - if undefined/null, set it to 'todo' and update the task object
            const status = task.status || 'todo';
            task.status = status; // IMPORTANT: Update the task object itself
            
            if (instance.boardData[status]) {
                instance.boardData[status].push(task);
                console.log(`Added task to ${status} column`);
            } else {
                console.log(`Unknown status ${status}, adding to todo`);
                task.status = 'todo'; // Update task status to todo if unknown status
                instance.boardData['todo'].push(task); // Fallback to todo
                console.log('Added task to todo column');
            }
        });
        
        console.log('Final organized board data:', instance.boardData);
        console.log('Board data summary:', {
            todo: instance.boardData.todo.length,
            doing: instance.boardData.doing.length,
            waiting: instance.boardData.waiting.length,
            done: instance.boardData.done.length
        });
        
        renderBoard(instance);
        setupEventListeners(instance);
        showStatus(`Loaded ${tasks.length} tasks successfully`, false);
        
    } catch (error) {
        console.error('Error in loadTasksAndRender:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        // Initialize empty board even on error so the UI still works
        instance.boardData = {
            'todo': [],
            'doing': [],
            'waiting': [],
            'done': []
        };
        
        renderBoard(instance);
        setupEventListeners(instance);
        showStatus('Error loading tasks: ' + (error.message || 'Unknown error') + ' - but you can still add new tasks', true);
    }
}

// Render the board
function renderBoard(instance) {
    console.log('renderBoard called for project:', instance.projectId);
    console.log('Current board data:', instance.boardData);
    
    let boardContainer;
    if (instance.isEmbeddedMode) {
        boardContainer = instance.container;
    } else {
        // For modal mode, look inside the kanban-container
        const kanbanView = document.getElementById('kanban-view');
        boardContainer = kanbanView ? kanbanView.querySelector('#kanban-container') : null;
    }
    
    if (!boardContainer) {
        console.error('Board container not found');
        return;
    }
    
    console.log('Found board container:', boardContainer);
    
    Object.keys(instance.boardData).forEach(status => {
        const cardsContainer = boardContainer.querySelector(`.cards-container[data-status="${status}"]`);
        console.log(`Rendering ${status} column with ${instance.boardData[status].length} tasks`);
        
        if (cardsContainer) {
            cardsContainer.innerHTML = '';
            instance.boardData[status].forEach((task, index) => {
                console.log(`Rendering task ${index}:`, task.id, task.text);
                
                const cardElement = document.createElement('div');
                cardElement.innerHTML = renderCard(task);
                const card = cardElement.firstElementChild;
                
                if (card) {
                    // Attach drag listeners to the newly created card
                    attachDragListeners(card);
                    cardsContainer.appendChild(card);
                    console.log(`Added card ${task.id} to ${status} container`);
                } else {
                    console.error('Failed to create card element for task:', task.id);
                }
            });
            console.log(`Finished rendering ${status} column, container has ${cardsContainer.children.length} cards`);
        } else {
            console.error(`Cards container for status ${status} not found`);
        }
    });
    
    // Update task counts in headers
    updateColumnHeaders(instance, boardContainer);
    
    console.log('renderBoard completed');
}

// Render a single column
function renderColumn(column) {
    const tasks = instance.boardData[column.id] || [];
    
    return `
        <div class="kanban-column" data-status="${column.id}">
            <div class="column-header" style="background-color: ${column.color}">
                <h3>${column.title}</h3>
                <span class="task-count">${tasks.length}</span>
                <button class="add-card-btn" data-status="${column.id}">+ Add Card</button>
            </div>
            <div class="column-body" data-status="${column.id}">
                ${tasks.map(task => renderCard(task)).join('')}
            </div>
        </div>
    `;
}

// Render a single card
function renderCard(task) {
    return `
        <div class="kanban-card" draggable="true" data-task-id="${task.id}" data-project-id="${task.projectId || 'unknown'}">
            <div class="card-header">
                <span class="card-title">${task.title || task.text || 'Untitled'}</span>
                <div class="card-actions">
                    <button class="edit-card-btn" data-task-id="${task.id}" data-project-id="${task.projectId || 'unknown'}" title="Edit">✏️</button>
                    <button class="delete-card-btn" data-task-id="${task.id}" data-project-id="${task.projectId || 'unknown'}" title="Delete">🗑️</button>
                </div>
            </div>
            ${task.description ? `<div class="card-description">${task.description}</div>` : ''}
            <div class="card-footer">
                <span class="card-date">${formatDate(task.created_at)}</span>
            </div>
        </div>
    `;
}

// Add new card
async function addCard(status, projectId) {
    console.log('addCard called with status:', status, 'projectId:', projectId);
    
    // Find the correct instance for this project
    const instance = findInstanceByProjectId(projectId);
    if (!instance) {
        console.error('No instance found for project:', projectId);
        showStatus('Error: No project instance found', true);
        return;
    }
    
    const title = prompt('Enter card title:');
    if (!title) {
        console.log('User cancelled card creation');
        return;
    }
    
    const description = prompt('Enter card description (optional):') || '';
    
    try {
        showStatus('Creating card...', false);
        console.log('About to create task with title:', title, 'description:', description);
        
        // Create task with appropriate field names based on existing data structure
        const taskData = {
            text: title,        // Use 'text' field like existing tasks
            description: description,
            completed: false,
            status: status,
            position: instance.boardData[status] ? instance.boardData[status].length : 0
        };
        
        console.log('Task data to create:', taskData);
        console.log('Calling taskService.createTask...');
        
        const newTask = await taskService.createTask(instance.projectId, taskData);
        console.log('Task created successfully:', newTask);
        
        // Add to board data with fallback for missing status
        const taskStatus = newTask.status || status;
        console.log('Adding task to board with status:', taskStatus);
        
        if (!instance.boardData[taskStatus]) {
            console.log('Creating new array for status:', taskStatus);
            instance.boardData[taskStatus] = [];
        }
        instance.boardData[taskStatus].push(newTask);
        
        console.log('Updated board data:', instance.boardData);
        console.log('Board data summary after add:', {
            todo: instance.boardData.todo.length,
            doing: instance.boardData.doing.length,
            waiting: instance.boardData.waiting.length,
            done: instance.boardData.done.length
        });
        
        // Re-render the board
        console.log('Re-rendering board...');
        renderBoard(instance);
        setupEventListeners(instance);
        
        showStatus('Card created successfully', false);
    } catch (error) {
        console.error('Error creating card:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            stack: error.stack
        });
        showStatus('Error creating card: ' + (error.message || 'Unknown error'), true);
    }
}

// Edit existing card
async function editCard(taskId, projectId) {
    // Find the correct instance for this project
    const instance = findInstanceByProjectId(projectId);
    if (!instance) {
        console.error('No instance found for project:', projectId);
        return;
    }
    
    const task = findTaskById(taskId, instance);
    if (!task) return;
    
    const currentTitle = task.title || task.text || '';
    const currentDescription = task.description || '';
    
    const newTitle = prompt('Enter new title:', currentTitle) || currentTitle;
    const newDescription = prompt('Enter new description:', currentDescription) || currentDescription;
    
    if (newTitle === currentTitle && newDescription === currentDescription) {
        return; // No changes
    }
    
    try {
        showStatus('Updating card...', false);
        
        // Update with correct field names
        const updateData = {
            text: newTitle,  // Use 'text' field for consistency
            description: newDescription
        };
        
        await taskService.updateTask(instance.projectId, taskId, updateData);
        
        // Update board data
        task.text = newTitle;
        task.title = newTitle; // Keep both for compatibility
        task.description = newDescription;
        
        // Re-render the board
        renderBoard(instance);
        setupEventListeners(instance);
        
        showStatus('Card updated successfully', false);
    } catch (error) {
        console.error('Error updating card:', error);
        showStatus('Error updating card: ' + (error.message || 'Unknown error'), true);
    }
}

// Delete card
async function deleteCard(taskId, projectId) {
    // Find the correct instance for this project
    const instance = findInstanceByProjectId(projectId);
    if (!instance) {
        console.error('No instance found for project:', projectId);
        return;
    }
    
    if (!confirm('Are you sure you want to delete this card?')) {
        return;
    }
    
    try {
        showStatus('Deleting card...', false);
        
        await taskService.deleteTask(instance.projectId, taskId);
        
        // Remove from board data
        BOARD_COLUMNS.forEach(column => {
            instance.boardData[column.id] = instance.boardData[column.id].filter(task => task.id !== taskId);
        });
        
        // Re-render the board
        renderBoard(instance);
        setupEventListeners(instance);
        
        showStatus('Card deleted successfully', false);
    } catch (error) {
        console.error('Error deleting card:', error);
        showStatus('Error deleting card', true);
    }
}

// Move card to different column
async function moveCard(taskId, newStatus, projectId) {
    // Find the correct instance for this project
    const instance = findInstanceByProjectId(projectId);
    if (!instance) {
        console.error('No instance found for project:', projectId);
        return;
    }
    
    console.log('moveCard called with:', { taskId, newStatus, currentData: instance.boardData });
    
    const task = findTaskById(taskId, instance);
    if (!task) {
        console.error('Task not found:', taskId);
        return;
    }
    
    console.log('Found task:', task);
    console.log('Current task status:', task.status);
    console.log('Target status:', newStatus);
    console.log('Status comparison:', task.status === newStatus);
    
    if (task.status === newStatus) {
        console.log('Task already in target status - but this might be wrong. Checking which column it is displayed in...');
        
        // Debug: Check which column the task is actually displayed in
        Object.keys(instance.boardData).forEach(columnStatus => {
            const taskInColumn = instance.boardData[columnStatus].find(t => t.id === taskId);
            if (taskInColumn) {
                console.log(`Task is actually in ${columnStatus} column in data`);
            }
        });
        
        // Let's continue with the move anyway to fix any mismatches
        console.log('Continuing with move to fix any status/display mismatches...');
    }
    
    try {
        showStatus('Moving card...', false);
        
        // UPDATE UI FIRST for immediate visual feedback
        updateUIOnly(task, newStatus, instance);
        
        // Then update database in background
        let updateData = { status: newStatus };
        console.log('Updating task with:', updateData);
        
        try {
            await taskService.updateTask(instance.projectId, taskId, updateData);
            console.log('Status update successful');
            showStatus('Card moved successfully', false);
        } catch (statusError) {
            console.log('Database update failed, but UI was already updated:', statusError);
            
            // If status column doesn't exist, that's fine - UI was already updated
            if (statusError.message && statusError.message.includes('status')) {
                console.log('Status column not found, but UI update was successful');
                showStatus('Card moved (UI only - database columns missing)', false);
            } else {
                console.error('Unexpected database error:', statusError);
                showStatus('Card moved (database sync failed)', true);
            }
        }
        
    } catch (error) {
        console.error('Error moving card:', error);
        
        // Since we updated UI first, even if database fails, the move is visible
        showStatus('Card moved (may need refresh to sync)', true);
    }
}

// Enhanced updateUIOnly function with immediate visual update fix
function updateUIOnly(task, newStatus, instance) {
    console.log('🔥 === ENHANCED UPDATEUIONLY CALLED ===');
    console.log('Task:', task);
    console.log('New Status:', newStatus);
    console.log('Instance Project ID:', instance.projectId);
    console.log('Board data before update:', instance.boardData);
    
    const oldStatus = task.status || 'todo';
    console.log('Moving from', oldStatus, 'to', newStatus);
    
    // Find the actual DOM element being dragged
    let boardContainer;
    if (instance.isEmbeddedMode) {
        boardContainer = instance.container;
    } else {
        const kanbanView = document.getElementById('kanban-view');
        boardContainer = kanbanView ? kanbanView.querySelector('#kanban-container') : null;
    }
    
    if (!boardContainer) {
        console.error('❌ Board container not found for UI update');
        renderBoard(instance); // Fallback to full re-render
        return;
    }
    
    console.log('✅ Found board container:', boardContainer);
    
    // Find the card element by task ID AND project ID for more specificity
    const cardElement = boardContainer.querySelector(`[data-task-id="${task.id}"][data-project-id="${instance.projectId}"]`);
    console.log('🔍 Found card element:', cardElement);
    
    if (cardElement) {
        // FORCE immediate visual reset
        cardElement.style.opacity = '1';
        cardElement.style.transform = '';
        cardElement.style.transition = 'none'; // Disable transitions temporarily
        cardElement.classList.remove('dragging');
        
        // Find the correct target container within the SAME board
        const targetContainer = boardContainer.querySelector(`.cards-container[data-status="${newStatus}"]`);
        console.log('🎯 Target container found:', targetContainer);
        
        if (targetContainer) {
            console.log('📊 Container children before move:', targetContainer.children.length);
            
            // Move the card immediately
            targetContainer.appendChild(cardElement);
            
            console.log('📊 Container children after move:', targetContainer.children.length);
            console.log('✅ Card moved successfully to:', newStatus);
            
            // Add success visual feedback
            cardElement.style.animation = 'cardMoveSuccess 0.3s ease-out';
            cardElement.style.border = '2px solid #4CAF50';
            
            // Reset visual feedback after a short delay
            setTimeout(() => {
                cardElement.style.animation = '';
                cardElement.style.border = '';
            }, 300);
            
        } else {
            console.error('❌ Target container not found for status:', newStatus);
            console.log('Available containers:', boardContainer.querySelectorAll('.cards-container'));
            renderBoard(instance); // Fallback to full re-render
            return;
        }
    } else {
        console.error('❌ Card element not found, using full re-render');
        renderBoard(instance); // Fallback to full re-render
        return;
    }
    
    // Update the data structure after successful DOM manipulation
    // Remove from old column
    if (instance.boardData[oldStatus]) {
        const beforeCount = instance.boardData[oldStatus].length;
        instance.boardData[oldStatus] = instance.boardData[oldStatus].filter(t => t.id !== task.id);
        const afterCount = instance.boardData[oldStatus].length;
        console.log(`📉 Removed from ${oldStatus}: ${beforeCount} -> ${afterCount}`);
    }
    
    // Add to new column
    task.status = newStatus;
    if (!instance.boardData[newStatus]) {
        instance.boardData[newStatus] = [];
    }
    const beforeCount = instance.boardData[newStatus].length;
    instance.boardData[newStatus].push(task);
    const afterCount = instance.boardData[newStatus].length;
    console.log(`📈 Added to ${newStatus}: ${beforeCount} -> ${afterCount}`);
    
    console.log('📋 Board data after update:', instance.boardData);
    
    // Update task counts in column headers immediately
    updateColumnHeaders(instance, boardContainer);
    
    // Force a visual refresh to ensure the change is visible
    setTimeout(() => {
        updateColumnHeaders(instance, boardContainer);
    }, 50);
    
    console.log('✅ Enhanced updateUIOnly completed successfully');
}

// Helper function to update column headers with task counts
function updateColumnHeaders(instance, boardContainer) {
    console.log('Updating column headers...');
    
    Object.keys(instance.boardData).forEach(status => {
        const count = instance.boardData[status].length;
        const headerElement = boardContainer.querySelector(`[data-status="${status}"] .task-count`);
        if (headerElement) {
            headerElement.textContent = count;
            console.log(`Updated ${status} count to ${count}`);
        }
    });
}

// Helper function to find instance by project ID
function findInstanceByProjectId(projectId) {
    for (const [container, instance] of kanbanInstances) {
        if (instance.projectId === projectId) {
            return instance;
        }
    }
    return null;
}

// Setup event listeners
function setupEventListeners(instance) {
    console.log('setupEventListeners called, isEmbeddedMode:', instance.isEmbeddedMode);
    
    let boardContainer;
    if (instance.isEmbeddedMode) {
        boardContainer = instance.container;
    } else {
        // For modal mode, look inside the kanban-container
        const kanbanView = document.getElementById('kanban-view');
        boardContainer = kanbanView ? kanbanView.querySelector('#kanban-container') : null;
    }
    
    console.log('boardContainer:', boardContainer);
    
    if (!boardContainer) {
        console.error('No board container found!');
        return;
    }
    
    // Remove existing click listeners to prevent duplicates
    boardContainer.removeEventListener('click', handleBoardClick);
    
    // Add single delegated click handler for all buttons
    boardContainer.addEventListener('click', handleBoardClick);
    boardContainer.setAttribute('data-listener-attached', 'true');
    
    console.log('Event delegation set up on board container');
    
    // Set up drop zones (not individual card listeners, those are handled in renderBoard)
    const containers = boardContainer.querySelectorAll('.cards-container');
    console.log('Found drop containers:', containers.length);
    
    containers.forEach((container, index) => {
        console.log(`Container ${index}:`, {
            element: container,
            status: container.dataset.status,
            hasListener: container.hasAttribute('data-drop-listeners-attached')
        });
        
        // Always re-attach listeners to ensure they work
        // Remove old listeners first
        container.removeEventListener('dragover', handleDragOver);
        container.removeEventListener('drop', handleDrop);
        container.removeEventListener('dragenter', handleDragEnter);
        container.removeEventListener('dragleave', handleDragLeave);
        
        // Attach new listeners
        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('drop', handleDrop);
        container.addEventListener('dragenter', handleDragEnter);
        container.addEventListener('dragleave', handleDragLeave);
        
        // Mark as attached
        container.setAttribute('data-drop-listeners-attached', 'true');
        
        console.log(`Setup drop listeners for container ${index} (${container.dataset.status})`);
    });
    
    console.log('setupEventListeners completed');
}

// Centralized click handler for all board interactions
function handleBoardClick(e) {
    console.log('Board click detected:', e.target);
    
    // Handle add card buttons
    if (e.target.classList.contains('add-card-btn')) {
        e.preventDefault();
        e.stopPropagation();
        const status = e.target.dataset.status;
        console.log('Add card button clicked for status:', status);
        addCard(status, e.target.dataset.projectId);
        return;
    }
    
    // Handle edit card buttons
    if (e.target.classList.contains('edit-card-btn')) {
        e.preventDefault();
        e.stopPropagation();
        const taskId = e.target.dataset.taskId;
        console.log('Edit card button clicked for task:', taskId);
        editCard(taskId, e.target.dataset.projectId);
        return;
    }
    
    // Handle delete card buttons
    if (e.target.classList.contains('delete-card-btn')) {
        e.preventDefault();
        e.stopPropagation();
        const taskId = e.target.dataset.taskId;
        console.log('Delete card button clicked for task:', taskId);
        deleteCard(taskId, e.target.dataset.projectId);
        return;
    }
    
    console.log('Click not handled by any button handler');
}

// Helper functions
function findTaskById(taskId, instance) {
    console.log('Finding task by ID:', taskId, 'in data:', instance.boardData);
    
    // Handle both string and number IDs - but don't convert UUIDs to numbers
    for (const columnId of Object.keys(instance.boardData)) {
        const task = instance.boardData[columnId].find(t => {
            // Compare as strings first, then try numeric comparison if both are numbers
            if (t.id === taskId) return true;
            
            // Only do numeric comparison if both values can be converted to numbers
            const numericTaskId = parseInt(taskId);
            const numericTId = parseInt(t.id);
            if (!isNaN(numericTaskId) && !isNaN(numericTId) && numericTId === numericTaskId) {
                return true;
            }
            
            return false;
        });
        if (task) {
            console.log('Found task:', task);
            return task;
        }
    }
    console.log('Task not found');
    return null;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

// Export the main initialization function
export const kanbanBoard = {
    init: initKanbanBoard,
    refresh: loadBoardData
};

// Test function for debugging drag and drop
window.testKanbanDragDrop = function() {
    console.log('=== TESTING KANBAN DRAG AND DROP ===');
    
    const boardContainer = instance.isEmbeddedMode ? instance.container : document.getElementById('kanban-view');
    console.log('Board container:', boardContainer);
    
    if (!boardContainer) {
        console.error('No board container found!');
        return;
    }
    
    const cards = boardContainer.querySelectorAll('.kanban-card');
    console.log('Found cards:', cards.length);
    
    cards.forEach((card, index) => {
        console.log(`Card ${index}:`, {
            draggable: card.draggable,
            taskId: card.dataset.taskId,
            innerHTML: card.innerHTML.substring(0, 100) + '...',
            classList: Array.from(card.classList)
        });
    });
    
    const containers = boardContainer.querySelectorAll('.cards-container');
    console.log('Found containers:', containers.length);
    
    containers.forEach((container, index) => {
        console.log(`Container ${index}:`, {
            status: container.dataset.status,
            childrenCount: container.children.length
        });
    });
    
    console.log('Current board data:', instance.boardData);
    console.log('Current project ID:', currentProjectId);
    console.log('Is embedded mode:', instance.isEmbeddedMode);
    
    // Try to manually trigger drag and drop
    if (cards.length > 0) {
        const firstCard = cards[0];
        console.log('Testing drag event on first card...');
        
        // Simulate dragstart
        const dragStartEvent = new DragEvent('dragstart', {
            bubbles: true,
            cancelable: true,
            dataTransfer: new DataTransfer()
        });
        
        firstCard.dispatchEvent(dragStartEvent);
        console.log('Drag start event dispatched');
    }
    
    console.log('=== TEST COMPLETE ===');
};

// Drag and drop handlers
let draggedCard = null;

// Fixed drag start handler that actually works
function handleDragStart(e) {
    console.log('🟢 DRAGSTART EVENT FIRED!');
    
    const card = e.target.closest('.kanban-card');
    if (!card) return;
    
    // Store the dragged card globally
    draggedCard = card;
    
    const taskId = card.dataset.taskId;
    console.log('   Dragging task ID:', taskId);
    
    // Set drag data
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    
    // Add dragging class to card with proper styles
    card.classList.add('dragging');
    card.style.opacity = '0.5';
    card.style.transform = 'rotate(2deg)';
    
    // Add dragging-active class to the board for stability
    const board = card.closest('.kanban-board, .embedded-kanban-container');
    if (board) {
        board.classList.add('dragging-active');
        console.log('   Added dragging-active class to board');
    }
    
    // Store the board for cleanup
    window.currentDragBoard = board;
    
    console.log('🟢 DRAGSTART COMPLETE');
}

// Fixed drag end handler with proper cleanup
function handleDragEnd(e) {
    console.log('🏁 DRAGEND EVENT FIRED!');
    
    const card = e.target.closest('.kanban-card');
    if (card) {
        // Reset card styles properly
        card.style.opacity = '1';
        card.style.transform = '';
        card.style.transition = '';
        card.classList.remove('dragging');
        console.log('   Cleaned up dragged card styles');
    }
    
    // Reset global dragged card
    draggedCard = null;
    
    // Clean up board dragging state
    if (window.currentDragBoard) {
        window.currentDragBoard.classList.remove('dragging-active');
        console.log('   Removed dragging-active class from board');
        window.currentDragBoard = null;
    }
    
    // Clean up all drag-over states
    const allContainers = document.querySelectorAll('.cards-container');
    allContainers.forEach(container => {
        container.classList.remove('drag-over');
    });
    
    console.log('🏁 DRAGEND CLEANUP COMPLETE');
}

// Enhanced drag enter handler
function handleDragEnter(e) {
    console.log('🟠 DRAGENTER EVENT FIRED!');
    e.preventDefault();
    e.stopPropagation();
    
    const container = e.currentTarget;
    if (container && container.classList.contains('cards-container')) {
        container.classList.add('drag-over');
        console.log('   Added drag-over class to container:', container.dataset.status);
    }
}

// Enhanced drag over handler
function handleDragOver(e) {
    console.log('🟡 DRAGOVER EVENT FIRED!');
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    
    const container = e.currentTarget;
    if (container && container.classList.contains('cards-container')) {
        container.classList.add('drag-over');
    }
}

// Enhanced drag leave handler
function handleDragLeave(e) {
    console.log('🟤 DRAGLEAVE EVENT FIRED!');
    e.preventDefault();
    e.stopPropagation();
    
    const container = e.currentTarget;
    if (container && container.classList.contains('cards-container')) {
        // Only remove if we're actually leaving the container, not entering a child
        if (!container.contains(e.relatedTarget)) {
            container.classList.remove('drag-over');
            console.log('   Removed drag-over class from container:', container.dataset.status);
        }
    }
}

// Enhanced drop handler with immediate visual feedback
function handleDrop(e) {
    console.log('🔴 DROP EVENT FIRED!');
    
    e.preventDefault();
    e.stopPropagation();
    
    const dropContainer = e.currentTarget;
    const newStatus = dropContainer.dataset.status;
    
    console.log('   Drop container:', dropContainer);
    console.log('   New status:', newStatus);
    
    // Get task data from the drag event
    const taskId = e.dataTransfer.getData('text/plain');
    console.log('   Dragged task ID:', taskId);
    
    if (!taskId) {
        console.error('❌ No task ID found in drop event');
        return;
    }
    
    // Find the dragged card element
    const draggedCard = document.querySelector(`[data-task-id="${taskId}"]`);
    if (!draggedCard) {
        console.error('❌ Could not find dragged card element');
        return;
    }
    
    console.log('   Found dragged card:', draggedCard);
    
    const projectId = draggedCard.dataset.projectId;
    const currentContainer = draggedCard.parentNode;
    const currentStatus = currentContainer.dataset.status;
    
    console.log('   Project ID:', projectId);
    console.log('   Current status:', currentStatus);
    console.log('   Moving from', currentStatus, 'to', newStatus);
    
    // Don't process if dropping in the same container
    if (currentStatus === newStatus) {
        console.log('⚠️ Dropped in same container, no action needed');
        // Still need to reset the visual state
        draggedCard.style.opacity = '1';
        draggedCard.style.transform = '';
        draggedCard.classList.remove('dragging');
        return;
    }
    
    // IMMEDIATE VISUAL UPDATE - Move the card right away
    console.log('⚡ PERFORMING IMMEDIATE VISUAL UPDATE');
    
    // Remove card from current container
    console.log('   Removing from current container...');
    currentContainer.removeChild(draggedCard);
    
    // Add card to new container
    console.log('   Adding to new container...');
    dropContainer.appendChild(draggedCard);
    
    // Reset visual state immediately
    draggedCard.style.opacity = '1';
    draggedCard.style.transform = '';
    draggedCard.style.transition = 'all 0.3s ease';
    draggedCard.classList.remove('dragging');
    
    // Force browser reflow
    draggedCard.offsetHeight;
    
    // Add success animation
    draggedCard.style.animation = 'cardMoveSuccess 0.5s ease-out';
    draggedCard.style.border = '2px solid #4CAF50';
    
    // Remove animation after completion
    setTimeout(() => {
        draggedCard.style.animation = '';
        draggedCard.style.border = '';
    }, 500);
    
    console.log('✅ IMMEDIATE VISUAL UPDATE COMPLETED');
    
    // Update container counts immediately
    updateContainerCounts(dropContainer.closest('.embedded-kanban-container'));
    
    // Now update the database in the background
    console.log('💾 Updating database in background...');
    
    // Find the kanban instance
    const boardContainer = dropContainer.closest('.embedded-kanban-container');
    const instance = kanbanInstances.get(boardContainer) || kanbanInstances.get(projectId);
    
    if (instance) {
        // Create task object for update
        const task = {
            id: taskId,
            status: currentStatus,
            projectId: projectId
        };
        
        // Update database
        moveCard(taskId, newStatus, projectId).then(result => {
            console.log('✅ Database update successful:', result);
            
            // Update the instance data
            updateInstanceData(instance, task, newStatus, currentStatus);
            
        }).catch(error => {
            console.error('❌ Database update failed:', error);
            
            // Revert the visual change if database update failed
            console.log('🔄 Reverting visual change due to database error...');
            dropContainer.removeChild(draggedCard);
            currentContainer.appendChild(draggedCard);
            updateContainerCounts(boardContainer);
            
            // Show error feedback
            draggedCard.style.border = '2px solid #f44336';
            setTimeout(() => {
                draggedCard.style.border = '';
            }, 2000);
        });
    } else {
        console.error('❌ Could not find kanban instance for update');
    }
    
    console.log('🔴 DROP EVENT HANDLING COMPLETED');
}

// Debug function to test database connection and task loading
window.debugKanbanDatabase = async function() {
    console.log('=== KANBAN DATABASE DEBUG ===');
    
    if (!currentProjectId) {
        console.error('No current project ID set');
        return;
    }
    
    console.log('Current project ID:', currentProjectId);
    
    try {
        console.log('Testing basic database connection...');
        
        // Test 1: Import supabaseService through taskService module
        console.log('Test 1: Importing supabaseService...');
        const { supabaseService } = await import('./supabase.js');
        console.log('supabaseService imported:', typeof supabaseService);
        
        // Test 2: Try to fetch all tasks for this project
        console.log('Test 2: Fetching all tasks for project...');
        const allTasks = await supabaseService.fetch('tasks', { project_id: currentProjectId });
        console.log('All tasks result:', allTasks);
        
        // Test 3: Try using taskService.getTasksByProjectId
        console.log('Test 3: Using taskService.getTasksByProjectId...');
        const serviceTasks = await taskService.getTasksByProjectId(currentProjectId);
        console.log('TaskService result:', serviceTasks);
        
        // Test 4: Try to create a simple task
        console.log('Test 4: Trying to create a simple task...');
        const testTask = {
            text: 'Debug test task',
            description: 'This is a test task for debugging',
            completed: false
        };
        
        console.log('Attempting to create task with data:', testTask);
        const createdTask = await taskService.createTask(currentProjectId, testTask);
        console.log('Created task result:', createdTask);
        
        // Test 5: Check if the task appears in subsequent fetch
        console.log('Test 5: Re-fetching tasks after creation...');
        const afterCreateTasks = await taskService.getTasksByProjectId(currentProjectId);
        console.log('Tasks after creation:', afterCreateTasks);
        
        // Test 6: Check if add button event listeners are working
        console.log('Test 6: Checking add button event listeners...');
        const boardContainer = instance.isEmbeddedMode ? instance.container : document.getElementById('kanban-view');
        if (boardContainer) {
            const addButtons = boardContainer.querySelectorAll('.add-card-btn');
            console.log('Found add buttons:', addButtons.length);
            addButtons.forEach((btn, index) => {
                console.log(`Button ${index}:`, {
                    status: btn.dataset.status,
                    hasListener: btn.hasAttribute('data-listener-attached'),
                    onclick: btn.onclick
                });
            });
        }
        
    } catch (error) {
        console.error('Debug test failed:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        });
    }
    
    console.log('=== END KANBAN DATABASE DEBUG ===');
};

// Test function to check if add card buttons are working
window.testAddCardButtons = function() {
    console.log('=== TESTING ADD CARD BUTTONS ===');
    
    const boardContainer = instance.isEmbeddedMode ? instance.container : document.getElementById('kanban-view');
    if (!boardContainer) {
        console.error('No board container found');
        return;
    }
    
    const addButtons = boardContainer.querySelectorAll('.add-card-btn');
    console.log('Found add buttons:', addButtons.length);
    
    addButtons.forEach((btn, index) => {
        console.log(`Button ${index}:`, {
            element: btn,
            status: btn.dataset.status,
            text: btn.textContent,
            visible: btn.offsetParent !== null,
            disabled: btn.disabled,
            styles: window.getComputedStyle(btn).display
        });
        
        // Test click programmatically
        console.log(`Testing click on button ${index} (${btn.dataset.status})`);
        try {
            btn.click();
            console.log(`Click test successful for ${btn.dataset.status}`);
        } catch (error) {
            console.error(`Click test failed for ${btn.dataset.status}:`, error);
        }
    });
    
    console.log('Current project ID:', currentProjectId);
    console.log('Board data:', instance.boardData);
    
    console.log('=== END ADD CARD BUTTON TEST ===');
};

// Function to refresh the Kanban board
window.refreshKanbanBoard = function() {
    console.log('=== REFRESHING KANBAN BOARD ===');
    
    if (!currentProjectId) {
        console.error('No current project ID');
        return;
    }
    
    console.log('Refreshing board for project:', currentProjectId);
    loadTasksAndRender(instance);
    
    console.log('=== KANBAN BOARD REFRESHED ===');
};

// Comprehensive DOM debugging function
window.debugKanbanDOM = function() {
    console.log('=== KANBAN DOM DEBUG ===');
    
    console.log('Current project ID:', currentProjectId);
    console.log('Is embedded mode:', instance.isEmbeddedMode);
    console.log('Embedded container:', instance.container);
    
    // Check board container
    const boardContainer = instance.isEmbeddedMode ? instance.container : document.getElementById('kanban-view');
    console.log('Board container:', boardContainer);
    
    if (!boardContainer) {
        console.error('NO BOARD CONTAINER FOUND!');
        return;
    }
    
    console.log('Board container HTML:', boardContainer.innerHTML.substring(0, 500) + '...');
    console.log('Board container children:', boardContainer.children.length);
    
    // Check for kanban board structure
    const kanbanBoard = boardContainer.querySelector('.kanban-board');
    console.log('Kanban board element:', kanbanBoard);
    
    if (kanbanBoard) {
        console.log('Kanban board HTML:', kanbanBoard.innerHTML.substring(0, 500) + '...');
        
        // Check columns
        const columns = kanbanBoard.querySelectorAll('.kanban-column');
        console.log('Found columns:', columns.length);
        
        columns.forEach((column, index) => {
            const status = column.dataset.status;
            const cardsContainer = column.querySelector('.cards-container');
            const cards = cardsContainer ? cardsContainer.children : [];
            const addButton = column.querySelector('.add-card-btn');
            
            console.log(`Column ${index} (${status}):`, {
                element: column,
                status: status,
                cardsContainer: cardsContainer,
                cardCount: cards.length,
                addButton: addButton,
                addButtonText: addButton ? addButton.textContent : 'NO BUTTON',
                addButtonVisible: addButton ? addButton.offsetParent !== null : false,
                containerHTML: cardsContainer ? cardsContainer.innerHTML.substring(0, 200) : 'NO CONTAINER'
            });
            
            // Log individual cards
            for (let i = 0; i < cards.length; i++) {
                const card = cards[i];
                console.log(`  Card ${i}:`, {
                    taskId: card.dataset.taskId,
                    visible: card.offsetParent !== null,
                    text: card.textContent.substring(0, 50),
                    classes: Array.from(card.classList)
                });
            }
        });
    }
    
    // Check current board data
    console.log('Current board data:', instance.boardData);
    console.log('Board data summary:', {
        todo: instance.boardData.todo ? instance.boardData.todo.length : 'undefined',
        doing: instance.boardData.doing ? instance.boardData.doing.length : 'undefined', 
        waiting: instance.boardData.waiting ? instance.boardData.waiting.length : 'undefined',
        done: instance.boardData.done ? instance.boardData.done.length : 'undefined'
    });
    
    // Check CSS styles
    if (boardContainer) {
        const styles = window.getComputedStyle(boardContainer);
        console.log('Board container styles:', {
            display: styles.display,
            visibility: styles.visibility,
            opacity: styles.opacity,
            position: styles.position,
            zIndex: styles.zIndex
        });
    }
    
    console.log('=== END KANBAN DOM DEBUG ===');
};

// Manual render test function
window.testRenderBoard = function() {
    console.log('=== TESTING RENDER BOARD ===');
    
    if (!currentProjectId) {
        console.error('No current project ID');
        return;
    }
    
    console.log('Current board data before render:', instance.boardData);
    
    const boardContainer = instance.isEmbeddedMode ? instance.container : document.getElementById('kanban-view');
    if (!boardContainer) {
        console.error('No board container found');
        return;
    }
    
    console.log('Board container found:', boardContainer);
    
    // Manual render each status
    Object.keys(instance.boardData).forEach(status => {
        console.log(`Rendering status: ${status} with ${instance.boardData[status].length} tasks`);
        
        const cardsContainer = boardContainer.querySelector(`.cards-container[data-status="${status}"]`);
        console.log(`Cards container for ${status}:`, cardsContainer);
        
        if (cardsContainer) {
            console.log(`Before clear - container has ${cardsContainer.children.length} children`);
            cardsContainer.innerHTML = '';
            console.log(`After clear - container has ${cardsContainer.children.length} children`);
            
            instance.boardData[status].forEach((task, index) => {
                console.log(`Rendering task ${index}:`, task);
                
                const cardHTML = renderCard(task);
                console.log(`Generated card HTML:`, cardHTML);
                
                const cardElement = document.createElement('div');
                cardElement.innerHTML = cardHTML;
                const card = cardElement.firstElementChild;
                
                console.log(`Created card element:`, card);
                cardsContainer.appendChild(card);
                console.log(`Appended card to container. Container now has ${cardsContainer.children.length} children`);
            });
        } else {
            console.error(`No cards container found for status: ${status}`);
        }
    });
    
    console.log('=== END RENDER BOARD TEST ===');
};

// Test function for debugging the complete Kanban flow
window.debugKanbanComplete = function() {
    console.log('=== COMPLETE KANBAN DEBUG ===');
    console.log('1. Current state:');
    console.log('   - isEmbeddedMode:', instance.isEmbeddedMode);
    console.log('   - currentProjectId:', currentProjectId);
    console.log('   - boardData:', instance.boardData);
    
    console.log('2. DOM elements:');
    const kanbanView = document.getElementById('kanban-view');
    console.log('   - kanban-view element:', kanbanView);
    
    if (kanbanView) {
        const kanbanContainer = kanbanView.querySelector('#kanban-container');
        console.log('   - kanban-container:', kanbanContainer);
        
        if (kanbanContainer) {
            const board = kanbanContainer.querySelector('.kanban-board');
            console.log('   - kanban-board:', board);
            
            const columns = kanbanContainer.querySelectorAll('.kanban-column');
            console.log('   - kanban columns found:', columns.length);
            
            const containers = kanbanContainer.querySelectorAll('.cards-container');
            console.log('   - cards containers found:', containers.length);
            
            const buttons = kanbanContainer.querySelectorAll('.add-card-btn');
            console.log('   - add card buttons found:', buttons.length);
            
            buttons.forEach((btn, i) => {
                console.log(`   - Button ${i}:`, {
                    status: btn.dataset.status,
                    hasEventListener: btn.hasAttribute('data-listener-attached'),
                    text: btn.textContent
                });
            });
            
            const cards = kanbanContainer.querySelectorAll('.kanban-card');
            console.log('   - kanban cards found:', cards.length);
        }
    }
    
    console.log('3. Testing button click manually...');
    const firstButton = document.querySelector('.add-card-btn[data-status="todo"]');
    if (firstButton) {
        console.log('   - Found todo button, simulating click...');
        firstButton.click();
    } else {
        console.log('   - No todo button found!');
    }
};

// Test function to check task service availability
window.testTaskService = async function() {
    console.log('=== TESTING TASK SERVICE ===');
    
    console.log('1. TaskService import check:');
    console.log('   - taskService object:', taskService);
    console.log('   - taskService methods:', Object.keys(taskService || {}));
    
    if (!taskService) {
        console.error('   - ERROR: taskService is not available!');
        return;
    }
    
    console.log('2. Testing getCurrentProjectId:');
    const testProjectId = 'test-project-id';
    currentProjectId = testProjectId;
    console.log('   - Set currentProjectId to:', currentProjectId);
    
    console.log('3. Testing getTasksByProjectId:');
    if (typeof taskService.getTasksByProjectId === 'function') {
        try {
            const tasks = await taskService.getTasksByProjectId(currentProjectId);
            console.log('   - Tasks returned:', tasks);
            console.log('   - Task count:', tasks ? tasks.length : 'null/undefined');
            
            if (tasks && tasks.length > 0) {
                console.log('   - First task structure:', tasks[0]);
            }
        } catch (error) {
            console.error('   - Error getting tasks:', error);
        }
    } else {
        console.error('   - ERROR: getTasksByProjectId is not a function!');
    }
    
    console.log('4. Testing createTask (dry run):');
    if (typeof taskService.createTask === 'function') {
        console.log('   - createTask function exists');
        // Don't actually create a task, just check it exists
    } else {
        console.error('   - ERROR: createTask is not a function!');
    }
};

// Complete flow test for Kanban board
window.testKanbanFlow = async function(projectId) {
    console.log('=== TESTING COMPLETE KANBAN FLOW ===');
    
    // Create a test project object if not provided
    const testProject = {
        id: projectId || 'test-project-123',
        title: 'Test Project'
    };
    
    console.log('1. Testing showKanbanBoard function...');
    try {
        window.showKanbanBoard(testProject);
        console.log('   ✓ showKanbanBoard called successfully');
    } catch (error) {
        console.error('   ✗ Error in showKanbanBoard:', error);
        return;
    }
    
    console.log('2. Checking DOM structure after showKanbanBoard...');
    const kanbanView = document.getElementById('kanban-view');
    console.log('   - kanban-view visible:', kanbanView ? kanbanView.style.display !== 'none' : 'not found');
    
    const kanbanContainer = kanbanView ? kanbanView.querySelector('#kanban-container') : null;
    console.log('   - kanban-container found:', !!kanbanContainer);
    
    const board = kanbanContainer ? kanbanContainer.querySelector('.kanban-board') : null;
    console.log('   - kanban-board created:', !!board);
    
    const columns = board ? board.querySelectorAll('.kanban-column') : [];
    console.log('   - columns created:', columns.length);
    
    const containers = board ? board.querySelectorAll('.cards-container') : [];
    console.log('   - card containers created:', containers.length);
    
    const buttons = board ? board.querySelectorAll('.add-card-btn') : [];
    console.log('   - add buttons created:', buttons.length);
    
    if (columns.length !== 4 || containers.length !== 4 || buttons.length !== 4) {
        console.error('   ✗ DOM structure incomplete!');
        return;
    }
    
    console.log('3. Waiting for loadTasksAndRender to complete...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    
    console.log('4. Checking final state...');
    console.log('   - currentProjectId:', currentProjectId);
    console.log('   - boardData:', instance.boardData);
    
    const finalCards = board.querySelectorAll('.kanban-card');
    console.log('   - cards rendered:', finalCards.length);
    
    console.log('5. Testing add button click...');
    const todoButton = board.querySelector('.add-card-btn[data-status="todo"]');
    if (todoButton) {
        console.log('   - Found todo button, testing click event...');
        
        // Add a temporary click listener to see if events work
        todoButton.addEventListener('click', function testClick(e) {
            console.log('   ✓ Button click event fired!', e);
            todoButton.removeEventListener('click', testClick);
        });
        
        todoButton.click();
    } else {
        console.error('   ✗ Todo button not found!');
    }
    
    console.log('=== KANBAN FLOW TEST COMPLETE ===');
};

// Force test function to manually create a working Kanban board
window.forceTestKanban = function() {
    console.log('=== FORCE TESTING KANBAN ===');
    
    // 1. Create a test container
    const testContainer = document.createElement('div');
    testContainer.id = 'force-test-kanban';
    testContainer.style.cssText = `
        border: 3px solid red;
        padding: 20px;
        margin: 20px;
        background: #f9f9f9;
        min-height: 400px;
    `;
    
    // Add to top of page
    document.body.insertBefore(testContainer, document.body.firstChild);
    
    // 2. Use a real project ID from your database
    const realProject = {
        id: 'f586fc45-79d0-42d2-90a2-e082cbe5ac6c', // Product event 25.6 (has 6 tasks)
        name: 'Product event 25.6'
    };
    
    console.log('1. Creating test container and project...');
    console.log('Test container created:', testContainer);
    console.log('Using real project:', realProject);
    
    // 3. Force initialize embedded Kanban
    console.log('2. Calling initEmbeddedKanban...');
    window.initEmbeddedKanban(realProject, testContainer);
    
    // 4. Wait and then test functionality
    setTimeout(() => {
        console.log('3. Testing after 2 seconds...');
        
        const board = testContainer.querySelector('.kanban-board');
        const buttons = testContainer.querySelectorAll('.add-card-btn');
        const cards = testContainer.querySelectorAll('.kanban-card');
        
        console.log('Final test results:', {
            board: !!board,
            buttons: buttons.length,
            cards: cards.length,
            boardData: instance.boardData,
            currentProjectId: currentProjectId,
            isEmbeddedMode: instance.isEmbeddedMode
        });
        
        if (buttons.length > 0) {
            console.log('✅ Found buttons! Testing click...');
            
            // Add a manual event listener to test
            const firstButton = buttons[0];
            console.log('First button:', firstButton);
            console.log('Button status:', firstButton.dataset.status);
            
            // Test manual click
            console.log('Simulating button click...');
            firstButton.click();
        } else {
            console.log('❌ No buttons found');
        }
        
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '❌ Close Test';
        closeBtn.style.cssText = 'position: absolute; top: 5px; right: 5px; z-index: 1000;';
        closeBtn.onclick = () => testContainer.remove();
        testContainer.style.position = 'relative';
        testContainer.appendChild(closeBtn);
        
    }, 3000);
};

// Debug function to compare real UI vs test environment
window.debugRealKanbanUI = function() {
    console.log('=== DEBUGGING REAL KANBAN UI ===');
    
    // Check if we're in embedded mode and what container we're using
    console.log('1. Current state:');
    console.log('   - isEmbeddedMode:', instance.isEmbeddedMode);
    console.log('   - embeddedContainer:', instance.container);
    console.log('   - currentProjectId:', currentProjectId);
    
    // Find any kanban boards in the real UI
    console.log('2. Looking for Kanban boards in the DOM...');
    const allKanbanBoards = document.querySelectorAll('.kanban-board');
    console.log('   - Found kanban boards:', allKanbanBoards.length);
    
    allKanbanBoards.forEach((board, index) => {
        console.log(`   Board ${index}:`, {
            element: board,
            parent: board.parentElement,
            visible: board.offsetParent !== null,
            style: board.style.cssText,
            computedStyle: window.getComputedStyle(board).display
        });
        
        // Check buttons in this board
        const buttons = board.querySelectorAll('.add-card-btn');
        console.log(`   Board ${index} buttons:`, buttons.length);
        buttons.forEach((btn, btnIndex) => {
            console.log(`     Button ${btnIndex}:`, {
                element: btn,
                visible: btn.offsetParent !== null,
                style: btn.style.cssText,
                computedStyle: window.getComputedStyle(btn).display,
                hasEventListener: btn.hasAttribute('data-listener-attached') || btn.dataset.listenerAttached
            });
        });
    });
    
    // Check for any overlapping elements that might block clicks
    console.log('3. Checking for potential click blockers...');
    const buttons = document.querySelectorAll('.add-card-btn');
    buttons.forEach((btn, index) => {
        const rect = btn.getBoundingClientRect();
        const elementAtCenter = document.elementFromPoint(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2
        );
        console.log(`   Button ${index} click test:`, {
            button: btn,
            boundingRect: rect,
            elementAtCenter: elementAtCenter,
            isClickable: elementAtCenter === btn || btn.contains(elementAtCenter)
        });
    });
    
    // Check for CSS issues
    console.log('4. CSS Analysis...');
    const kanbanContainers = document.querySelectorAll('[class*="kanban"]');
    kanbanContainers.forEach((container, index) => {
        const styles = window.getComputedStyle(container);
        console.log(`   Container ${index}:`, {
            element: container,
            zIndex: styles.zIndex,
            position: styles.position,
            pointerEvents: styles.pointerEvents,
            overflow: styles.overflow
        });
    });
};

// Manual button test for real UI
window.testRealButtons = function() {
    console.log('=== TESTING REAL UI BUTTONS ===');
    
    const buttons = document.querySelectorAll('.add-card-btn');
    console.log('Found buttons:', buttons.length);
    
    if (buttons.length === 0) {
        console.log('❌ No buttons found! Kanban might not be initialized.');
        return;
    }
    
    buttons.forEach((btn, index) => {
        console.log(`Testing button ${index}:`, btn);
        console.log('  - Text:', btn.textContent);
        console.log('  - Status:', btn.dataset.status);
        console.log('  - Visible:', btn.offsetParent !== null);
        console.log('  - Parent:', btn.parentElement);
        
        // Try to click it
        console.log('  - Attempting click...');
        try {
            btn.click();
            console.log('  ✅ Click successful');
        } catch (error) {
            console.log('  ❌ Click failed:', error);
        }
    });
};

// Test function to verify multiple board support
window.testMultipleBoardsFix = function() {
    console.log('=== TESTING MULTIPLE BOARDS FIX ===');
    
    console.log('Number of Kanban instances:', kanbanInstances.size);
    
    let instanceIndex = 0;
    for (const [container, instance] of kanbanInstances) {
        console.log(`Instance ${instanceIndex}:`, {
            projectId: instance.projectId,
            containerElement: container,
            taskCounts: {
                todo: instance.boardData.todo.length,
                doing: instance.boardData.doing.length,
                waiting: instance.boardData.waiting.length,
                done: instance.boardData.done.length
            }
        });
        
        // Test if buttons exist and have correct project IDs
        const buttons = container.querySelectorAll('.add-card-btn');
        console.log(`  Buttons found: ${buttons.length}`);
        buttons.forEach((btn, btnIndex) => {
            console.log(`    Button ${btnIndex}: status=${btn.dataset.status}, projectId=${btn.dataset.projectId}`);
        });
        
        instanceIndex++;
    }
    
    console.log('=== TEST COMPLETE ===');
};

// Test drag listeners on cards
window.testDragListeners = function() {
    console.log('=== TESTING DRAG LISTENERS ===');
    
    // Find any Kanban board
    const allCards = document.querySelectorAll('.kanban-card');
    console.log('Total cards found:', allCards.length);
    
    allCards.forEach((card, index) => {
        const hasDataAttr = card.hasAttribute('data-listener-attached');
        const taskId = card.dataset.taskId;
        const projectId = card.dataset.projectId;
        
        console.log(`Card ${index}:`, {
            taskId: taskId,
            projectId: projectId,
            draggable: card.draggable,
            hasListenerAttr: hasDataAttr,
            hasOnDragStart: card.ondragstart !== null,
            eventListenersCount: getEventListeners ? getEventListeners(card) : 'N/A'
        });
        
        // Test if dragstart works
        console.log(`Testing dragstart on card ${index}...`);
        try {
            const event = new DragEvent('dragstart', {
                bubbles: true,
                cancelable: true,
                dataTransfer: new DataTransfer()
            });
            const result = card.dispatchEvent(event);
            console.log(`Dragstart dispatch result:`, result);
        } catch (e) {
            console.log(`Dragstart test failed:`, e.message);
        }
    });
    
    console.log('=== TEST COMPLETE ===');
};

// Fix: Attach drag listeners to individual card
function attachDragListeners(card) {
    // Always re-attach listeners to ensure they work
    // Remove old listeners first
    card.removeEventListener('dragstart', handleDragStart);
    card.removeEventListener('dragend', handleDragEnd);
    
    // Set draggable attribute
    card.setAttribute('draggable', 'true');
    card.draggable = true; // Set property as well
    
    // Attach new listeners
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    
    // Mark as attached
    card.setAttribute('data-drag-listeners-attached', 'true');
    
    console.log('Attached drag listeners to card:', card.dataset.taskId, 'draggable:', card.draggable);
}

// Debug function to check task status vs display column
window.debugTaskLocations = function() {
    console.log('=== DEBUGGING TASK LOCATIONS ===');
    
    // Find all kanban instances
    for (const [container, instance] of kanbanInstances) {
        console.log(`\nProject: ${instance.projectId}`);
        
        // Check data structure
        Object.keys(instance.boardData).forEach(status => {
            const tasks = instance.boardData[status];
            console.log(`Data - ${status} column: ${tasks.length} tasks`);
            tasks.forEach(task => {
                console.log(`  Task ${task.id}: status="${task.status}", text="${task.text}"`);
            });
        });
        
        // Check visual display
        const boardContainer = instance.container;
        Object.keys(instance.boardData).forEach(status => {
            const visualColumn = boardContainer.querySelector(`.cards-container[data-status="${status}"]`);
            if (visualColumn) {
                const visualCards = visualColumn.querySelectorAll('.kanban-card');
                console.log(`Visual - ${status} column: ${visualCards.length} cards displayed`);
                visualCards.forEach(card => {
                    const taskId = card.dataset.taskId;
                    const title = card.querySelector('.card-title')?.textContent || 'No title';
                    console.log(`  Visual card ${taskId}: "${title}"`);
                });
            }
        });
    }
    
    console.log('=== DEBUG COMPLETE ===');
};

// Test drag functionality
window.testDragFunctionality = function() {
    console.log('=== TESTING DRAG FUNCTIONALITY ===');
    
    const allCards = document.querySelectorAll('.kanban-card');
    console.log('Found cards:', allCards.length);
    
    if (allCards.length === 0) {
        console.log('❌ No cards found to test!');
        return;
    }
    
    const firstCard = allCards[0];
    console.log('Testing first card:', {
        id: firstCard.dataset.taskId,
        draggable: firstCard.draggable,
        hasListeners: firstCard.hasAttribute('data-drag-listeners-attached')
    });
    
    // Test if drag events work
    console.log('Triggering dragstart event...');
    try {
        const dragEvent = new DragEvent('dragstart', {
            bubbles: true,
            cancelable: true,
            dataTransfer: new DataTransfer()
        });
        
        const result = firstCard.dispatchEvent(dragEvent);
        console.log('Dragstart event result:', result);
    } catch (e) {
        console.error('Drag test failed:', e);
    }
    
    console.log('=== DRAG TEST COMPLETE ===');
};

// Force re-attach all drag listeners
window.fixDragListeners = function() {
    console.log('=== FIXING DRAG LISTENERS ===');
    
    const allCards = document.querySelectorAll('.kanban-card');
    console.log('Found cards to fix:', allCards.length);
    
    allCards.forEach((card, index) => {
        console.log(`Fixing card ${index}:`, card.dataset.taskId);
        
        // Remove old attribute if exists
        card.removeAttribute('data-drag-listeners-attached');
        
        // Re-attach listeners
        attachDragListeners(card);
        
        console.log(`Fixed card ${index} - draggable: ${card.draggable}`);
    });
    
    console.log('=== ALL DRAG LISTENERS FIXED ===');
};

// Test function to check current drag and drop state
window.testDragAndDrop = function() {
    console.log('=== DRAG AND DROP TEST ===');
    
    const allCards = document.querySelectorAll('.kanban-card');
    const allContainers = document.querySelectorAll('.cards-container');
    
    console.log('Found cards:', allCards.length);
    console.log('Found containers:', allContainers.length);
    
    // Check if cards have drag listeners
    allCards.forEach((card, index) => {
        console.log(`Card ${index}:`, {
            taskId: card.dataset.taskId,
            draggable: card.draggable,
            hasDataAttribute: card.hasAttribute('data-drag-listeners-attached'),
            opacity: card.style.opacity || 'default'
        });
    });
    
    // Check if containers have drop listeners
    allContainers.forEach((container, index) => {
        console.log(`Container ${index}:`, {
            status: container.dataset.status,
            hasDropListeners: container.hasAttribute('data-drop-listeners-attached'),
            childCount: container.children.length
        });
    });
    
    // Test if we can manually trigger a drag event
    if (allCards.length > 0) {
        const testCard = allCards[0];
        console.log('Testing manual drag on first card...');
        
        // Test dragstart
        try {
            const dragStartEvent = new Event('dragstart', { bubbles: true, cancelable: true });
            testCard.dispatchEvent(dragStartEvent);
            console.log('✅ Dragstart event fired');
        } catch (e) {
            console.error('❌ Dragstart failed:', e);
        }
    }
    
    console.log('=== TEST COMPLETE ===');
};

// Comprehensive drag and drop debugging function
window.debugDragDropComplete = function() {
    console.log('🔍 === COMPREHENSIVE DRAG AND DROP DEBUG ===');
    
    // 1. Check if kanban instances exist
    console.log('📋 Kanban Instances:', kanbanInstances.size);
    for (const [container, instance] of kanbanInstances) {
        console.log(`   Instance for project ${instance.projectId}:`, {
            isEmbedded: instance.isEmbeddedMode,
            container: container,
            taskCounts: {
                todo: instance.boardData.todo?.length || 0,
                doing: instance.boardData.doing?.length || 0,
                waiting: instance.boardData.waiting?.length || 0,
                done: instance.boardData.done?.length || 0
            }
        });
    }
    
    // 2. Check all cards
    const allCards = document.querySelectorAll('.kanban-card');
    console.log(`🎴 Found ${allCards.length} cards total`);
    
    allCards.forEach((card, index) => {
        const taskId = card.dataset.taskId;
        const projectId = card.dataset.projectId;
        const isDraggable = card.draggable;
        const hasListeners = card.hasAttribute('data-drag-listeners-attached');
        
        console.log(`   Card ${index} (ID: ${taskId}):`, {
            draggable: isDraggable,
            hasListeners: hasListeners,
            projectId: projectId,
            parentColumn: card.parentElement?.dataset?.status || 'unknown'
        });
        
        // Test if event listeners are working
        const hasEventListeners = card.ondragstart !== null || 
                                 card.addEventListener === Element.prototype.addEventListener;
        console.log(`     Event capability: ${hasEventListeners}`);
    });
    
    // 3. Check all drop containers
    const allContainers = document.querySelectorAll('.cards-container');
    console.log(`📦 Found ${allContainers.length} drop containers`);
    
    allContainers.forEach((container, index) => {
        const status = container.dataset.status;
        const hasDropListeners = container.hasAttribute('data-drop-listeners-attached');
        const childCount = container.children.length;
        
        console.log(`   Container ${index} (${status}):`, {
            hasDropListeners: hasDropListeners,
            childCount: childCount,
            display: window.getComputedStyle(container).display
        });
    });
    
    // 4. Test drag functionality manually
    if (allCards.length > 0) {
        console.log('🧪 Testing drag functionality...');
        const testCard = allCards[0];
        const taskId = testCard.dataset.taskId;
        
        console.log(`   Testing card ID: ${taskId}`);
        
        // Create a proper DataTransfer object
        try {
            const dragEvent = new DragEvent('dragstart', {
                bubbles: true,
                cancelable: true,
                dataTransfer: new DataTransfer()
            });
            
            console.log('   Dispatching dragstart event...');
            const result = testCard.dispatchEvent(dragEvent);
            console.log(`   ✅ Dragstart event result: ${result}`);
        } catch (e) {
            console.error('   ❌ Dragstart test failed:', e.message);
        }
    }
    
    // 5. Test drop functionality
    if (allContainers.length > 0) {
        console.log('🎯 Testing drop functionality...');
        const testContainer = allContainers[0];
        const status = testContainer.dataset.status;
        
        try {
            // Create drop event with fake data
            const dropEvent = new DragEvent('drop', {
                bubbles: true,
                cancelable: true,
                dataTransfer: new DataTransfer()
            });
            
            // Add fake task ID to dataTransfer
            dropEvent.dataTransfer.setData('text/plain', 'test-task-id');
            
            console.log(`   Testing drop on ${status} container...`);
            const result = testContainer.dispatchEvent(dropEvent);
            console.log(`   ✅ Drop event result: ${result}`);
        } catch (e) {
            console.error('   ❌ Drop test failed:', e.message);
        }
    }
    
    // 6. Check for common issues
    console.log('🔧 Checking for common issues...');
    
    // Check if CSS is preventing interactions
    allCards.forEach((card, index) => {
        const styles = window.getComputedStyle(card);
        if (styles.pointerEvents === 'none') {
            console.warn(`   ⚠️ Card ${index} has pointer-events: none`);
        }
        if (styles.display === 'none') {
            console.warn(`   ⚠️ Card ${index} is hidden`);
        }
    });
    
    // Check if containers are properly positioned
    allContainers.forEach((container, index) => {
        const styles = window.getComputedStyle(container);
        if (styles.display === 'none') {
            console.warn(`   ⚠️ Container ${index} is hidden`);
        }
    });
    
    console.log('🔍 === DEBUG COMPLETE ===');
    console.log('💡 To test manually: Try dragging a card and watch console for events');
};

// Quick fix function for common issues
window.fixDragDropIssues = function() {
    console.log('🔧 === FIXING DRAG AND DROP ISSUES ===');
    
    const allCards = document.querySelectorAll('.kanban-card');
    const allContainers = document.querySelectorAll('.cards-container');
    
    console.log(`Fixing ${allCards.length} cards and ${allContainers.length} containers...`);
    
    // Fix cards
    allCards.forEach((card, index) => {
        // Reset drag listeners
        card.removeAttribute('data-drag-listeners-attached');
        card.draggable = true;
        
        // Re-attach listeners
        if (typeof attachDragListeners === 'function') {
            attachDragListeners(card);
        } else {
            // Fallback manual attachment
            card.addEventListener('dragstart', handleDragStart);
            card.addEventListener('dragend', handleDragEnd);
            card.setAttribute('data-drag-listeners-attached', 'true');
        }
        
        console.log(`   ✅ Fixed card ${index}`);
    });
    
    // Fix containers
    allContainers.forEach((container, index) => {
        // Reset drop listeners
        container.removeAttribute('data-drop-listeners-attached');
        
        // Re-attach listeners
        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('drop', handleDrop);
        container.addEventListener('dragenter', handleDragEnter);
        container.addEventListener('dragleave', handleDragLeave);
        container.setAttribute('data-drop-listeners-attached', 'true');
        
        console.log(`   ✅ Fixed container ${index} (${container.dataset.status})`);
    });
    
    console.log('🔧 === FIX COMPLETE ===');
    console.log('🧪 Now try: debugDragDropComplete() to verify the fixes');
};

// Real-time drag and drop monitor
window.monitorDragDrop = function() {
    console.clear();
    console.log('🎯 === REAL-TIME DRAG DROP MONITOR ACTIVE ===');
    console.log('💡 Now try dragging a card and watch what happens...');
    
    // Override the updateUIOnly function temporarily to add more logging
    const originalUpdateUIOnly = window.updateUIOnly || updateUIOnly;
    
    window.updateUIOnly = function(task, newStatus, instance) {
        console.log('🔥 === UPDATEUIONLY CALLED ===');
        console.log('Task:', task);
        console.log('New Status:', newStatus);
        console.log('Instance Project ID:', instance.projectId);
        console.log('Instance Container:', instance.container);
        
        // Call the original function and watch what happens
        const result = originalUpdateUIOnly.call(this, task, newStatus, instance);
        
        // Check if the card actually moved visually
        setTimeout(() => {
            const allCards = document.querySelectorAll(`[data-task-id="${task.id}"]`);
            console.log('🔍 Cards with this ID after move:', allCards.length);
            allCards.forEach((card, index) => {
                const parent = card.closest('.cards-container');
                console.log(`Card ${index} is in container with status:`, parent?.dataset?.status || 'unknown');
                console.log(`Card ${index} parent container:`, parent);
            });
        }, 100);
        
        return result;
    };
    
    console.log('🎯 Monitor is active - drag a card now!');
};

// Test drop container functionality
window.testContainers = function() {
    console.clear();
    console.log('🧪 === TESTING DROP CONTAINERS ===');
    
    const containers = document.querySelectorAll('.cards-container');
    console.log(`Found ${containers.length} containers`);
    
    containers.forEach((container, index) => {
        console.log(`Container ${index}:`, {
            status: container.dataset.status,
            hasDropListeners: container.hasAttribute('data-drop-listeners-attached'),
            position: container.getBoundingClientRect(),
            visible: container.offsetParent !== null
        });
        
        // Add a temporary click test
        const testClickHandler = function(e) {
            console.log(`✅ Container ${index} (${container.dataset.status}) is clickable!`);
            container.removeEventListener('click', testClickHandler);
        };
        container.addEventListener('click', testClickHandler);
    });
    
    console.log('🖱️ Try clicking on any of the drop containers to test if they receive events');
};

// Comprehensive test function to validate visual updates
window.testVisualUpdate = function() {
    console.log('🧪 === COMPREHENSIVE VISUAL UPDATE TEST ===');
    
    // Find all embedded kanban boards
    const embeddedBoards = document.querySelectorAll('.embedded-kanban-container');
    console.log(`Found ${embeddedBoards.length} embedded kanban boards`);
    
    embeddedBoards.forEach((board, index) => {
        console.log(`\n📋 Testing board ${index + 1}:`);
        
        // Find all cards in this board
        const cards = board.querySelectorAll('.kanban-card');
        console.log(`  Found ${cards.length} cards`);
        
        if (cards.length > 0) {
            const testCard = cards[0]; // Use first card for testing
            const taskId = testCard.dataset.taskId;
            const projectId = testCard.dataset.projectId;
            
            console.log(`  Testing card: ${taskId} (project: ${projectId})`);
            
            // Get current container
            const currentContainer = testCard.closest('.cards-container');
            const currentStatus = currentContainer ? currentContainer.dataset.status : 'unknown';
            console.log(`  Current status: ${currentStatus}`);
            
            // Find different target status
            const containers = board.querySelectorAll('.cards-container');
            let targetStatus = null;
            containers.forEach(container => {
                const status = container.dataset.status;
                if (status !== currentStatus) {
                    targetStatus = status;
                }
            });
            
            if (targetStatus) {
                console.log(`  Will test move to: ${targetStatus}`);
                
                // Find the instance for this project
                const instance = findInstanceByProjectId(projectId);
                if (instance) {
                    console.log(`  Found instance for project ${projectId}`);
                    
                    // Find the task in the instance data
                    const task = findTaskById(taskId, instance);
                    if (task) {
                        console.log(`  Found task in instance data:`, task);
                        
                        // Test the visual update
                        console.log(`  🎯 Testing visual update...`);
                        updateUIOnly(task, targetStatus, instance);
                        
                        // Verify the result
                        setTimeout(() => {
                            const newContainer = testCard.closest('.cards-container');
                            const newStatus = newContainer ? newContainer.dataset.status : 'unknown';
                            console.log(`  ✅ Card moved to: ${newStatus}`);
                            console.log(`  Expected: ${targetStatus}, Actual: ${newStatus}`);
                            console.log(`  Success: ${newStatus === targetStatus ? '✅' : '❌'}`);
                        }, 100);
                        
                    } else {
                        console.log(`  ❌ Task not found in instance data`);
                    }
                } else {
                    console.log(`  ❌ Instance not found for project ${projectId}`);
                }
            } else {
                console.log(`  ⚠️ No other containers found for testing`);
            }
        }
    });
};

// Quick fix function for visual update issues
window.fixVisualUpdates = function() {
    console.log('🔧 === FIXING VISUAL UPDATE ISSUES ===');
    
    // Re-attach all event listeners
    kanbanInstances.forEach((instance, container) => {
        console.log(`Fixing instance for project ${instance.projectId}`);
        setupEventListeners(instance);
    });
    
    // Force refresh all boards
    kanbanInstances.forEach((instance, container) => {
        console.log(`Re-rendering board for project ${instance.projectId}`);
        renderBoard(instance);
        setupEventListeners(instance);
    });
    
    console.log('✅ Visual update fixes applied');
};

// Monitor visual updates in real-time
window.monitorVisualUpdates = function() {
    console.log('👀 === MONITORING VISUAL UPDATES ===');
    
    // Monitor DOM mutations
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                const target = mutation.target;
                if (target.classList.contains('cards-container')) {
                    const status = target.dataset.status;
                    console.log(`📝 Container "${status}" children changed:`, {
                        added: mutation.addedNodes.length,
                        removed: mutation.removedNodes.length,
                        total: target.children.length
                    });
                }
            }
        });
    });
    
    // Observe all card containers
    const containers = document.querySelectorAll('.cards-container');
    containers.forEach(container => {
        observer.observe(container, { childList: true });
    });
    
    console.log(`👀 Monitoring ${containers.length} containers for changes`);
    
    // Stop monitoring after 30 seconds
    setTimeout(() => {
        observer.disconnect();
        console.log('👀 Monitoring stopped');
    }, 30000);
};

// Simple visual verification function
window.verifyDragDrop = function() {
    console.log('🔍 === VERIFYING DRAG AND DROP FUNCTIONALITY ===');
    
    // Find a board with cards
    const boards = document.querySelectorAll('.embedded-kanban-container');
    console.log(`Found ${boards.length} kanban boards`);
    
    let workingBoard = null;
    let testCard = null;
    
    for (let board of boards) {
        const cards = board.querySelectorAll('.kanban-card');
        if (cards.length > 0) {
            workingBoard = board;
            testCard = cards[0];
            break;
        }
    }
    
    if (!workingBoard || !testCard) {
        console.log('❌ No boards with cards found for testing');
        return;
    }
    
    const projectId = workingBoard.id.replace('embedded-kanban-', '');
    const taskId = testCard.dataset.taskId;
    
    console.log(`📋 Testing board: ${projectId}`);
    console.log(`🎯 Testing card: ${taskId}`);
    
    // Get current container
    const currentContainer = testCard.closest('.cards-container');
    const currentStatus = currentContainer.dataset.status;
    console.log(`📍 Card currently in: ${currentStatus}`);
    
    // Find different status containers
    const containers = workingBoard.querySelectorAll('.cards-container');
    const statuses = Array.from(containers).map(c => c.dataset.status);
    console.log(`📊 Available containers: ${statuses.join(', ')}`);
    
    // Pick a different status to move to
    const targetStatus = statuses.find(s => s !== currentStatus);
    if (!targetStatus) {
        console.log('❌ No different container found for testing');
        return;
    }
    
    console.log(`🎯 Will move card from ${currentStatus} to ${targetStatus}`);
    
    // Take a screenshot of current state
    console.log('📸 BEFORE MOVE:');
    statuses.forEach(status => {
        const container = workingBoard.querySelector(`[data-status="${status}"]`);
        const cardCount = container.children.length;
        console.log(`  ${status}: ${cardCount} cards`);
    });
    
    // Simulate the move
    const instance = findInstanceByProjectId(projectId);
    if (instance) {
        const task = findTaskById(taskId, instance);
        if (task) {
            console.log('🔄 Simulating card move...');
            updateUIOnly(task, targetStatus, instance);
            
            // Check result after a delay
            setTimeout(() => {
                console.log('📸 AFTER MOVE:');
                statuses.forEach(status => {
                    const container = workingBoard.querySelector(`[data-status="${status}"]`);
                    const cardCount = container.children.length;
                    console.log(`  ${status}: ${cardCount} cards`);
                });
                
                const newContainer = testCard.closest('.cards-container');
                const newStatus = newContainer ? newContainer.dataset.status : 'unknown';
                console.log(`✅ Card is now in: ${newStatus}`);
                console.log(`🎯 Expected: ${targetStatus}, Actual: ${newStatus}`);
                console.log(`🏆 SUCCESS: ${newStatus === targetStatus ? 'YES' : 'NO'}`);
                
                // Move it back
                setTimeout(() => {
                    console.log('🔄 Moving card back...');
                    updateUIOnly(task, currentStatus, instance);
                }, 2000);
            }, 500);
        }
    }
};

// Function to highlight cards and make movement more visible
window.highlightMovement = function() {
    console.log('🌟 === HIGHLIGHTING KANBAN CARDS ===');
    
    // Add bright colors to all cards and containers
    const style = document.createElement('style');
    style.id = 'kanban-highlight-style';
    style.textContent = `
        .kanban-card {
            border: 3px solid #ff0000 !important;
            background: linear-gradient(45deg, #ffeb3b, #4caf50) !important;
            color: #000 !important;
            font-weight: bold !important;
            box-shadow: 0 4px 8px rgba(255,0,0,0.5) !important;
            transition: all 0.3s ease !important;
        }
        .cards-container {
            border: 4px dashed #2196f3 !important;
            background: rgba(33,150,243,0.1) !important;
            min-height: 100px !important;
        }
        .cards-container[data-status="todo"] {
            background: rgba(255,0,0,0.1) !important;
        }
        .cards-container[data-status="doing"] {
            background: rgba(255,193,7,0.1) !important;
        }
        .cards-container[data-status="waiting"] {
            background: rgba(156,39,176,0.1) !important;
        }
        .cards-container[data-status="done"] {
            background: rgba(76,175,80,0.1) !important;
        }
        .kanban-card:hover {
            transform: scale(1.1) !important;
            border-color: #00ff00 !important;
        }
    `;
    
    // Remove existing style if present
    const existing = document.getElementById('kanban-highlight-style');
    if (existing) existing.remove();
    
    document.head.appendChild(style);
    
    console.log('🌟 Cards and containers are now highlighted!');
    console.log('🔄 Now try dragging a card and watch it move!');
    
    // Auto-remove highlighting after 30 seconds
    setTimeout(() => {
        style.remove();
        console.log('🌟 Highlighting removed');
    }, 30000);
};

// Duplicate function removed - using the original updateColumnHeaders function

// Force immediate visual update test
window.forceVisualUpdate = function() {
    console.log('🚀 === FORCING VISUAL UPDATE TEST ===');
    
    // Find first card to test with
    const card = document.querySelector('.kanban-card');
    if (!card) {
        console.log('❌ No cards found');
        return;
    }
    
    const taskId = card.dataset.taskId;
    const projectId = card.dataset.projectId;
    const currentStatus = card.closest('.cards-container').dataset.status;
    
    console.log('🎯 Testing card:', taskId, 'in project:', projectId, 'current status:', currentStatus);
    
    // Determine new status
    const statusMap = {
        'todo': 'doing',
        'doing': 'done', 
        'done': 'todo'
    };
    const newStatus = statusMap[currentStatus];
    
    console.log('🔄 Moving from', currentStatus, 'to', newStatus);
    
    // Get the instance
    const embeddedContainer = card.closest('.embedded-kanban-container');
    const instanceId = embeddedContainer ? embeddedContainer.id.replace('embedded-kanban-', '') : null;
    
    if (instanceId && window.kanbanInstances && window.kanbanInstances[instanceId]) {
        const instance = window.kanbanInstances[instanceId];
        const task = { id: taskId, status: currentStatus };
        
        // Force immediate visual update
        updateUIOnly(task, newStatus, instance);
        
        console.log('✅ Forced visual update completed');
    } else {
        console.log('❌ Could not find kanban instance');
    }
};

// Debug DOM structure to find visual update issues
window.debugDOMStructure = function() {
    console.log('🔬 === ANALYZING DOM STRUCTURE ===');
    
    // Find all embedded kanban boards
    const boards = document.querySelectorAll('.embedded-kanban-container');
    console.log(`Found ${boards.length} embedded kanban boards`);
    
    boards.forEach((board, index) => {
        console.log(`\n📋 Board ${index + 1} (${board.id}):`);
        
        // Check containers
        const containers = board.querySelectorAll('.cards-container');
        console.log(`  Found ${containers.length} containers`);
        
        containers.forEach(container => {
            const status = container.dataset.status;
            const cards = container.querySelectorAll('.kanban-card');
            console.log(`  📦 ${status}: ${cards.length} cards`);
            
            // Log each card's details
            cards.forEach((card, cardIndex) => {
                console.log(`    🎴 Card ${cardIndex + 1}:`, {
                    taskId: card.dataset.taskId,
                    projectId: card.dataset.projectId,
                    title: card.querySelector('.card-title')?.textContent?.trim(),
                    parent: card.parentNode.dataset.status
                });
            });
        });
    });
    
    // Check for any cards not in containers
    const orphanCards = document.querySelectorAll('.kanban-card:not(.cards-container .kanban-card)');
    if (orphanCards.length > 0) {
        console.log(`⚠️ Found ${orphanCards.length} orphan cards not in containers`);
    }
};

// Test immediate DOM manipulation
window.testImmediateDOMMove = function() {
    console.log('⚡ === TESTING IMMEDIATE DOM MANIPULATION ===');
    
    const card = document.querySelector('.kanban-card');
    if (!card) {
        console.log('❌ No cards found');
        return;
    }
    
    const currentContainer = card.parentNode;
    const currentStatus = currentContainer.dataset.status;
    console.log('🎯 Current card status:', currentStatus);
    
    // Find a different container
    const targetStatus = currentStatus === 'todo' ? 'doing' : 'todo';
    const boardContainer = card.closest('.embedded-kanban-container');
    const targetContainer = boardContainer.querySelector(`.cards-container[data-status="${targetStatus}"]`);
    
    if (targetContainer) {
        console.log('🚀 Moving card immediately...');
        console.log('Before move - Current container children:', currentContainer.children.length);
        console.log('Before move - Target container children:', targetContainer.children.length);
        
        // Force immediate move
        currentContainer.removeChild(card);
        targetContainer.appendChild(card);
        
        // Force reflow
        card.offsetHeight;
        
        console.log('After move - Current container children:', currentContainer.children.length);
        console.log('After move - Target container children:', targetContainer.children.length);
        console.log('✅ Card moved successfully to:', targetStatus);
        
        // Add visual feedback
        card.style.border = '3px solid #ff4444';
        setTimeout(() => {
            card.style.border = '';
        }, 2000);
        
    } else {
        console.log('❌ Target container not found');
    }
};

// Diagnostic functions to help debug kanban issues
window.debugKanbanInstances = function() {
    console.log('🔍 === KANBAN INSTANCES DEBUG ===');
    console.log('Total instances:', kanbanInstances.size);
    
    kanbanInstances.forEach((instance, key) => {
        console.log('Instance key:', key);
        console.log('Instance:', {
            projectId: instance.projectId,
            isEmbeddedMode: instance.isEmbeddedMode,
            containerConnected: instance.container ? instance.container.isConnected : 'no container',
            boardDataKeys: Object.keys(instance.boardData)
        });
    });
    
    // Check for kanban containers in DOM
    const embeddedContainers = document.querySelectorAll('.embedded-kanban-container');
    console.log('Embedded containers in DOM:', embeddedContainers.length);
    
    embeddedContainers.forEach((container, index) => {
        console.log(`Container ${index + 1}:`, {
            id: container.id,
            hasKanbanBoard: !!container.querySelector('.kanban-board'),
            innerHTML: container.innerHTML.length + ' chars'
        });
    });
};

// Force reinitialize all kanban boards
window.forceReinitializeKanban = function() {
    console.log('🔄 === FORCE REINITIALIZING ALL KANBAN BOARDS ===');
    
    // Clear existing instances
    kanbanInstances.clear();
    
    // Find all embedded containers and reinitialize
    const embeddedContainers = document.querySelectorAll('.embedded-kanban-container');
    console.log('Found', embeddedContainers.length, 'embedded containers');
    
    embeddedContainers.forEach((container, index) => {
        const projectId = container.id.replace('embedded-kanban-', '');
        console.log(`Reinitializing container ${index + 1} for project:`, projectId);
        
        // Find project data
        if (window.projects && window.projects.length > 0) {
            const project = window.projects.find(p => p.id === projectId);
            if (project) {
                console.log('Found project data:', project.title || project.name);
                window.initEmbeddedKanban(project, container);
            } else {
                console.log('❌ Project not found in window.projects');
            }
        } else {
            console.log('❌ No projects data available');
        }
    });
};

// Helper function to update container counts immediately
function updateContainerCounts(boardContainer) {
    const containers = boardContainer.querySelectorAll('.cards-container');
    containers.forEach(container => {
        const status = container.dataset.status;
        const count = container.children.length;
        const header = boardContainer.querySelector(`.column-header[data-status="${status}"]`);
        const countSpan = header ? header.querySelector('.task-count') : null;
        
        if (countSpan) {
            countSpan.textContent = count;
            console.log(`📊 Updated ${status} count to: ${count}`);
        }
    });
}

// Helper function to update instance data after card move
function updateInstanceData(instance, task, newStatus, oldStatus) {
    console.log('🔄 Updating instance data...');
    
    // Remove from old status array
    if (instance.boardData[oldStatus]) {
        const oldIndex = instance.boardData[oldStatus].findIndex(t => t.id === task.id);
        if (oldIndex > -1) {
            instance.boardData[oldStatus].splice(oldIndex, 1);
            console.log(`   Removed task from ${oldStatus} array`);
        }
    }
    
    // Add to new status array
    if (!instance.boardData[newStatus]) {
        instance.boardData[newStatus] = [];
    }
    
    const updatedTask = { ...task, status: newStatus };
    instance.boardData[newStatus].push(updatedTask);
    console.log(`   Added task to ${newStatus} array`);
    
    console.log('✅ Instance data updated successfully');
}

// Quick test function for immediate drag and drop
window.testImmediateDragDrop = function() {
    console.log('🚀 === TESTING IMMEDIATE DRAG AND DROP ===');
    
    const card = document.querySelector('.kanban-card');
    if (!card) {
        console.log('❌ No cards found for testing');
        return;
    }
    
    const currentContainer = card.parentNode;
    const currentStatus = currentContainer.dataset.status;
    const newStatus = currentStatus === 'todo' ? 'doing' : 'todo';
    
    console.log(`Testing move from ${currentStatus} to ${newStatus}`);
    
    // Simulate the immediate visual update
    const boardContainer = card.closest('.embedded-kanban-container');
    const targetContainer = boardContainer.querySelector(`.cards-container[data-status="${newStatus}"]`);
    
    if (targetContainer) {
        // Perform immediate move
        currentContainer.removeChild(card);
        targetContainer.appendChild(card);
        
        // Update counts
        updateContainerCounts(boardContainer);
        
        // Add visual feedback
        card.style.border = '3px solid #4CAF50';
        setTimeout(() => {
            card.style.border = '';
        }, 1000);
        
        console.log('✅ Immediate move test completed!');
    } else {
        console.log('❌ Target container not found');
    }
};


