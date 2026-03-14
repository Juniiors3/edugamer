import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Physics, Entity } from './Physics';
import { QUESTIONS, Question } from './questions';

interface GameState {
  score: number;
  lives: number;
  coins: number;
  time: number;
  isGameOver: boolean;
  currentQuestion: Question | null;
}

export const GameEngine: React.FC<{ onStateChange: (state: GameState) => void }> = ({ onStateChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(null);
  
  // Game Objects Refs
  const sceneRef = useRef<THREE.Scene>(new THREE.Scene());
  const cameraRef = useRef<THREE.PerspectiveCamera>(new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000));
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const playerRef = useRef<THREE.Group>(new THREE.Group());
  const platformsRef = useRef<THREE.Mesh[]>([]);
  const boxesRef = useRef<THREE.Mesh[]>([]);
  const enemiesRef = useRef<THREE.Mesh[]>([]);
  const fireballsRef = useRef<THREE.Mesh[]>([]);
  
  // Physics State
  const playerPhysics = useRef<Entity>({
    position: new THREE.Vector3(0, 5, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    width: 1,
    height: 1.5,
    depth: 1,
    onGround: false
  });

  const keys = useRef<{ [key: string]: boolean }>({});
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    lives: 3,
    coins: 0,
    time: 0,
    isGameOver: false,
    currentQuestion: null
  });

  const lastPlatformX = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene Setup
    const scene = sceneRef.current;
    scene.background = new THREE.Color(0x87ceeb); // Sky blue
    scene.fog = new THREE.Fog(0x87ceeb, 20, 50);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(10, 20, 10);
    sunLight.castShadow = true;
    sunLight.shadow.camera.left = -20;
    sunLight.shadow.camera.right = 20;
    sunLight.shadow.camera.top = 20;
    sunLight.shadow.camera.bottom = -20;
    scene.add(sunLight);

    // Player Model (Enhanced)
    const playerGroup = playerRef.current;
    
    // Body
    const bodyGeo = new THREE.CapsuleGeometry(0.4, 0.7, 4, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff3333, roughness: 0.7 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    playerGroup.add(body);
    
    // Head
    const headGeo = new THREE.SphereGeometry(0.38, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffccaa });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 0.75;
    head.castShadow = true;
    playerGroup.add(head);

    // Eyes (Direction indicator)
    const eyeGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(0.15, 0.8, 0.3);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(-0.15, 0.8, 0.3);
    playerGroup.add(eyeL, eyeR);

    // Hat
    const hatGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16);
    const hatMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const hat = new THREE.Mesh(hatGeo, hatMat);
    hat.position.y = 1.1;
    playerGroup.add(hat);

    scene.add(playerGroup);

    // Background Elements (Clouds)
    for (let i = 0; i < 20; i++) {
      createCloud(Math.random() * 200 - 50, 10 + Math.random() * 10, -10 - Math.random() * 10);
    }

    // Initial Platforms
    generateInitialLevel();

    // Event Listeners
    const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.code] = true; if (e.code === 'KeyF') shootFireball(); };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Animation Loop
    const animate = () => {
      if (gameState.isGameOver || gameState.currentQuestion) {
        requestRef.current = requestAnimationFrame(animate);
        return;
      }

      updatePlayer();
      updateEnemies();
      updateFireballs();
      generateLevel();
      
      // Camera Follow
      cameraRef.current.position.x = THREE.MathUtils.lerp(cameraRef.current.position.x, playerPhysics.current.position.x, 0.1);
      cameraRef.current.position.y = THREE.MathUtils.lerp(cameraRef.current.position.y, playerPhysics.current.position.y + 2, 0.1);
      cameraRef.current.position.z = 10;
      cameraRef.current.lookAt(playerPhysics.current.position.x, playerPhysics.current.position.y + 1, 0);

      renderer.render(scene, cameraRef.current);
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      renderer.dispose();
    };
  }, [gameState.isGameOver, !!gameState.currentQuestion]);

  const generateInitialLevel = () => {
    // Ground
    for (let i = 0; i < 5; i++) {
      createPlatform(i * 10, 0, 10);
    }
    lastPlatformX.current = 40;
  };

  const createCloud = (x: number, y: number, z: number) => {
    const group = new THREE.Group();
    const geo = new THREE.SphereGeometry(1, 8, 8);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true });
    
    for (let i = 0; i < 5; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(i * 0.8, Math.random() * 0.5, Math.random() * 0.5);
      mesh.scale.setScalar(0.8 + Math.random() * 0.5);
      group.add(mesh);
    }
    group.position.set(x, y, z);
    sceneRef.current.add(group);
  };

  const createPlatform = (x: number, y: number, width: number) => {
    const group = new THREE.Group();
    
    // Grass Top
    const grassGeo = new THREE.BoxGeometry(width, 0.4, 4);
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x44aa44 });
    const grass = new THREE.Mesh(grassGeo, grassMat);
    grass.position.y = 0.2;
    grass.receiveShadow = true;
    group.add(grass);

    // Dirt Bottom
    const dirtGeo = new THREE.BoxGeometry(width, 0.6, 3.8);
    const dirtMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const dirt = new THREE.Mesh(dirtGeo, dirtMat);
    dirt.position.y = -0.3;
    dirt.receiveShadow = true;
    group.add(dirt);

    group.position.set(x, y, 0);
    sceneRef.current.add(group);
    
    // For collision, we still use a simplified mesh or just the group position
    const collisionMesh = new THREE.Mesh(new THREE.BoxGeometry(width, 1, 4));
    collisionMesh.position.set(x, y, 0);
    collisionMesh.visible = false;
    platformsRef.current.push(collisionMesh);

    // Randomly add a box or enemy
    if (Math.random() > 0.6) {
      createBox(x + (Math.random() - 0.5) * (width - 2), y + 2.5);
    }
    if (Math.random() > 0.7) {
      createEnemy(x + (Math.random() - 0.5) * (width - 2), y + 1);
    }
  };

  const createBox = (x: number, y: number) => {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffd700 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, 0);
    mesh.castShadow = true;
    sceneRef.current.add(mesh);
    boxesRef.current.push(mesh);
  };

  const createEnemy = (x: number, y: number) => {
    const geo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const mat = new THREE.MeshStandardMaterial({ color: 0x8b0000 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, 0);
    mesh.castShadow = true;
    sceneRef.current.add(mesh);
    enemiesRef.current.push(mesh);
  };

  const shootFireball = () => {
    const geo = new THREE.SphereGeometry(0.2, 8, 8);
    const mat = new THREE.MeshStandardMaterial({ color: 0xff4500, emissive: 0xff4500 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(playerPhysics.current.position);
    mesh.position.y += 0.5;
    sceneRef.current.add(mesh);
    fireballsRef.current.push(mesh);
    // Add velocity property to mesh for ease
    (mesh as any).velocity = new THREE.Vector3(0.2, 0, 0);
  };

  const updatePlayer = () => {
    const p = playerPhysics.current;
    
    // Movement
    if (keys.current['ArrowRight']) p.velocity.x = 0.15;
    else if (keys.current['ArrowLeft']) p.velocity.x = -0.15;
    else p.velocity.x *= Physics.FRICTION;

    if (keys.current['Space'] && p.onGround) {
      p.velocity.y = 0.35;
      p.onGround = false;
    }

    p.velocity.y += Physics.GRAVITY;
    p.position.add(p.velocity);
    p.onGround = false;

    // Collision with platforms
    platformsRef.current.forEach(plat => {
      const platEntity: Entity = {
        position: plat.position,
        velocity: new THREE.Vector3(),
        width: (plat.geometry as THREE.BoxGeometry).parameters.width,
        height: 1,
        depth: 4,
        onGround: true
      };
      if (Physics.checkCollision(p, platEntity)) {
        Physics.resolveCollision(p, platEntity);
      }
    });

    // Collision with boxes
    boxesRef.current.forEach((box, index) => {
      const boxEntity: Entity = {
        position: box.position,
        velocity: new THREE.Vector3(),
        width: 1, height: 1, depth: 1, onGround: true
      };
      if (Physics.checkCollision(p, boxEntity)) {
        // If hitting from bottom
        if (p.velocity.y > 0 && p.position.y < box.position.y) {
          triggerQuestion(box.position.x, box.position.y);
          sceneRef.current.remove(box);
          boxesRef.current.splice(index, 1);
        } else {
          Physics.resolveCollision(p, boxEntity);
        }
      }
    });

    // Collision with enemies
    enemiesRef.current.forEach((enemy, index) => {
      const enemyEntity: Entity = {
        position: enemy.position,
        velocity: new THREE.Vector3(),
        width: 0.8, height: 0.8, depth: 0.8, onGround: true
      };
      if (Physics.checkCollision(p, enemyEntity)) {
        // If jumping on top
        if (p.velocity.y < 0 && p.position.y > enemy.position.y + 0.5) {
          p.velocity.y = 0.2;
          createParticles(enemy.position.x, enemy.position.y, 0x8b0000);
          sceneRef.current.remove(enemy);
          enemiesRef.current.splice(index, 1);
          setGameState(prev => ({ ...prev, score: prev.score + 100 }));
        } else {
          handleDamage();
        }
      }
    });

    // Fall check
    if (p.position.y < -5) handleDamage();

    playerRef.current.position.copy(p.position);
    onStateChange(gameState);
  };

  const updateEnemies = () => {
    enemiesRef.current.forEach(enemy => {
      enemy.position.x += Math.sin(Date.now() * 0.002) * 0.02;
    });
  };

  const updateFireballs = () => {
    fireballsRef.current.forEach((fb, fIndex) => {
      const vel = (fb as any).velocity;
      fb.position.add(vel);

      // Check enemy collision
      enemiesRef.current.forEach((enemy, eIndex) => {
        if (fb.position.distanceTo(enemy.position) < 0.8) {
          createParticles(enemy.position.x, enemy.position.y, 0x8b0000);
          sceneRef.current.remove(enemy);
          enemiesRef.current.splice(eIndex, 1);
          sceneRef.current.remove(fb);
          fireballsRef.current.splice(fIndex, 1);
          setGameState(prev => ({ ...prev, score: prev.score + 50 }));
        }
      });

      if (fb.position.x > playerPhysics.current.position.x + 20) {
        sceneRef.current.remove(fb);
        fireballsRef.current.splice(fIndex, 1);
      }
    });
  };

  const generateLevel = () => {
    if (playerPhysics.current.position.x > lastPlatformX.current - 30) {
      const width = 5 + Math.random() * 10;
      const gap = 3 + Math.random() * 5;
      const y = (Math.random() - 0.5) * 4;
      createPlatform(lastPlatformX.current + gap + width/2, y, width);
      lastPlatformX.current += gap + width;
    }
  };

  const createParticles = (x: number, y: number, color: number) => {
    const group = new THREE.Group();
    const geo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const mat = new THREE.MeshStandardMaterial({ color });
    
    for (let i = 0; i < 8; i++) {
      const p = new THREE.Mesh(geo, mat);
      p.position.set(0, 0, 0);
      (p as any).velocity = new THREE.Vector3((Math.random() - 0.5) * 0.2, Math.random() * 0.2, (Math.random() - 0.5) * 0.2);
      group.add(p);
    }
    group.position.set(x, y, 0);
    sceneRef.current.add(group);
    
    // Auto remove particles
    setTimeout(() => {
      sceneRef.current.remove(group);
    }, 1000);

    // Update particles in the animation loop would be better, but for simplicity:
    const updateP = () => {
      group.children.forEach(c => {
        const mesh = c as THREE.Mesh;
        mesh.position.add((mesh as any).velocity);
        (mesh as any).velocity.y -= 0.01;
      });
      if (group.parent) requestAnimationFrame(updateP);
    };
    updateP();
  };

  const triggerQuestion = (x: number, y: number) => {
    createParticles(x, y, 0xffd700);
    const randomQuestion = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    setGameState(prev => ({ ...prev, currentQuestion: randomQuestion }));
  };

  const handleDamage = () => {
    setGameState(prev => {
      const newLives = prev.lives - 1;
      if (newLives <= 0) return { ...prev, lives: 0, isGameOver: true };
      
      // Reset position
      playerPhysics.current.position.set(playerPhysics.current.position.x - 5, 5, 0);
      playerPhysics.current.velocity.set(0, 0, 0);
      
      return { ...prev, lives: newLives };
    });
  };

  // Exposed methods for the parent
  useEffect(() => {
    (window as any).answerQuestion = (correct: boolean) => {
      if (correct) {
        setGameState(prev => ({ ...prev, score: prev.score + 500, coins: prev.coins + 1, currentQuestion: null }));
      } else {
        setGameState(prev => ({ ...prev, lives: Math.max(0, prev.lives - 1), currentQuestion: null, isGameOver: prev.lives <= 1 }));
      }
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
};
