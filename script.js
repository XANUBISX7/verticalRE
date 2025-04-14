// Three.js Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('heroCanvas'),
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Camera position
camera.position.z = 30;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 10, 10);
scene.add(directionalLight);

// Create buildings
function createBuilding(x, z) {
    const height = Math.random() * 15 + 5;
    const geometry = new THREE.BoxGeometry(4, height, 4);
    const material = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8
    });
    const building = new THREE.Mesh(geometry, material);
    building.position.set(x, height / 2, z);
    return building;
}

// Add buildings to scene
for (let i = 0; i < 20; i++) {
    const x = (Math.random() - 0.5) * 100;
    const z = (Math.random() - 0.5) * 100;
    const building = createBuilding(x, z);
    scene.add(building);
}

// Add a few gold accent buildings
for (let i = 0; i < 5; i++) {
    const x = (Math.random() - 0.5) * 100;
    const z = (Math.random() - 0.5) * 100;
    const height = Math.random() * 20 + 10;
    const geometry = new THREE.BoxGeometry(4, height, 4);
    const material = new THREE.MeshPhongMaterial({
        color: 0xF6D984,
        transparent: true,
        opacity: 0.9
    });
    const building = new THREE.Mesh(geometry, material);
    building.position.set(x, height / 2, z);
    scene.add(building);
}

// Animation
function animate() {
    requestAnimationFrame(animate);
    
    // Rotate buildings slightly
    scene.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
            child.rotation.y += 0.001;
        }
    });
    
    renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Salesforce Authentication
async function authenticateSalesforce() {
    try {
        // Check if we have a stored auth code from the callback
        const authCode = sessionStorage.getItem('sf_auth_code');
        
        if (authCode) {
            // Clear the stored code
            sessionStorage.removeItem('sf_auth_code');
            
            // Exchange the code for an access token
            const response = await fetch('https://login.salesforce.com/services/oauth2/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: authCode,
                    client_id: 'YOUR_CLIENT_ID', // Replace with your Salesforce client ID
                    client_secret: 'YOUR_CLIENT_SECRET', // Replace with your Salesforce client secret
                    redirect_uri: 'https://cloudastickre.netlify.app/callback.html'
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error_description || 'Token exchange failed');
            }

            const data = await response.json();
            // Store the tokens in sessionStorage
            sessionStorage.setItem('sf_access_token', data.access_token);
            sessionStorage.setItem('sf_instance_url', data.instance_url);
            return data;
        }
        
        // Check if we have stored tokens
        const accessToken = sessionStorage.getItem('sf_access_token');
        const instanceUrl = sessionStorage.getItem('sf_instance_url');
        
        if (accessToken && instanceUrl) {
            return {
                access_token: accessToken,
                instance_url: instanceUrl
            };
        }
        
        // If no stored tokens or auth code, initiate OAuth flow
        window.location.href = `https://login.salesforce.com/services/oauth2/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=https://cloudastickre.netlify.app/callback.html`;
        return null;
    } catch (error) {
        console.error('Error authenticating with Salesforce:', error);
        throw error;
    }
}

// Fetch Property Data from Salesforce
async function fetchPropertyData(instanceUrl, accessToken) {
    try {
        const query = encodeURIComponent('SELECT Id, Name, Price__c, Square_Footage__c, Bedrooms__c, Bathrooms__c, Address__c, City__c FROM Property__c');
        const response = await fetch(`${instanceUrl}/services/data/v57.0/query?q=${query}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch properties');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching property data:', error);
        throw error;
    }
}

// Display properties in the grid
function displayProperties(properties) {
    const grid = document.getElementById('propertiesGrid');
    grid.innerHTML = '';

    if (!properties || properties.length === 0) {
        grid.innerHTML = `
            <div class="col-12 text-center">
                <p class="lead">No properties found matching your criteria.</p>
                <p>Try adjusting your search filters.</p>
            </div>
        `;
        return;
    }

    properties.forEach(property => {
        const card = document.createElement('div');
        card.className = 'col-md-4 col-sm-6 fade-in';
        card.innerHTML = `
            <div class="card property-card">
                <img src="${property.Picture__c}" class="card-img-top" alt="${property.Name}">
                <div class="card-body">
                    <h5 class="card-title">${property.Name}</h5>
                    <p class="card-text">
                        <strong>${property.City__c}</strong><br>
                        ${property.Beds__c} beds • ${property.Baths__c} baths<br>
                        $${property.Price__c.toLocaleString()}
                    </p>
                    <a href="${property.Record_Link__c}" class="btn btn-primary" target="_blank">View Details</a>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Handle form submission
document.getElementById('propertySearchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const filters = {
        minPrice: document.getElementById('budget').value,
        city: document.getElementById('location').value,
        minBeds: document.getElementById('beds').value,
        minBaths: document.getElementById('baths').value,
        page: 1,
        limit: 9
    };

    // Show loading state
    const grid = document.getElementById('propertiesGrid');
    grid.innerHTML = `
        <div class="col-12 text-center">
            <div class="spinner-border text-light" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3">Loading properties...</p>
        </div>
    `;

    const properties = await fetchProperties(filters);
    if (properties) {
        displayProperties(properties);
    }
});

// Handle contact form submission
document.getElementById('contactForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        company: document.getElementById('company').value,
        message: document.getElementById('message').value
    };

    // Here you would typically send this to your backend
    console.log('Contact form submitted:', formData);
    showSuccess('Thank you for your message! We will get back to you soon.');
    e.target.reset();
});

// Error handling
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
}

// Success message
function showSuccess(message) {
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-white border-0 position-fixed bottom-0 end-0 m-3';
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body" style="color: var(--accent-color);">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    document.body.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// Fetch properties from Salesforce
async function fetchProperties(filters = {}) {
    try {
        // First authenticate with Salesforce
        const authData = await authenticateSalesforce();
        
        // Then fetch the property data
        const propertyData = await fetchPropertyData(authData.instance_url, authData.access_token);
        
        // Filter the properties based on the provided filters
        let filteredProperties = propertyData.records;
        
        if (filters.minPrice) {
            filteredProperties = filteredProperties.filter(p => p.Price__c >= filters.minPrice);
        }
        if (filters.city) {
            filteredProperties = filteredProperties.filter(p => 
                p.City__c.toLowerCase().includes(filters.city.toLowerCase())
            );
        }
        if (filters.minBeds) {
            filteredProperties = filteredProperties.filter(p => p.Beds__c >= filters.minBeds);
        }
        if (filters.minBaths) {
            filteredProperties = filteredProperties.filter(p => p.Baths__c >= filters.minBaths);
        }
        
        // Apply pagination
        const startIndex = (filters.page - 1) * filters.limit;
        const endIndex = startIndex + filters.limit;
        return filteredProperties.slice(startIndex, endIndex);
        
    } catch (error) {
        console.error('Error fetching properties:', error);
        showError('Failed to fetch properties. Please try again later.');
        return null;
    }
}

// Initial property load
fetchProperties().then(properties => {
    if (properties) {
        displayProperties(properties);
    }
}); 