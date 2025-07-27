import React, { useRef, useCallback, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { ThreeDGraphData, GraphNode, ForceGraphInstance } from '../types';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { Vector2 } from 'three';

interface GraphVisualizerProps {
  data: ThreeDGraphData;
  onNodeClick: (node: GraphNode) => void;
  onBackgroundClick: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const GraphVisualizer: React.FC<GraphVisualizerProps> = ({ 
  data, 
  onNodeClick, 
  onBackgroundClick, 
  isFullscreen = false, 
  onToggleFullscreen 
}) => {
  const fgRef = useRef<ForceGraphInstance>(null);
  const centralNodeRef = useRef<THREE.Group | null>(null);
  const keysPressed = useRef<Set<string>>(new Set());
  const moveSpeed = useRef(4);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (!fgRef.current) return;

    const updateBloomPass = () => {
      if (!fgRef.current) return;
      const bloomPass = new UnrealBloomPass(new Vector2(window.innerWidth, window.innerHeight), 1.2, 0.5, 0);
      // Clear existing passes and add new one
      const composer = fgRef.current.postProcessingComposer();
      composer.passes.length = 1; // Keep only the render pass
      composer.addPass(bloomPass);
    };

    updateBloomPass();

    // Set link distance imperatively to bypass prop type error
    (fgRef.current.d3Force('link') as any)?.distance((link: {source: GraphNode, target: GraphNode}) => {
      return link.source.id === 'ROOT' || link.target.id === 'ROOT' ? 200 : 30;
    });

    // Handle window resize and fullscreen changes
    const handleResize = () => {
      updateBloomPass();
      if (fgRef.current) {
        fgRef.current.refresh();
        // Force canvas to resize to new dimensions
        const canvas = fgRef.current.renderer().domElement;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        fgRef.current.renderer().setSize(window.innerWidth, window.innerHeight);
      }
    };

    // Listen for fullscreen changes (F11 browser fullscreen)
    const handleFullscreenChange = () => {
      // Small delay to ensure dimensions are updated
      setTimeout(() => {
        handleResize();
      }, 100);
    };

    // Animation loop for central node rings and camera movement
    const animate = () => {
      if (centralNodeRef.current) {
        // Animate rings
        const rings = centralNodeRef.current.children.filter(
          (child): child is THREE.Mesh => child instanceof THREE.Mesh && child.geometry.type === 'TorusGeometry'
        );
        if(rings.length > 0) rings[0].rotation.z -= 0.003;
        if(rings.length > 1) rings[1].rotation.z += 0.003;
      }

      // Handle camera movement
      if (fgRef.current && keysPressed.current.size > 0) {
        const camera = fgRef.current.camera();
        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);
        
        const right = new THREE.Vector3().crossVectors(cameraDirection, camera.up).normalize();
        const up = camera.up.clone().normalize();
        
        const moveVector = new THREE.Vector3();
        
        if (keysPressed.current.has('w')) {
          moveVector.add(cameraDirection.clone().multiplyScalar(moveSpeed.current));
        }
        if (keysPressed.current.has('s')) {
          moveVector.add(cameraDirection.clone().multiplyScalar(-moveSpeed.current));
        }
        if (keysPressed.current.has('a')) {
          moveVector.add(right.clone().multiplyScalar(-moveSpeed.current));
        }
        if (keysPressed.current.has('d')) {
          moveVector.add(right.clone().multiplyScalar(moveSpeed.current));
        }
        if (keysPressed.current.has('q')) {
          moveVector.add(up.clone().multiplyScalar(moveSpeed.current));
        }
        if (keysPressed.current.has('z')) {
          moveVector.add(up.clone().multiplyScalar(-moveSpeed.current));
        }
        
        if (moveVector.length() > 0) {
          const currentPos = fgRef.current.cameraPosition();
          fgRef.current.cameraPosition({
            x: currentPos.x + moveVector.x,
            y: currentPos.y + moveVector.y,
            z: currentPos.z + moveVector.z
          });
        }
      }
      
      animationFrameId.current = requestAnimationFrame(animate);
    };

    // Keyboard event handlers
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'q', 'z'].includes(key)) {
        event.preventDefault();
        keysPressed.current.add(key);
      }
      if ((key === 'f' || key === 'escape') && onToggleFullscreen) {
        event.preventDefault();
        onToggleFullscreen();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'q', 'z'].includes(key)) {
        event.preventDefault();
        keysPressed.current.delete(key);
      }
    };

    // Add event listeners
    window.addEventListener('resize', handleResize);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Start animation
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [onToggleFullscreen]);

  const handleNodeClick = useCallback((node: object) => {
    const castedNode = node as GraphNode;
    if (fgRef.current && castedNode.x !== undefined && castedNode.y !== undefined && castedNode.z !== undefined) {
      const distance = 800;
      const distRatio = 1 + distance/Math.hypot(castedNode.x, castedNode.y, castedNode.z);

      fgRef.current.cameraPosition(
        { x: castedNode.x * distRatio, y: castedNode.y * distRatio, z: castedNode.z * distRatio }, // new position
        castedNode, // lookAt ({ x, y, z })
        2000  // ms transition duration
      );
    }
    onNodeClick(castedNode);
  }, [onNodeClick]);

  const handleNodeThreeObject = useCallback((node: GraphNode) => {
    if (node.id !== 'ROOT') {
        return null; // use default sphere for other nodes
    }

    const group = new THREE.Group();
    const nodeSize = node.val * 1.5;

    // The central glowing sphere
    const geometry = new THREE.SphereGeometry(nodeSize / 2, 24, 24);
    const material = new THREE.MeshLambertMaterial({
        color: node.color,
        emissive: node.color,
        emissiveIntensity: 3
    });
    group.add(new THREE.Mesh(geometry, material));

    // Create Rings
    const ringColor = 0xd946ef; // fuchsia
    const ringMaterial = new THREE.MeshBasicMaterial({ color: ringColor, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });

    const ring1 = new THREE.Mesh(
        new THREE.TorusGeometry(nodeSize / 2 + 4, 0.8, 8, 75),
        ringMaterial
    );
    ring1.rotation.x = Math.PI / 2;

    const ring2 = new THREE.Mesh(
        new THREE.TorusGeometry(nodeSize / 2 + 4, 0.8, 8, 75),
        ringMaterial
    );
    ring2.rotation.x = Math.PI / 2;
    ring2.rotation.y = Math.PI / 2;

    group.add(ring1, ring2);
    
    centralNodeRef.current = group; // Store reference for animation

    return group;
}, []);

  return (
    <div className="absolute inset-0">
      <ForceGraph3D
        ref={fgRef}
        graphData={data}
        nodeLabel="label"
        nodeVal="val"
        nodeColor="color"
        nodeOpacity={0.7}
        nodeResolution={16}
        nodeThreeObject={handleNodeThreeObject as any}
        onNodeClick={handleNodeClick}
        onBackgroundClick={() => onBackgroundClick()}
        linkSource="source"
        linkTarget="target"
        linkColor={() => 'rgba(255, 255, 255, 0.2)'}
        linkWidth={0.5}
        linkDirectionalParticles={1}
        linkDirectionalParticleWidth={1.2}
        linkDirectionalParticleColor={() => 'rgba(217, 70, 239, 0.8)'} // fuchsia-500
        backgroundColor="rgba(0,0,0,0)"
        d3AlphaDecay={0.01}
        d3VelocityDecay={0.3}
        width={window.innerWidth}
        height={window.innerHeight}
        controlType="orbit"
        showNavInfo={false}
      />
      
      {/* Controls overlay - only show when not in fullscreen */}
      {!isFullscreen && (
        <div className="absolute bottom-4 right-4 z-10 p-3 bg-gray-900/70 backdrop-blur-sm rounded-lg text-white text-xs">
          <div className="font-bold mb-2">Camera Controls:</div>
          <div className="space-y-1">
            <div><span className="font-mono bg-gray-700 px-1 rounded">W/S</span> - Forward/Backward</div>
            <div><span className="font-mono bg-gray-700 px-1 rounded">A/D</span> - Left/Right</div>
            <div><span className="font-mono bg-gray-700 px-1 rounded">Q/Z</span> - Up/Down</div>
            <div><span className="font-mono bg-gray-700 px-1 rounded">F</span> - Toggle Fullscreen</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(GraphVisualizer);