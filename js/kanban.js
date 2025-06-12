// Kanban Board functionality
// Simple Trello-like board with 4 columns: To Do, Doing, Waiting Feedback, Done

import { taskService } from './tasks.js';

// Use global showStatus function from app.js
const showStatus = window.showStatus || ((message, isError) => console.log(message));

// Kanban board configuration
const BOARD_COLUMNS = [
    { id: 'todo', title: 'To Do', color: '#e3f2fd' },
    { id: 'doing', title: 'Doing', color: '#fff3e0' },
    { id: 'waiting_feedback', title: 'Waiting Feedback', color: '#fce4ec' },
    { id: 'done', title: 'Done', color: '#e8f5e8' }
];

// Global variables
let currentProjectId = null;
let boardData = {
    'todo': [],
    'doing': [],
    'waiting': [],
    'done': []
};
let isEmbeddedMode = false;
let embeddedContainer = null;

// Initialize embedded Kanban board
window.initEmbeddedKanban = function(project, container) {
    isEmbeddedMode = true;
    embeddedContainer = container;
    currentProjectId = project.id;
    
    // Create kanban board HTML structure inside the container
    const kanbanHTML = `
        <div class="kanban-board">
            <div class="kanban-column" data-status="todo">
                <div class="column-header todo-header">
                    <h3>To Do</h3>
                    <button class="add-card-btn" data-status="todo">+ Add Card</button>
                </div>
                <div class="cards-container" data-status="todo"></div>
            </div>
            <div class="kanban-column" data-status="doing">
                <div class="column-header doing-header">
                    <h3>Doing</h3>
                    <button class="add-card-btn" data-status="doing">+ Add Card</button>
                </div>
                <div class="cards-container" data-status="doing"></div>
            </div>
            <div class="kanban-column" data-status="waiting">
                <div class="column-header waiting-header">
                    <h3>Waiting Feedback</h3>
                    <button class="add-card-btn" data-status="waiting">+ Add Card</button>
                </div>
                <div class="cards-container" data-status="waiting"></div>
            </div>
            <div class="kanban-column" data-status="done">
                <div class="column-header done-header">
                    <h3>Done</h3>
                    <button class="add-card-btn" data-status="done">+ Add Card</button>
                </div>
                <div class="cards-container" data-status="done"></div>
            </div>
        </div>
    `;
    
    container.innerHTML = kanbanHTML;
    
    // Load tasks and render board
    loadTasksAndRender();
};

// Show Kanban board (existing modal mode)
window.showKanbanBoard = function(project) {
    isEmbeddedMode = false;
    embeddedContainer = null;
    currentProjectId = project.id;
    
    const kanbanView = document.getElementById('kanban-view');
    if (!kanbanView) {
        console.error('Kanban view container not found');
        return;
    }
    
    // Update project title
    const projectTitle = kanbanView.querySelector('.kanban-header h2');
    if (projectTitle) {
        projectTitle.textContent = `${project.title || project.name || 'Project'} - Kanban Board`;
    }
    
    // Show the kanban view
    kanbanView.style.display = 'block';
    
    // Load tasks and render board
    loadTasksAndRender();
};

// Hide Kanban board (modal mode only)
window.hideKanbanBoard = function() {
    if (!isEmbeddedMode) {
        const kanbanView = document.getElementById('kanban-view');
        if (kanbanView) {
            kanbanView.style.display = 'none';
        }
    }
    currentProjectId = null;
    boardData = { 'todo': [], 'doing': [], 'waiting': [], 'done': [] };
};

// Initialize Kanban board
export async function initKanbanBoard(projectId) {
    currentProjectId = projectId;
    await loadBoardData();
    renderBoard();
    setupEventListeners();
}

// Load all tasks and organize by status
async function loadBoardData() {
    try {
        showStatus('Loading board data...', false);
        
        // Get all tasks for the project
        const tasks = await taskService.getTasksByProjectId(currentProjectId);
        
        // Initialize board data structure
        boardData = {};
        BOARD_COLUMNS.forEach(column => {
            boardData[column.id] = [];
        });
        
        // Organize tasks by status (default to 'todo' if no status)
        tasks.forEach(task => {
            const status = task.status || 'todo';
            if (boardData[status]) {
                boardData[status].push(task);
            } else {
                boardData['todo'].push(task); // Fallback to todo
            }
        });
        
        showStatus('Board loaded successfully', false);
    } catch (error) {
        console.error('Error loading board data:', error);
        showStatus('Error loading board data', true);
    }
}

// Load tasks and render board
async function loadTasksAndRender() {
    if (!currentProjectId) return;
    
    try {
        showStatus('Loading tasks...', false);
        const tasks = await taskService.getTasksByProjectId(currentProjectId, null);
        
        // Organize tasks by status
        boardData = {
            'todo': [],
            'doing': [],
            'waiting': [],
            'done': []
        };
        
        tasks.forEach(task => {
            const status = task.status || 'todo';
            if (boardData[status]) {
                boardData[status].push(task);
            } else {
                boardData['todo'].push(task); // Fallback to todo
            }
        });
        
        renderBoard();
        setupEventListeners();
        showStatus('Tasks loaded successfully', false);
    } catch (error) {
        console.error('Error loading tasks:', error);
        showStatus('Error loading tasks: ' + (error.message || 'Unknown error'), true);
    }
}

// Render the board
function renderBoard() {
    const boardContainer = isEmbeddedMode ? embeddedContainer : document.getElementById('kanban-view');
    if (!boardContainer) return;
    
    Object.keys(boardData).forEach(status => {
        const cardsContainer = boardContainer.querySelector(`.cards-container[data-status="${status}"]`);
        if (cardsContainer) {
            cardsContainer.innerHTML = '';
            boardData[status].forEach(task => {
                const cardElement = document.createElement('div');
                cardElement.innerHTML = renderCard(task);
                cardsContainer.appendChild(cardElement.firstElementChild);
            });
        }
    });
}

// Render a single column
function renderColumn(column) {
    const tasks = boardData[column.id] || [];
    
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
    const title = task.title || task.text || 'Untitled'; // Support both title and text fields
    const description = task.description || '';
    const createdAt = task.created_at || task.createdAt || new Date().toISOString();
    
    return `
        <div class="kanban-card" data-task-id="${task.id}" draggable="true">
            <div class="card-header">
                <span class="card-title">${title}</span>
                <div class="card-actions">
                    <button class="edit-card-btn" data-task-id="${task.id}">✏️</button>
                    <button class="delete-card-btn" data-task-id="${task.id}">🗑️</button>
                </div>
            </div>
            ${description ? `<div class="card-description">${description}</div>` : ''}
            <div class="card-footer">
                <span class="card-date">${formatDate(createdAt)}</span>
            </div>
        </div>
    `;
}

// Add new card to a column
async function addCard(status) {
    const title = prompt('Enter card title:');
    if (!title) return;
    
    const description = prompt('Enter card description (optional):') || '';
    
    try {
        showStatus('Creating card...', false);
        
        // Create task with appropriate field names based on existing data structure
        const taskData = {
            text: title,        // Use 'text' field like existing tasks
            description: description,
            completed: false,
            status: status,
            position: boardData[status].length
        };
        
        const newTask = await taskService.createTask(currentProjectId, taskData);
        
        // Add to board data with fallback for missing status
        const taskStatus = newTask.status || status;
        if (!boardData[taskStatus]) {
            boardData[taskStatus] = [];
        }
        boardData[taskStatus].push(newTask);
        
        // Re-render the board
        renderBoard();
        setupEventListeners();
        
        showStatus('Card created successfully', false);
    } catch (error) {
        console.error('Error creating card:', error);
        showStatus('Error creating card: ' + (error.message || 'Unknown error'), true);
    }
}

// Edit existing card
async function editCard(taskId) {
    const task = findTaskById(taskId);
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
        
        await taskService.updateTask(currentProjectId, taskId, updateData);
        
        // Update board data
        task.text = newTitle;
        task.title = newTitle; // Keep both for compatibility
        task.description = newDescription;
        
        // Re-render the board
        renderBoard();
        setupEventListeners();
        
        showStatus('Card updated successfully', false);
    } catch (error) {
        console.error('Error updating card:', error);
        showStatus('Error updating card: ' + (error.message || 'Unknown error'), true);
    }
}

// Delete card
async function deleteCard(taskId) {
    if (!confirm('Are you sure you want to delete this card?')) {
        return;
    }
    
    try {
        showStatus('Deleting card...', false);
        
        await taskService.deleteTask(currentProjectId, taskId);
        
        // Remove from board data
        BOARD_COLUMNS.forEach(column => {
            boardData[column.id] = boardData[column.id].filter(task => task.id !== taskId);
        });
        
        // Re-render the board
        renderBoard();
        setupEventListeners();
        
        showStatus('Card deleted successfully', false);
    } catch (error) {
        console.error('Error deleting card:', error);
        showStatus('Error deleting card', true);
    }
}

// Move card to different column
async function moveCard(taskId, newStatus) {
    console.log('moveCard called with:', { taskId, newStatus, currentData: boardData });
    
    const task = findTaskById(taskId);
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
        
        // Try to update with status field, fall back if column doesn't exist
        const updateData = {
            status: newStatus,
            position: boardData[newStatus] ? boardData[newStatus].length : 0
        };
        
        console.log('Updating task with:', updateData);
        
        await taskService.updateTask(currentProjectId, taskId, updateData);
        
        // Update board data
        const oldStatus = task.status || 'todo';
        console.log('Moving from', oldStatus, 'to', newStatus);
        
        if (boardData[oldStatus]) {
            boardData[oldStatus] = boardData[oldStatus].filter(t => t.id !== taskId);
        }
        
        task.status = newStatus;
        if (!boardData[newStatus]) {
            boardData[newStatus] = [];
        }
        boardData[newStatus].push(task);
        
        console.log('Updated board data:', boardData);
        
        // Re-render the board
        renderBoard();
        setupEventListeners();
        
        showStatus('Card moved successfully', false);
    } catch (error) {
        console.error('Error moving card:', error);
        // If the error is about missing status column, just update the UI
        if (error.message && error.message.includes('status')) {
            console.log('Status column not found, updating UI only');
            const oldStatus = task.status || 'todo';
            if (boardData[oldStatus]) {
                boardData[oldStatus] = boardData[oldStatus].filter(t => t.id !== taskId);
            }
            task.status = newStatus;
            if (!boardData[newStatus]) {
                boardData[newStatus] = [];
            }
            boardData[newStatus].push(task);
            renderBoard();
            setupEventListeners();
            showStatus('Card moved (UI only - database column missing)', false);
        } else {
            showStatus('Error moving card: ' + (error.message || 'Unknown error'), true);
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    console.log('setupEventListeners called, isEmbeddedMode:', isEmbeddedMode);
    
    const boardContainer = isEmbeddedMode ? embeddedContainer : document.getElementById('kanban-view');
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
    
    // Add card buttons
    const addButtons = boardContainer.querySelectorAll('.add-card-btn');
    console.log('Found add buttons:', addButtons.length);
    addButtons.forEach(btn => {
        if (!btn.hasAttribute('data-listener-attached')) {
            btn.setAttribute('data-listener-attached', 'true');
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const status = btn.dataset.status;
                addCard(status);
            });
        }
    });
    
    // Edit and delete buttons
    const editButtons = boardContainer.querySelectorAll('.edit-card-btn');
    const deleteButtons = boardContainer.querySelectorAll('.delete-card-btn');
    console.log('Found edit buttons:', editButtons.length, 'delete buttons:', deleteButtons.length);
    
    editButtons.forEach(btn => {
        if (!btn.hasAttribute('data-listener-attached')) {
            btn.setAttribute('data-listener-attached', 'true');
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const taskId = btn.dataset.taskId;
                editCard(taskId);
            });
        }
    });
    
    deleteButtons.forEach(btn => {
        if (!btn.hasAttribute('data-listener-attached')) {
            btn.setAttribute('data-listener-attached', 'true');
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const taskId = btn.dataset.taskId;
                deleteCard(taskId);
            });
        }
    });
    
    // Drag and drop for cards
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

// Helper functions
function findTaskById(taskId) {
    console.log('Finding task by ID:', taskId, 'in data:', boardData);
    
    // Handle both string and number IDs - but don't convert UUIDs to numbers
    for (const columnId of Object.keys(boardData)) {
        const task = boardData[columnId].find(t => {
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
    
    const boardContainer = isEmbeddedMode ? embeddedContainer : document.getElementById('kanban-view');
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
    
    console.log('Current board data:', boardData);
    console.log('Current project ID:', currentProjectId);
    console.log('Is embedded mode:', isEmbeddedMode);
    
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
    e.target.classList.remove('drag-over');
    
    if (draggedCard) {
        const taskId = draggedCard.dataset.taskId;
        const newStatus = e.target.dataset.status;
        
        console.log('Drop event:', { taskId, newStatus, draggedCard, target: e.target });
        
        if (taskId && newStatus) {
            // Don't convert UUID strings to numbers - keep as string
            moveCard(taskId, newStatus);
        } else {
            console.error('Missing taskId or newStatus:', { taskId, newStatus });
        }
    }
} 