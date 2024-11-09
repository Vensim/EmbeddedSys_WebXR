import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

// Basic three.js scene setup...
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;

document.body.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer));

// Create a cube
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Set the camera position
camera.position.z = 5;

// Handle Oculus controllers
const controller1 = renderer.xr.getController(0);
const controller2 = renderer.xr.getController(1);

const controllerModelFactory = new XRControllerModelFactory();

const controllerGrip1 = renderer.xr.getControllerGrip(0);
controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
scene.add(controllerGrip1);

const controllerGrip2 = renderer.xr.getControllerGrip(1);
controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
scene.add(controllerGrip2);

scene.add(controller1);
scene.add(controller2);

// Handle VR controller input
controller1.addEventListener('selectstart', onSelectStart);
controller1.addEventListener('selectend', onSelectEnd);
controller2.addEventListener('selectstart', onSelectStart);
controller2.addEventListener('selectend', onSelectEnd);

let moving = false;

function onSelectStart(event) {
    moving = true;
}

function onSelectEnd(event) {
    moving = false;
}

const tempMatrix = new THREE.Matrix4();
const movementSpeed = 0.05;

// Animation loop
const animate = () => {
    renderer.setAnimationLoop(render);
};

const render = () => {
    if (moving) {
        const userData = controller1.userData;
        if (!userData.matrix) {
            userData.matrix = new THREE.Matrix4().identity();
        }
        tempMatrix.identity().extractRotation(controller1.matrixWorld);
        camera.position.applyMatrix4(tempMatrix);
        camera.position.z -= movementSpeed;
    }

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