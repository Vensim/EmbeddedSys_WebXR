import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function generateRandomData(numFunctions) {
    return Array.from({ length: numFunctions }, () => Math.random());
}

export function setupChart(scene, numFunctions, { scale = 1, position = { x: 0, y: 0, z: 0 }, generateDummyData = false, chartData = null } = {}) {
    if (generateDummyData) {
        chartData = {
            initialExecutionTime: generateRandomData(numFunctions).map(x => x * 200),
            finalExecutionTime: [],
            initialCallFrequency: Array.from({ length: numFunctions }, () => Math.floor(Math.random() * 50) + 1),
            finalCallFrequency: []
        };
        chartData.finalExecutionTime = chartData.initialExecutionTime.map(x => x + ((Math.random() - 0.5) * 20)); // Simulate changes
        chartData.finalCallFrequency = chartData.initialCallFrequency.map(x => x + Math.floor(Math.random() * 10) - 5); // Simulate changes
    }

    const { initialExecutionTime, finalExecutionTime, initialCallFrequency, finalCallFrequency } = chartData;

    // Normalize data to a unit cube [0, 1]
    const maxInitialExecutionTime = Math.max(...initialExecutionTime);
    const maxFinalExecutionTime = Math.max(...finalExecutionTime);
    const maxExecutionTime = Math.max(maxInitialExecutionTime, maxFinalExecutionTime);

    const maxInitialCallFrequency = Math.max(...initialCallFrequency);
    const maxFinalCallFrequency = Math.max(...finalCallFrequency);
    const maxCallFrequency = Math.max(maxInitialCallFrequency, maxFinalCallFrequency);

    const normalize = (value, max) => value / max;

    const normalizedInitialExecutionTime = initialExecutionTime.map(x => normalize(x, maxExecutionTime));
    const normalizedFinalExecutionTime = finalExecutionTime.map(x => normalize(x, maxExecutionTime));
    const normalizedInitialCallFrequency = initialCallFrequency.map(x => normalize(x, maxCallFrequency));
    const normalizedFinalCallFrequency = finalCallFrequency.map(x => normalize(x, maxCallFrequency));

    const executionTimeDiff = normalizedFinalExecutionTime.map((x, i) => x - normalizedInitialExecutionTime[i]);
    const callFrequencyDiff = normalizedFinalCallFrequency.map((x, i) => x - normalizedInitialCallFrequency[i]);
    const functions = Array.from({ length: numFunctions }, (_, i) => i);  // Function/Module IDs

    // Add arrows function
    function addArrow(start, direction, length, color) {
        const arrowHelper = new THREE.ArrowHelper(
            direction.clone().normalize(),
            start,
            length * scale, // Scale the length of arrows
            color
        );
        scene.add(arrowHelper);
    }

    // Add points and arrows
    functions.forEach((f, i) => {
        let initialPos = new THREE.Vector3(
            normalize(f, numFunctions - 1), // Normalize function/module IDs to [0, 1]
            normalizedInitialCallFrequency[i],
            normalizedInitialExecutionTime[i]
        );
        let finalPos = new THREE.Vector3(
            normalize(f, numFunctions - 1), // Normalize function/module IDs to [0, 1]
            normalizedFinalCallFrequency[i],
            normalizedFinalExecutionTime[i]
        );

        // Apply uniform scale
        initialPos = initialPos.multiplyScalar(scale);
        finalPos = finalPos.multiplyScalar(scale);

        // Apply position offset
        initialPos.add(new THREE.Vector3(position.x, position.y, position.z));
        finalPos.add(new THREE.Vector3(position.x, position.y, position.z));

        // Initial data points
        const initialSphere = new THREE.Mesh(new THREE.SphereGeometry(0.02 * scale, 16, 16), new THREE.MeshBasicMaterial({ color: 'blue' }));
        initialSphere.position.copy(initialPos);
        scene.add(initialSphere);

        // Final data points
        const finalSphere = new THREE.Mesh(new THREE.SphereGeometry(0.02 * scale, 16, 16), new THREE.MeshBasicMaterial({ color: 'red' }));
        finalSphere.position.copy(finalPos);
        scene.add(finalSphere);

        // Arrows indicating change
        const direction = new THREE.Vector3(0, callFrequencyDiff[i], executionTimeDiff[i]); // Already normalized
        const length = direction.length();
        addArrow(initialPos, direction, length, 'green');
    });

    // Add axes labels using CanvasTexture (optional)
    function createTextTexture(text) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 512;
        context.font = '48px sans-serif';
        context.fillStyle = 'white';
        context.fillText(text, 50, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    function makeLabel(text, position) {
        const texture = createTextTexture(text);
        const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
        const geometry = new THREE.PlaneGeometry(0.1 * scale, 0.1 * scale); // Adjust the size of the label
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        scene.add(mesh);
    }

    makeLabel('Function/Module ID', new THREE.Vector3(0.5 * scale + position.x, -0.1 * scale + position.y, -0.1 * scale + position.z));
    makeLabel('Call Frequency', new THREE.Vector3(-0.1 * scale + position.x, 0.5 * scale + position.y, -0.1 * scale + position.z));
    makeLabel('Execution Time (ms)', new THREE.Vector3(-0.1 * scale + position.x, -0.1 * scale + position.y, 0.8 * scale + position.z));
}