// Main application entry point

// Import services
import { supabaseService } from './supabase.js';
import { projectService } from './projects.js';
import { taskService } from './tasks.js';
import { uiService, openModal, closeModal } from './ui.js';
import { populateAllRatings } from './populateRatings.js';
import { kanbanBoard } from './kanban.js';

// Global variables for Kanban board
let currentKanbanProject = null;

// Create a simple loading/error indicator
function showStatus(message, isError = false) {
    const statusEl = document.createElement('div');
    statusEl.id = 'status-message';
    statusEl.textContent = message;
    statusEl.className = isError ? 'error-message' : 'status-message';
    statusEl.style.position = 'fixed';
    statusEl.style.top = '10px';
    statusEl.style.right = '10px';
    statusEl.style.padding = '10px';
    statusEl.style.borderRadius = '4px';
    statusEl.style.zIndex = '1000';
    statusEl.style.backgroundColor = isError ? '#f8d7da' : '#d4edda';
    statusEl.style.color = isError ? '#721c24' : '#155724';
    
    // Remove existing status messages
    const existingStatus = document.getElementById('status-message');
    if (existingStatus) {
        existingStatus.remove();
    }
    
    document.body.appendChild(statusEl);
    
    // Auto-remove after 5 seconds if not an error
    if (!isError) {
        setTimeout(() => {
            if (document.getElementById('status-message')) {
                document.getElementById('status-message').remove();
            }
        }, 5000);
    } else {
        // Add a close button for errors
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.marginLeft = '10px';
        closeBtn.style.border = 'none';
        closeBtn.style.background = 'none';
        closeBtn.style.fontSize = '20px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.onclick = () => statusEl.remove();
        statusEl.appendChild(closeBtn);
    }
}

// Make showStatus globally available
window.showStatus = showStatus;

// Kanban board functions
function showKanbanBoard(project) {
    try {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
        });
        
        // Show Kanban view
        const kanbanView = document.getElementById('kanban-view');
        const kanbanTitle = document.getElementById('kanban-project-title');
        
        if (kanbanView && kanbanTitle) {
            kanbanView.style.display = 'block';
            kanbanTitle.textContent = `${project.name} - Kanban Board`;
            currentKanbanProject = project;
            
            // Initialize the Kanban board
            kanbanBoard.init(project.id);
        } else {
            console.error('Kanban view elements not found');
            showStatus('Error loading Kanban board', true);
        }
    } catch (error) {
        console.error('Error showing Kanban board:', error);
        showStatus('Error loading Kanban board', true);
    }
}

function hideKanbanBoard() {
    try {
        // Hide Kanban view
        const kanbanView = document.getElementById('kanban-view');
        if (kanbanView) {
            kanbanView.style.display = 'none';
        }
        
        // Show the appropriate tab content
        const activeTab = document.querySelector('.tab-button.active');
        if (activeTab) {
            const tabContent = document.getElementById(activeTab.dataset.tab);
            if (tabContent) {
                tabContent.style.display = 'block';
            }
        }
        
        currentKanbanProject = null;
    } catch (error) {
        console.error('Error hiding Kanban board:', error);
    }
}

// Initialize the application
async function initApp() {
    try {
        console.log('Starting application initialization...');
        showStatus('Initializing application...');
        
        // Initialize Supabase client
        console.log('Initializing Supabase client...');
        const supabaseInitialized = await supabaseService.init();
        
        if (!supabaseInitialized) {
            const errorMsg = 'Failed to initialize Supabase client. Check your internet connection and try again.';
            console.error(errorMsg);
            throw new Error(errorMsg);
        }
        
        console.log('Supabase client initialized successfully, setting up event listeners...');
        showStatus('Supabase client initialized');
        
        // Set up event listeners
        try {
            uiService.setupEventListeners();
            setupKanbanEventListeners();
            console.log('Event listeners set up successfully');
        } catch (listenerError) {
            console.error('Error setting up event listeners:', listenerError);
            showStatus('Warning: Some UI features may not work correctly', true);
            // Continue execution despite listener errors
        }
        
        // Initial rendering of project lists
        console.log('Rendering initial project lists...');
        showStatus('Loading projects...');
        
        try {
            const bizDevSortBy = document.getElementById('sort-bizdev').value;
            await uiService.renderProjectList('bizdev', 'bizdev-project-list', bizDevSortBy, false);
            
            const ianSortBy = document.getElementById('sort-ian').value;
            await uiService.renderProjectList('ian', 'ian-collab-project-list', ianSortBy, true);
            
            console.log('Project lists rendered successfully');
        } catch (renderError) {
            console.error('Error rendering project lists:', renderError);
            showStatus('Warning: Error loading some projects', true);
            // Continue execution despite rendering errors
        }
        
        showStatus('Application initialized successfully');
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
        showStatus(`Failed to initialize application: ${error.message}. Please refresh the page or try again later.`, true);
    }
}

// Setup Kanban-specific event listeners
function setupKanbanEventListeners() {
    // Back to projects button
    const backToProjectsBtn = document.getElementById('back-to-projects');
    if (backToProjectsBtn) {
        backToProjectsBtn.addEventListener('click', hideKanbanBoard);
    }
}

// Retry initialization if it fails
async function initWithRetry(maxRetries = 3, delay = 2000) {
    let retries = 0;
    
    while (retries < maxRetries) {
        try {
            await initApp();
            return; // Success, exit the function
        } catch (error) {
            retries++;
            console.error(`Initialization attempt ${retries} failed:`, error);
            
            if (retries < maxRetries) {
                showStatus(`Initialization failed. Retrying in ${delay/1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                showStatus('Failed to initialize after multiple attempts. Please check your internet connection and refresh the page.', true);
            }
        }
    }
}

// Wait for Supabase to be ready, then start the application
function waitForSupabaseAndInit() {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        console.log('Supabase already available, proceeding with app initialization.');
        initWithRetry();
    } else {
        console.log('Supabase not yet available, waiting for supabase-ready event...');
        let eventListenerTimeout = null;

        const onSupabaseReady = () => {
            console.log('supabase-ready event received. Proceeding with app initialization.');
            clearTimeout(eventListenerTimeout); // Clear the timeout
            document.removeEventListener('supabase-ready', onSupabaseReady);
            initWithRetry();
        };

        document.addEventListener('supabase-ready', onSupabaseReady);

        // Fallback timeout in case the event doesn't fire (e.g., script loading issue)
        eventListenerTimeout = setTimeout(() => {
            console.warn('Timeout waiting for supabase-ready event. Attempting to initialize app anyway...');
            document.removeEventListener('supabase-ready', onSupabaseReady);
            initWithRetry(); // Attempt to init even if event didn't fire, Supabase might be there
        }, 10000); // 10-second timeout
    }
}

// Start the application when the DOM is fully loaded AND Supabase is ready
document.addEventListener('DOMContentLoaded', waitForSupabaseAndInit);

// Handle errors that occur after initialization
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showStatus(`An error occurred: ${event.error.message}. Check the console for details.`, true);
});

// Expose functions to window for development purposes
window.openModal = openModal;
window.closeModal = closeModal;
window.populateAllRatings = populateAllRatings;
window.showKanbanBoard = showKanbanBoard;
window.hideKanbanBoard = hideKanbanBoard;

// Debug function to test basic database connectivity
window.testDatabaseConnection = async function() {
    console.log('=== DATABASE CONNECTION TEST ===');
    
    try {
        // Test 1: Import check
        console.log('1. Checking imports...');
        console.log('supabaseService available:', typeof window.supabaseService);
        
        // Import supabaseService directly
        const { supabaseService } = await import('./supabase.js');
        console.log('supabaseService import successful:', typeof supabaseService);
        
        // Test 2: Basic connection test
        console.log('2. Testing Supabase initialization...');
        const initResult = await supabaseService.init();
        console.log('Supabase init result:', initResult);
        
        // Test 3: Try to fetch any data from tasks table
        console.log('3. Testing basic fetch from tasks table...');
        try {
            const testFetch = await supabaseService.fetch('tasks', {});
            console.log('Basic fetch successful, got', testFetch.length, 'tasks');
            
            if (testFetch.length > 0) {
                console.log('=== ALL TASKS IN DATABASE ===');
                testFetch.forEach((task, index) => {
                    console.log(`Task ${index + 1}:`, {
                        id: task.id,
                        text: task.text,
                        title: task.title,
                        projectId: task.projectId,
                        project_id: task.project_id,
                        status: task.status,
                        description: task.description,
                        completed: task.completed,
                        createdAt: task.createdAt,
                        created_at: task.created_at
                    });
                });
                console.log('=== END ALL TASKS ===');
            }
        } catch (fetchError) {
            console.error('Basic fetch failed:', fetchError);
        }
        
        // Test 4: Check what projects exist
        console.log('4. Checking available projects...');
        try {
            const allProjects = await supabaseService.fetch('projects', {});
            console.log('Projects in database:', allProjects.length);
            
            if (allProjects.length > 0) {
                console.log('=== ALL PROJECTS IN DATABASE ===');
                allProjects.forEach((project, index) => {
                    console.log(`Project ${index + 1}:`, {
                        id: project.id,
                        name: project.name,
                        title: project.title,
                        isIanCollaboration: project.isIanCollaboration,
                        is_ian_collaboration: project.is_ian_collaboration
                    });
                });
                console.log('=== END ALL PROJECTS ===');
            }
        } catch (projectError) {
            console.error('Project fetch failed:', projectError);
        }
        
        // Test 5: Try with a specific project ID from the UI
        console.log('5. Testing with specific project filter...');
        const uiProjects = document.querySelectorAll('.project-item');
        if (uiProjects.length > 0) {
            const firstProject = uiProjects[0];
            const projectId = firstProject.dataset.projectId;
            console.log('Testing with UI project ID:', projectId);
            
            try {
                const projectTasks = await supabaseService.fetch('tasks', { project_id: projectId });
                console.log('Project-specific fetch successful, got', projectTasks.length, 'tasks');
                
                if (projectTasks.length > 0) {
                    console.log('Tasks for this project:', projectTasks);
                }
            } catch (projectError) {
                console.error('Project-specific fetch failed:', projectError);
            }
        }
        
        // Test 6: Try creating a simple test task
        console.log('6. Testing task creation...');
        const projectElements = document.querySelectorAll('.project-item');
        if (projectElements.length > 0) {
            const firstProjectElement = projectElements[0];
            const testProjectId = firstProjectElement.dataset.projectId;
            
            try {
                const testTaskData = {
                    text: 'DEBUG TEST TASK - ' + new Date().toISOString(),
                    description: 'This is a test task created for debugging',
                    completed: false
                };
                
                console.log('Attempting to create test task with data:', testTaskData);
                const createdTask = await supabaseService.insert('tasks', {
                    project_id: testProjectId,
                    ...testTaskData
                });
                console.log('Test task created successfully:', createdTask);
                
                // Try to fetch it back
                const fetchBack = await supabaseService.fetch('tasks', { project_id: testProjectId });
                console.log('Tasks after creation:', fetchBack.length);
                
            } catch (createError) {
                console.error('Test task creation failed:', createError);
            }
        }
        
    } catch (error) {
        console.error('Database connection test failed:', error);
    }
    
    console.log('=== END DATABASE CONNECTION TEST ===');
}; 