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
    
    // Store instance using container as key
    kanbanInstances.set(container, instance);
    
    console.log('Setting embedded mode. projectId:', instance.projectId);
    
    // Create kanban board HTML structure inside the container
    const kanbanHTML = `
        <div class="kanban-board" data-project-id="${project.id}">
            <div class="kanban-column" data-status="todo">
                <div class="column-header todo-header">
                    <h3>To Do</h3>
                    <button class="add-card-btn" data-status="todo" data-project-id="${project.id}">+ Add Card</button>
                </div>
                <div class="cards-container" data-status="todo"></div>
            </div>
            <div class="kanban-column" data-status="doing">
                <div class="column-header doing-header">
                    <h3>Doing</h3>
                    <button class="add-card-btn" data-status="doing" data-project-id="${project.id}">+ Add Card</button>
                </div>
                <div class="cards-container" data-status="doing"></div>
            </div>
            <div class="kanban-column" data-status="waiting">
                <div class="column-header waiting-header">
                    <h3>Waiting Feedback</h3>
                    <button class="add-card-btn" data-status="waiting" data-project-id="${project.id}">+ Add Card</button>
                </div>
                <div class="cards-container" data-status="waiting"></div>
            </div>
            <div class="kanban-column" data-status="done">
                <div class="column-header done-header">
                    <h3>Done</h3>
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
                        <h3>To Do</h3>
                        <button class="add-card-btn" data-status="todo" data-project-id="${project.id}">+ Add Card</button>
                    </div>
                    <div class="cards-container" data-status="todo"></div>
                </div>
                <div class="kanban-column" data-status="doing">
                    <div class="column-header doing-header">
                        <h3>Doing</h3>
                        <button class="add-card-btn" data-status="doing" data-project-id="${project.id}">+ Add Card</button>
                    </div>
                    <div class="cards-container" data-status="doing"></div>
                </div>
                <div class="kanban-column" data-status="waiting">
                    <div class="column-header waiting-header">
                        <h3>Waiting Feedback</h3>
                        <button class="add-card-btn" data-status="waiting" data-project-id="${project.id}">+ Add Card</button>
                    </div>
                    <div class="cards-container" data-status="waiting"></div>
                </div>
                <div class="kanban-column" data-status="done">
                    <div class="column-header done-header">
                        <h3>Done</h3>
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
        
        // Organize tasks by status (default to 'todo' if no status)
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
            
            const status = task.status || 'todo';
            if (instance.boardData[status]) {
                instance.boardData[status].push(task);
                console.log(`Added task to ${status} column`);
            } else {
                console.log(`Unknown status ${status}, adding to todo`);
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
            
            const status = task.status || 'todo';
            if (instance.boardData[status]) {
                instance.boardData[status].push(task);
                console.log(`Added task to ${status} column`);
            } else {
                console.log(`Unknown status ${status}, adding to todo`);
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
    
    Object.keys(instance.boardData).forEach(status => {
        const cardsContainer = boardContainer.querySelector(`.cards-container[data-status="${status}"]`);
        if (cardsContainer) {
            cardsContainer.innerHTML = '';
            instance.boardData[status].forEach(task => {
                const cardElement = document.createElement('div');
                cardElement.innerHTML = renderCard(task);
                cardsContainer.appendChild(cardElement.firstElementChild);
            });
        } else {
            console.log(`Cards container for status ${status} not found`);
        }
    });
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
    
    if (task.status === newStatus) {
        console.log('Task already in target status');
        return;
    }
    
    try {
        showStatus('Moving card...', false);
        
        // First try with just status field (most likely to work)
        let updateData = { status: newStatus };
        
        console.log('Updating task with:', updateData);
        
        try {
            await taskService.updateTask(instance.projectId, taskId, updateData);
            console.log('Status update successful');
        } catch (statusError) {
            console.log('Status column also missing, trying without status:', statusError);
            
            // If status column doesn't exist either, just update the UI
            if (statusError.message && statusError.message.includes('status')) {
                console.log('Status column not found, updating UI only');
                updateUIOnly(task, newStatus, instance);
                return;
            } else {
                throw statusError; // Re-throw if it's a different error
            }
        }
        
        // Update board data after successful database update
        updateUIOnly(task, newStatus, instance);
        
        showStatus('Card moved successfully', false);
        
    } catch (error) {
        console.error('Error moving card:', error);
        
        // Check if it's a column-missing error
        if (error.message && (error.message.includes('status') || error.message.includes('position'))) {
            console.log('Database columns missing, updating UI only');
            updateUIOnly(task, newStatus, instance);
            showStatus('Card moved (UI only - database columns missing)', false);
        } else {
            showStatus('Error moving card: ' + (error.message || 'Unknown error'), true);
        }
    }
}

// Helper function to update UI without database changes
function updateUIOnly(task, newStatus, instance) {
    console.log('updateUIOnly called with:', { task, newStatus });
    
    const oldStatus = task.status || 'todo';
    console.log('Moving from', oldStatus, 'to', newStatus);
    
    // Remove from old column
    if (instance.boardData[oldStatus]) {
        instance.boardData[oldStatus] = instance.boardData[oldStatus].filter(t => t.id !== task.id);
    }
    
    // Add to new column
    task.status = newStatus;
    if (!instance.boardData[newStatus]) {
        instance.boardData[newStatus] = [];
    }
    instance.boardData[newStatus].push(task);
    
    console.log('Updated board data:', instance.boardData);
    
    // Re-render the board
    renderBoard(instance);
    setupEventListeners(instance);
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
    
    // Remove existing listeners to prevent duplicates
    const existingListeners = boardContainer.querySelectorAll('[data-listener-attached]');
    console.log('Removing existing listeners:', existingListeners.length);
    existingListeners.forEach(element => {
        element.removeAttribute('data-listener-attached');
    });
    
    // Use event delegation instead of direct listeners - this is more reliable
    // Remove any existing delegated listeners first
    boardContainer.removeEventListener('click', handleBoardClick);
    
    // Add single delegated click handler for all buttons
    boardContainer.addEventListener('click', handleBoardClick);
    boardContainer.setAttribute('data-listener-attached', 'true');
    
    console.log('Event delegation set up on board container');
    
    // Still set up drag and drop on individual cards
    const cards = boardContainer.querySelectorAll('.kanban-card');
    console.log('Found kanban cards:', cards.length);
    
    cards.forEach((card, index) => {
        console.log(`Card ${index}:`, {
            element: card,
            draggable: card.draggable,
            taskId: card.dataset.taskId,
            hasListener: card.hasAttribute('data-listener-attached')
        });
        
        if (!card.hasAttribute('data-listener-attached')) {
            card.setAttribute('data-listener-attached', 'true');
            card.addEventListener('dragstart', (e) => {
                console.log('Dragstart event triggered for card:', card.dataset.taskId);
                handleDragStart(e);
            });
            card.addEventListener('dragend', (e) => {
                console.log('Dragend event triggered for card:', card.dataset.taskId);
                handleDragEnd(e);
            });
        }
    });
    
    // Drop zones
    const containers = boardContainer.querySelectorAll('.cards-container');
    console.log('Found drop containers:', containers.length);
    
    containers.forEach((container, index) => {
        console.log(`Container ${index}:`, {
            element: container,
            status: container.dataset.status,
            hasListener: container.hasAttribute('data-listener-attached')
        });
        
        if (!container.hasAttribute('data-listener-attached')) {
            container.setAttribute('data-listener-attached', 'true');
            container.addEventListener('dragover', handleDragOver);
            container.addEventListener('drop', (e) => {
                console.log('Drop event triggered on container:', container.dataset.status);
                handleDrop(e);
            });
            container.addEventListener('dragenter', handleDragEnter);
            container.addEventListener('dragleave', handleDragLeave);
        }
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

function handleDragStart(e) {
    draggedCard = e.target;
    e.target.style.opacity = '0.5';
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
}

function handleDragEnd(e) {
    e.target.style.opacity = '1';
    draggedCard = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    e.target.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.target.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const taskId = e.dataTransfer.getData('text/plain');
    const newStatus = e.currentTarget.dataset.status;
    
    console.log('Drop event:', { taskId, newStatus, target: e.currentTarget });
    
    if (taskId && newStatus) {
        // Find the project ID from the dragged card
        const draggedCard = document.querySelector(`[data-task-id="${taskId}"]`);
        const projectId = draggedCard ? draggedCard.dataset.projectId : null;
        
        if (projectId) {
            // Don't convert UUID strings to numbers - keep as string
            moveCard(taskId, newStatus, projectId);
        } else {
            console.error('No project ID found for dropped card');
        }
    } else {
        console.error('Missing taskId or newStatus:', { taskId, newStatus });
    }
    
    // Remove visual feedback
    e.currentTarget.classList.remove('drag-over');
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