
function relax(sites, width, height) {
  return d3.voronoi(sites)
    .extent([[-1, -1], [width + 1, height + 1]])
    .polygons(sites)
    .map(d3.polygonCentroid);
}

function main() {
  const width = 1024;
  const height = 1024;
  const svg = d3.select('body').append('svg')
    .attr('width', width)
    .attr('height', height);

  let sites = d3.range(4096)
    .map(() => [Math.random() * width, Math.random() * height]);

  sites = relax(sites, width, height);
  sites = relax(sites, width, height);

  const final = d3.voronoi(sites)
    .extent([[-1, -1], [width + 1, height + 1]])
    .polygons(sites)
    .map(x => Object.assign(x, ({
      height: Math.random(),
    })));

  svg.append('g')
    .selectAll('.data-border')
    .data(final)
    .enter()
    .append('path')
    .attr('d', d => `M${d.join('L')}Z`)
    .attr('fill', d => `rgba(0,0,0,${d.height}`)
    .attr('stroke', 'none');

  svg.append('g')
    .selectAll('.data-point')
    .data(sites)
    .enter()
    .append('circle')
    .attr('r', 2)
    .attr('cx', d => d[0])
    .attr('cy', d => d[1])
    .attr('fill', 'black');
}

main();
