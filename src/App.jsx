import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const FPSShooter = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    console.log('THREE.js loaded:', THREE); // Debug log
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

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

    // Variables for mouse look
    let isPointerLocked = false;
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    const PI_2 = Math.PI / 2;

    // Mouse movement handler
    const onMouseMove = (event) => {
      if (!isPointerLocked) return;

      const { movementX, movementY } = event;
      
      euler.setFromQuaternion(camera.quaternion);
      euler.y -= movementX * 0.002;
      euler.x -= movementY * 0.002;
      euler.x = Math.max(-PI_2, Math.min(PI_2, euler.x));
      
      camera.quaternion.setFromEuler(euler);
      
      console.log('Mouse moved:', { movementX, movementY, eulerX: euler.x, eulerY: euler.y }); // Debug
    };

    // Pointer lock handlers
    const onPointerLockChange = () => {
      isPointerLocked = document.pointerLockElement === renderer.domElement;
      console.log('Pointer lock changed:', isPointerLocked); // Debug
    };

    const onPointerLockError = () => {
      console.error('Pointer lock error');
    };

    const onClick = () => {
      console.log('Canvas clicked, requesting pointer lock'); // Debug
      renderer.domElement.requestPointerLock();
    };

    // Add event listeners
    document.addEventListener('pointerlockchange', onPointerLockChange);
    document.addEventListener('pointerlockerror', onPointerLockError);
    document.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onClick);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Rotate the cube for visual reference
      cube.rotation.y += 0.01;
      
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      document.removeEventListener('pointerlockerror', onPointerLockError);
      document.removeEventListener('mousemove', onMouseMove);
      
      if (renderer.domElement) {
        renderer.domElement.removeEventListener('click', onClick);
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
        background: 'rgba(0,0,0,0.7)',
        padding: '15px',
        borderRadius: '5px',
        zIndex: 1000,
        maxWidth: '300px'
      }}>
        <div>1. Click canvas to lock mouse</div>
        <div>2. Move mouse to look around</div>
        <div>3. Press ESC to unlock</div>
        <div style={{ marginTop: '10px', fontSize: '14px', color: '#ccc' }}>
          You should see a white spinning cube in front of you
        </div>
      </div>
      
      {/* Crosshair */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '20px',
        height: '20px',
        border: '2px solid white',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 1000
      }} />
    </div>
  );
};

export default FPSShooter;  