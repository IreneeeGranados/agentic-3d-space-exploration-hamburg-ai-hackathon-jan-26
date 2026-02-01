import * as THREE from 'three';

/**
 * PartyLoadingScene - Fun 3D party scene for loading screen
 * Features SpAIce Face bouncing around with rockets and disco vibes
 */
export class PartyLoadingScene {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.clock = new THREE.Clock();
        
        // Party objects
        this.rockets = [];
        this.particles = [];
        this.discoLights = [];
        this.spAIceFace = null;
        
        this.init();
    }

    init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 0);
        this.container.appendChild(this.renderer.domElement);
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.zIndex = '1';

        // Setup camera
        this.camera.position.z = 20;

        // Create party scene
        this.createSpAIceFace();
        this.createRockets();
        this.createPartyParticles();
        this.createDiscoLights();
        this.createStars();

        // Handle resize
        window.addEventListener('resize', () => this.onResize());

        // Start animation
        this.animate();
    }

    createSpAIceFace() {
        // Create a cute robot face with the SpAIce logo vibe
        const faceGroup = new THREE.Group();

        // Head (rounded cube)
        const headGeom = new THREE.BoxGeometry(4, 4, 3);
        const headMat = new THREE.MeshPhongMaterial({ 
            color: 0x00ffff, 
            emissive: 0x00ffff,
            emissiveIntensity: 0.5,
            shininess: 100 
        });
        const head = new THREE.Mesh(headGeom, headMat);
        faceGroup.add(head);

        // Eyes (glowing spheres)
        const eyeGeom = new THREE.SphereGeometry(0.6, 16, 16);
        const eyeMat = new THREE.MeshBasicMaterial({ 
            color: 0xff00ff,
            emissive: 0xff00ff 
        });
        
        const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
        leftEye.position.set(-1, 0.5, 1.6);
        faceGroup.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
        rightEye.position.set(1, 0.5, 1.6);
        faceGroup.add(rightEye);

        // Smile (torus)
        const smileGeom = new THREE.TorusGeometry(1.2, 0.2, 16, 32, Math.PI);
        const smileMat = new THREE.MeshBasicMaterial({ color: 0x39ff14 });
        const smile = new THREE.Mesh(smileGeom, smileMat);
        smile.position.set(0, -0.8, 1.5);
        smile.rotation.z = Math.PI;
        faceGroup.add(smile);

        // Antenna with ball
        const antennaGeom = new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
        const antennaMat = new THREE.MeshPhongMaterial({ color: 0xffff00 });
        const antenna = new THREE.Mesh(antennaGeom, antennaMat);
        antenna.position.set(0, 3, 0);
        faceGroup.add(antenna);

        const ballGeom = new THREE.SphereGeometry(0.5, 16, 16);
        const ballMat = new THREE.MeshBasicMaterial({ 
            color: 0xff00ff,
            emissive: 0xff00ff 
        });
        const ball = new THREE.Mesh(ballGeom, ballMat);
        ball.position.set(0, 4, 0);
        faceGroup.add(ball);

        // Add point light from face
        const faceLight = new THREE.PointLight(0x00ffff, 2, 20);
        faceGroup.add(faceLight);

        this.spAIceFace = faceGroup;
        this.scene.add(faceGroup);

        // Store parts for animation
        this.leftEye = leftEye;
        this.rightEye = rightEye;
        this.antenna = antenna;
        this.antennaBall = ball;
    }

    createRockets() {
        // Create 5 playful rockets flying around
        for (let i = 0; i < 5; i++) {
            const rocketGroup = new THREE.Group();

            // Rocket body (cone)
            const bodyGeom = new THREE.ConeGeometry(0.5, 2, 8);
            const bodyMat = new THREE.MeshPhongMaterial({ 
                color: [0xff0000, 0xff6b00, 0xffff00, 0x00ff00, 0x0000ff][i],
                emissive: [0xff0000, 0xff6b00, 0xffff00, 0x00ff00, 0x0000ff][i],
                emissiveIntensity: 0.3
            });
            const body = new THREE.Mesh(bodyGeom, bodyMat);
            body.rotation.x = -Math.PI / 2;
            rocketGroup.add(body);

            // Flame (glowing sphere)
            const flameGeom = new THREE.SphereGeometry(0.4, 8, 8);
            const flameMat = new THREE.MeshBasicMaterial({ 
                color: 0xff6b00,
                emissive: 0xff6b00 
            });
            const flame = new THREE.Mesh(flameGeom, flameMat);
            flame.position.z = 1;
            rocketGroup.add(flame);

            // Random starting position
            rocketGroup.position.set(
                Math.random() * 30 - 15,
                Math.random() * 20 - 10,
                Math.random() * 10 - 5
            );

            // Random velocity
            rocketGroup.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 0.5
            );

            rocketGroup.userData.rotationSpeed = (Math.random() - 0.5) * 0.1;
            rocketGroup.userData.flame = flame;

            this.rockets.push(rocketGroup);
            this.scene.add(rocketGroup);
        }
    }

    createPartyParticles() {
        // Create floating confetti particles
        const particleCount = 200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = Math.random() * 40 - 20;
            positions[i * 3 + 1] = Math.random() * 30 - 15;
            positions[i * 3 + 2] = Math.random() * 20 - 10;

            const color = new THREE.Color();
            color.setHSL(Math.random(), 1, 0.5);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.3,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });

        this.particleSystem = new THREE.Points(geometry, material);
        this.scene.add(this.particleSystem);
    }

    createDiscoLights() {
        // Create rotating colored lights
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xff00ff, 0xffff00, 0x00ffff];
        
        for (let i = 0; i < 6; i++) {
            const light = new THREE.PointLight(colors[i], 2, 30);
            const angle = (i / 6) * Math.PI * 2;
            light.position.set(
                Math.cos(angle) * 15,
                Math.sin(angle) * 10,
                5
            );
            this.discoLights.push(light);
            this.scene.add(light);
        }

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 1);
        this.scene.add(ambientLight);
    }

    createStars() {
        // Background stars
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 500;
        const positions = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
        }

        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
            transparent: true,
            opacity: 0.6
        });

        const stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(stars);
        this.stars = stars;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const time = this.clock.getElapsedTime();
        const delta = this.clock.getDelta();

        // Bounce SpAIce Face
        if (this.spAIceFace) {
            this.spAIceFace.position.y = Math.sin(time * 2) * 3;
            this.spAIceFace.rotation.y = Math.sin(time * 0.5) * 0.3;
            this.spAIceFace.rotation.z = Math.cos(time * 0.7) * 0.2;
            
            // Blink eyes
            const blink = Math.sin(time * 5);
            if (blink > 0.9) {
                this.leftEye.scale.y = 0.1;
                this.rightEye.scale.y = 0.1;
            } else {
                this.leftEye.scale.y = 1;
                this.rightEye.scale.y = 1;
            }

            // Wobble antenna
            this.antenna.rotation.x = Math.sin(time * 3) * 0.2;
            this.antennaBall.position.y = 4 + Math.sin(time * 5) * 0.3;
        }

        // Animate rockets
        this.rockets.forEach((rocket, i) => {
            // Move rocket
            rocket.position.add(rocket.userData.velocity);
            
            // Point in direction of movement
            const velocity = rocket.userData.velocity;
            rocket.lookAt(rocket.position.clone().add(velocity));

            // Bounce off boundaries
            if (Math.abs(rocket.position.x) > 20) rocket.userData.velocity.x *= -1;
            if (Math.abs(rocket.position.y) > 15) rocket.userData.velocity.y *= -1;
            if (Math.abs(rocket.position.z) > 10) rocket.userData.velocity.z *= -1;

            // Rotate rocket
            rocket.rotation.z += rocket.userData.rotationSpeed;

            // Pulse flame
            const flame = rocket.userData.flame;
            flame.scale.setScalar(0.8 + Math.sin(time * 10 + i) * 0.4);
        });

        // Rotate particles
        if (this.particleSystem) {
            this.particleSystem.rotation.y += 0.001;
            this.particleSystem.rotation.x = Math.sin(time * 0.3) * 0.1;
        }

        // Rotate disco lights
        this.discoLights.forEach((light, i) => {
            const angle = (i / this.discoLights.length) * Math.PI * 2 + time;
            light.position.x = Math.cos(angle) * 15;
            light.position.z = Math.sin(angle) * 10;
            light.position.y = Math.sin(time * 2 + i) * 5;
            light.intensity = 1.5 + Math.sin(time * 5 + i) * 0.5;
        });

        // Rotate stars slowly
        if (this.stars) {
            this.stars.rotation.y += 0.0002;
        }

        // Render
        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    dispose() {
        // Clean up
        window.removeEventListener('resize', () => this.onResize());
        
        // Remove renderer
        if (this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
        
        // Dispose geometries and materials
        this.scene.traverse((object) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(mat => mat.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });

        this.renderer.dispose();
    }
}
