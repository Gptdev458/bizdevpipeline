 // Supabase configuration file
// This script initializes the Supabase client and provides helper functions for database operations

// Supabase project URL and anon key (replace with your own)
const SUPABASE_URL = 'https://imvclloqzzpiukhtozav.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltdmNsbG9xenpwaXVraHRvemF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMTcwMjgsImV4cCI6MjA2Mjg5MzAyOH0.F66MEsWca31MQtgmNDg57kmNaXfkjqPcOG_JsknALqM';

// Initialize the Supabase client (will be loaded via CDN in index.html)
let supabase = null;

// Data conversion utilities
function camelToSnakeCase(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    if (Array.isArray(obj)) {
        return obj.map(camelToSnakeCase);
    }
    
    return Object.keys(obj).reduce((acc, key) => {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        const value = obj[key];
        
        acc[snakeKey] = camelToSnakeCase(value);
        return acc;
    }, {});
}

function snakeToCamelCase(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    if (Array.isArray(obj)) {
        return obj.map(snakeToCamelCase);
    }
    
    return Object.keys(obj).reduce((acc, key) => {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        const value = obj[key];
        
        acc[camelKey] = snakeToCamelCase(value);
        return acc;
    }, {});
}

// Convert filters from camelCase to snake_case
function convertFilters(filters) {
    const result = {};
    for (const [key, value] of Object.entries(filters)) {
        // Special case for isIanCollaboration
        if (key === 'isIanCollaboration') {
            result['is_ian_collaboration'] = value;
        } else {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            result[snakeKey] = value;
        }
    }
    return result;
}

// Function to initialize Supabase client
async function initSupabase() {
    try {
        console.log('Initializing Supabase client...'); // Debug log
        
        // Check if already initialized
        if (typeof supabase === 'object' && supabase !== null && supabase.auth) {
            console.log('Supabase client already initialized');
            return true;
        }
        
        console.log('Checking for supabase in window object...'); // Debug log
        
        if (!window.supabase) {
            console.error('Supabase client not available in window object.');
            return false;
        }
        
        console.log('Creating Supabase client with URL:', SUPABASE_URL); // Debug log
        
        try {
            // Explicitly check that createClient exists
            if (typeof window.supabase.createClient !== 'function') {
                console.error('supabase.createClient is not a function. Supabase object:', window.supabase);
                return false;
            }
            
            // Create client without additional options
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            
            if (!supabase) {
                console.error('Failed to create Supabase client, client is null');
                return false;
            }
            
            console.log('Supabase client created successfully:', supabase);
            
            // Only proceed if we can verify the client has the necessary methods
            if (!supabase.from || typeof supabase.from !== 'function') {
                console.error('Supabase client is missing required methods. Client:', supabase);
                return false;
            }
            
            return true;
        } catch (clientError) {
            console.error('Error creating Supabase client:', clientError);
            return false;
        }
    } catch (error) {
        console.error('Error initializing Supabase client:', error);
        return false;
    }
}

// Generic database operations with better error handling

// Fetch data with optional filters
async function fetchData(table, filters = {}, sortBy = null) {
    try {
        console.log(`Fetching data from ${table} with filters:`, filters);
        
        if (!supabase) {
            const initialized = await initSupabase();
            if (!initialized) {
                console.error('Supabase initialization failed during fetchData. Cannot proceed.');
                throw new Error('Supabase client not initialized.');
            }
        }
        
        // Verify that supabase.from is actually a function
        if (!supabase.from || typeof supabase.from !== 'function') {
            console.error('supabase.from is not a function. Supabase object:', supabase);
            throw new Error('Supabase client is not correctly configured (missing .from method).');
        }
        
        // Convert filters from camelCase to snake_case
        const snakeCaseFilters = convertFilters(filters);
        
        let query = supabase.from(table).select('*');
        
        // Apply filters
        for (const [key, value] of Object.entries(snakeCaseFilters)) {
            if (value === null) {
                query = query.is(key, null); // Use .is() for NULL checks
            } else {
                query = query.eq(key, value);
            }
        }
        
        // Handle string-based sortBy (from UI) and object-based sortBy
        if (sortBy) {
            if (typeof sortBy === 'string') {
                // Parse the string sortBy (e.g., "rating_desc", "name_asc")
                const [column, direction] = sortBy.split('_');
                const ascending = direction !== 'desc';
                const snakeCaseColumn = column.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                query = query.order(snakeCaseColumn, { ascending });
            } else if (typeof sortBy === 'object' && sortBy.column) {
                // Object-based sortBy with { column, ascending }
                const snakeCaseColumn = sortBy.column.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                query = query.order(snakeCaseColumn, { ascending: sortBy.ascending });
            }
        }
        
        const { data, error } = await query;
        
        if (error) {
            console.error(`Error in query for ${table}:`, error);
            
            // Show user-visible error
            if (typeof window.showStatus === 'function') {
                window.showStatus(`Database query error: ${error.message}`, true);
            }
            
            throw error;
        }
        
        // Convert data from snake_case to camelCase
        const camelCaseData = data ? snakeToCamelCase(data) : [];
        
        return camelCaseData;
    } catch (error) {
        console.error(`Error fetching data from ${table}:`, error);
        
        // Show user-visible error
        if (typeof window.showStatus === 'function') {
            window.showStatus(`Error loading data from ${table}: ${error.message}. Check console for details.`, true);
        }
        
        // Re-throw the error so the caller knows it failed, instead of calling a non-existent directFetch
        throw error;
    }
}

// Insert data into a table
async function insertData(table, data) {
    try {
        console.log(`Inserting data into ${table}:`, data);
        
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }
        
        // Convert data from camelCase to snake_case
        const snakeCaseData = camelToSnakeCase(data);
        console.log(`Converted data to snake_case:`, snakeCaseData); // Debug log
        
        // Enhanced logging for insert operation
        console.log(`Sending insert request to table '${table}'`);
        const response = await supabase
            .from(table)
            .insert(snakeCaseData)
            .select();
            
        console.log(`Insert response:`, response); // Debug log
        
        const { data: result, error } = response;
        
        if (error) {
            console.error(`Insert error for table ${table}:`, error);
            console.error(`Error code: ${error.code}, Message: ${error.message}`);
            console.error(`Error details:`, error.details);
            throw error;
        }
        
        if (!result || result.length === 0) {
            console.warn(`Insert succeeded but no data returned from table ${table}`);
            return null;
        }
        
        console.log(`Insert successful, raw result:`, result[0]); // Debug log
        // Convert result from snake_case to camelCase
        const camelCaseResult = snakeToCamelCase(result[0]);
        console.log(`Converted result to camelCase:`, camelCaseResult); // Debug log
        
        return camelCaseResult;
    } catch (error) {
        console.error(`Error inserting data into ${table}:`, error);
        throw error;
    }
}

// Update data in a table
async function updateData(table, id, data) {
    try {
        console.log(`Updating data in ${table} with id ${id}:`, data);
        
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }
        
        // Convert data from camelCase to snake_case
        const snakeCaseData = camelToSnakeCase(data);
        
        // Update data in the database
        const { data: result, error } = await supabase
            .from(table)
            .update(snakeCaseData)
            .eq('id', id)
            .select();
        
        if (error) {
            console.error(`Update error for table ${table}:`, error);
            throw error;
        }
        
        if (!result || result.length === 0) {
            console.warn(`Update succeeded but no data returned from table ${table}`);
            return null;
        }
        
        // Convert result from snake_case to camelCase
        const camelCaseResult = snakeToCamelCase(result[0]);
        
        return camelCaseResult;
    } catch (error) {
        console.error(`Error updating data in ${table} with id ${id}:`, error);
        throw error;
    }
}

// Delete data from a table
async function deleteData(table, id) {
    try {
        console.log(`Deleting data from ${table} with id ${id}`);
        
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }
        
        // First, check if the record exists
        const { data: existingRecord, error: checkError } = await supabase
            .from(table)
            .select('id')
            .eq('id', id)
            .single();
            
        if (checkError && checkError.code !== 'PGRST116') {
            console.error(`Error checking record existence for ${table}:`, checkError);
            throw checkError;
        }
        
        if (!existingRecord) {
            console.warn(`Record with id ${id} not found in table ${table}`);
            throw new Error(`Record with id ${id} not found in table ${table}`);
        }
        
        console.log(`Record exists, proceeding with delete for ${table} id ${id}`);
        
        // Delete data from the database and return the deleted record
        const { data: deletedData, error } = await supabase
            .from(table)
            .delete()
            .eq('id', id)
            .select();
        
        if (error) {
            console.error(`Delete error for table ${table}:`, error);
            throw error;
        }
        
        if (!deletedData || deletedData.length === 0) {
            console.error(`Delete operation completed but no records were deleted from ${table} with id ${id}`);
            throw new Error(`Failed to delete record from ${table} with id ${id} - no records affected`);
        }
        
        console.log(`Successfully deleted ${deletedData.length} record(s) from ${table}:`, deletedData);
        
        return {
            success: true,
            deletedCount: deletedData.length,
            deletedRecord: deletedData[0]
        };
    } catch (error) {
        console.error(`Error deleting data from ${table} with id ${id}:`, error);
        throw error;
    }
}

// Export functions to be used by other modules
export const supabaseService = {
    init: initSupabase,
    fetch: fetchData,
    insert: insertData,
    update: updateData,
    delete: deleteData,
    camelToSnake: camelToSnakeCase,
    snakeToCamel: snakeToCamelCase,
    
    // Helper function to debug data conversion
    validateDataFormat: function(data, expectedFormat) {
        if (!data) return { valid: false, error: 'Data is null or undefined' };
        
        let errors = [];
        let hasErrors = false;
        
        if (expectedFormat === 'camel') {
            // Check for snake_case properties (indicating conversion issue)
            const snakeProps = Object.keys(data).filter(key => key.includes('_'));
            if (snakeProps.length > 0) {
                hasErrors = true;
                errors.push({
                    type: 'format',
                    message: `Found ${snakeProps.length} snake_case properties in camelCase data`,
                    properties: snakeProps
                });
            }
            
            // Check for expected camelCase properties
            const expectedProps = ['id', 'name', 'description', 'rating', 'priority', 'status', 'isIanCollaboration'];
            const missingProps = expectedProps.filter(prop => data[prop] === undefined);
            if (missingProps.length > 0) {
                hasErrors = true;
                errors.push({
                    type: 'missing',
                    message: `Missing ${missingProps.length} expected camelCase properties`,
                    properties: missingProps
                });
            }
        } else if (expectedFormat === 'snake') {
            // Check for camelCase properties (indicating conversion issue)
            const camelProps = Object.keys(data).filter(key => /[A-Z]/.test(key));
            if (camelProps.length > 0) {
                hasErrors = true;
                errors.push({
                    type: 'format',
                    message: `Found ${camelProps.length} camelCase properties in snake_case data`,
                    properties: camelProps
                });
            }
            
            // Check for expected snake_case properties
            const expectedProps = ['id', 'name', 'description', 'rating', 'priority', 'status', 'is_ian_collaboration'];
            const missingProps = expectedProps.filter(prop => data[prop] === undefined);
            if (missingProps.length > 0) {
                hasErrors = true;
                errors.push({
                    type: 'missing',
                    message: `Missing ${missingProps.length} expected snake_case properties`,
                    properties: missingProps
                });
            }
        }
        
        return {
            valid: !hasErrors,
            errors: errors.length > 0 ? errors : null
        };
    }
}; 