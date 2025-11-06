import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { CharacterControls } from './characterControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'; 
import { TextureLoader } from 'three';


//CONSTANTS

const clock = new THREE.Clock(); //required for consistent animation timing

const  fog_HorizonColor = 0x5a5a66; //fog-color
const fog_Density_Normal = 0.015;   //fog-density at normal time
const fog_Density_Max = 0.9;        //fog-density at changing background time

let isFading = false; // Flag to check if Fog Fade effect is in progress or not(default false)
let fadeStartTime = 0; // Time when the fade started
const FADE_DURATION = 1.5; // Duration of the fade (in seconds)
let isbackGroundChanging = false; //Flag to check that background changing is in process or not.

let characterControls; // to declare controls globally.

//to avoid writing window.innerwidth and height each time in code.
const sizes = 
{
    width: window.innerWidth,
    height: window.innerHeight
}


//SCENE
const scene = new THREE.Scene();
scene.background = null; //makes it null to see FOG clearly which by default NULL as well.
scene.fog = new THREE.FogExp2( fog_HorizonColor, fog_Density_Normal);


// connects canvas to HTML Page to load on site. 
const canvas = document.getElementById("experience-canvas");


//RAY-CASTER & POINTER
/* raycaster cast a ray from camera to the pointer and the object that interrupt 
   that ray can se seen as touchable or clickable for user/Viewer. */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();


//RAY-CASTER TO STOP CHARACTER GO THROUGH WALLS

window.collidable_Objects = []; // Global array to hold wall, fence, and building meshes
window.collisionRaycaster = new THREE.Raycaster();
window.collisionDistance = 0.5; // minimum distance between character & wall that makes it stop.


//RENDERER
const renderer = new THREE.WebGLRenderer(
    {
        canvas: canvas,
        //to ignore edgy look while zooming or exploring the scene.
        antialias: true,
        alpha : true
    }
);

renderer.setClearColor(0x000000, 0); // Transparent background

renderer.setSize(sizes.width,sizes.height);

/* to keep pixelRatio below 2 otherwise it may overuse GPU or kill performance due to high ratio.
    which is later mentioned in handleResize function */
// renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));

// types of shadow map to enhance shadows more on site.

// 1. basic square or rectangle blocks of shadows.
// renderer.shadowMap.type = THREE.BasicShadowMap;

// 2. pixeled version of shadows but better than basicshadow map.
// renderer.shadowMap.type = THREE.PCFShadowMap;

// 3. smoother shadows which can be generally considered good.
// renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// 4. Best and Most calculated shadows in VSMshadow map.
renderer.shadowMap.type = THREE.VSMShadowMap;

/* to enable shadows through the layered approch of threeJS. But still we need to tell threeJS 
   that for which child we need shadows which specified in GLB function of loader. */
renderer.shadowMap.enabled = true;

// tone Mapping to set the vibe of Environment. total 8 types of different toneMapping.
renderer.toneMapping = THREE.ReinhardToneMapping;

// this will make light dim a little bit but instead of increasing SunLight value use Exposure.
// to setup environment bright naturally instead of just increasing brightness.
renderer.toneMappingExposure = 2.25;


// CONTENTS OF PROJECTS

const projectContent = 
{
    "AboutMe" : 
    {
        title: "About Me",
        content: `
            Passionate Game Developer
            Building games with C++ & Unreal Engine
            Focus: Game logic, immersive gameplay, mechanics, systems, in-game animations
            Exploring complex game logic through personal projects
            Also skilled in MERN-stack web development
            Cross-platform app dev with Flutter Framework
        `,
    },
    "AboutMeSign" :
    {
        title: "About Me",
        content: `
            Passionate Game Developer
            Building games with C++ & Unreal Engine
            Focus: Game logic, immersive gameplay, mechanics, systems, in-game animations
            Exploring complex game logic through personal projects
            Also skilled in MERN-stack web development
            Cross-platform app dev with Flutter Framework
        `,
    },
    "MailBoxResume" : 
    {
        title: "My Experience & Skills",
        content: `Bachelor of Technology in Computer Engineering -- -- 2022-2026 <br> From Marwadi Universiy, Rajkot <br> Language : C++, Dart, Java <br> Tools & libraries : SFML, Unreal Engine, Blender, Asprite, THREEJS, Flutter, MERN-Stack,SQL, PreForce, Git/GitHub <br> Grab My Experience here !! <br> <a href="./Assets/Rahul_Resume.pdf" download="MyResume.pdf" class="view-link">View Resume</a>` ,
    },
    "MailBox" : 
    {
        title: "My Experience & Skills",
        content: `Bachelor of Technology in Computer Engineering -- -- 2022-2026 <br> From Marwadi Universiy, Rajkot <br> Language : C++, Dart, Java <br> Tools & libraries : SFML, Unreal Engine, Blender, Asprite, THREEJS, Flutter, MERN-Stack,SQL, PreForce, Git/GitHub <br> Grab My Experience here !! <br> <a href="./Assets/Rahul_Resume.pdf" download="MyResume.pdf" class="view-link">View Resume</a>`,
    },
    "NamePlate" : 
    {
        title: "Player 1 :",
        content: "I am Coder , Developer , Gamer \nDream. Design. Deploy." ,
    },
    "Picnic" : 
    {
        title: "About Me",
        content: `
            Passionate Game Developer
            Building games with C++ & Unreal Engine
            Focus: Game logic, immersive gameplay, mechanics, systems, in-game animations
            Exploring complex game logic through personal projects
            Also skilled in MERN-stack web development
            Cross-platform app dev with Flutter Framework
        `,
    },
    "Project1" : 
    {
        title: "E-commerce stationary wesbite",
        content: "MERN-stack website E-Commerce website for stationary shop, with Complete Admin panel and stock list and other necessary features like cart add-on, user authentication etc... Made this during my second semeter in computer Engineering." ,
    },
    "Project2" : 
    {
        title: "Food-Recipe app",
        content:"Food Recipe app that shows user all the recipes at one place with all its ingredients, steps, calories and required time.Where user can login through two roles either it can view recipes or can uoload its own recipes for those who are Professional Chef, which others can show and review it.  but the main attraction -- AI chatbot that gives personalize suggestion upon user's mood , time and whether by giving prompt. Project is currently on going so,<br> Stay Tuned......" ,
    },
    "Project31" : 
    {
        title: "Extreme Climber",
        content:`A 2-D platformer game made on Unreal Engine using C++ with blender. where player need to complete parkour challenge to beat the game or can set respawn on checkpoint. you should definetly play this game once.<br><a href="https://sneaky-k.itch.io/2d-platformerr" target="_blank" class="view-link">Download & Play</a>` ,
    },
    "Project32" : 
    {
        title: "Extreme Climber",
        content:`A 2-D platformer game made on Unreal Engine using C++ with blender. where player need to complete parkour challenge to beat the game or can set respawn on checkpoint. you should definetly play this game once.<br><a href="https://sneaky-k.itch.io/2d-platformerr" target="_blank" class="view-link">Download & Play</a>` ,
    },
}


// to fetch HTML content & write their logic here
const model = document.querySelector(".model")
const modelTitle = document.querySelector(".model-title")
const modelProjectDescription = document.querySelector(".model-project-description")
const modelExitButton = document.querySelector(".model-exit-button")
const runButton = document.getElementById('run-button')


//POP-UPS
//pops-up the description of project
function showModel (id)
{
    const content = projectContent[id];
    if(content)
    {
        modelTitle.textContent = content.title;
        //used innerHTML instead of .textcontent because .innerHTMl let us use html tags link href and br in content description.
        modelProjectDescription.innerHTML = content.content;
        model.classList.toggle("hidden");
    }
}


//removes the description of project.
function hideModel ()
{
    model.classList.toggle("hidden");
}


let interactObject = "";
//this array stores the all information of objects that are interactable.
const interactObjects = [];
const interactObjectsNames = [
    "AboutMe",
    "AboutMeSign",
    "MailBoxResume",
    "MailBox",
    "NamePlate",
    "Picnic",
    "Pikachu",
    "Pikachu2",
    "Project1",
    "Project2",
    "Project31",
    "Project32",
    "CharacterModel"
];


//LOADER

const loadingManager = new THREE.LoadingManager();

loadingManager.onProgress = function(item, loaded, total) 
{
    // Update the progress bar width based on the percentage loaded
    const percent = Math.round((loaded / total) * 100);
    if (progressIndicator) 
    {
        progressIndicator.style.width = `${percent}%`;
    }
};

loadingManager.onLoad = function() 
{
    // hide the Progress Bar Container completely
    if (loaderBar) 
    {
        loaderBar.classList.add('hidden-bar');
    }

    // update Status Text(that appear when loading is done)
    if (loaderStatusText) 
    {
        loaderStatusText.textContent = '';
    }

    // this line changes the default HTML loader-instructions text
    if (instructionsText) 
    {
        instructionsText.textContent = '(ex. Click name, resume, aboutme, project etc...)';
    }

    // show the Enter button & on click it gets hidden
    if (enterButton) 
    {
        enterButton.classList.remove('hidden');
    }

    // set up the click listener to simple fade out animation for Enter button
    if (enterButton) 
    {
        enterButton.addEventListener('click', () => {
            // start the fade out effect
            if (loadingScreen) 
            {
                loadingScreen.classList.add('fade-out');
            }
        });
    }
};

loadingManager.onError = function(url) 
{
    console.error(`There was an error loading ${url}`);
};

/* Simple GLTF loader is sufficient to lode the whole model,but ThreeJs needed another dracoLoader which is a decoding plugin as well that compresses the 3D-model size as it reduces the geometry that renders.

So, Here GLTF loader handles the primary file transfer of loading but Dracoloader allows compressed
geometry to render. And with that path of draco loader is also required */ 

// Now, initialize your loaders using the manager
const dracoLoader = new DRACOLoader(loadingManager); // Pass the manager here
dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/'); 

 
const loader = new GLTFLoader(loadingManager); // Pass the manager here
// Means here our loader which is a GLTF loader renders the data which is compressed by dracoloader, so it uses the funcionality of setDRACOLoader and we are using threejs dracoloader 
loader.setDRACOLoader(dracoLoader);


loader.load(
    "./Assets/3DModels/Garden.glb",
    function (glb) 
    {
        glb.scene.traverse((child => 
        {
            if(interactObjectsNames.includes(child.name))
            {
                interactObjects.push(child);
            }
            if(child.isMesh)
            {
                if(child.name === "Collision_Garden_Wall")
                {
                    child.visible = false;
                }
                else
                {
                    child.castShadow = true;
                    child.receiveShadow = true;
                } 
            }
            const collidableNames = 
            [
                "Collision_Garden_Wall" // new invisible wall
            ];

            // this will push walls into collidable objects array which will prevent it from going thorugh walls who's logic is inside characterContorls.js file.
            if (child.isMesh && collidableNames.includes(child.name)) 
            {
                collidable_Objects.push(child);
            }
  
            // console.log(child.name);

        }));
        // this will add garden on scene as glb variable
        scene.add( glb.scene );
    },
    undefined,
    function(error) 
    {
        console.error(error);
    }
);


//SUN-LIGHT
//to make scene more bright and add sunLight.

const sun = new THREE.DirectionalLight( 0xFFFFFF,1);
sun.castShadow = true;
//position of that casting shadow angle or position of Sun.
sun.position.set(80,120,0);
sun.target.position.set(4,0,0);

//Map size of shadow which can increase the resolutions of shadows by increasing the value.
sun.shadow.mapSize.width = 512;
sun.shadow.mapSize.height = 512;

sun.shadow.camera.left = -45;
sun.shadow.camera.right = 100;
sun.shadow.camera.top = 100;
sun.shadow.camera.bottom = -50;
// this will make shadows more smoother and cleaner instead of that edgy and rough shadows.
sun.shadow.normalBias = 0.01;
scene.add(sun);


//HELPER
//to add camera angle that cast shadows of mesh which are covered by this angle.
//basically it shows the lines so that developer know that in how many area light is going

// const Shadowhelper = new THREE.CameraHelper( sun.shadow.camera );
// scene.add( Shadowhelper );
// console.log(sun.shadow);


/* same as above helper but this one shows only one line that sun is emmiting its light.
means in which direction light is going from where to where is shown by a single line through this helper */

// const helper = new THREE.DirectionalLightHelper( sun, 5);
// scene.add( helper );


//model is loaded but not visible untill the lights for it is provided.
const light = new THREE.AmbientLight(0x404040, 3); // default soft white light
scene.add(light);



const HDRI_FILES = 
[
    './Assets/BackGround_Hdri/SunRise.hdr', // Current one
    './Assets/BackGround_Hdri/BKW.hdr',       // Replace with your second HDRI file name
    './Assets/BackGround_Hdri/MidNight.hdr'   // Replace with your third HDRI file name
];


let currentHDRIIndex = 0;


//CAMERA

const aspectRatio = sizes.width / sizes.height;
//camera setUp for Website.
const camera = new THREE.PerspectiveCamera(
    80, //Fov
    aspectRatio, //AspectRatio
    0.1, // near distance
    1000 // far distance
);


//CONTROLS
const controls = new OrbitControls( camera, canvas);
controls.enableDamping = true;
const camera_Distance = 4;
controls.minDistance = camera_Distance;
controls.maxDistance = camera_Distance;

// these values decide how character can swipe the scene vertically to explore.
// values less than 3 will stop character from looking up.
controls.minPolarAngle = Math.PI / 3;
controls.maxPolarAngle = Math.PI / 0.75;

//this will prevent user drag the scene using two-fingers(basically used to focus always on character)
controls.enablePan = false; 
// controls.update();




// CHARACTER MODEL

new GLTFLoader().load('./Assets/3DModels/Character.glb', function (gltf)
{
    const model = gltf.scene;
    model.traverse(function (object)
    {
        if(object.isMesh) object.castShadow = true;
    });

    model.position.set(10,0,-2); // Position of Character
    model.scale.set(1.5,1.5,1.5); //Scale of Character
    model.name = "Rahul" //Name

    scene.add(model);

    const gltfAnimations = gltf.animations;
    const mixer = new THREE.AnimationMixer(model);
    const animationsMap = new Map()
    gltfAnimations
        .filter(a => a.name != 'TPose')
        .forEach(a => {
            animationsMap.set(a.name, mixer.clipAction(a));
        });


        const initial_Action = 'Idle';
        animationsMap.get(initial_Action).play();

        characterControls = new CharacterControls
        (
            model,
            mixer,
            animationsMap,
            controls,
            camera,
            initial_Action,
            keysPressed
        );

        characterControls.updateCameraTarget(0, 0); 
        
        // Copy the calculated ideal positions immediately to the camera/controls
        camera.position.copy(characterControls.idealCameraPosition);
        controls.target.copy(characterControls.idealCameraTarget);

        
    // RUN-BUTTON Logic
    if (runButton) 
    {
        const toggleRunState = (e) => 
        {
            // Prevent default touch/click behavior, especially on mobile
            if (e && e.preventDefault) e.preventDefault(); 
            
            // Toggle the character's run state
            characterControls.switchRunToggle();

            // Update the button text
            runButton.textContent = characterControls.toggleRun ? 'WALK' : 'RUN';

            // ADD OR REMOVE THE VISUAL RUNNING CLASS
            if (characterControls.toggleRun) 
            {
                runButton.classList.add('running');
            } 
            else 
            {
                runButton.classList.remove('running');
            }
        };
        runButton.addEventListener('click', toggleRunState);
        runButton.addEventListener('touchstart', toggleRunState);
    }
    controls.update();
});

// MOVEMENT CONTROLS

// to access it in characterControls.js file make it global by using window. instead of const
window.keysPressed = {};

// keyDown Means whenever a key is pressed.
function handleKeyDown(event)
{
    const key = event.key.toLowerCase();

    // 1. Shift Key Logic (Run Toggle)
    if(event.key === 'Shift')
    {
        // Ensure characterControls exists and Shift is not already pressed
        if(window.characterControls && !window.keysPressed['Shift'])
        {
            window.characterControls.switchRunToggle(); 
            window.keysPressed['Shift'] = true;
        }
    }
    else
    {
        // Use the global keysPressed object
        window.keysPressed[key] = true;
    }
}


// keyUp means whenever presses key is released.
function handleKeyUp(event)
{
    const key = event.key.toLowerCase();
    
    if(event.key === 'Shift')
    {
        if(window.characterControls && !window.keysPressed['Shift'])
        {
            window.characterControls.switchRunToggle();
            window.keysPressed['Shift'] = false;
        }
    }
    else
    {
        window.keysPressed[key] = false;
    }
}


//To resize the website at real time when it is being resized instead of reloading after each resize.
function handleResize()
{
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    const aspect = window.innerWidth / window.innerHeight;

    /* this lines are only needed for orthographic camera not for perspective camera.
    camera.left = 50, 
    camera.right = sizes.width/sizes.height, 
    camera.top = 0.1, 
    camera.bottom = 1000, */

    /* this aspect is make website to update its size and dimension while they are changing instead of reloading after change. */
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    
    renderer.setSize(sizes.width,sizes.height);
    // to keep pixelRatio below 2 otherwise it may overuse GPU or kill performance due to high ratio.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
}


function handleClick()
{
    console.log(interactObject);
    if(interactObject !== "")
    {
        showModel(interactObject)
    }
}


//to make objects clickable and touchable.
function handlePointerMove( event ) 
{

	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components

	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}


//  VIRTUAL JOYSTICK SETUP 

/* this dead zone means is movement is less than 15 pixels then it will be ignored and not calculated as
joystick movement so when user is just exploring and touching the world it wont considered as movement */
const dead_Zone_Distance = 15;
function setupVirtualJoystick() 
{
    if (typeof nipplejs === 'undefined') 
    {
        console.warn("nipplejs not loaded. Skipping joystick setup.");
        return;
    }

    const manager = nipplejs.create
    ({
        zone: document.getElementById('joystick-container'),
        mode: 'static', 
        position: { left: '50%', top: '50%' },
        color: 'white',
        size: 100,
    });
    
    // Helper function to clear all movement keys
    const clearMovementKeys = () => 
    {
        keysPressed['w'] = false;
        keysPressed['a'] = false;
        keysPressed['s'] = false;
        keysPressed['d'] = false;
        // Optionally clear 'Shift' if you plan to use a run button
        keysPressed['Shift'] = false; 
    };

    // most important part for stopping movement.
    manager.on('end', function () 
    {
        // This ensures keys are cleared every time the user lifts their finger.
        clearMovementKeys();
    });

    // Handle Movement
    manager.on('move', function (evt, data) 
    {    
        // If the movement is too small, treat it as a released state immediately.
        if (data.distance < dead_Zone_Distance) 
        { 
            clearMovementKeys();
            return; 
        }

        // Reset all keys before setting new ones
        clearMovementKeys();

        let angle = data.angle.radian;
        
        // Rotate the angle by -PI/2 to align joystick 'up' (Nipple) with game 'forward' (W)
        angle -= Math.PI / 2;
        if (angle < -Math.PI) 
        {
            angle += 2 * Math.PI;
        }

        // 8-Directional Mapping Logic 
        // Forward (W) - centered at 0
        if (angle >= -Math.PI / 8 && angle <= Math.PI / 8) 
        {
            keysPressed['w'] = true;
        }
        // Forward-Right (W + D)
        else if (angle > -3 * Math.PI / 8 && angle < -Math.PI / 8) 
        {
             keysPressed['w'] = true;
             keysPressed['d'] = true;
        }
        // Right (D) - centered at -PI/2
        else if (angle >= -5 * Math.PI / 8 && angle <= -3 * Math.PI / 8) 
        {
            keysPressed['d'] = true;
        }
        // Backward-Right (S + D)
        else if (angle > -7 * Math.PI / 8 && angle < -5 * Math.PI / 8) 
        {
             keysPressed['s'] = true;
             keysPressed['d'] = true;
        }
        // Backward (S) - centered at -PI
        else if (angle >= 7 * Math.PI / 8 || angle <= -7 * Math.PI / 8) 
        {
            keysPressed['s'] = true;
        }
        // Backward-Left (S + A)
        else if (angle > 5 * Math.PI / 8 && angle < 7 * Math.PI / 8) 
        {
             keysPressed['s'] = true;
             keysPressed['a'] = true;
        }
        // Left (A) - centered at PI/2
        else if (angle >= 3 * Math.PI / 8 && angle <= 5 * Math.PI / 8) 
        {
            keysPressed['a'] = true;
        }
        // Forward-Left (W + A)
        else if (angle > Math.PI / 8 && angle < 3 * Math.PI / 8) 
        {
            keysPressed['w'] = true;
            keysPressed['a'] = true;
        }
    });
}

// function Call
setupVirtualJoystick();



function playClick() 
{
    const clickSound = document.getElementById('click-sound');
    if (clickSound) 
    {
        clickSound.currentTime = 0; // Reset to start
        // to ensure that play is wrapped in a try/catch for promise errors (common in browsers)
        clickSound.play().catch(e => console.log("Click sound block/error:", e));
    }
}



function handleHdriChange() 
{
    const hdriButton = document.getElementById('hdri-change-button');
    const hdriIcon = hdriButton ? hdriButton.querySelector('.button-icon') : null;

    // Start the visual fade, which will internally update currentHDRIIndex in the animate loop
    startHDRIChange(); 
    
    // Toggle the button's visual state (for CSS glow/color)
    if (hdriButton && hdriIcon) 
    {
        hdriButton.classList.toggle('active');
        
        // --- ICON SWAP LOGIC ---
        // Determine the index of the HDRI that will be loaded next.
        const nextIndex = (currentHDRIIndex + 1) % HDRI_FILES.length;
        const nextHDRIFile = HDRI_FILES[nextIndex];

        // This makes the icon swap *predictive* based on the next file name
        if (nextHDRIFile.toLowerCase().includes('sun')) 
        {
            // Icon represents the next environment (e.g., Day)
            hdriIcon.src = './Assets/Icons/dayIcon.png'; 
            hdriIcon.alt = 'Day/Light Icon';
        } 
        else 
        {
            // Icon represents the next environment (e.g., Night/Dark)
            hdriIcon.src = './Assets/Icons/nightIcon.png'; 
            hdriIcon.alt = 'Night/Dark Icon';
        }
    }
}


function startHDRIChange() 
{
    if (isFading) return; // Prevent spamming the button

    isFading = true;
    isbackGroundChanging = true; // Start by transitioning to the "fog_Density_Max" state
    fadeStartTime = performance.now(); // Record the start time
    
    // The actual HDRI switch and fade-out will happen in the animate loop (Step 3)
}

// Initial Call (call this where you previously called loadNextHDRI)
startHDRIChange();


/**
 * Toggles the background music playback, updates the button's state,
 * and swaps the icon image source.
 */
function handleMusicChange() 
{
    const musicButton = document.getElementById('music-button');
    const backgroundMusic = document.getElementById('background-music');

    if (!musicButton || !backgroundMusic) 
    {
        console.error("Music button or audio element not found.");
        return;
    }

    // Get the image element inside the button
    const musicIcon = musicButton.querySelector('.button-icon');
    if (!musicIcon) 
    {
        console.error("Music button icon element (.button-icon) not found.");
        return;
    }

    backgroundMusic.volume = 0.3;

    if (backgroundMusic.paused) 
    {
        backgroundMusic.play()
            .then(() => {
                // Change the icon to the 'ON' state
                musicIcon.src = "./Assets/Icons/musicONIcon.png"; 
                musicIcon.alt = 'Music ON Icon';
                
                // Add the playing class for CSS glow/color change
                musicButton.classList.add('playing');
                // console.log('Music started.');
            })
            .catch(error => 
            {
                console.error('Playback failed:', error);
                alert('Music playback failed. Some browsers require user interaction to start audio.');
            });
    } 
    else 
    {
        backgroundMusic.pause();
        
        // Change the icon back to the 'OFF' state
        musicIcon.src = './Assets/Icons/MusicOffIcon.png'; 
        musicIcon.alt = 'Music OFF Icon';
        
        // Remove the playing class to reset CSS glow/color
        musicButton.classList.remove('playing');
        console.log('Music paused.');
    }
}


const loadingScreen = document.getElementById('loading-screen');
const progressIndicator = document.getElementById('progress-indicator');
const loaderStatusText = document.getElementById('loader-status-text');
const enterButton = document.getElementById('enter-button');
const loaderBar = document.querySelector('.loader-bar'); 
const instructionsText = document.getElementById('instructions-text');


modelExitButton.addEventListener("click", hideModel);
window.addEventListener("resize", handleResize);
window.addEventListener("click", handleClick);
window.addEventListener("pointermove", handlePointerMove);
window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);


document.addEventListener('DOMContentLoaded', () => 
{
    
    const musicButton = document.getElementById('music-button');
    const hdriButton = document.getElementById('hdri-change-button');
    const toggleButtons = document.querySelectorAll('.cube-toggle-button');
    const backgroundMusic = document.getElementById('background-music'); 
    
    // ensure everything starts in the correct default state ---
    if (musicButton && backgroundMusic) 
    {
        const musicIcon = musicButton.querySelector('.button-icon');
        
        // set initial volume
        backgroundMusic.volume = 0.3;
        
        // force the button/icon to the OFF state, as music is paused by default 
        // until the user clicks it (due to browser policy).
        if (musicIcon) 
        {
            musicIcon.src = './Assets/Icons/MusicOffIcon.png'; 
            musicIcon.alt = 'Music OFF Icon';
        }
        musicButton.classList.remove('playing'); 
        console.log('Music system initialized. Music is paused, awaiting user click.');
    }

    // MUSIC BUTTON: Attach the toggle function
    if (musicButton) 
    {
        musicButton.addEventListener('click', handleMusicChange);
    }
    
    // HDRI BUTTON: Attach the new toggle function
    if (hdriButton) 
    {
        hdriButton.addEventListener('click', handleHdriChange);
        hdriButton.addEventListener('touchstart', (e) => { 
            e.preventDefault(); 
            handleHdriChange();
        });
    }
    
    // CLICK SOUND: Attach playClick to both buttons using the shared class
    if (toggleButtons.length > 0) 
    {
        toggleButtons.forEach(button => {
            button.addEventListener('click', playClick);
            button.addEventListener('touchstart', playClick);
        });
    }
});


// this function will decide what to render on screen constantly.
function animate()
{

    const delta = clock.getDelta();
    
    if (isFading) 
    {
        // Calculate the time elapsed since the fade started (convert milliseconds to seconds)
        const timeElapsed = (performance.now() - fadeStartTime) / 1000;
        let t = Math.min(1.0, timeElapsed / FADE_DURATION); // Normalized time (0.0 to 1.0)

        if (isbackGroundChanging) 
        {
            // phase 1: FADE in (Normal Density to Max Density)
            scene.fog.density = THREE.MathUtils.lerp(fog_Density_Normal, fog_Density_Max, t);

            if (t >= 1.0) 
            {
                // FADE-IN COMPLETE: Now switch the HDRI and start the FADE-OUT
                
                // Switch HDRI to the next file
                const hdriFileName = HDRI_FILES[currentHDRIIndex];
                new RGBELoader().setPath('').load(hdriFileName, (texture) => 
                {
                    texture.mapping = THREE.EquirectangularReflectionMapping;
                    scene.background = texture; 
                });
                
                // Cycle the index for the next switch
                currentHDRIIndex = (currentHDRIIndex + 1) % HDRI_FILES.length;
                
                // Reset for the fade-out phase
                isbackGroundChanging = false;
                fadeStartTime = performance.now(); // Restart the timer for the fade-out
            }
        } 
        else 
        {
            // phase 2: FADE OUT (Max Density to Normal Density)
            t = 1.0 - t; // reverse the normalized time (1.0 to 0.0)
            scene.fog.density = THREE.MathUtils.lerp(fog_Density_Normal, fog_Density_Max, t);
            
            if (t <= 0.0) 
            {
                // FADE-OUT COMPLETE: Stop the animation
                isFading = false;
                scene.fog.density = fog_Density_Normal; // Lock it to the final normal value
            }
        }
    }
    if(characterControls)
    {
        // The camera update logic is now handled internally by characterControls.update()
        characterControls.update(delta,keysPressed);
        camera.position.lerp(characterControls.idealCameraPosition, 0.01); 
    }



    // console.log(camera.position);

    // update the picking ray with the camera and pointer position
	raycaster.setFromCamera( pointer, camera );

	// calculate objects intersecting the picking ray
    // no need to intersect whole scene only the objects which are interactble for which we have made array
	const intersects = raycaster.intersectObjects( interactObjects );


    // change cursor from arrow to pointer if it is an interactble object.
    if(intersects.length > 0)
    {
        document.body.style.cursor = "pointer";
    }
    // else it will stay default arrow.
    else
    {
        document.body.style.cursor = "default";
        /* this will reset the pointer as well otherwise after clicking for first time it will 
           give pop ups on every click whether it is on clickable objects or not. */
        interactObject = "";
    }

	for ( let i = 0; i < intersects.length; i ++ ) 
    {
        // console.log(intersects[0].object.parent.name);
        interactObject = intersects[0].object.parent.name;
		// intersects[ i ].object.material.color.set( 0xff0000 );
    }

    controls.update();
    renderer.render(scene,camera);
    // requestAnimationFrame(animate)
}

// and this feature will keep animating the animation function again & again.
renderer.setAnimationLoop(animate);