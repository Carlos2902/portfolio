import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Preload, useGLTF } from "@react-three/drei";

import CanvasLoader from "../Loader";

const Computers = ({isMobile}) => {
  const computer = useGLTF("./fluxs_pit_stop/scene.gltf");

  return (
    <mesh>
      {/* Adjust the intensity property of the lights */}
      <hemisphereLight intensity={10} groundColor='black' />
<pointLight intensity={20} />
<spotLight
  position={[-20, 50, 10]}
  angle={0.12}
  intensity={5} // Increase intensity
  castShadow
  shadow-mapSize={1024}
/>
        <primitive
      object={computer.scene}
      scale={isMobile ? 1.25 : 2.5} // Change this value to make the model bigger
      position={isMobile ? [0, -1.5, 0] : [0, -3, -0.1]} // Adjust X position for mobile
      rotation={[0, 1, -0.1]}
    />
    </mesh>
  );
};

  const ComputersCanvas = () =>{
      // UseState for mobile
      const [isMobile,setIsMobile] = useState(false);

      // To get if it is a mobile device
       // AddEventListener for verify changesto the screen size
      useEffect(()=>{
          const mediaQuery = window.matchMedia('(max-width:500px)');
          // Set the initial value of the setIsMobile state.
          setIsMobile(mediaQuery.matches);
          // Define a callback function to handle changes to the media query
          const handleMediaQueryChange = (event) => {
            setIsMobile(event.matches);
          }

          // Add the callback fction as a listener for changes to the media query
          mediaQuery.addEventListener('change', handleMediaQueryChange);
          // Remove the Listener when the component is unmounted
          return()=>{
            mediaQuery.removeEventListener('change', handleMediaQueryChange);
          }

      }, [])


    return(
      <Canvas
        frameloop="demand"
        shadows
        camera={{position: [20, 3, 5], fov:23}}
        gl={{ preserveDrawingBuffer: true }}
      >
        <Suspense fallback={<CanvasLoader/>}>
          <OrbitControls
            enableZoom={false}
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={Math.PI /2}
          />
          <Computers isMobile={isMobile}/>
        </Suspense>

            < Preload all/>
      </Canvas>
    );
  };

export default ComputersCanvas;