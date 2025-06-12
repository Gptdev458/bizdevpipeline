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

let currentProjectId = null;
let boardData = {};

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

// Render the complete Kanban board
function renderBoard() {
    const container = document.getElementById('kanban-container');
    if (!container) {
        console.error('Kanban container not found');
        return;
    }
    
    container.innerHTML = `
        <div class="kanban-board">
            ${BOARD_COLUMNS.map(column => renderColumn(column)).join('')}
        </div>
    `;
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
    const task = findTaskById(taskId);
    if (!task || task.status === newStatus) return;
    
    try {
        showStatus('Moving card...', false);
        
        // Try to update with status field, fall back if column doesn't exist
        const updateData = {
            status: newStatus,
            position: boardData[newStatus] ? boardData[newStatus].length : 0
        };
        
        await taskService.updateTask(currentProjectId, taskId, updateData);
        
        // Update board data
        const oldStatus = task.status || 'todo';
        if (boardData[oldStatus]) {
            boardData[oldStatus] = boardData[oldStatus].filter(t => t.id !== taskId);
        }
        
        task.status = newStatus;
        if (!boardData[newStatus]) {
            boardData[newStatus] = [];
        }
        boardData[newStatus].push(task);
        
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

// Setup event listeners for the board
function setupEventListeners() {
    // Add card buttons
    document.querySelectorAll('.add-card-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const status = e.target.dataset.status;
            addCard(status);
        });
    });
    
    // Edit card buttons
    document.querySelectorAll('.edit-card-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const taskId = parseInt(e.target.dataset.taskId);
            editCard(taskId);
        });
    });
    
    // Delete card buttons
    document.querySelectorAll('.delete-card-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const taskId = parseInt(e.target.dataset.taskId);
            deleteCard(taskId);
        });
    });
    
    // Drag and drop
    setupDragAndDrop();
}

// Setup drag and drop functionality
function setupDragAndDrop() {
    let draggedCard = null;
    
    // Card drag start
    document.querySelectorAll('.kanban-card').forEach(card => {
        card.addEventListener('dragstart', (e) => {
            draggedCard = e.target;
            e.target.style.opacity = '0.5';
        });
        
        card.addEventListener('dragend', (e) => {
            e.target.style.opacity = '1';
            draggedCard = null;
        });
    });
    
    // Column drop zones
    document.querySelectorAll('.column-body').forEach(column => {
        column.addEventListener('dragover', (e) => {
            e.preventDefault();
            column.classList.add('drag-over');
        });
        
        column.addEventListener('dragleave', (e) => {
            column.classList.remove('drag-over');
        });
        
        column.addEventListener('drop', (e) => {
            e.preventDefault();
            column.classList.remove('drag-over');
            
            if (draggedCard) {
                const taskId = parseInt(draggedCard.dataset.taskId);
                const newStatus = column.dataset.status;
                moveCard(taskId, newStatus);
            }
        });
    });
}

// Helper functions
function findTaskById(taskId) {
    for (const columnId of Object.keys(boardData)) {
        const task = boardData[columnId].find(t => t.id === taskId);
        if (task) return task;
    }
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