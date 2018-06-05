function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  // If you don't care about the order of the elements inside
  // the array, you should sort both arrays here.

  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// https://bl.ocks.org/mbostock/19168c663618b7f07158
function poissonDiscSampler(width, height, radius) {
  let k = 30; // maximum number of samples before rejection
  let radius2 = radius * radius;
  let R = 3 * radius2;
  let cellSize = radius * Math.SQRT1_2;
  let gridWidth = Math.ceil(width / cellSize);
  let gridHeight = Math.ceil(height / cellSize);
  let grid = new Array(gridWidth * gridHeight);
  let queue = [];
  let queueSize = 0;
  let sampleSize = 0;

  return function () {
    if (!sampleSize) return sample(Math.random() * width, Math.random() * height);

    // Pick a random existing sample and remove it from the queue.
    while (queueSize) {
      let i = Math.random() * queueSize | 0,
        s = queue[i];

      // Make a new candidate between [radius, 2 * radius] from the existing sample.
      for (let j = 0; j < k; ++j) {
        let a = 2 * Math.PI * Math.random(),
          r = Math.sqrt(Math.random() * R + radius2),
          x = s[0] + r * Math.cos(a),
          y = s[1] + r * Math.sin(a);

        // Reject candidates that are outside the allowed extent,
        // or closer than 2 * radius to any existing sample.
        if (x >= 0 && x < width && y >= 0 && y < height && far(x, y)) return sample(x, y);
      }

      queue[i] = queue[--queueSize];
      queue.length = queueSize;
    }
  };

  function far(x, y) {
    let i = x / cellSize | 0,
      j = y / cellSize | 0,
      i0 = Math.max(i - 2, 0),
      j0 = Math.max(j - 2, 0),
      i1 = Math.min(i + 3, gridWidth),
      j1 = Math.min(j + 3, gridHeight);

    for (j = j0; j < j1; ++j) {
      let o = j * gridWidth;
      for (i = i0; i < i1; ++i) {
        if (s = grid[o + i]) {
          var s,
            dx = s[0] - x,
            dy = s[1] - y;
          if (dx * dx + dy * dy < radius2) return false;
        }
      }
    }

    return true;
  }

  function sample(x, y) {
    let s = [x, y];
    queue.push(s);
    grid[gridWidth * (y / cellSize | 0) + (x / cellSize | 0)] = s;
    ++sampleSize;
    ++queueSize;
    return s;
  }
}

function main() {
  const width = 1024;
  const height = 1024;
  const svg = d3.select('body').append('svg')
    .attr('width', width)
    .attr('height', height);

  const sampler = poissonDiscSampler(width, height, 40);
  const sites = [];
  while (true) {
    const next = sampler();
    if (!next) {
      break;
    }
    sites.push(next);
  }

  const delauney = d3.voronoi()
    .extent([[-1, -1], [width + 1, height + 1]])
    .triangles(sites);

  const centroids = delauney
    .map(x => ({
      centroid: d3.polygonCentroid(x),
      triangle: x,
    }));

  const mesh = sites.map((x, i) => ({
    id: i,
    polygon: d3.polygonHull(centroids.filter(y => arraysEqual(y.triangle[0], x) || arraysEqual(y.triangle[1], x) || arraysEqual(y.triangle[2], x)).map(y => y.centroid)),
    neighbors: [],
    site: x,
    triangles: delauney.filter(y => y.some(z => arraysEqual(z, x))),
    height: 0,
  })).filter(x => x.polygon);

  mesh.forEach((m) => {
    m.neighbors = mesh.filter(y => m.triangles.some(z => z.some(a => arraysEqual(a, y.site))));
  });

  function addHill() {
    var handled = new Map ();
    let startPoint = randomElement(mesh);
    let amount = 0.9;
    function iteration(points, amount) {
      if (amount < 0.001) {
        return;
      }

      let next = [];
      for(const s of points) {
        handled.set(s.id, true);
      }

      for(const s of points) {
        s.height += amount;
        next = next.concat(s.neighbors.filter(y => !handled.has(y.id) && next.indexOf(y) === -1));
      }

      iteration(next, amount * 0.75);
    }

    iteration([startPoint], amount);
  }

  addHill();
  addHill();
  addHill();
  addHill();
  addHill();
  addHill();
  
  /*svg.append('g')
    .selectAll('.data-border')
    .data(delauney)
    .enter()
    .append('path')
    .attr('d', d => `M${d.join('L')}Z`)
    .attr('fill', 'none')
    .attr('stroke', 'black');*/

  svg.append('g')
    .selectAll('.data-border')
    .data(mesh)
    .enter()
    .append('path')
    .attr('d', d => `M${d.polygon.join('L')}Z`)
    .attr('fill', d => `rgba(0,0,0,${1 - d.height})`);
    //.attr('stroke', 'green');

  /*svg.append('g')
    .selectAll('.data-point')
    .data(sites)
    .enter()
    .append('circle')
    .attr('r', 5)
    .attr('cx', d => d[0])
    .attr('cy', d => d[1])
    .attr('fill', 'red');

  svg.append('g')
    .selectAll('.data-point')
    .data(centroids.map(x => x.centroid))
    .enter()
    .append('circle')
    .attr('r', 2)
    .attr('cx', d => d[0])
    .attr('cy', d => d[1])
    .attr('fill', 'blue');*/
}

main();
