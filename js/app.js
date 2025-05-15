// Main application entry point

// Initialize the application
async function initApp() {
    try {
        // Initialize Supabase client (commented out for now since we're using mock data)
        // await supabaseService.init();
        
        // Set up event listeners
        uiService.setupEventListeners();
        
        // Initial rendering of project lists
        const bizDevSortBy = document.getElementById('sort-bizdev').value;
        const showIanCollabFlag = document.getElementById('showIanCollabToggle').checked;
        await uiService.renderProjectList('bizdev', 'bizdev-project-list', bizDevSortBy, showIanCollabFlag);
        
        const ianSortBy = document.getElementById('sort-ian').value;
        await uiService.renderProjectList('ian', 'ian-collab-project-list', ianSortBy, true);
        
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
        alert('Failed to initialize application. Please refresh the page or try again later.');
    }
}

// Start the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);

// Expose functions to window for development purposes
window.openModal = openModal;
window.closeModal = closeModal; 