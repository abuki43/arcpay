'use client';

import React, { useEffect, useState } from 'react';
import { Effects } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Particles } from './particles';
import { VignetteShader } from './shaders/vignetteShader';

interface GLProps {
  hovering?: boolean;
  targetRef?: React.RefObject<HTMLElement | null>;
}

export const GL = ({ hovering = false, targetRef }: GLProps) => {
  const speed = 1.0;
  const focus = 3.8;
  const aperture = 2.2;
  const size = 128;
  const noiseScale = 0.6;
  const noiseIntensity = 0.42;
  const timeScale = 1.0;
  const pointSize = 5.0;
  const opacity = 0.4;
  const planeScale = 10.0;
  const vignetteDarkness = 1.0;
  const vignetteOffset = 0.45;

  const [paused, setPaused] = useState(true);

  useEffect(() => {
    const el = targetRef?.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setPaused(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [targetRef]);

  return (
    <div id="webgl">
      <Canvas
        frameloop={paused ? 'never' : 'always'}
        dpr={[1, 1.5]}
        camera={{
          position: [1.2629783123314589, 2.664606471394044, -1.8178993743288914],
          fov: 50,
          near: 0.01,
          far: 300,
        }}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        <color attach="background" args={['#F6F4EF']} />
        <Particles
          speed={speed}
          aperture={aperture}
          focus={focus}
          size={size}
          noiseScale={noiseScale}
          noiseIntensity={noiseIntensity}
          timeScale={timeScale}
          pointSize={pointSize}
          opacity={opacity}
          planeScale={planeScale}
          useManualTime={false}
          manualTime={0}
          introspect={hovering}
        />
        <Effects multisamping={0} disableGamma>
          <shaderPass
            args={[VignetteShader]}
            uniforms-darkness-value={vignetteDarkness}
            uniforms-offset-value={vignetteOffset}
          />
        </Effects>
      </Canvas>
    </div>
  );
};