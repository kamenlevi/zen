
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

  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(res => res.json())
      .then(data => {
        setWorldData(feature(data, data.objects.countries));
      });
  }, []);

  const latestGuess = useMemo(() => {
    if (guesses.length === 0) return null;
    return guesses[guesses.length - 1];
  }, [guesses]);

  useEffect(() => {
    if (!worldData || !svgRef.current) return;

    const width = 240;
    const height = 240;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const projection = d3.geoOrthographic()
      .scale(110)
      .translate([width / 2, height / 2])
      .clipAngle(90);

    const path = d3.geoPath(projection);

    // Initial rotation toward latest guess
    if (latestGuess && latestGuess.lat !== undefined && latestGuess.lng !== undefined) {
      // D3 rotation is [-lng, -lat]
      const targetRotation: [number, number, number] = [-latestGuess.lng, -latestGuess.lat, 0];
      
      // Animate rotation
      const interpolate = d3.interpolate(rotationRef.current, targetRotation);
      
      d3.transition()
        .duration(800)
        .ease(d3.easeCubicInOut)
        .tween('rotate', () => (t: number) => {
          rotationRef.current = interpolate(t);
          render();
        });
    } else {
      render();
    }

    function render() {
      svg.selectAll('*').remove();
      projection.rotate(rotationRef.current);

      // Globe background (Sea)
      svg.append('path')
        .datum({ type: 'Sphere' })
        .attr('class', 'sphere')
        .attr('d', path)
        .attr('fill', '#ffffff')
        .attr('stroke', '#f4f4f5')
        .attr('stroke-width', '1');

      // All countries
      svg.append('g')
        .selectAll('path')
        .data(worldData.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('fill', '#f4f4f5')
        .attr('stroke', '#e4e4e7')
        .attr('stroke-width', '0.3');

      // Guessed countries
      const guessedNames = new Set(guesses.map(g => g.guessName.toLowerCase()));
      
      svg.append('g')
        .selectAll('path')
        .data(worldData.features.filter((f: any) => guessedNames.has(f.properties.name.toLowerCase())))
        .enter()
        .append('path')
        .attr('d', path)
        .attr('fill', (d: any) => {
            const guess = guesses.find(g => g.guessName.toLowerCase() === d.properties.name.toLowerCase());
            if (guess && guess === latestGuess) return '#10b981'; // Bright emerald for latest
            return '#34d399'; // Lighter emerald for previous
        })
        .attr('stroke', '#059669')
        .attr('stroke-width', '0.5');

      // Globe shine/border
      svg.append('path')
        .datum({ type: 'Sphere' })
        .attr('d', path)
        .attr('fill', 'none')
        .attr('stroke', '#e4e4e7')
        .attr('stroke-width', '1.5');
    }
  }, [worldData, guesses, latestGuess]);

  return (
    <div className={`relative w-[240px] h-[240px] flex items-center justify-center ${className}`}>
        {!worldData && (
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-zinc-100 border-t-zinc-900 rounded-full animate-spin"></div>
            </div>
        )}
        <svg ref={svgRef} width="240" height="240" className="overflow-visible" />
    </div>
  );
};

export default GlobeView;
