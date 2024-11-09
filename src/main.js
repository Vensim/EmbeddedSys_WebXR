import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Enable WebXR in renderer
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer));

// Create a cube
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
cube.position.set(0, 1.5, -3);  // Set position in front of the camera
scene.add(cube);

// Set camera position
camera.position.set(0, 1.5, 0);

// Oculus controllers setup
const controller1 = renderer.xr.getController(0);
const controller2 = renderer.xr.getController(1);

const controllerModelFactory = new THREE.XRControllerModelFactory();

const controllerGrip1 = renderer.xr.getControllerGrip(0);
controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
scene.add(controllerGrip1);

const controllerGrip2 = renderer.xr.getControllerGrip(1);
controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
scene.add(controllerGrip2);

scene.add(controller1);
scene.add(controller2);

// Function to detect controller intersection with objects
const raycaster = new THREE.Raycaster();
function intersectObjects(controller) {
    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

    return raycaster.intersectObjects(scene.children);
}

// Handle controller events
function onSelectStart(event) {
    const controller = event.target;
    const intersections = intersectObjects(controller);
    if (intersections.length > 0) {
        const intersected = intersections[0].object;
        intersected.material.emissive.b = 1;
        controller.userData.selected = intersected;
    }
}

function onSelectEnd(event) {
    const controller = event.target;
    if (controller.userData.selected !== undefined) {
        controller.userData.selected.material.emissive.b = 0;
        controller.userData.selected = undefined;
    }
}

controller1.addEventListener('selectstart', onSelectStart);
controller1.addEventListener('selectend', onSelectEnd);
controller2.addEventListener('selectstart', onSelectStart);
controller2.addEventListener('selectend', onSelectEnd);

// Animation loop
const animate = () => {
    renderer.setAnimationLoop(render);
};

// Render loop
const render = () => {
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    renderer.render(scene, camera);
};

animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});