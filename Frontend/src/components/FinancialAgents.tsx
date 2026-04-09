import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, DollarSign, TrendingUp, Target, Shield, BarChart as ChartBar, Workflow, Coins, Building, Scale, LineChart, Landmark, Network } from 'lucide-react';

export function FinancialAgents() {
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  const agents = [
    { id: 'nexus', name: 'NEXUS ROUTER', icon: <Network className="w-7 h-7" />, x: 500, y: 300, core: true },
    { id: 'data_analyst', name: 'Analysis Engine', icon: <BrainCircuit className="w-5 h-5" />, x: 300, y: 160 },
    { id: 'risk_advisor', name: 'Risk', icon: <Shield className="w-5 h-5" />, x: 700, y: 160 },
    { id: 'trading_strategy', name: 'Quant Logic', icon: <ChartBar className="w-5 h-5" />, x: 300, y: 440 },
    { id: 'execution', name: 'Trade Exec', icon: <Workflow className="w-5 h-5" />, x: 700, y: 440 },
    
    // Outer satellites
    { id: 'crypto', name: 'Crypto Arb', icon: <Coins className="w-4 h-4" />, x: 100, y: 80 },
    { id: 'real_estate', name: 'Property Orcl', icon: <Building className="w-4 h-4" />, x: 500, y: 50 },
    { id: 'budget', name: 'Budget Opt', icon: <TrendingUp className="w-4 h-4" />, x: 900, y: 80 },

    { id: 'debt_management', name: 'Debt & Credit', icon: <DollarSign className="w-4 h-4" />, x: 80, y: 300 },
    { id: 'goal_planning', name: 'Client Goals', icon: <Target className="w-4 h-4" />, x: 920, y: 300 },

    { id: 'gold', name: 'Commodities', icon: <Scale className="w-4 h-4" />, x: 100, y: 520 },
    { id: 'mutual_funds', name: 'Mutual Funds', icon: <LineChart className="w-4 h-4" />, x: 500, y: 550 },
    { id: 'fixed_income', name: 'Fixed Income', icon: <Landmark className="w-4 h-4" />, x: 900, y: 520 },
  ];

  const links = [
    // Center to first ring
    [0, 1], [0, 2], [0, 3], [0, 4],
    // First ring interconnects
    [1, 2], [3, 4], [1, 3], [2, 4],
    // First ring to outer
    [1, 5], [1, 6], [1, 8],
    [2, 6], [2, 7], [2, 9],
    [3, 8], [3, 10], [3, 11],
    [4, 9], [4, 11], [4, 12],
    // Outer random connections for Web look
    [5, 6], [6, 7], [8, 10], [9, 12]
  ];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden bg-charcoal-900 border border-charcoal-800 rounded-xl shadow-inner">
      <div className="absolute inset-0 w-full h-full p-8 md:p-7">
        <div className="relative w-full h-full">
          {/* Synchronized SVG Coordinate Plane */}
          <svg viewBox="0 0 1000 600" preserveAspectRatio="none" className="absolute w-full h-full pointer-events-none z-0">
             {links.map((link, idx) => {
               const source = agents[link[0]];
               const target = agents[link[1]];
               const isLinkedToHover = hoveredNode === link[0] || hoveredNode === link[1];
               const isHoverActive = hoveredNode !== null;
               
               const strokeColor = isLinkedToHover ? "rgba(39, 201, 63, 0.7)" : (isHoverActive ? "rgba(184, 154, 122, 0.05)" : "rgba(184, 154, 122, 0.2)");
               const strokeWidth = isLinkedToHover ? 2 : 1;
               const pulseColor = isLinkedToHover ? "#27c93f" : "#b89a7a";
               
               return (
                 <g key={`l-${idx}`}>
                   <line 
                     x1={source.x} y1={source.y}
                     x2={target.x} y2={target.y}
                     stroke={strokeColor} 
                     strokeWidth={strokeWidth}
                     strokeDasharray={isLinkedToHover ? "none" : "3 6"}
                     className="transition-colors duration-300"
                   />
                   <motion.circle
                     r={isLinkedToHover ? 3.5 : 1.5}
                     fill={pulseColor}
                     animate={{
                       cx: [source.x, target.x],
                       cy: [source.y, target.y],
                     }}
                     transition={{
                       duration: isLinkedToHover ? 0.7 : 2 + (idx % 2),
                       repeat: Infinity,
                       repeatType: "reverse",
                       ease: "linear",
                       delay: (idx * 0.1) % 1
                     }}
                     className="transition-all duration-300"
                     style={{ filter: isLinkedToHover ? "drop-shadow(0 0 5px #27c93f)" : "none", opacity: isHoverActive && !isLinkedToHover ? 0.2 : 1 }}
                   />
                 </g>
               )
             })}
          </svg>

          {agents.map((agent, i) => {
            const isHovered = hoveredNode === i;
            const isConnectedToHover = hoveredNode !== null && links.some(link => (link[0] === hoveredNode && link[1] === i) || (link[1] === hoveredNode && link[0] === i));
            const isDimmed = hoveredNode !== null && !isHovered && !isConnectedToHover;

            return (
              <div
                key={agent.id}
                onMouseEnter={() => setHoveredNode(i)}
                onMouseLeave={() => setHoveredNode(null)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center z-10 cursor-pointer transition-all duration-300 ${isHovered ? 'z-30' : (isConnectedToHover ? 'z-20' : 'z-10')} ${isDimmed ? 'opacity-30' : 'opacity-100'}`}
                style={{ left: `${agent.x / 10}%`, top: `${agent.y / 6}%` }}
              >
                {/* Agent Node Icon Wrapper */}
                <div 
                  className={`relative flex items-center justify-center transition-all duration-300 
                    ${isHovered ? 'scale-125' : (isConnectedToHover ? 'scale-110' : 'scale-100')} 
                    ${agent.core ? 'w-16 h-16 rounded-full bg-charcoal-950 border-2 shadow-[0_0_30px_rgba(184,154,122,0.3)]' : 'w-10 h-10 rounded-xl bg-charcoal-900 border shadow-lg'}
                    ${isHovered || isConnectedToHover ? 'border-green-400 bg-green-400/10' : 'border-charcoal-700 hover:border-bronze'}
                  `}
                >
                  <div className={`transition-colors duration-300 ${isHovered || isConnectedToHover ? 'text-green-400 animate-pulse' : 'text-bronze'}`}>
                    {agent.icon}
                  </div>
                  
                  {agent.core && isHovered && (
                     <div className="absolute inset-0 rounded-full border border-green-400 animate-ping opacity-30"></div>
                  )}
                </div>

                {/* Floating Node Label */}
                <div 
                  className={`absolute -bottom-6 text-[10px] font-mono tracking-wide px-2 py-0.5 rounded border backdrop-blur-sm transition-all duration-300 whitespace-nowrap
                    ${isHovered ? 'text-green-400 bg-green-400/10 border-green-400/30' : 'text-warmGrey-400 bg-charcoal-950/80 border-charcoal-800'}
                  `}
                >
                  {agent.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}