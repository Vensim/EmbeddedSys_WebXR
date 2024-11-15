import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { generateRandomData, setupChart } from './charting.js';

class VRScene {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x505050);

        this.initCamera();
        this.initRenderer();
        this.initControls();
        this.initSceneObjects();
        this.initLights();
        this.initControllers();
        this.initDebugInfo();
        this.initEventHandlers();

        this.loadModel('./models/adafruit_huzzah32_esp32_feather.glb');
        this.setupDataVisualization();
        this.animate();
        this.handleWindowResize();
    }

    initCamera() {
        this.camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 1.6, 3);
    }

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.xr.enabled = true;
        document.body.appendChild(this.renderer.domElement);
        document.body.appendChild(VRButton.createButton(this.renderer));
    }

    initControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 1.6, 0);
        this.controls.update();
    }

    initSceneObjects() {
        const floorGeometry = new THREE.PlaneGeometry(20, 20);
        const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x404040 });
        this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
        this.floor.rotation.x = -Math.PI / 2;
        this.floor.receiveShadow = true;
        this.scene.add(this.floor);
    }

    initLights() {
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff);
        directionalLight.position.set(3, 10, 10);
        this.scene.add(directionalLight);
    }

    initControllers() {
        const self = this;  // Save reference to this for use in event handlers

        // Initialize controllers
        this.controller1 = this.renderer.xr.getController(0);
        this.controller2 = this.renderer.xr.getController(1);
        this.scene.add(this.controller1);
        this.scene.add(this.controller2);

        const controllerModelFactory = new XRControllerModelFactory();

        // Controller Grips
        this.controllerGrip1 = this.renderer.xr.getControllerGrip(0);
        this.controllerGrip2 = this.renderer.xr.getControllerGrip(1);
        this.controllerGrip1.add(controllerModelFactory.createControllerModel(this.controllerGrip1));
        this.controllerGrip2.add(controllerModelFactory.createControllerModel(this.controllerGrip2));
        this.scene.add(this.controllerGrip1);
        this.scene.add(this.controllerGrip2);

        // Add laser pointers
        this.laserPointer1 = this.createLaserPointer(0xff0000);
        this.laserPointer2 = this.createLaserPointer(0x0000ff);
        this.controller1.add(this.laserPointer1);
        this.controller2.add(this.laserPointer2);

        // Make objects grabbable
        this.controller1.addEventListener('selectstart', (event) => this.onSelectStart(event, self));
        this.controller1.addEventListener('selectend', (event) => this.onSelectEnd(event, self));
        this.controller2.addEventListener('selectstart', (event) => this.onSelectStart(event, self));
        this.controller2.addEventListener('selectend', (event) => this.onSelectEnd(event, self));
        this.controller1.addEventListener('squeezestart', (event) => this.onSqueezeStart(event, self));
        this.controller1.addEventListener('squeezeend', (event) => this.onSqueezeEnd(event, self));
        this.controller2.addEventListener('squeezestart', (event) => this.onSqueezeStart(event, self));
        this.controller2.addEventListener('squeezeend', (event) => this.onSqueezeEnd(event, self));
    }

    createLaserPointer(color) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, -1)
        ]);

        const material = new THREE.LineBasicMaterial({ color });
        const line = new THREE.Line(geometry, material);
        line.scale.z = 15;

        return line;
    }

    intersectObjects(controller) {
        const raycaster = new THREE.Raycaster();
        const tempMatrix = new THREE.Matrix4();

        tempMatrix.identity().extractRotation(controller.matrixWorld);
        raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
        raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

        return raycaster.intersectObjects(this.scene.children, false);
    }

    onSelectStart(event, self) {
        const controller = event.target;
        const intersections = self.intersectObjects(controller);

        if (intersections.length > 0) {
            const intersected = intersections[0].object;
            intersected.material.emissive.b = 1;
            controller.userData.selected = intersected;
        }
    }

    onSelectEnd(event, self) {
        const controller = event.target;

        if (controller.userData.selected !== undefined) {
            controller.userData.selected.material.emissive.b = 0;
            controller.userData.selected = undefined;
        }
    }

    // Handle grabbing with grip button (selecting grip)
    onSqueezeStart(event, self) {
        const controller = event.target;
        const intersections = self.intersectObjects(controller);

        if (intersections.length > 0) {
            const intersected = intersections[0].object;
            controller.attach(intersected); // Attach model to controller
            controller.userData.grabbed = intersected;
        }
    }

    // Handle releasing with grip button
    onSqueezeEnd(event, self) {
        const controller = event.target;

        if (controller.userData.grabbed !== undefined) {
            self.scene.attach(controller.userData.grabbed);  // Detach model from controller
            controller.userData.grabbed = undefined;
        }
    }

    setupDataVisualization() {

        const numFunctions = 30
        setupChart(this.scene, numFunctions, { scale: 1, position: { x: 2, y: 1, z: 1 }, generateDummyData: true });
        setupChart(this.scene, numFunctions, { scale: 1, position: { x: 2, y: 1, z: 2.2 }, generateDummyData: true });
    }

    initEventHandlers() {
        // Custom event handlers can be added here if needed
    }

    initDebugInfo() {
        this.debugCanvas = document.createElement('canvas');
        this.debugCanvas.width = 512;
        this.debugCanvas.height = 256;
        this.debugContext = this.debugCanvas.getContext('2d');
        this.debugContext.fillStyle = 'white';
        this.debugContext.font = '30px Arial';

        this.debugTexture = new THREE.Texture(this.debugCanvas);
        const debugMaterial = new THREE.MeshBasicMaterial({ map: this.debugTexture });

        const debugPlane = new THREE.PlaneGeometry(2, 1);
        const debugMesh = new THREE.Mesh(debugPlane, debugMaterial);
        debugMesh.position.set(0, 2, -4);
        this.scene.add(debugMesh);
    }

    updateDebugInfo(text) {
        const lines = text.split('\n');
        this.debugContext.clearRect(0, 0, this.debugCanvas.width, this.debugCanvas.height);
        lines.forEach((line, index) => {
            this.debugContext.fillText(line, 10, 40 + 30 * index); // Adjust the line height
        });
        this.debugTexture.needsUpdate = true;
    }
    attachPins(pinsData) {
        pinsData.forEach(pin => {
            const { x, y, z } = pin.coordinates;
            const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
            const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

            // const scaledPosition = new THREE.Vector3(x, y, z).multiplyScalar(1); // Adjust for model scale
            sphere.position.add(new THREE.Vector3(x, y, z)); // Adjust for model position

            console.log(`Pin position: (${sphere.position.x}, ${sphere.position.y}, ${sphere.position.z})`);

            this.model.add(sphere); // Add sphere to the model
        });
    }
    loadModel(modelPath) {
        const loader = new GLTFLoader();
        loader.load(
            modelPath,
            (gltf) => {
                gltf.scene.position.set(0, 0, 0);
                gltf.scene.scale.set(0.05, 0.05, 0.05);
                this.scene.add(gltf.scene);
                this.model = gltf.scene;

                // Calculate and log model dimensions and position
                const boundingBox = new THREE.Box3().setFromObject(gltf.scene);
                const dimensions = boundingBox.getSize(new THREE.Vector3());
                const position = boundingBox.getCenter(new THREE.Vector3());

                const orientation = new THREE.Quaternion();
                gltf.scene.getWorldQuaternion(orientation);
                const euler = new THREE.Euler().setFromQuaternion(orientation);

                console.log('Model Dimensions:', dimensions);
                console.log('Model Position:', position);
                console.log('Model Orientation (Euler):', euler);

                //The X axis is red. The Y axis is green. The Z axis is blue.
                const axesSize = 5;
                const axesHelper = new THREE.AxesHelper(axesSize);
                axesHelper.position.set(0, dimensions.y + 5, 0);
                this.model.add(axesHelper);

                // Add GridHelper to the scene
                const gridHelper = new THREE.GridHelper(5, 5);
                gridHelper.position.set(position.x, 0, position.z); // Align the grid with the model
                this.scene.add(gridHelper);


                fetch('./esp32_metadata.json')
                    .then(response => response.json())
                    .then(data => this.attachPins(data.pins))
                    .catch(error => console.error('Error fetching pin locations:', error));
            },
            undefined,
            (error) => {
                console.error('An error happened', error);
            }
        );
    }

    animate() {
        this.renderer.setAnimationLoop(this.render.bind(this));
    }

    render() {
        const vrOrientationText = this.getVROrientationText();
        const controller1Info = this.getControllerInfo(this.controller1, 1);
        const controller2Info = this.getControllerInfo(this.controller2, 2);

        this.updateDebugInfo(`${vrOrientationText}${controller1Info}\n${controller2Info}`);

        this.renderer.render(this.scene, this.camera);
    }

    getVROrientationText() {
        if (this.renderer.xr.getSession()) {
            const pose = this.renderer.xr.getCamera().matrixWorld.elements;
            return `VR Orientation: [${pose[0].toFixed(2)}, ${pose[5].toFixed(2)}, ${pose[10].toFixed(2)}]\n`;
        }
        return 'VR Orientation: N/A\n';
    }

    getControllerInfo(controller, index) {
        const gamepad = controller.userData.gamepad;
        if (gamepad) {
            const axes = gamepad.axes.map(a => a.toFixed(2)).join(', ');
            const buttons = gamepad.buttons.map((b, idx) => `Button ${idx}: ${b.pressed}`).join('\n');
            return `Controller ${index}\nAxes: [${axes}]\n${buttons}\n`;
        }
        return `Controller ${index} not connected\n`;
    }

    handleWindowResize() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    onControllerConnected(event, index) {
        const gamepad = event.data.gamepad;
        event.target.userData.gamepad = gamepad;

        const onGamepadUpdate = () => {
            if (gamepad.axes.length > 3) {
                const x = gamepad.axes[2];
                const y = gamepad.axes[3];
                this.movement.forward = y < -0.2;
                this.movement.backward = y > 0.2;
                this.movement.left = x < -0.2;
                this.movement.right = x > 0.2;
            }

            requestAnimationFrame(onGamepadUpdate);
        };

        onGamepadUpdate();
    }
}

// Initialize the VRScene
new VRScene();