export function haversine(a, b) {
  const R = 6371, P = Math.PI / 180;
  const dLat = (b.lat - a.lat) * P;
  const dLng = (b.lng - a.lng) * P;
  const x = Math.sin(dLat/2)**2 + Math.cos(a.lat*P)*Math.cos(b.lat*P)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}

// 1. BFS
export function bfs(start, end, graph) {
  const queue = [[start]], visited = new Set([start]);
  let explored = 0;
  while (queue.length) {
    const path = queue.shift(), node = path[path.length-1];
    explored++;
    if (node === end) return { path, explored };
    for (const nb of (graph[node]||[]))
      if (!visited.has(nb)) { visited.add(nb); queue.push([...path, nb]); }
  }
  return { path: null, explored };
}

// 2. DFS
export function dfs(start, end, graph) {
  const stack = [[start]], visited = new Set();
  let explored = 0;
  while (stack.length) {
    const path = stack.pop(), node = path[path.length-1];
    if (visited.has(node)) continue;
    visited.add(node); explored++;
    if (node === end) return { path, explored };
    for (const nb of [...(graph[node]||[])].reverse())
      if (!visited.has(nb)) stack.push([...path, nb]);
  }
  return { path: null, explored };
}

// 3. UCS (Dijkstra)
export function ucs(start, end, graph, weightFn) {
  const dist = {}, prev = {}, visited = new Set();
  Object.keys(graph).forEach(k => { dist[k]=Infinity; prev[k]=null; });
  dist[start] = 0;
  const pq = [[0, start]];
  let explored = 0;
  while (pq.length) {
    pq.sort((a,b) => a[0]-b[0]);
    const [cost, node] = pq.shift();
    if (visited.has(node)) continue;
    visited.add(node); explored++;
    if (node === end) break;
    for (const nb of (graph[node]||[])) {
      const nc = cost + weightFn(node, nb);
      if (nc < dist[nb]) { dist[nb]=nc; prev[nb]=node; pq.push([nc,nb]); }
    }
  }
  if (dist[end]===Infinity) return { path:null, explored };
  const path=[]; let c=end;
  while(c) { path.unshift(c); c=prev[c]; }
  return { path, explored };
}

// 4. Greedy Best-First Search
export function greedyBFS(start, end, graph, hFn) {
  const visited = new Set([start]), prev = {[start]:null};
  const pq = [[hFn(start,end), start]];
  let explored = 0;
  while (pq.length) {
    pq.sort((a,b)=>a[0]-b[0]);
    const [,node] = pq.shift(); explored++;
    if (node===end) {
      const path=[]; let c=end;
      while(c!==null){path.unshift(c);c=prev[c];}
      return { path, explored };
    }
    for (const nb of (graph[node]||[]))
      if (!visited.has(nb)) { visited.add(nb); prev[nb]=node; pq.push([hFn(nb,end),nb]); }
  }
  return { path:null, explored };
}

// 5. A*
export function aStar(start, end, graph, weightFn, hFn) {
  const g={}, prev={}, visited=new Set();
  Object.keys(graph).forEach(k => { g[k]=Infinity; prev[k]=null; });
  g[start]=0;
  const open=[[hFn(start,end), start]];
  let explored=0;
  while(open.length) {
    open.sort((a,b)=>a[0]-b[0]);
    const [,node]=open.shift();
    if(visited.has(node)) continue;
    visited.add(node); explored++;
    if(node===end) break;
    for(const nb of (graph[node]||[])) {
      const ng=g[node]+weightFn(node,nb);
      if(ng<g[nb]){ g[nb]=ng; prev[nb]=node; open.push([ng+hFn(nb,end),nb]); }
    }
  }
  if(g[end]===Infinity) return {path:null,explored};
  const path=[]; let c=end;
  while(c){path.unshift(c);c=prev[c];}
  return {path,explored};
}

// TSP Nearest Neighbour
export function tspNN(startId, campuses) {
  const map = Object.fromEntries(campuses.map(c=>[c.id,c]));
  const unvis = new Set(campuses.map(c=>c.id).filter(id=>id!==startId));
  const order=[startId]; let cur=startId;
  while(unvis.size) {
    let best=null, bestD=Infinity;
    for(const id of unvis){ const d=haversine(map[cur],map[id]); if(d<bestD){bestD=d;best=id;} }
    order.push(best); unvis.delete(best); cur=best;
  }
  order.push(startId);
  return order;
}