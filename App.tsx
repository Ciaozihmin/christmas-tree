import React, { useState } from 'react';
import { Experience } from './components/Experience';
import { TreeState } from './types';

function App() {
  const [treeState, setTreeState] = useState<TreeState>(TreeState.SCATTERED);

  const toggleState = () => {
    setTreeState((prev) => 
      prev === TreeState.SCATTERED ? TreeState.TREE_SHAPE : TreeState.SCATTERED
    );
  };

  return (
    <div className="w-full h-screen relative bg-black">
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Experience treeState={treeState} />
      </div>

      {/* UI Overlay Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-between py-12 px-6">
        
        {/* Header */}
        <div className="text-center">
          {/* Title: Lighter Gold #CCA452 (was #A67721) */}
          <h1 className="text-5xl md:text-7xl font-serif font-light tracking-widest text-[#CCA452] drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            ARIX SIGNATURE
          </h1>
          <p className="text-white/70 mt-3 text-sm md:text-base tracking-[0.3em] uppercase font-light font-sans">
            Interactive Holiday Collection
          </p>
        </div>

        {/* Spacer to push controls down */}
        <div className="flex-grow"></div>

        {/* Footer Group containing Button and Text */}
        <div className="flex flex-col items-center gap-8 mb-4 pointer-events-auto">
          <button
            onClick={toggleState}
            className="group relative px-10 py-4 bg-transparent overflow-hidden rounded-full transition-all duration-500 ease-out hover:scale-105 active:scale-95"
          >
            {/* Button Border - Static visible border with color #A67721 */}
            <div className="absolute inset-0 rounded-full border-2 border-[#A67721] border-opacity-100 transition-all duration-500"></div>
            
            {/* Button Background Blur - 50% Opacity */}
            <div className="absolute inset-0 bg-[#001a10] bg-opacity-50 backdrop-blur-md rounded-full transition-colors duration-500"></div>

            {/* Shine Effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

            <span className="relative z-10 text-[#A67721] font-serif text-lg tracking-widest uppercase flex items-center gap-3">
              {treeState === TreeState.SCATTERED ? 'Assemble Tree' : 'Release Magic'}
              {/* Simple Icon */}
              <svg className={`w-5 h-5 transition-transform duration-500 ${treeState === TreeState.TREE_SHAPE ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </span>
          </button>

          {/* Footer Text */}
          <div className="text-white/30 text-xs tracking-widest uppercase pointer-events-none">
            High Fidelity 3D Experience
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;