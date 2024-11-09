import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x505050);

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 3);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;

// Add VR button
document.body.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer));

// Add OrbitControls for easier debugging outside VR
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.6, 0);
controls.update();

// Floor
const floorGeometry = new THREE.PlaneGeometry(20, 20);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x404040 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Lights
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff);
directionalLight.position.set(3, 10, 10);
scene.add(directionalLight);

// Create an interactive cube
const cubeGeometry = new THREE.BoxGeometry();
const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.position.set(0, 1.5, -3);
cube.castShadow = true;
scene.add(cube);

// Oculus controllers setup
const controller1 = renderer.xr.getController(0);
const controller2 = renderer.xr.getController(1);
scene.add(controller1);
scene.add(controller2);

const controllerModelFactory = new THREE.XRControllerModelFactory();

const controllerGrip1 = renderer.xr.getControllerGrip(0);
controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
scene.add(controllerGrip1);

const controllerGrip2 = renderer.xr.getControllerGrip(1);
controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
scene.add(controllerGrip2);

// Laser pointer setup
const createLaserPointer = (color) => {
    const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -1)
    ]);

    const material = new THREE.LineBasicMaterial({
        color: color,
        linewidth: 3
    });

    const line = new THREE.Line(geometry, material);
    line.scale.z = 15; // Length of the laser pointer

    return line;
}

const laserPointer1 = createLaserPointer(0xff0000);
const laserPointer2 = createLaserPointer(0x0000ff);
controller1.add(laserPointer1);
controller2.add(laserPointer2);

// Raycaster setup
const raycaster = new THREE.Raycaster();
const tempMatrix = new THREE.Matrix4();

function intersectObjects(controller) {
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

    return raycaster.intersectObjects(scene.children, false);
}

// Handle controller interaction
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

// Handle movement using analog stick
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

const movementSpeed = 10;

// Debug info setup
const debugCanvas = document.createElement('canvas');
debugCanvas.width = 512;
debugCanvas.height = 256;

const debugContext = debugCanvas.getContext('2d');
debugContext.fillStyle = 'white';
debugContext.font = '30px Arial';

const debugTexture = new THREE.Texture(debugCanvas);
const debugMaterial = new THREE.MeshBasicMaterial({ map: debugTexture });

const debugPlane = new THREE.PlaneGeometry(2, 1);
const debugMesh = new THREE.Mesh(debugPlane, debugMaterial);
debugMesh.position.set(0, 2, -4);
scene.add(debugMesh);

const updateDebugInfo = (text) => {
    debugContext.clearRect(0, 0, debugCanvas.width, debugCanvas.height);
    debugContext.fillText(text, 10, 50);
    debugTexture.needsUpdate = true;
};

controller1.addEventListener('connected', (event) => {
    const gamepad = event.data.gamepad;

    const onGamepadUpdate = () => {
        if (gamepad.axes.length > 3) {
            const x = gamepad.axes[2];
            const y = gamepad.axes[3];
            moveForward = y < -0.2;
            moveBackward = y > 0.2;
            moveLeft = x < -0.2;
            moveRight = x > 0.2;

            const debugText = `Controller 0\nAxes: ${x.toFixed(2)}, ${y.toFixed(2)}\nButtons: ${gamepad.buttons.map(b => b.pressed).join(', ')}`;
            updateDebugInfo(debugText);
        }

        requestAnimationFrame(onGamepadUpdate);
    };

    onGamepadUpdate();
});

// Animation loop
function animate() {
    renderer.setAnimationLoop(render);
}

function render() {
    if (moveForward) {
        camera.position.z -= movementSpeed;
    }
    if (moveBackward) {
        camera.position.z += movementSpeed;
    }
    if (moveLeft) {
        camera.position.x -= movementSpeed;
    }
    if (moveRight) {
        camera.position.x += movementSpeed;
    }

    renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});