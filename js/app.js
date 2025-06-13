// Main application entry point
// Updated with real-time visual drag and drop fix - 2024-12-06 19:03

import { uiService } from './ui.js';
import { supabaseService } from './supabase.js';

class App {
    constructor() {
        this.isInitialized = false;
    }

    async init() {
        try {
            console.log('Starting application initialization...');
            
            // Initialize Supabase client
            console.log('Initializing Supabase client...');
            const supabaseInitialized = await supabaseService.init();
            if (!supabaseInitialized) {
                throw new Error('Failed to initialize Supabase client');
            }
            
            console.log('Supabase client initialized successfully, setting up event listeners...');
            
            // Setup UI event listeners
            uiService.setupEventListeners();
            console.log('Event listeners set up successfully');
            
            // Initial render of project lists
            console.log('Rendering initial project lists...');
            await this.renderInitialLists();
            
            console.log('Application initialization complete');
            this.isInitialized = true;
            
        } catch (error) {
            console.error('Application initialization failed:', error);
            this.showInitializationError(error);
        }
    }
    
    async renderInitialLists() {
        try {
            // Render BizDev projects
            await uiService.renderProjectList(
                'bizdev', 
                'bizdev-project-list', 
                'rating_desc', 
                false
            );
            
            // Render Ian Collaboration projects
            await uiService.renderProjectList(
                'ian', 
                'ian-collab-project-list', 
                'name_asc', 
                true
            );
        } catch (error) {
            console.error('Error rendering initial project lists:', error);
        }
    }
    
    showInitializationError(error) {
        const errorMessage = `
            <div style="text-align: center; padding: 50px; color: #721c24;">
                <h2>Application Initialization Failed</h2>
                <p>Error: ${error.message || 'Unknown error'}</p>
                <p>Please refresh the page and try again.</p>
            </div>
        `;
        
        const appContent = document.getElementById('app-content');
        if (appContent) {
            appContent.innerHTML = errorMessage;
        }
    }
}

// Wait for Supabase to be ready, then initialize the app
document.addEventListener('supabase-ready', async () => {
    console.log('Supabase already available, proceeding with app initialization.');
    
    const app = new App();
    await app.init();
});

// Export for potential external use
export { App }; 