import * as THREE from 'three'; 

// helper Variables for Directions
const W = 'w';
const A = 'a';
const S = 's';
const D = 'd';
const DIRECTIONS = [W, A, S, D]; 

// CharacterControls Class
export class CharacterControls 
{
    model;
    mixer;
    animationsMap = new Map(); 
    orbitControl;
    camera;
    toggleRun = false; 
    currentAction;
    walkDirection = new THREE.Vector3();
    rotateAngle = new THREE.Vector3(0, 1, 0);
    rotateQuarternion = new THREE.Quaternion();
    cameraTarget = new THREE.Vector3(); 
    fadeDuration = 0.2;
    runVelocity = 5;
    walkVelocity = 2;
    tight_Offset_Y = 3.5; 
    tight_Offset_Z = 4;
    idealCameraPosition = new THREE.Vector3();
    idealCameraTarget = new THREE.Vector3();
    cameraRotationOffset = new THREE.Vector3(); 


    // Define the raycasting directions for a 360-degree check
    RAYCAST_VECTORS = [
        new THREE.Vector3(0, 0, 1),   // Forward
        new THREE.Vector3(0, 0, -1), // Backward
        new THREE.Vector3(1, 0, 0),   // Right
        new THREE.Vector3(-1, 0, 0), // Left
        new THREE.Vector3(1, 0, 1).normalize(),  // Diagonals
        new THREE.Vector3(1, 0, -1).normalize(),
        new THREE.Vector3(-1, 0, 1).normalize(),
        new THREE.Vector3(-1, 0, -1).normalize()
    ];

    constructor(model, mixer, animationsMap, orbitControl, camera, currentAction) 
    {
        this.model = model;
        this.mixer = mixer;
        this.animationsMap = animationsMap;
        this.currentAction = currentAction;
        this.keysPressed = keysPressed;
        
        this.animationsMap.forEach((value, key) => 
        {
            if (key === currentAction) {
                value.play();
            }
        });
        
        this.orbitControl = orbitControl;
        this.camera = camera;
        this.updateCameraTarget(0, 0);
    }

    switchRunToggle() 
    {
        this.toggleRun = !this.toggleRun;
    }

    update(delta, keysPressed) 
    {
        const directionPressed = DIRECTIONS.some(key => keysPressed[key] === true);

        let play = directionPressed 
            ? (this.toggleRun ? 'Run' : 'Walk') 
            : 'Idle';

        // Animation Switching Logic
        if (this.currentAction !== play) 
        {
            const toPlay = this.animationsMap.get(play);
            const current = this.animationsMap.get(this.currentAction);
            
            if (current) current.fadeOut(this.fadeDuration);
            if (toPlay) toPlay.reset().fadeIn(this.fadeDuration).play();

            this.currentAction = play;
        }

        this.mixer.update(delta);

        // Character Movement Logic
        if (directionPressed) 
        {
            
            // (Rotation Logic )
            const angleYCameraDirection = Math.atan2(
                (this.camera.position.x - this.model.position.x), 
                (this.camera.position.z - this.model.position.z)
            );
            
            const directionOffset = this.directionOffset(keysPressed);

            this.rotateQuarternion.setFromAxisAngle(this.rotateAngle, angleYCameraDirection + directionOffset);
            this.model.quaternion.rotateTowards(this.rotateQuarternion, 0.02);

            this.camera.getWorldDirection(this.walkDirection);
            this.walkDirection.y = 0;
            this.walkDirection.normalize();
            this.walkDirection.applyAxisAngle(this.rotateAngle, directionOffset);

            const velocity = this.currentAction === 'Run' ? this.runVelocity : this.walkVelocity;

            let moveX = this.walkDirection.x * velocity * delta;
            let moveZ = this.walkDirection.z * velocity * delta;

            // Collision Check Logic

            // Check if the global variables are available
            if (window.collisionRaycaster && window.collidable_Objects) 
            {
                
                const isColliding = this.checkCollision(moveX, moveZ);

                if (isColliding) 
                {
                    moveX = 0;
                    moveZ = 0;

                    // Stop the animation if movement is blocked
                    if (this.currentAction !== 'Idle') 
                    {
                        const toPlay = this.animationsMap.get('Idle');
                        const current = this.animationsMap.get(this.currentAction);
                        
                        if (current) current.fadeOut(this.fadeDuration);
                        if (toPlay) toPlay.reset().fadeIn(this.fadeDuration).play();
                        this.currentAction = 'Idle';
                    }
                }
            }

            this.model.position.x += moveX;
            this.model.position.z += moveZ;
            this.updateCameraTarget(moveX, moveZ);
        }
    }
    
    /**
     * Performs a 360-degree raycast around the character to check for walls.
     * @param {number} moveX The amount of movement in the X direction.
     * @param {number} moveZ The amount of movement in the Z direction.
     * @returns {boolean} True if a collision is imminent, false otherwise.
     */
    
    checkCollision(moveX, moveZ) 
    {
        
        // Use the global variables (declared in main.js)
        const collisionDistance = window.collisionDistance || 0.5;
        const collidable_Objects = window.collidable_Objects || [];
        const collisionRaycaster = window.collisionRaycaster;
        
        if (!collisionRaycaster || collidable_Objects.length === 0) return false;

        // Origin point is the character's position, slightly above ground (e.g., 1 unit)
        const originPoint = this.model.position.clone().add(new THREE.Vector3(0, 1.0, 0));
        
        // This vector holds the *next* attempted position.
        const nextPosition = this.model.position.clone().add(new THREE.Vector3(moveX, 0, moveZ));
        
        // Calculate the vector from the character to the intended next position.
        const attemptedDirection = nextPosition.sub(this.model.position).normalize();
        
        
        // Perform raycasting in multiple directions
        let isColliding = false;
        
        // Use the model's current rotation to rotate the ray vectors
        const characterRotation = this.model.quaternion.clone();
        
        // We only need to check the rays pointing in the current movement direction's quadrant
        for (let i = 0; i < this.RAYCAST_VECTORS.length; i++) 
        {
            
            const rayDirection = this.RAYCAST_VECTORS[i].clone();
            
            // Project the ray direction by the character's rotation
            rayDirection.applyQuaternion(characterRotation);
            
            // Only cast the ray if it is generally pointing towards the attempted direction.
            // This is a simple dot product check to prevent unnecessary raycasts.
            if (rayDirection.dot(attemptedDirection) < 0.1) 
            { 
                continue; // Skip rays pointing away from the movement
            }

            collisionRaycaster.set(originPoint, rayDirection);
            
            const collisions = collisionRaycaster.intersectObjects(collidable_Objects, false);
            
            // Check if any collision is within the character's collision distance
            if (collisions.length > 0 && collisions[0].distance < collisionDistance) 
            {
                isColliding = true;
                break; 
            }
        }
        
        return isColliding;
    }


    updateCameraTarget(moveX, moveZ) 
    {
        // Calculate Ideal Camera Position ---
        const idealOffset = new THREE.Vector3(0, this.tight_Offset_Y, this.tight_Offset_Z);
        idealOffset.applyQuaternion(this.model.quaternion);
        idealOffset.add(this.model.position);
        this.idealCameraPosition.copy(idealOffset);

        // Calculate Ideal Camera Target (what OrbitControls should look at)
        const idealTargetOffset = new THREE.Vector3(0, 2.5, 0); 
        idealTargetOffset.add(this.model.position);
        this.idealCameraTarget.copy(idealTargetOffset);

        // Update OrbitControls' target. 
        this.orbitControl.target.copy(this.idealCameraTarget);
        this.orbitControl.update(); 
    }


    directionOffset(keysPressed) 
    {
        var directionOffset = 0 // w

        if (keysPressed[W]) 
        {
            if (keysPressed[A]) 
            {
                directionOffset = Math.PI / 4 // w+a
            } 
            else if (keysPressed[D]) 
            {
                directionOffset = - Math.PI / 4 // w+d
            }
        } 
        else if (keysPressed[S]) 
        {
            if (keysPressed[A]) 
            {
                directionOffset = Math.PI / 4 + Math.PI / 2 // s+a
            } 
            else if (keysPressed[D]) 
            {
                directionOffset = -Math.PI / 4 - Math.PI / 2 // s+d
            } 
            else 
            {
                directionOffset = Math.PI // s
            }
        } 
        else if (keysPressed[A]) 
        {
            directionOffset = Math.PI / 2 // a
        } 
        else if (keysPressed[D]) 
        {
            directionOffset = - Math.PI / 2 // d
        }

        return directionOffset;
    }
}