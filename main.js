import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import { VRButton } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/webxr/VRButton.js';

// Example basic setup for a three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
// Enable WebXR
renderer.xr.enabled = true;

// Append the renderer to the document body
document.body.appendChild(renderer.domElement);

// Add the VR button to the DOM
document.body.appendChild(VRButton.createButton(renderer));

// Create a cube
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Set the camera position
camera.position.z = 5;

const animate = () => {
    renderer.setAnimationLoop(() => {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        renderer.render(scene, camera);
    });
};

animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});