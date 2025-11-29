document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000/api';

    // Views
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    const calculatorView = document.getElementById('calculator-view');
    const historyView = document.getElementById('history-view');
    const resultView = document.getElementById('result-view');

    // Forms
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const calculatorForm = document.getElementById('calculator-form');

    // Buttons and Links
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const logoutBtn = document.getElementById('logout-btn');
    const showHistoryBtn = document.getElementById('show-history-btn');
    const backToCalculatorBtn = document.getElementById('back-to-calculator-btn');

    // Content Holders
    const resultContent = document.getElementById('result-content');
    const historyList = document.getElementById('history-list');

    // --- State Management ---
    let token = localStorage.getItem('token');

    const updateUI = () => {
        if (token) {
            loginView.style.display = 'none';
            registerView.style.display = 'none';
            calculatorView.style.display = 'block';
            logoutBtn.style.display = 'block';
        } else {
            loginView.style.display = 'block';
            registerView.style.display = 'none';
            calculatorView.style.display = 'none';
            historyView.style.display = 'none';
            logoutBtn.style.display = 'none';
        }
    };

    // --- API Functions ---
    const apiCall = async (endpoint, method, body = null, headers = {}) => {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json', ...headers },
        };
        if (body) options.body = JSON.stringify(body);
        if (token) options.headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_URL}${endpoint}`, options);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'API call failed');
        }
        return data;
    };

    // --- Event Handlers ---
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginView.style.display = 'none';
        registerView.style.display = 'block';
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerView.style.display = 'none';
        loginView.style.display = 'block';
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const result = await apiCall('/auth/login', 'POST', { email, password });
            token = result.data.token;
            localStorage.setItem('token', token);
            updateUI();
        } catch (error) {
            alert(`Login failed: ${error.message}`);
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const result = await apiCall('/auth/register', 'POST', { name, email, password });
            token = result.data.token;
            localStorage.setItem('token', token);
            updateUI();
        } catch (error) {
            alert(`Registration failed: ${error.message}`);
        }
    });

    logoutBtn.addEventListener('click', () => {
        token = null;
        localStorage.removeItem('token');
        updateUI();
    });

    calculatorForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const industryName = document.getElementById('industry-name').value;
            const carbonEmissionTons = parseFloat(document.getElementById('carbon-tons').value);
            const region = document.getElementById('region').value;
            const industryType = document.getElementById('industry-type').value;

            const result = await apiCall('/calculate-offset', 'POST', {
                industryName, carbonEmissionTons, region, industryType
            });

            displayResult(result.data);
        } catch (error) {
            alert(`Calculation failed: ${error.message}`);
        }
    });

    showHistoryBtn.addEventListener('click', async () => {
        try {
            const result = await apiCall('/history', 'GET');
            displayHistory(result.data);
            calculatorView.style.display = 'none';
            historyView.style.display = 'block';
        } catch (error) {
            alert(`Failed to fetch history: ${error.message}`);
        }
    });

    backToCalculatorBtn.addEventListener('click', () => {
        historyView.style.display = 'none';
        calculatorView.style.display = 'block';
    });

    // --- UI Display Functions ---
    const displayResult = (data) => {
        resultContent.innerHTML = `
            <p><strong>Trees Required:</strong> ${data.treesRequired}</p>
            <p><strong>Reasoning:</strong> ${data.reasoning}</p>
            <p><strong>Recommended Species:</strong> ${data.recommendedSpecies.join(', ')}</p>
            <p><strong>Additional Strategies:</strong> ${data.additionalStrategies.join(', ')}</p>
        `;
        resultView.style.display = 'block';
    };

    const displayHistory = (items) => {
        if (items.length === 0) {
            historyList.innerHTML = '<p>No history found.</p>';
            return;
        }
        historyList.innerHTML = items.map(item => `
            <div class="item">
                <p><strong>Industry:</strong> ${item.industryName}</p>
                <p><strong>Emissions:</strong> ${item.carbonEmissionTons} tons/year</p>
                <p><strong>Trees Required:</strong> ${item.treesRequired}</p>
                <p><em>Calculated on: ${new Date(item.createdAt).toLocaleDateString()}</em></p>
            </div>
        `).join('');
    };

    // Initial UI setup
    updateUI();
});