function KnowledgeMapRenderer({
  graph,
  setGraph,
  frozen,
  onClear,
}: {
  graph: { nodes: KnowledgeNode[], links: KnowledgeLink[] };
  setGraph: React.Dispatch<React.SetStateAction<{ nodes: KnowledgeNode[], links: KnowledgeLink[] }>>;
  frozen: boolean;
  onClear: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Local mutable state for high-performance physics
  const physicsRef = useRef<{nodes: KnowledgeNode[], links: KnowledgeLink[]}>({ nodes: [], links: [] });
  // Sync prop graph to local physics model roughly (additions)
  useEffect(() => {
    const localNodes = physicsRef.current.nodes;
    graph.nodes.forEach(gn => {
      const existing = localNodes.find(n => n.id === gn.id);
      if (existing) {
         existing.frequency = gn.frequency;
      } else {
         localNodes.push({ ...gn, x: gn.x || Math.random() * 800, y: gn.y || Math.random() * 600, vx: 0, vy: 0 });
      }
    });
    physicsRef.current.links = [...graph.links];
  }, [graph]);

  // Sync physics positions backwards to React state when frozen OR debounced
  useEffect(() => {
    if (frozen) {
      setGraph(prev => ({
        nodes: prev.nodes.map(n => {
           const pn = physicsRef.current.nodes.find(ln => ln.id === n.id);
           return pn ? { ...n, x: pn.x, y: pn.y, vx: pn.vx, vy: pn.vy } : n;
        }),
        links: prev.links
      }));
    }
  }, [frozen]);

  const pointerPos = useRef<{x: number, y: number} | null>(null);
  const draggedNode = useRef<KnowledgeNode | null>(null);
  const [hoverData, setHoverData] = useState<{node: KnowledgeNode, x: number, y: number} | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let animationId: number;

    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      const { nodes, links } = physicsRef.current;

      // PHYSICS STEP
      if (!frozen) {
        nodes.forEach(n => {
          if (draggedNode.current && draggedNode.current.id === n.id) {
             if (pointerPos.current) {
                n.x = pointerPos.current.x;
                n.y = pointerPos.current.y;
             }
             return;
          }
          let fx = (w/2 - n.x) * 0.005;
          let fy = (h/2 - n.y) * 0.005;

          nodes.forEach(n2 => {
            if (n.id === n2.id) return;
            const dx = n.x - n2.x;
            const dy = n.y - n2.y;
            const distSq = dx*dx + dy*dy || 1;
            const dist = Math.sqrt(distSq);
            if (dist < 300) {
              const force = 1000 / distSq;
              fx += (dx/dist) * force;
              fy += (dy/dist) * force;
            }
          });

          links.forEach(l => {
            if (l.source === n.id || l.target === n.id) {
                const otherId = l.source === n.id ? l.target : l.source;
                const n2 = nodes.find(x => x.id === otherId);
                if (n2) {
                   const dx = n2.x - n.x;
                   const dy = n2.y - n.y;
                   const dist = Math.sqrt(dx*dx + dy*dy) || 1;
                   const force = (dist - 150) * 0.02;
                   fx += (dx/dist) * force;
                   fy += (dy/dist) * force;
                }
            }
          });

          n.vx = (n.vx * 0.8) + fx;
          n.vy = (n.vy * 0.8) + fy;
          n.x += n.vx;
          n.y += n.vy;

          n.x = Math.max(50, Math.min(w-50, n.x));
          n.y = Math.max(50, Math.min(h-50, n.y));
        });
      }

      // IDENTIFY CONNECTIONS FOR HIGHLIGHTING
      const connectedIds = new Set<string>();
      if (highlightedId) {
         connectedIds.add(highlightedId);
         links.forEach(l => {
            if (l.source === highlightedId) connectedIds.add(l.target);
            if (l.target === highlightedId) connectedIds.add(l.source);
         });
      }

      // DRAW LINKS
      links.forEach(l => {
        const s = nodes.find(n => n.id === l.source);
        const t = nodes.find(n => n.id === l.target);
        if (!s || !t) return;
        
        const isFaded = highlightedId && !connectedIds.has(s.id) && !connectedIds.has(t.id);
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = isFaded ? 'rgba(0,0,0,0.1)' : '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // DRAW NODES
      nodes.forEach(n => {
        const isFaded = highlightedId && !connectedIds.has(n.id);
        const isHighlighted = highlightedId && connectedIds.has(n.id);

        const fontSize = Math.min(24, 10 + n.frequency * 4);
        ctx.font = `bold ${fontSize}px monospace`;
        const textWidth = ctx.measureText(n.id).width;
        const width = textWidth + 24;
        const height = fontSize + 20;

        ctx.fillStyle = isHighlighted ? '#FFE600' : '#FFF';
        ctx.globalAlpha = isFaded ? 0.2 : 1;
        ctx.fillRect(n.x - width/2, n.y - height/2, width, height);
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeRect(n.x - width/2, n.y - height/2, width, height);

        // Sidebar Color mapping
        let color = '#FFF';
        if (n.sourceMode === 'RESEARCH') color = '#0047FF';
        else if (n.sourceMode === 'SUPPORT') color = '#FF2D00';
        else if (n.sourceMode === 'WORKFLOW') color = '#FFE600';
        else if (n.sourceMode === 'KNOWLEDGE') color = '#00FF00';
        else if (n.sourceMode === 'DEBATE') color = '#FF00FF';

        ctx.fillStyle = color;
        ctx.fillRect(n.x - width/2, n.y - height/2, 8, height); // left colored bar
        ctx.strokeRect(n.x - width/2, n.y - height/2, 8, height);

        ctx.fillStyle = '#000';
        ctx.fillText(n.id, n.x - width/2 + 16, n.y + fontSize/3);
        ctx.globalAlpha = 1;
      });

      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [frozen, highlightedId]);

  const handlePointerDown = (e: React.PointerEvent) => {
    const rx = e.nativeEvent.offsetX;
    const ry = e.nativeEvent.offsetY;
    const { nodes } = physicsRef.current;
    
    // Find highest node
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const fontSize = Math.min(24, 10 + n.frequency * 4);
      // Rough bounding box assuming 10px monospace
      const width = (n.id.length * fontSize * 0.6) + 24;
      const height = fontSize + 20;
      if (rx >= n.x - width/2 && rx <= n.x + width/2 && ry >= n.y - height/2 && ry <= n.y + height/2) {
         draggedNode.current = n;
         pointerPos.current = { x: rx, y: ry };
         setHighlightedId(n.id);
         return;
      }
    }
    setHighlightedId(null);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const rx = e.nativeEvent.offsetX;
    const ry = e.nativeEvent.offsetY;
    pointerPos.current = { x: rx, y: ry };

    const { nodes } = physicsRef.current;
    let foundHover: KnowledgeNode | null = null;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const fontSize = Math.min(24, 10 + n.frequency * 4);
      const width = (n.id.length * fontSize * 0.6) + 24;
      const height = fontSize + 20;
      if (rx >= n.x - width/2 && rx <= n.x + width/2 && ry >= n.y - height/2 && ry <= n.y + height/2) {
         foundHover = n;
         break;
      }
    }

    if (foundHover) {
       setHoverData({ node: foundHover, x: rx, y: ry });
    } else {
       setHoverData(null);
    }
  };

  const handlePointerUp = () => {
    draggedNode.current = null;
  };

  const exportPng = () => {
     if (!canvasRef.current) return;
     const src = canvasRef.current.toDataURL('image/png');
     const a = document.createElement('a');
     a.href = src;
     a.download = 'knowledge_map.png';
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
  };

  const executeClear = () => {
     if (window.confirm("CONFIRM_WIPE? [YES] [NO]")) {
        physicsRef.current = { nodes: [], links: [] };
        setGraph({ nodes: [], links: [] });
        onClear();
     }
  };

  return (
    <div className="flex-1 flex flex-col relative w-full h-full bg-[#E5E5E5] overflow-hidden" ref={containerRef}>
      {/* TOOLBAR */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap gap-2 pointer-events-none">
        <button onClick={executeClear} className="pointer-events-auto bg-[#FF2D00] text-white border-[3px] border-black px-4 py-2 font-black uppercase text-xs active:translate-y-1" style={{boxShadow: '4px 4px 0px #000'}}>
          [CLEAR_MAP]
        </button>
        <button onClick={exportPng} className="pointer-events-auto bg-[#FFE600] text-black border-[3px] border-black px-4 py-2 font-black uppercase text-xs active:translate-y-1" style={{boxShadow: '4px 4px 0px #000'}}>
          [EXPORT_MAP_PNG]
        </button>
        <button onClick={() => {
           // We toggle frozen state
           // Since freeze state lives in App, we should receive an unfreeze / freeze method
        }} className="pointer-events-auto bg-black text-white border-[3px] border-black px-4 py-2 font-black uppercase text-xs active:translate-y-1" style={{boxShadow: '4px 4px 0px #000'}} id="freeze-btn">
          {frozen ? '[UNFREEZE_LAYOUT]' : '[FREEZE_LAYOUT]'}
        </button>
      </div>

      <canvas 
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />

      {hoverData && !draggedNode.current && (
         <div 
           className="absolute z-20 bg-white border-[3px] border-black p-2 pointer-events-none font-mono text-xs uppercase"
           style={{ left: hoverData.x + 15, top: hoverData.y + 15, boxShadow: '4px 4px 0px #000' }}
         >
           <div className="font-black border-b-[2px] border-black pb-1 mb-1 bg-black text-white px-1">NODE: {hoverData.node.id}</div>
           <div>MENTIONS: {hoverData.node.frequency}</div>
           <div>FIRST_SEEN: {new Date(hoverData.node.firstSeenMs).toLocaleTimeString()}</div>
         </div>
      )}
    </div>
  );
}
