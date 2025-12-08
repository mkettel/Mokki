"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useSnow } from "@/lib/snow-context";

const FADE_DURATION = 500; // ms

const VERTEX_SHADER = `
  uniform float elapsedTime;
  uniform float radiusX;
  uniform float radiusZ;
  uniform float height;
  uniform float size;
  uniform float scale;

  attribute float aSize;

  void main() {
    vec3 pos = position;

    // Horizontal drift using sin/cos for natural swaying motion (from tutorial)
    pos.x += cos((elapsedTime + position.z) * 0.25) * radiusX;
    pos.z += sin((elapsedTime + position.x) * 0.25) * radiusZ;

    // Falling motion with modulo wrapping
    pos.y = mod(pos.y - elapsedTime, height) - height * 0.5;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    // Size varies with depth for perspective feel
    gl_PointSize = aSize * size * (scale / length(mvPosition.xyz));
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = `
  uniform vec3 color;
  uniform float opacity;

  void main() {
    // Create soft circular snowflake
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);

    // Soft falloff
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha *= opacity;

    gl_FragColor = vec4(color, alpha);
  }
`;

export function SnowfallBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { enabled } = useSnow();
  const [visible, setVisible] = useState(enabled);
  const [opacity, setOpacity] = useState(enabled ? 1 : 0);

  // Handle fade in/out
  useEffect(() => {
    let rafId1: number;
    let rafId2: number;
    let timer: NodeJS.Timeout;

    if (enabled) {
      // Fade in: show immediately, then animate opacity
      setVisible(true);
      // Double requestAnimationFrame ensures the browser has painted with opacity 0
      // before we transition to opacity 1 (single RAF isn't enough)
      rafId1 = requestAnimationFrame(() => {
        rafId2 = requestAnimationFrame(() => {
          setOpacity(1);
        });
      });
    } else {
      // Fade out: animate opacity, then hide
      setOpacity(0);
      timer = setTimeout(() => {
        setVisible(false);
      }, FADE_DURATION);
    }

    return () => {
      cancelAnimationFrame(rafId1);
      cancelAnimationFrame(rafId2);
      clearTimeout(timer);
    };
  }, [enabled]);

  useEffect(() => {
    if (!visible) return;

    const container = containerRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();

    // Calculate dimensions for full coverage
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 500;

    // Camera positioned to look at the XY plane of falling snow
    const camera = new THREE.PerspectiveCamera(60, aspect, 1, 2000);
    camera.position.set(0, 0, 500);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Particle configuration
    const particleCount = 12000;
    const spreadX = frustumSize * aspect * 1.5;
    const spreadY = frustumSize * 1.5;
    const spreadZ = 400;
    const height = spreadY * 2;

    // Create geometry
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * spreadX * 2;
      positions[i * 3 + 1] = Math.random() * height;
      positions[i * 3 + 2] = (Math.random() - 0.5) * spreadZ * 2;
      sizes[i] = 0.5 + Math.random() * 1.5;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

    // Shader material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0xffffff) },
        opacity: { value: 0.9 },
        size: { value: 15.0 },
        scale: { value: 300.0 },
        height: { value: height },
        elapsedTime: { value: 0.0 },
        radiusX: { value: 2.5 },
        radiusZ: { value: 2.5 },
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthTest: false,
    });

    // Create particle system
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Resize handler
    const handleResize = () => {
      const newAspect = window.innerWidth / window.innerHeight;
      camera.aspect = newAspect;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // Animation
    const clock = new THREE.Clock();
    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();
      material.uniforms.elapsedTime.value = elapsed * 15;

      // Gentle camera sway
      camera.position.x = Math.sin(elapsed * 0.1) * 30;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      container.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none transition-opacity"
      style={{
        zIndex: 0,
        opacity,
        transitionDuration: `${FADE_DURATION}ms`,
      }}
      aria-hidden="true"
    />
  );
}
