// Main application entry point

// Import services
import { supabaseService } from './supabase.js';
import { projectService } from './projects.js';
import { taskService } from './tasks.js';
import { uiService, openModal, closeModal } from './ui.js';
import { populateAllRatings } from './populateRatings.js';

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