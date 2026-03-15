# 🗺️ KIIT Campus Navigator

A full-stack interactive campus navigation web app built with **React.js + Leaflet.js** for KIIT University, Bhubaneswar. Visualizes shortest path algorithms on a real map with all 25 KIIT campuses at their verified GPS coordinates.

---

## 🚀 Live Demo

> Add your deployed link here

---

## ✨ Features

### 📍 Point-to-Point Navigation
- Select any **source** and **destination** campus
- Shortest route drawn instantly on the real map with a **glowing animated path**
- Shows: distance (km), time (min), hops, nodes explored
- Full path displayed as step-by-step chips
- **⇅ Swap** button to reverse the route instantly

### 🔄 Full Campus TSP Tour
- Select a **start campus** — visits all 25 campuses and **returns to start**
- Uses **Nearest Neighbour heuristic** (TSP approximation) for visit order
- Each hop solved using your selected algorithm
- Animated step-by-step with live km/min counter
- Speed slider: 1× slow → 5× fast

### 🧠 5 Algorithms

| Algorithm | Strategy | Complexity | Optimal? |
|-----------|----------|------------|----------|
| **BFS** | Level-by-level · Queue | O(V+E) | ✅ Fewest hops |
| **DFS** | Deep paths · Stack | O(V+E) | ❌ |
| **UCS** | Lowest cost first (Dijkstra) | O(b^(1+C/ε)) | ✅ Shortest dist |
| **GBFS** | Heuristic h(n) only | O(b^m) | ❌ |
| **A\*** | f(n) = g(n) + h(n) | O(E log V) | ✅ Optimal+Fast |

### 🗺️ Map
- Real **OpenStreetMap** tiles — roads, buildings, landmarks all visible
- Dark-themed map
- All 25 campus pins at **verified GPS coordinates** (right-clicked from Google Maps)
- Glowing path — 🟢 green for walking, 🟠 orange dashed for biking
- Direction arrows on each segment
- Click any pin for name + coordinates popup

---

## 🏗️ Tech Stack

| Tech | Purpose |
|------|---------|
| React 18 | UI & state management |
| Vite | Build tool & dev server |
| Leaflet.js | Interactive map |
| Vanilla JS | All algorithm logic |
| CSS Variables | Dark themed UI |

---

## 📁 Project Structure

```
KIIT-Campus-Navigator/
├── src/
│   ├── data/
│   │   └── campuses.js       ← 25 GPS coordinates + adjacency graph
│   ├── algorithms/
│   │   └── index.js          ← BFS, DFS, UCS, GBFS, A*, TSP NN
│   ├── App.jsx               ← Main component (map + UI logic)
│   ├── App.css               ← All styles
│   └── main.jsx              ← Entry point
├── index.html
├── package.json
└── vite.config.js
```

### Netlify
```bash
npm run build
# Drag the /dist folder to netlify.com/drop
```

---

## 🗺️ Verified Campus Coordinates

All 25 coordinates confirmed directly from Google Maps:

| Campus | Lat | Lng |
|--------|-----|-----|
| Campus 1 | 20.346308 | 85.823736 |
| Campus 2 | 20.353417 | 85.818391 |
| Campus 3 | 20.353934 | 85.816816 |
| Campus 4 | 20.354078 | 85.820326 |
| Campus 5 | 20.352955 | 85.813887 |
| Campus 6 | 20.353378 | 85.819387 |
| Campus 7 | 20.351031 | 85.819567 |
| Campus 8 | 20.351585 | 85.819382 |
| Campus 9 | 20.353659 | 85.811594 |
| Campus 10 | 20.354800 | 85.816278 |
| Campus 11 | 20.360884 | 85.822929 |
| Campus 12 | 20.355526 | 85.820692 |
| Campus 13 | 20.356875 | 85.818540 |
| Campus 14 | 20.356366 | 85.815319 |
| Campus 15 | 20.349959 | 85.815779 |
| Campus 16 | 20.362274 | 85.822875 |
| Campus 17 | 20.349349 | 85.819448 |
| Campus 18 | 20.356153 | 85.824076 |
| Campus 19 | 20.348868 | 85.816079 |
| Campus 20 | 20.354281 | 85.816207 |
| Campus 21 | 20.351645 | 85.815731 |
| Campus 22 | 20.354518 | 85.814702 |
| Campus 23 | 20.348271 | 85.820358 |
| Campus 24 | 20.351679 | 85.821498 |
| Campus 25 | 20.364748 | 85.816926 |

---

## 🧩 Algorithm Explanations

### BFS — Breadth-First Search
Explores all neighbours at the current depth before going deeper using a **queue (FIFO)**. Guarantees the path with the fewest hops. Does not consider edge weights.

### DFS — Depth-First Search
Explores as far as possible along each branch before backtracking using a **stack (LIFO)**. Not guaranteed shortest path but is memory-efficient.

### UCS — Uniform Cost Search
Expands the node with the **lowest cumulative cost** via a priority queue. Identical to Dijkstra's algorithm. Guarantees the optimal (shortest distance) path.

### GBFS — Greedy Best-First Search
Uses only the straight-line distance to the goal as heuristic **h(n)**. Very fast but does not guarantee the optimal path.

### A* Search
**f(n) = g(n) + h(n)** — combines actual cost from start g(n) with heuristic estimate to goal h(n). Both optimal and efficient. The gold standard for pathfinding.

---

## 🔬 TSP — Nearest Neighbour Heuristic

```
1. Start at selected campus, mark all others unvisited
2. From current → find nearest unvisited campus (haversine distance)
3. Move there → mark visited → repeat
4. After all 25 visited → return to start
5. Each hop solved using chosen algorithm (BFS/DFS/UCS/GBFS/A*)
```

Approximate TSP solution in **O(n²)** time.

---

## 📚 Course

**Artificial Intelligence Lab**
B.Tech — KIIT University, Bhubaneswar
Academic Year 2024–25

---

## 🙏 Acknowledgements

- [OpenStreetMap](https://www.openstreetmap.org/) — Map data
- [Leaflet.js](https://leafletjs.com/) — Map rendering library
- [React](https://react.dev/) — UI framework
- [Vite](https://vitejs.dev/) — Build tool
