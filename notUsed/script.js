var scene, camera, renderer, clock, mixer, actions = [], mode, isWireframe = false, params, lights;
let loadedModel;
let secondModelMixer, secondModelAction = [];

init();

function init() {
    
    const assetPath = './'; // Path to assets

    clock = new THREE.Clock();

    // Create the scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x00aaff);

    // Set up the camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(-5, 25, 20);

    // Add lighting
    const ambient = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
    scene.add(ambient);

    lights = {};
    lights.spot = new THREE.SpotLight();
    lights.spot.visible = true;
    lights.spot.position.set(0,20,0);
    lights.spotHelper = new THREE.SpotLightHelper(lights.spot);
    lights.spotHelper.visible = false;
    scene.add(lights.spotHelper);
    scene.add(lights.spot);

    params = {
        spot: {
            enable: false,
            color: 0xffffff,
            distance: 20,
            angle: Math.PI/2,
            penumbra: 0,
            helper: false,
            moving: false
        }
    }

    const gui = new dat.GUI({ autoPlace: false });
    
    const guiContainer = document.getElementById('gui-container');
    guiContainer.appendChild(gui.domElement);

    guiContainer.style.position = 'fixed';
    
    const spot = gui.addFolder('Spot');
    spot.open();
    spot.add(params.spot, 'enable').onChange(value => { lights.spot.visible = value });
    spot.addColor(params.spot, 'color').onChange(value => lights.spot.color = new THREE.Color(value));
    spot.add(params.spot,'distance').min(0).max(20).onChange( value => lights.spot.distance = value);
    spot.add(params.spot,'angle').min(0.1).max(6.28).onChange( value => lights.spot.angle = value );
    spot.add(params.spot,'penumbra').min(0).max(1).onChange( value => lights.spot.penumbra = value );
    spot.add(params.spot, 'helper').onChange(value => lights.spotHelper.visible = value);
    spot.add(params.spot, 'moving');
    


    const light = new THREE.DirectionalLight(0xFFFFFF, 2);
    light.position.set(0, 10, 2);
    scene.add(light);
    
    // Set up the renderer
    const canvas = document.getElementById('threeContainer');
    renderer = new THREE.WebGLRenderer({canvas : canvas});
    renderer.setPixelRatio(window.devicePixelRatio);
    resize();
    
    // Add OrbitControls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(1, 2, 0);
    controls.update();

    // Button to control animations
    mode = 'open';
    const btn = document.getElementById("btn");
    btn.addEventListener('click', function() {
        if (actions.length === 2) {
            if (mode === "open") {
                actions.forEach(action => {
                    action.timeScale = 1;
                    action.reset();
                    action.play();
                });
            }
        }
    });

    // Add wireframe toggle button
    const wireframeBtn = document.getElementById("toggleWireframe");
    wireframeBtn.addEventListener('click', function () {
        isWireframe = !isWireframe;
        toggleWireframe(isWireframe);
    });

    // Add rotation button logic
    const rotateBtn = document.getElementById("rotate");
    rotateBtn.addEventListener('click', function () {
        if (loadedModel) {
            const axis = new THREE.Vector3(0, 1, 0); // Y-axis
            const angle = Math.PI / 7; // Rotate 22.5 degrees
            loadedModel.rotateOnAxis(axis, angle);
        } else {
            console.warn('Model not loaded yet.');
        }
    });

    // Add event listener for the play second model animation button
    const playSecondModelAnimationBtn = document.getElementById("secondAnimation");
    playSecondModelAnimationBtn.addEventListener('click', function () {
    
        if (secondModelActions.length > 0) {
            secondModelActions.forEach(action => {
                action.reset();
                action.setLoop(THREE.LoopOnce); // Play the animation only once
                action.clampWhenFinished = true; // Stop at the last frame
                action.play();
            });
        
        } else {
        console.warn('No animation available for the second model.');
        }
    });
    
    // Function to load a model
    const loader = new THREE.GLTFLoader();
    function loadModel(modelPath) {
        // Remove the current model if it exists
        if (loadedModel) {
            scene.remove(loadedModel);
        }
    
        // Load the new model
        loader.load(modelPath, function (gltf) {
            const model = gltf.scene;
    
            // Set the position and add it to the scene
            model.position.set(0, 0, 0); // Same position as the previous model
            scene.add(model);
    
            // Update the reference to the loaded model
            loadedModel = model;
    
            // Reset animations if applicable
            mixer = new THREE.AnimationMixer(model);
            const animations = gltf.animations; // Array of animation clips
            actions = []; // Clear previous actions
            animations.forEach(clip => {
                const action = mixer.clipAction(clip);
                actions.push(action);
            });
    
            // If this is the second model, set up its separate mixer and actions
            if (modelPath === 'assets/models/CokeCanCrush.glb') {
                secondModelMixer = mixer;
                secondModelActions = actions; // Store the second model's animations separately
            }
        });
    }

    // Initial model load
    loadModel('./assets/models/CokeCanOpen.glb');

    // Add event listener for the switch model button
    const switchBtn = document.getElementById("switchModel");
    switchBtn.addEventListener('click', function () {
        loadModel('assets/models/CokeCanCrush.glb'); // Path to the new model
    });

    // Handle resizing
    window.addEventListener('resize', resize, false);
    
    // Start the animation loop
    animate();
}

function toggleWireframe(enable) {
    scene.traverse(function (object) {
        if (object.isMesh) {
            object.material.wireframe = enable;
        }
    });
}
    
function animate() {
    requestAnimationFrame(animate);
    
    // Update animations
    if (mixer) {
        mixer.update(clock.getDelta());
        if (secondModelMixer) secondModelMixer.update(clock.getDelta())
    }

    renderer.render(scene, camera);

    const time = clock.getElapsedTime();
    const delta = Math.sin(time)*5;
    if (params.spot.moving){
        lights.spot.position.x = delta;
        lights.spotHelper.update();
    }
}
    
function resize() {
    const canvas = document.getElementById('threeContainer');
    const width = window.innerWidth;
    const height = window.innerHeight;

    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}