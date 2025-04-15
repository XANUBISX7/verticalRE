// Three.js Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('heroCanvas'),
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
renderer.shadowMap.enabled = true;

// Add fog for depth
scene.fog = new THREE.FogExp2(0x000000, 0.01);

// Grid parameters
const gridSize = 10;
const spacing = 8;

// Mouse interaction variables
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let mouse = new THREE.Vector2();
let raycaster = new THREE.Raycaster();
let selectedBuilding = null;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Create ground
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x111111,
    roughness: 0.8,
    metalness: 0.2
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Create distant cityscape
function createDistantCityscape() {
    const cityscapeGroup = new THREE.Group();
    
    // Create pyramids
    const pyramidGeometry = new THREE.ConeGeometry(10, 15, 4);
    const pyramidMaterial = new THREE.MeshStandardMaterial({
        color: 0xD4AF37,
        roughness: 0.7,
        metalness: 0.3
    });
    
    for (let i = 0; i < 3; i++) {
        const pyramid = new THREE.Mesh(pyramidGeometry, pyramidMaterial);
        pyramid.position.set(-100 + i * 15, 0, -150);
        pyramid.rotation.y = Math.PI / 4;
        cityscapeGroup.add(pyramid);
    }
    
    // Create modern towers
    const towerGeometry = new THREE.BoxGeometry(5, 30, 5);
    const towerMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        roughness: 0.5,
        metalness: 0.8,
        transparent: true,
        opacity: 0.7
    });
    
    for (let i = 0; i < 5; i++) {
        const tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.set(100 + i * 20, 15, -150);
        tower.scale.y = 1 + Math.random() * 2;
        cityscapeGroup.add(tower);
    }
    
    scene.add(cityscapeGroup);
    return cityscapeGroup;
}

// Create streets
function createStreets() {
    const streetGroup = new THREE.Group();
    
    // Create road material
    const roadMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.9,
        metalness: 0.1
    });
    
    // Create main roads
    const roadWidth = 4;
    const roadGeometry = new THREE.PlaneGeometry(200, roadWidth);
    
    // Horizontal roads
    for (let z = -gridSize; z <= gridSize; z += spacing) {
        const road = new THREE.Mesh(roadGeometry, roadMaterial);
        road.rotation.x = -Math.PI / 2;
        road.position.set(0, 0.01, z);
        streetGroup.add(road);
    }
    
    // Vertical roads
    for (let x = -gridSize; x <= gridSize; x += spacing) {
        const road = new THREE.Mesh(roadGeometry, roadMaterial);
        road.rotation.x = -Math.PI / 2;
        road.rotation.z = Math.PI / 2;
        road.position.set(x, 0.01, 0);
        streetGroup.add(road);
    }
    
    // Add street lights
    const lightGeometry = new THREE.CylinderGeometry(0.2, 0.2, 3, 8);
    const lightMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.7,
        metalness: 0.3
    });
    
    const lightTopGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const lightTopMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFE4B5,
        emissive: 0xFFE4B5,
        emissiveIntensity: 1,
        roughness: 0.5
    });
    
    for (let x = -gridSize; x <= gridSize; x += spacing) {
        for (let z = -gridSize; z <= gridSize; z += spacing) {
            const light = new THREE.Mesh(lightGeometry, lightMaterial);
            const lightTop = new THREE.Mesh(lightTopGeometry, lightTopMaterial);
            
            light.position.set(x, 1.5, z);
            lightTop.position.set(x, 3, z);
            
            streetGroup.add(light);
            streetGroup.add(lightTop);
        }
    }
    
    scene.add(streetGroup);
    return streetGroup;
}

// Create animated people
function createPeople() {
    const peopleGroup = new THREE.Group();
    
    // Create more realistic person geometry
    const createPersonGeometry = () => {
        const group = new THREE.Group();
        
        // Body
        const bodyGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.8, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.7
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.4;
        group.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFE0BD,
            roughness: 0.7
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.1;
        group.add(head);
        
        // Legs
        const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8);
        const legMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.7
        });
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.1, -0.2, 0);
        group.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.1, -0.2, 0);
        group.add(rightLeg);
        
        return group;
    };
    
    const people = [];
for (let i = 0; i < 20; i++) {
        const person = createPersonGeometry();
        
        // Position person on a street
        const streetX = Math.floor(Math.random() * (gridSize * 2 + 1) - gridSize) * spacing;
        const streetZ = Math.floor(Math.random() * (gridSize * 2 + 1) - gridSize) * spacing;
        person.position.set(streetX, 0, streetZ);
        
        person.userData = {
            speed: 0.02 + Math.random() * 0.03,
            direction: new THREE.Vector3(
                Math.random() - 0.5,
                0,
                Math.random() - 0.5
            ).normalize(),
            walkCycle: 0,
            walkSpeed: 0.1
        };
        
        peopleGroup.add(person);
        people.push(person);
    }
    
    scene.add(peopleGroup);
    return { group: peopleGroup, people: people };
}

// Create animated cars
function createCars() {
    const carGroup = new THREE.Group();
    
    // Create more realistic car geometry
    const createCarGeometry = () => {
        const group = new THREE.Group();
        
        // Car body
        const bodyGeometry = new THREE.BoxGeometry(1.5, 0.5, 3);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(Math.random(), 0.8, 0.5),
            roughness: 0.5,
            metalness: 0.8
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.25;
        group.add(body);
        
        // Windows
        const windowGeometry = new THREE.BoxGeometry(1.3, 0.3, 2.8);
        const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            roughness: 0.2,
            metalness: 0.9,
            transparent: true,
            opacity: 0.7
        });
        const windows = new THREE.Mesh(windowGeometry, windowMaterial);
        windows.position.y = 0.6;
        group.add(windows);
        
        // Wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
        const wheelMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const wheelPositions = [
            { x: -0.6, z: -1.2 },
            { x: 0.6, z: -1.2 },
            { x: -0.6, z: 1.2 },
            { x: 0.6, z: 1.2 }
        ];
        
        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(pos.x, 0.3, pos.z);
            wheel.rotation.z = Math.PI / 2;
            group.add(wheel);
        });
        
        return group;
    };
    
    const cars = [];
    for (let i = 0; i < 10; i++) {
        const car = createCarGeometry();
        
        // Position car on a street
        const streetX = Math.floor(Math.random() * (gridSize * 2 + 1) - gridSize) * spacing;
        const streetZ = Math.floor(Math.random() * (gridSize * 2 + 1) - gridSize) * spacing;
        car.position.set(streetX, 0, streetZ);
        
        // Randomly choose between horizontal and vertical movement
        const isHorizontal = Math.random() > 0.5;
        car.userData = {
            speed: 0.05 + Math.random() * 0.05,
            direction: new THREE.Vector3(
                isHorizontal ? (Math.random() > 0.5 ? 1 : -1) : 0,
                0,
                isHorizontal ? 0 : (Math.random() > 0.5 ? 1 : -1)
            ),
            wheelRotation: 0
        };
        
        // Align car with direction
        if (isHorizontal) {
            car.rotation.y = car.userData.direction.x > 0 ? Math.PI / 2 : -Math.PI / 2;
        } else {
            car.rotation.y = car.userData.direction.z > 0 ? 0 : Math.PI;
        }
        
        carGroup.add(car);
        cars.push(car);
    }
    
    scene.add(carGroup);
    return { group: carGroup, cars: cars };
}

// Building materials
const buildingMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7, metalness: 0.3 }),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6, metalness: 0.4 }),
    new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.5, metalness: 0.5 })
];

// Mock building data
const mockBuildings = [
    { name: "Skyline Tower", price: 850000, beds: 3, baths: 2, city: "New York" },
    { name: "Ocean View", price: 1200000, beds: 4, baths: 3, city: "Miami" },
    { name: "Mountain Peak", price: 650000, beds: 2, baths: 2, city: "Denver" },
    { name: "Urban Loft", price: 450000, beds: 1, baths: 1, city: "Chicago" },
    { name: "Lakeside Villa", price: 950000, beds: 3, baths: 2.5, city: "Seattle" }
];

// Mock apartment data
const mockApartments = [
    { name: "Luxury Suite", price: 2500, beds: 2, baths: 2, sqft: 1200, floor: "3rd" },
    { name: "Studio Loft", price: 1800, beds: 1, baths: 1, sqft: 800, floor: "2nd" },
    { name: "Penthouse", price: 4500, beds: 3, baths: 2.5, sqft: 2000, floor: "5th" },
    { name: "Garden View", price: 2200, beds: 2, baths: 1.5, sqft: 1100, floor: "1st" },
    { name: "City View", price: 3000, beds: 2, baths: 2, sqft: 1500, floor: "4th" }
];

// Create hover modal element
const hoverModal = document.createElement('div');
hoverModal.className = 'apartment-hover-modal';
hoverModal.style.cssText = `
    position: fixed;
    background: rgba(0, 0, 0, 0.9);
    border: 1px solid var(--accent-color);
    border-radius: var(--border-radius);
    padding: 1rem;
    color: white;
    pointer-events: none;
    z-index: 1000;
    display: none;
    backdrop-filter: blur(5px);
    min-width: 200px;
`;
document.body.appendChild(hoverModal);

// Generate mock buildings with apartments
function generateBuildings() {
    const buildings = [];
    let buildingIndex = 0;
    
    for (let x = -gridSize; x <= gridSize; x += spacing) {
        for (let z = -gridSize; z <= gridSize; z += spacing) {
            if (Math.random() > 0.3) {
                const height = 5 + Math.random() * 15;
                const width = 3 + Math.random() * 4;
                const depth = 3 + Math.random() * 4;
                
                const geometry = new THREE.BoxGeometry(width, height, depth);
                const material = buildingMaterials[Math.floor(Math.random() * buildingMaterials.length)];
                const building = new THREE.Mesh(geometry, material);
                
                building.position.set(x, height / 2, z);
                building.castShadow = true;
                building.receiveShadow = true;
                
                building.userData = {
                    isBuilding: true,
                    data: mockBuildings[buildingIndex % mockBuildings.length],
                    originalColor: material.color.clone(),
                    highlightColor: new THREE.Color(0xF6D984),
                    windows: [],
                    apartments: []
                };
                
                // Add windows and apartments
                addWindowsToBuilding(building);
                addApartmentsToBuilding(building);
                
    scene.add(building);
                buildings.push(building);
                buildingIndex++;
            }
        }
    }
    return buildings;
}

// Add windows to buildings
function addWindowsToBuilding(building) {
    const geometry = building.geometry;
    const size = geometry.parameters;
    const windowSize = 0.8;
    const windowSpacing = 2;
    const windowDepth = 0.1;
    
    // Create window materials
    const windowOffMaterial = new THREE.MeshStandardMaterial({
        color: 0x111111,
        emissive: 0x000000,
        emissiveIntensity: 0,
        roughness: 0.8,
        metalness: 0.2
    });
    
    const windowOnMaterial = new THREE.MeshStandardMaterial({
        color: 0x111111,
        emissive: 0xFFE4B5, // Warm Ghibli-style light
        emissiveIntensity: 0,
        roughness: 0.5,
        metalness: 0.3
    });
    
    // Create window frames
    const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x2A2A2A,
        roughness: 0.7,
        metalness: 0.3
    });
    
    // Calculate number of windows per side
    const windowsPerSide = Math.floor((size.width - 1) / windowSpacing);
    const windowsPerHeight = Math.floor((size.height - 1) / windowSpacing);
    
    // Add windows to each side of the building
    for (let h = 1; h < windowsPerHeight; h++) {
        const y = (h * windowSpacing) - (size.height / 2) + 1;
        
        // Front and back windows
        for (let w = 0; w < windowsPerSide; w++) {
            const x = (w * windowSpacing) - ((windowsPerSide - 1) * windowSpacing / 2);
            
            // Create window frame
            const frameGeometry = new THREE.BoxGeometry(windowSize + 0.2, windowSize + 0.2, windowDepth + 0.05);
            const frame = new THREE.Mesh(frameGeometry, frameMaterial);
            
            // Create window glass
            const windowGeometry = new THREE.BoxGeometry(windowSize, windowSize, windowDepth);
            const window = new THREE.Mesh(windowGeometry, windowOffMaterial);
            
            // Position window and frame
            const z = size.depth / 2 + windowDepth / 2;
            window.position.set(x, y, z);
            frame.position.set(x, y, z + 0.025);
            
            // Add to building
            building.add(window);
            building.add(frame);
            
            // Store window reference
            building.userData.windows.push({
                mesh: window,
                frame: frame,
                material: windowOffMaterial,
                onMaterial: windowOnMaterial
            });
            
            // Add window to back side
            const backWindow = window.clone();
            const backFrame = frame.clone();
            backWindow.position.z = -z;
            backFrame.position.z = -z - 0.025;
            building.add(backWindow);
            building.add(backFrame);
            building.userData.windows.push({
                mesh: backWindow,
                frame: backFrame,
                material: windowOffMaterial,
                onMaterial: windowOnMaterial
            });
        }
        
        // Left and right windows
        for (let w = 0; w < windowsPerSide; w++) {
            const z = (w * windowSpacing) - ((windowsPerSide - 1) * windowSpacing / 2);
            
            // Create window frame
            const frameGeometry = new THREE.BoxGeometry(windowSize + 0.2, windowSize + 0.2, windowDepth + 0.05);
            const frame = new THREE.Mesh(frameGeometry, frameMaterial);
            
            // Create window glass
            const windowGeometry = new THREE.BoxGeometry(windowSize, windowSize, windowDepth);
            const window = new THREE.Mesh(windowGeometry, windowOffMaterial);
            
            // Position window and frame
            const x = size.width / 2 + windowDepth / 2;
            window.position.set(x, y, z);
            frame.position.set(x + 0.025, y, z);
            window.rotation.y = Math.PI / 2;
            frame.rotation.y = Math.PI / 2;
            
            // Add to building
            building.add(window);
            building.add(frame);
            
            // Store window reference
            building.userData.windows.push({
                mesh: window,
                frame: frame,
                material: windowOffMaterial,
                onMaterial: windowOnMaterial
            });
            
            // Add window to right side
            const rightWindow = window.clone();
            const rightFrame = frame.clone();
            rightWindow.position.x = -x;
            rightFrame.position.x = -x - 0.025;
            building.add(rightWindow);
            building.add(rightFrame);
            building.userData.windows.push({
                mesh: rightWindow,
                frame: rightFrame,
                material: windowOffMaterial,
                onMaterial: windowOnMaterial
            });
        }
    }
}

// Add apartments to buildings
function addApartmentsToBuilding(building) {
    const geometry = building.geometry;
    const size = geometry.parameters;
    const floors = Math.floor(size.height / 3);
    const apartmentsPerFloor = 2;
    
    for (let floor = 0; floor < floors; floor++) {
        for (let apt = 0; apt < apartmentsPerFloor; apt++) {
            const apartment = {
                position: new THREE.Vector3(
                    (apt === 0 ? -1 : 1) * (size.width / 4),
                    (floor * 3) + 1.5,
                    size.depth / 2 - 0.5
                ),
                data: mockApartments[(floor * apartmentsPerFloor + apt) % mockApartments.length]
            };
            
            // Create apartment indicator (small cube)
            const indicatorGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
            const indicatorMaterial = new THREE.MeshStandardMaterial({
                color: 0x333333,
                transparent: true,
                opacity: 0.5
            });
            
            const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
            indicator.position.copy(apartment.position);
            indicator.userData = {
                isApartment: true,
                data: apartment.data
            };
            
            building.add(indicator);
            building.userData.apartments.push(apartment);
        }
    }
}

// Initialize scene elements
const cityscape = createDistantCityscape();
const streets = createStreets();
const { group: peopleGroup, people } = createPeople();
const { group: carGroup, cars } = createCars();
const buildings = generateBuildings();

// Scroll-based camera transition
let scrollProgress = 0;
const maxScroll = 500; // Adjust based on your page height
const initialCameraHeight = 15;
const finalCameraHeight = 40; // Increased height for better top view
const searchSectionThreshold = 0.3; // When search section becomes visible

// Add parallax effect to scene elements
function updateParallax(scrollProgress) {
    // Move clouds based on scroll
    cityscape.position.z = -150 + Math.sin(scrollProgress * Math.PI) * 10;
    cityscape.position.x = Math.sin(scrollProgress * Math.PI * 0.5) * 20;
}

window.addEventListener('scroll', () => {
    scrollProgress = Math.min(window.scrollY / maxScroll, 1);
    
    // Calculate new camera position
    let targetHeight, targetX, targetZ;
    
    if (scrollProgress >= searchSectionThreshold) {
        // Full top view for search section
        targetHeight = finalCameraHeight;
        targetX = 0;
        targetZ = 0;
        camera.rotation.x = -Math.PI / 2; // Look straight down
    } else {
        // Smooth transition to top view
        const progress = scrollProgress / searchSectionThreshold;
        targetHeight = initialCameraHeight + (finalCameraHeight - initialCameraHeight) * progress;
        targetX = 0;
        targetZ = 20 * (1 - progress);
        camera.rotation.x = -Math.PI / 2 * progress; // Gradually look down
    }
    
    // Smooth transition
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetHeight, 0.1);
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.1);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.1);
    
    // Update parallax effects
    updateParallax(scrollProgress);
    
    // Adjust scene elements based on scroll
    cityscape.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
            child.material.opacity = THREE.MathUtils.lerp(0.3, 0.2, scrollProgress); // Even more transparent
        }
    });
    
    // Adjust fog density based on scroll
    scene.fog.density = THREE.MathUtils.lerp(0.01, 0.005, scrollProgress); // Reduced fog for clearer view
});

// Handle mouse movement
function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Update mouse light position
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([ground]);
    if (intersects.length > 0) {
        const point = intersects[0].point;
        mouseLight.position.set(point.x, 10, point.z);
        
        // Adjust light intensity based on scroll
        mouseLight.intensity = THREE.MathUtils.lerp(1, 0.5, scrollProgress);
    }
    
    if (!isDragging) {
        raycaster.setFromCamera(mouse, camera);
        
        // Reset previous highlights
        buildings.forEach(building => {
            if (building.userData.isBuilding) {
                building.material.color.copy(building.userData.originalColor);
                building.userData.windows.forEach(window => {
                    window.mesh.material = window.material;
                    window.mesh.material.emissiveIntensity = 0;
                });
            }
        });
        
        // Find all intersected objects
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        // Check for apartment intersections
        let foundApartment = false;
        for (const intersect of intersects) {
            const object = intersect.object;
            if (object.userData && object.userData.isApartment) {
                // Show hover modal
                hoverModal.style.display = 'block';
                hoverModal.style.left = `${event.clientX + 10}px`;
                hoverModal.style.top = `${event.clientY + 10}px`;
                hoverModal.innerHTML = `
                    <h4>${object.userData.data.name}</h4>
                    <p>$${object.userData.data.price}/month</p>
                    <p>${object.userData.data.beds} beds • ${object.userData.data.baths} baths</p>
                    <p>${object.userData.data.sqft} sqft • ${object.userData.data.floor} floor</p>
                `;
                
                // Highlight the building
                const building = object.parent;
                building.material.color.lerp(building.userData.highlightColor, 0.3);
                building.userData.windows.forEach(window => {
                    window.mesh.material = window.onMaterial;
                    window.mesh.material.emissiveIntensity = 0.8;
                });
                
                foundApartment = true;
                break;
            }
        }
        
        if (!foundApartment) {
            hoverModal.style.display = 'none';
        }
    }
}

// Handle mouse down
function onMouseDown(event) {
    isDragging = true;
    previousMousePosition = {
        x: event.clientX,
        y: event.clientY
    };
}

// Handle mouse up
function onMouseUp(event) {
    isDragging = false;
    
    // Only check for apartment click if we didn't drag
    if (!isDragging) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        for (const intersect of intersects) {
            const object = intersect.object;
            if (object.userData && object.userData.isApartment) {
                showBuildingDetails(object.userData.data);
                break;
            }
        }
    }
}

// Show building details
function showBuildingDetails(buildingData) {
    // Remove any existing modal
    const existingModal = document.querySelector('.building-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.className = 'building-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${buildingData.name}</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <p><strong>Location:</strong> ${buildingData.city}</p>
                <p><strong>Price:</strong> $${buildingData.price.toLocaleString()}</p>
                <p><strong>Details:</strong> ${buildingData.beds} beds • ${buildingData.baths} baths</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary">View Details</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .building-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            backdrop-filter: blur(5px);
        }
        .modal-content {
            background: rgba(0, 0, 0, 0.9);
            padding: 2rem;
            border-radius: var(--border-radius);
            border: 1px solid var(--accent-color);
            max-width: 400px;
            width: 90%;
            position: relative;
        }
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }
        .close-modal {
            background: none;
            border: none;
            color: var(--accent-color);
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0.5rem;
            line-height: 1;
        }
        .modal-body {
            margin-bottom: 1.5rem;
        }
        .modal-body p {
            margin-bottom: 0.5rem;
        }
        .modal-footer {
            text-align: right;
        }
    `;
    document.head.appendChild(style);

    // Close modal handlers
    const closeModal = () => {
        modal.remove();
        style.remove();
    };

    // Close on X button click
    modal.querySelector('.close-modal').addEventListener('click', closeModal);
    
    // Close on clicking outside modal content
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

// Handle mouse drag
function onMouseDrag(event) {
    if (isDragging) {
        const deltaMove = {
            x: event.clientX - previousMousePosition.x,
            y: event.clientY - previousMousePosition.y
        };
        
        // Smoother rotation with easing
        const rotationSpeed = 0.002; // Reduced speed for smoother rotation
        const rotationX = deltaMove.y * rotationSpeed;
        const rotationY = deltaMove.x * rotationSpeed;
        
        // Rotate camera around the scene center with easing
        const radius = Math.sqrt(
            Math.pow(camera.position.x, 2) + 
            Math.pow(camera.position.z, 2)
        );
        
        const angle = Math.atan2(camera.position.z, camera.position.x);
        const newAngle = angle + rotationY;
        
        // Apply easing to camera movement
        const targetX = radius * Math.cos(newAngle);
        const targetZ = radius * Math.sin(newAngle);
        const targetY = Math.max(5, Math.min(50, camera.position.y - rotationX));
        
        camera.position.x += (targetX - camera.position.x) * 0.1;
        camera.position.z += (targetZ - camera.position.z) * 0.1;
        camera.position.y += (targetY - camera.position.y) * 0.1;
        
        // Always look at the center
        camera.lookAt(0, 0, 0);
        
        previousMousePosition = {
            x: event.clientX,
            y: event.clientY
        };
    }
}

// Add event listeners
window.addEventListener('mousemove', onMouseMove);
window.addEventListener('mousedown', onMouseDown);
window.addEventListener('mouseup', onMouseUp);
window.addEventListener('mousemove', onMouseDrag);

// Camera animation
let isAnimating = true;
let animationProgress = 0;

// Initial camera position (top view)
camera.position.set(0, 50, 0);
camera.lookAt(0, 0, 0);

// Animation function
function animateCamera() {
    if (!isAnimating) return;
    
    animationProgress += 0.005;
    if (animationProgress >= 1) {
        animationProgress = 1;
        isAnimating = false;
    }
    
    // Smooth camera movement using easing function
    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
    const progress = easeOutCubic(animationProgress);
    
    // Calculate new camera position
    const targetHeight = 15;
    const targetDistance = 20;
    const angle = progress * Math.PI * 2;
    
    camera.position.y = 50 - (50 - targetHeight) * progress;
    camera.position.x = Math.sin(angle) * targetDistance * progress;
    camera.position.z = Math.cos(angle) * targetDistance * progress;
    
    camera.lookAt(0, 0, 0);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Update animation loop
function animate() {
    requestAnimationFrame(animate);
    
    if (isAnimating) {
        animateCamera();
    }
    
    // Animate people with adjusted speed based on scroll
    people.forEach(person => {
        const speedMultiplier = 1 - scrollProgress * 0.5;
        person.position.add(person.userData.direction.clone().multiplyScalar(person.userData.speed * speedMultiplier));
        
        // Animate walking
        person.userData.walkCycle += person.userData.walkSpeed * speedMultiplier;
        const leg1 = person.children[2];
        const leg2 = person.children[3];
        leg1.rotation.x = Math.sin(person.userData.walkCycle) * 0.5;
        leg2.rotation.x = -Math.sin(person.userData.walkCycle) * 0.5;
        
        // Bounce off boundaries and change direction occasionally
        if (Math.abs(person.position.x) > 50 || Math.abs(person.position.z) > 50 || Math.random() < 0.01) {
            person.userData.direction = new THREE.Vector3(
                Math.random() - 0.5,
                0,
                Math.random() - 0.5
            ).normalize();
            
            // Ensure person stays on streets
            person.position.x = Math.round(person.position.x / spacing) * spacing;
            person.position.z = Math.round(person.position.z / spacing) * spacing;
        }
    });
    
    // Animate cars with adjusted speed based on scroll
    cars.forEach(car => {
        const speedMultiplier = 1 - scrollProgress * 0.5; // Slow down as we scroll up
        car.position.add(car.userData.direction.clone().multiplyScalar(car.userData.speed * speedMultiplier));
        
        // Rotate wheels
        car.userData.wheelRotation += car.userData.speed * 2 * speedMultiplier;
        car.children.slice(2).forEach(wheel => {
            wheel.rotation.x = car.userData.wheelRotation;
        });
        
        // Bounce off boundaries and change direction
        if (Math.abs(car.position.x) > 50 || Math.abs(car.position.z) > 50) {
            car.userData.direction.multiplyScalar(-1);
            car.rotation.y += Math.PI;
            
            // Ensure car stays on streets
            car.position.x = Math.round(car.position.x / spacing) * spacing;
            car.position.z = Math.round(car.position.z / spacing) * spacing;
        }
    });
    
    // Pulsate window lights with adjusted intensity based on scroll
    buildings.forEach(building => {
        if (building.userData.isBuilding) {
            building.userData.windows.forEach(window => {
                if (window.mesh.material.emissiveIntensity > 0) {
                    const time = Date.now() * 0.001;
                    const pulse = (0.5 + Math.sin(time * 1.5) * 0.2) * (1 - scrollProgress * 0.5);
                    window.mesh.material.emissiveIntensity = pulse;
                    window.mesh.material.emissive.setRGB(
                        0xFF / 255,
                        0xE4 / 255 + Math.sin(time) * 0.1,
                        0xB5 / 255 + Math.cos(time) * 0.1
                    );
                }
            });
        }
    });
    
    renderer.render(scene, camera);
}

animate();

// Salesforce Authentication
async function authenticateSalesforce() {
    try {
        const response = await fetch('http://localhost:3000/api/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error_description || 'Authentication failed');
        }

        const data = await response.json();
        
        // Store the tokens in sessionStorage
        sessionStorage.setItem('sf_access_token', data.access_token);
        sessionStorage.setItem('sf_instance_url', data.instance_url);
        
        return data;
    } catch (error) {
        console.error('Error authenticating with Salesforce:', error);
        throw error;
    }
}

// Fetch Property Data from Salesforce
async function fetchPropertyData(instanceUrl, accessToken) {
    try {
        const query = 'SELECT Id, Name, Price__c, Square_Footage__c, Bedrooms__c, Bathrooms__c, Address__c, City__c FROM Property__c';
        const response = await fetch('http://localhost:3000/api/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                instance_url: instanceUrl,
                access_token: accessToken,
                query: query
            })
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

// Golden pulse effect variables
let isPulseActive = false;
let pulseStartTime = 0;
let pulseDuration = 2; // seconds
const pulseColor = new THREE.Color(0xF6D984); // Golden color
const originalColors = new Map(); // Store original building colors

// Function to start golden pulse effect
function startGoldenPulse() {
    if (isPulseActive) return;
    
    isPulseActive = true;
    pulseStartTime = Date.now();
    
    // Store original colors
    buildings.forEach(building => {
        if (building.userData.isBuilding) {
            originalColors.set(building, building.material.color.clone());
        }
    });
    
    // Start pulse animation
    function animatePulse() {
        if (!isPulseActive) return;
        
        const currentTime = Date.now();
        const elapsed = (currentTime - pulseStartTime) / 1000;
        const progress = Math.min(elapsed / pulseDuration, 1);
        
        // Calculate pulse radius based on progress
        const maxRadius = Math.max(gridSize * spacing, 50);
        const currentRadius = maxRadius * progress;
        
        // Calculate pulse intensity (fades out as it spreads)
        const intensity = 1 - progress;
        
        // Update buildings and ground
        buildings.forEach(building => {
            if (building.userData.isBuilding) {
                const distance = new THREE.Vector2(building.position.x, building.position.z).length();
                
                if (distance <= currentRadius) {
                    // Calculate color based on distance from center
                    const distanceFactor = 1 - (distance / currentRadius);
                    const pulseIntensity = intensity * distanceFactor;
                    
                    // Blend between original color and pulse color
                    building.material.color.lerpColors(
                        originalColors.get(building),
                        pulseColor,
                        pulseIntensity
                    );
                    
                    // Add emissive effect
                    building.material.emissive = pulseColor.clone();
                    building.material.emissiveIntensity = pulseIntensity * 0.5;
                }
            }
        });
        
        // Update ground
        const groundDistance = new THREE.Vector2(0, 0).length();
        if (groundDistance <= currentRadius) {
            const groundIntensity = intensity * (1 - (groundDistance / currentRadius));
            ground.material.color.lerpColors(
                new THREE.Color(0x111111),
                pulseColor,
                groundIntensity * 0.3
            );
        }
        
        if (progress < 1) {
            requestAnimationFrame(animatePulse);
        } else {
            // Reset colors
            buildings.forEach(building => {
                if (building.userData.isBuilding) {
                    building.material.color.copy(originalColors.get(building));
                    building.material.emissive.set(0x000000);
                    building.material.emissiveIntensity = 0;
                }
            });
            ground.material.color.set(0x111111);
            isPulseActive = false;
        }
    }
    
    animatePulse();
}

// Modify the search form submission handler
document.getElementById('propertySearchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Start golden pulse effect
    startGoldenPulse();
    
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

    try {
    const properties = await fetchProperties(filters);
    if (properties) {
        displayProperties(properties);
        }
    } catch (error) {
        console.error('Error fetching properties:', error);
        showError('Failed to fetch properties. Please try again later.');
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