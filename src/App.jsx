import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const FPSShooter = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    console.log('THREE.js loaded:', THREE);
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.tabIndex = 1; // Make canvas focusable

    // Add renderer to DOM
    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    // Create a simple brown ground
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Add a white cube as reference point
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.set(0, 0.5, -5);
    scene.add(cube);

    // Add more cubes for reference
    for (let i = 0; i < 10; i++) {
      const refCube = cube.clone();
      refCube.position.set(
        (Math.random() - 0.5) * 30,
        0.5,
        (Math.random() - 0.5) * 30
      );
      refCube.material = new THREE.MeshBasicMaterial({ 
        color: new THREE.Color().setHSL(Math.random(), 0.8, 0.6) 
      });
      scene.add(refCube);
    }

    // Variables for mouse look
    let isPointerLocked = false;
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    const PI_2 = Math.PI / 2;

    // Movement variables
    const moveSpeed = 0.12; // Slightly slower for drunk effect
    const keys = {
      w: false,
      a: false,
      s: false,
      d: false
    };

    // Drunk effect variables
    let drunkTime = 0;
    const drunkIntensity = 0.3; // How drunk (0 = sober, 1 = very drunk)
    const swayAmount = 0.05;
    const bobAmount = 0.03;
    const rotationSwayAmount = 0.02;

    // Mouse movement handler
    const onMouseMove = (event) => {
      if (!isPointerLocked) return;

      const { movementX, movementY } = event;
      
      euler.setFromQuaternion(camera.quaternion);
      euler.y -= movementX * 0.002;
      euler.x -= movementY * 0.002;
      euler.x = Math.max(-PI_2, Math.min(PI_2, euler.x));
      
      camera.quaternion.setFromEuler(euler);
    };

    // Keyboard handlers
    const onKeyDown = (event) => {
      if (!isPointerLocked) return; // Only respond to keys when locked
      
      const key = event.key.toLowerCase();
      if (key in keys) {
        keys[key] = true;
        console.log(`Key pressed: ${key.toUpperCase()}`);
        event.preventDefault(); // Prevent default browser behavior
      }
    };

    const onKeyUp = (event) => {
      if (!isPointerLocked) return; // Only respond to keys when locked
      
      const key = event.key.toLowerCase();
      if (key in keys) {
        keys[key] = false;
        console.log(`Key released: ${key.toUpperCase()}`);
        event.preventDefault();
      }
    };

    // Movement function
    const updateMovement = () => {
      if (!isPointerLocked) return; // Only move when pointer is locked
      
      // Check if any movement keys are pressed
      const isMoving = keys.w || keys.a || keys.s || keys.d;

      // Calculate movement direction
      let moveX = 0;
      let moveZ = 0;

      if (isMoving) {
        // Forward/backward movement
        if (keys.w) moveZ -= 1;
        if (keys.s) moveZ += 1;
        
        // Left/right movement  
        if (keys.a) moveX -= 1;
        if (keys.d) moveX += 1;

        // Normalize diagonal movement
        if (moveX !== 0 && moveZ !== 0) {
          moveX *= 0.707; // 1/sqrt(2)
          moveZ *= 0.707;
        }

        // Add drunk stumbling to movement
        const stumbleX = (Math.sin(drunkTime * 1.5) + Math.sin(drunkTime * 2.3)) * 0.3;
        const stumbleZ = (Math.cos(drunkTime * 1.2) + Math.cos(drunkTime * 1.8)) * 0.3;
        
        moveX += stumbleX * drunkIntensity;
        moveZ += stumbleZ * drunkIntensity;

        // Apply movement speed with some randomness
        const speedVariation = 1 + (Math.random() - 0.5) * 0.3 * drunkIntensity;
        moveX *= moveSpeed * speedVariation;
        moveZ *= moveSpeed * speedVariation;

        // Get camera's forward and right vectors
        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);
        
        const cameraRight = new THREE.Vector3();
        cameraRight.crossVectors(cameraDirection, camera.up).normalize();

        // Calculate final movement vector
        const finalMovement = new THREE.Vector3();
        finalMovement.addScaledVector(cameraDirection, -moveZ); // Forward/backward
        finalMovement.addScaledVector(cameraRight, moveX); // Left/right
        finalMovement.y = 0; // Keep movement horizontal

        // Apply movement
        camera.position.add(finalMovement);
      }

      // Always apply drunk effects (even when not moving)
      const baseHeight = 1.6;
      
      // Head bobbing and swaying
      const swayX = Math.sin(drunkTime * 0.8) * swayAmount * drunkIntensity;
      const swayZ = Math.cos(drunkTime * 0.6) * swayAmount * drunkIntensity;
      const bob = Math.sin(drunkTime * 1.5) * bobAmount * drunkIntensity;
      
      // Apply drunk camera position effects
      camera.position.x += swayX * 0.1;
      camera.position.z += swayZ * 0.1;
      camera.position.y = baseHeight + bob;

      // Drunk head rotation sway
      const currentEuler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
      const rollSway = Math.sin(drunkTime * 0.7) * rotationSwayAmount * drunkIntensity;
      const pitchSway = Math.cos(drunkTime * 0.9) * rotationSwayAmount * 0.5 * drunkIntensity;
      
      // Apply subtle head roll and pitch
      currentEuler.z = rollSway; // Head tilt/roll
      currentEuler.x += pitchSway * 0.1; // Slight pitch variation
      
      camera.quaternion.setFromEuler(currentEuler);
      
      if (isMoving) {
        console.log('Drunk movement applied:', {
          keys: Object.keys(keys).filter(k => keys[k]).join('+') || 'none',
          position: { 
            x: camera.position.x.toFixed(2), 
            y: camera.position.y.toFixed(2), 
            z: camera.position.z.toFixed(2) 
          },
          drunkEffects: {
            sway: { x: swayX.toFixed(3), z: swayZ.toFixed(3) },
            bob: bob.toFixed(3),
            roll: rollSway.toFixed(3)
          }
        });
      }
    };

    // Pointer lock handlers
    const onPointerLockChange = () => {
      isPointerLocked = document.pointerLockElement === renderer.domElement;
      console.log('Pointer lock changed:', isPointerLocked);
      
      if (isPointerLocked) {
        // Focus the canvas when locked
        renderer.domElement.focus();
      } else {
        // Clear all keys when unlocked
        Object.keys(keys).forEach(key => keys[key] = false);
      }
    };

    const onPointerLockError = () => {
      console.error('Pointer lock error');
    };

    const onClick = () => {
      console.log('Canvas clicked, requesting pointer lock');
      renderer.domElement.requestPointerLock();
    };

    // Add event listeners
    document.addEventListener('pointerlockchange', onPointerLockChange);
    document.addEventListener('pointerlockerror', onPointerLockError);
    document.addEventListener('mousemove', onMouseMove);
    
    // Add keyboard listeners to both document and canvas
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    renderer.domElement.addEventListener('keydown', onKeyDown);
    renderer.domElement.addEventListener('keyup', onKeyUp);
    
    renderer.domElement.addEventListener('click', onClick);

    // Focus the canvas initially
    setTimeout(() => {
      if (renderer.domElement) {
        renderer.domElement.focus();
      }
    }, 100);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Update drunk time for effects
      drunkTime += 0.016; // Roughly 60fps timing
      
      // Update movement
      updateMovement();
      
      // Rotate the cube for visual reference
      cube.rotation.y += 0.01;
      
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      document.removeEventListener('pointerlockerror', onPointerLockError);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', handleResize);
      
      if (renderer.domElement) {
        renderer.domElement.removeEventListener('click', onClick);
        renderer.domElement.removeEventListener('keydown', onKeyDown);
        renderer.domElement.removeEventListener('keyup', onKeyUp);
      }
      
      if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      renderer.dispose();
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Instructions */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        background: 'rgba(0,0,0,0.8)',
        padding: '15px',
        borderRadius: '8px',
        zIndex: 1000,
        maxWidth: '300px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#00ff00' }}>
          🍺 Drunk FPS Controls:
        </div>
        <div>🖱️ Click canvas to lock mouse</div>
        <div>👀 Move mouse to look around (with sway!)</div>
        <div>⌨️ Use WASD to stumble around</div>
        <div>🔓 Press ESC to unlock</div>
        <div style={{ marginTop: '10px', fontSize: '14px', color: '#ccc' }}>
          Experience wobbly movement, head bobbing, and unsteady walking
        </div>
        <div style={{ marginTop: '5px', fontSize: '12px', color: '#aaa' }}>
          Check console for drunk movement debug info
        </div>
      </div>
      
      {/* Crosshair */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '4px',
        height: '4px',
        backgroundColor: '#ff0000',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 9999,
        boxShadow: '0 0 0 2px rgba(255,255,255,0.8), 0 0 8px rgba(255,0,0,0.6)'
      }} />
      
      {/* Additional crosshair lines */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '24px',
        height: '2px',
        backgroundColor: '#ff0000',
        pointerEvents: 'none',
        zIndex: 9998,
        opacity: 0.9,
        boxShadow: '0 0 4px rgba(255,255,255,0.8)'
      }} />
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '2px',
        height: '24px',
        backgroundColor: '#ff0000',
        pointerEvents: 'none',
        zIndex: 9998,
        opacity: 0.9,
        boxShadow: '0 0 4px rgba(255,255,255,0.8)'
      }} />
    </div>
  );
};

export default FPSShooter;