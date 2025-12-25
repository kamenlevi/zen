
import React, { useEffect, useState, useRef, useMemo } from 'react';
import * as d3 from 'https://esm.sh/d3@7';
import { feature } from 'https://esm.sh/topojson-client@3';
import { GeodleMove } from '../types.ts';

interface GlobeViewProps {
  guesses: GeodleMove[];
  className?: string;
}

const GlobeView: React.FC<GlobeViewProps> = ({ guesses, className = '' }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [worldData, setWorldData] = useState<any>(null);
  const rotationRef = useRef<[number, number, number]>([0, -20, 0]);
  const gRef = useRef<any>(null);

  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(res => res.json())
      .then(data => { setWorldData(feature(data, data.objects.countries)); });
  }, []);

  const latestGuess = useMemo(() => guesses.length > 0 ? guesses[guesses.length - 1] : null, [guesses]);

  useEffect(() => {
    if (!worldData || !svgRef.current) return;
    const width = 240, height = 240;
    const svg = d3.select(svgRef.current);
    
    if (!gRef.current) {
      svg.selectAll('*').remove();
      gRef.current = svg.append('g');
    }

    const projection = d3.geoOrthographic().scale(110).translate([width/2, height/2]).clipAngle(90);
    const path = d3.geoPath(projection);

    const render = () => {
      projection.rotate(rotationRef.current);
      const g = gRef.current;
      g.selectAll('*').remove();

      g.append('path').datum({ type: 'Sphere' }).attr('d', path).attr('fill', '#ffffff').attr('stroke', '#f4f4f5');
      
      g.selectAll('.country')
        .data(worldData.features)
        .enter()
        .append('path')
        .attr('class', 'country')
        .attr('d', path)
        .attr('fill', (d: any) => {
          const name = d.properties.name.toLowerCase();
          const guess = guesses.find(g => g.guessName.toLowerCase() === name);
          if (guess) return guess === latestGuess ? '#10b981' : '#34d399';
          return '#f4f4f5';
        })
        .attr('stroke', '#e4e4e7')
        .attr('stroke-width', '0.3');

      g.append('path').datum({ type: 'Sphere' }).attr('d', path).attr('fill', 'none').attr('stroke', '#e4e4e7').attr('stroke-width', '1.5');
    };

    if (latestGuess && latestGuess.lat !== undefined && latestGuess.lng !== undefined) {
      const targetRotation: [number, number, number] = [-latestGuess.lng, -latestGuess.lat, 0];
      const interpolate = d3.interpolate(rotationRef.current, targetRotation);
      d3.transition().duration(600).ease(d3.easeCubicInOut).tween('rotate', () => (t: number) => {
        rotationRef.current = interpolate(t);
        render();
      });
    } else {
      render();
    }
  }, [worldData, guesses, latestGuess]);

  return (
    <div className={`relative w-[240px] h-[240px] ${className}`}>
        {!worldData && <div className="absolute inset-0 flex items-center justify-center"><div className="w-8 h-8 border-4 border-zinc-100 border-t-zinc-900 rounded-full animate-spin"></div></div>}
        <svg ref={svgRef} width="240" height="240" />
    </div>
  );
};

export default GlobeView;
