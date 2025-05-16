document.addEventListener('DOMContentLoaded', () => {
    // THIS IS NOT SECURE FOR PRODUCTION. Password is visible in client-side code.
    // Suitable only for simple, local, non-sensitive applications.
    const HARDCODED_PASSWORD = 'hello'; // Change this to your desired password

    const loginOverlay = document.getElementById('login-overlay');
    const appContent = document.getElementById('app-content');
    const passwordInput = document.getElementById('password-input');
    const loginButton = document.getElementById('login-button');
    const loginError = document.getElementById('login-error');

    function showApp() {
        if (loginOverlay) loginOverlay.style.display = 'none';
        if (appContent) appContent.style.display = 'block';
    }

    function showLogin() {
        if (loginOverlay) loginOverlay.style.display = 'flex'; // 'flex' because CSS uses it for centering
        if (appContent) appContent.style.display = 'none';
    }

    // Check session storage on load
    if (sessionStorage.getItem('isAuthenticated') === 'true') {
        showApp();
    } else {
        showLogin();
    }

    if (loginButton) {
        loginButton.addEventListener('click', () => {
            if (passwordInput.value === HARDCODED_PASSWORD) {
                sessionStorage.setItem('isAuthenticated', 'true');
                loginError.textContent = '';
                passwordInput.value = ''; // Clear password field
                showApp();
            } else {
                loginError.textContent = 'Incorrect password. Please try again.';
                passwordInput.value = '';
                passwordInput.focus();
            }
        });
    }
    
    // Optional: Allow login with Enter key in password field
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault(); // Prevent default form submission if it were in a form
                loginButton.click();
            }
        });
    }
}); 