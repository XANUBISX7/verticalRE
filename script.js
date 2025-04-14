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
        color: 0x007bff,
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

// Salesforce Integration
async function fetchProperties(filters = {}) {
    try {
        const queryParams = new URLSearchParams({
            grant_type: 'password',
            client_id: '3MVG9HxRZv05HarSVQTVEemG9FwGRw.kvwiYNqCNOgazF2lMc7rQx5gt.aiMZWn5Wd5F_eN.3wPHYtStIp5ib',
            client_secret: 'CE2F1A590D250CADCF6738B9B5DCC3CACBEE427FC4FF9F270DB8F289E9BFD55D',
            username: '{YourSalesforceUsername}',
            password: '{YourPassword}{SecurityToken}'
        });

        // First, get the access token
        const authResponse = await fetch('https://login.salesforce.com/services/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: queryParams
        });

        const authData = await authResponse.json();
        
        // Then, query the properties
        const propertyQuery = `
            SELECT Id, Name, City__c, Address__c, Beds__c, Baths__c, Price__c, Tags__c, Picture__c, Record_Link__c
            FROM Property__c
            WHERE Price__c >= ${filters.minPrice || 0}
            AND Price__c <= ${filters.maxPrice || 1000000}
            AND Beds__c >= ${filters.minBeds || 0}
            AND Baths__c >= ${filters.minBaths || 0}
            ${filters.city ? `AND City__c LIKE '%${filters.city}%'` : ''}
            ${filters.tag ? `AND Tags__c LIKE '%${filters.tag}%'` : ''}
            LIMIT ${filters.limit || 10}
            OFFSET ${(filters.page - 1) * (filters.limit || 10)}
        `;

        const propertyResponse = await fetch(`${authData.instance_url}/services/data/v59.0/query?q=${encodeURIComponent(propertyQuery)}`, {
            headers: {
                'Authorization': `Bearer ${authData.access_token}`,
                'Content-Type': 'application/json'
            }
        });

        const propertyData = await propertyResponse.json();
        return propertyData.records;
    } catch (error) {
        console.error('Error fetching properties:', error);
        showError('Failed to fetch properties. Please try again later.');
    }
}

// Display properties in the grid
function displayProperties(properties) {
    const grid = document.getElementById('propertiesGrid');
    grid.innerHTML = '';

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
    alert('Thank you for your message! We will get back to you soon.');
    e.target.reset();
});

// Error handling
function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-white bg-danger border-0 position-fixed bottom-0 end-0 m-3';
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
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

// Initial property load
fetchProperties().then(properties => {
    if (properties) {
        displayProperties(properties);
    }
}); 