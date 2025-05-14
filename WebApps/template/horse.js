// script.js
var scene, camera, renderer, clock, mixer, actions = [], mode, isWireframe = false, params, lights;
let loadedModel;
let secondModelMixer, secondModelActions = [];

init();

function init() {

    // Path to assets
    const assetPath = './'; 

    let isShowingSecondModel = false;
    const firstModelPath  = './assets/models/horse/HorseTexture.glb';
    const secondModelPath = './assets/models/snake/Snake5.glb';

    // Clock
    clock = new THREE.Clock();

    // Scene & background
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x00aaff);

    // Camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(-5, 25, 20);

    // Lights
    const ambient = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
    scene.add(ambient);
    lights = {};
    lights.spot = new THREE.SpotLight(0xffffff, 1);
    lights.spot.visible = true;
    lights.spot.position.set(0, 20, 0);
    lights.spotHelper = new THREE.SpotLightHelper(lights.spot);
    lights.spotHelper.visible = false;
    scene.add(lights.spotHelper);
    scene.add(lights.spot); 

    params = { 
        spot: { 
            enable: false, 
            helper: false, 
            moving: false, 
            color: 0xffffff, 
            distance: 20, 
            angle: Math.PI/2, 
            penumbra: 0 } };

    const gui = new dat.GUI({ autoPlace: false });
        
    document.getElementById('gui-container').appendChild(gui.domElement);
    gui.domElement.style.position = 'fixed';
    
    const spotFolder = gui.addFolder('Spot');
    spotFolder.add(params.spot, 'enable').onChange(v => lights.spot.visible = v);
    spotFolder.add(params.spot, 'helper').onChange(v => lights.spotHelper.visible = v);
    spotFolder.add(params.spot, 'moving');
    spotFolder.add(params.spot, 'distance', 0, 50).onChange(v => lights.spot.distance = v);
    spotFolder.add(params.spot, 'angle', 0, Math.PI).onChange(v => lights.spot.angle = v);
    spotFolder.add(params.spot, 'penumbra', 0, 1).onChange(v => lights.spot.penumbra = v);
    spotFolder.addColor(params.spot, 'color').onChange(v => lights.spot.color.set(v));
    spotFolder.open();

    const directional = new THREE.DirectionalLight(0xffffff, 2);
    directional.position.set(0, 10, 2);
    scene.add(directional);

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('threeContainer'), antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    onWindowResize();

    // Controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(1, 2, 0);
    controls.update();

    const initialOffset = camera.position.clone().sub( controls.target.clone() );


    // Button event listeners
    /* document.getElementById('btn').addEventListener('click', () => {
        if (actions.length) {
            actions.forEach(a => { a.reset(); a.setLoop(THREE.LoopOnce); a.clampWhenFinished = true; a.play(); });
        }
    }); */
    document.getElementById('toggleWireframe').addEventListener('click', () => {
        isWireframe = !isWireframe;
        scene.traverse(o => { if (o.isMesh) o.material.wireframe = isWireframe; });
    });
    document.getElementById('rotate').addEventListener('click', () => {
        if (loadedModel) loadedModel.rotateOnAxis(new THREE.Vector3(0,1,0), Math.PI/7);
    });
    /*document.getElementById('secondAnimation').addEventListener('click', () => {
        if (secondModelActions.length > 0) {
            secondModelActions.forEach(a => { 
                a.reset(); 
                a.setLoop(THREE.LoopOnce); 
                a.clampWhenFinished = true;
                a.play(); 
            });
        } else {
            console.warn('No animation available for the second model.');
            }
    }); */

    document.getElementById("playAnimation").addEventListener("click", () => {
        actions.forEach(action => action.play());
    });
    
    document.getElementById("pauseAnimation").addEventListener("click", () => {
        actions.forEach(action => action.stop());
    });
    

     // Function to load a model
     const loader = new THREE.GLTFLoader();

 
     // Initial model load
     loadModel('./assets/models/horse/HorseTexture.glb');

    function loadModel(modelPath, isSecond=false) {
        loader.load(modelPath,gltf => {
             if (loadedModel) {
                scene.remove(loadedModel);
             }
            // DEBUG: log what clips/tracks you actually got
            console.log(`Loaded GLTF from ${modelPath}`);
            console.log(' clips:', gltf.animations.map(a => a.name));
            gltf.animations.forEach(clip =>
            console.log('   track names:', clip.tracks.map(t => t.name)));


            // add new
            loadedModel = gltf.scene;
            loadedModel.position.set(0,0,0);
            scene.add(loadedModel);

            // setup mixer & actions
            mixer = new THREE.AnimationMixer(loadedModel);
            actions = gltf.animations.map(clip => mixer.clipAction(clip));

            // Re‐center orbit controls on the model:
            const box = new THREE.Box3().setFromObject(gltf.scene);
            const center = box.getCenter(new THREE.Vector3());
            controls.target.copy(center);
            camera.position.copy(center.clone().add(initialOffset));
            onWindowResize(); 
            controls.update();
            controls.target.copy(center);
            camera.lookAt(center);

            
            // find the position track:
            
           const clip = gltf.animations[0];
           const posTrack = clip.tracks.find(t => t.name.endsWith('.position'));

            if (!posTrack) {
                console.warn(`No position track in clip '${clip.name}'.`);  
                    } else {
                        console.log('first 3 position values:', posTrack.values.slice(0,3));
                        console.log('mid 3:', posTrack.values.slice(posTrack.values.length/2, posTrack.values.length/2+3));
                        console.log('last 3:', posTrack.values.slice(-3));
                    }
            
                
            if (actions.length === 0) {
                console.warn('No animation clips found in', modelPath);
              } else {
                actions.forEach(a => {
                  console.log('clip duration:', a.getClip().duration);
                  a.reset().setLoop(THREE.LoopOnce).clampWhenFinished = true;
                  a.play();
                });
              }
            // second-model storage
            if (isSecond) {
                secondModelMixer = mixer;
                secondModelActions = actions;
            }
        }, undefined, err => console.error('GLTF load error:', err));
    }

 
    // Add event listener for the switch model button
   const switchBtn = document.getElementById('switchModel');
    switchBtn.addEventListener('click', () => {
        if (isShowingSecondModel) {
        // Go back to the snake
        loadModel(firstModelPath, false);
     } else {
        // Show the can
        loadModel(secondModelPath, true);
    }
    // Flip the flag so next click swings back
    isShowingSecondModel = !isShowingSecondModel;
});
 
    // Handle resizing
    window.addEventListener('resize', onWindowResize, false);
    const navCollapse = document.querySelector('.navbar-collapse');
    if (navCollapse) {
        // Bootstrap fires these events when the menu opens/closes
        navCollapse.addEventListener('shown.bs.collapse',  onWindowResize);
    navCollapse.addEventListener('hidden.bs.collapse', onWindowResize);
    }
    navCollapse.addEventListener('transitionend', onWindowResize);

    // Start the animation loop
    animate();
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

function onWindowResize() {
  // Measure the navbar’s current height:
  const nav = document.querySelector('.navbar_coca_cola');
  const navHeight = nav ? nav.getBoundingClientRect().height : 0;

  // Compute full width/height minus the navbar
  const width  = window.innerWidth;
  const height = window.innerHeight - navHeight;

  // Resize our WebGL canvas & camera
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}


window.addEventListener('resize', onWindowResize);
