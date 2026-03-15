import { useState, useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CAMPUS_LIST, ADJACENCY } from './data/campuses'
import { haversine, bfs, dfs, ucs, greedyBFS, aStar, tspNN } from './algorithms'
import './App.css'

/* ── Algorithm metadata ── */
const ALGO_META = {
  bfs:   { label:'BFS',  full:'Breadth-First Search',  cx:'O(V+E)',        col:'#4dabf7', desc:'Explores level-by-level using a queue. Finds the path with fewest hops.' },
  dfs:   { label:'DFS',  full:'Depth-First Search',    cx:'O(V+E)',        col:'#be8aff', desc:'Explores deep paths before backtracking. Finds any valid path quickly.' },
  ucs:   { label:'UCS',  full:'Uniform Cost Search',   cx:'O(b^(1+C/ε))', col:'#ffd60a', desc:'Always expands the lowest-cost node. Guarantees the shortest distance path.' },
  gbfs:  { label:'GBFS', full:'Greedy Best-First',     cx:'O(b^m)',        col:'#ff8040', desc:'Guided by straight-line distance to goal. Very fast but not always optimal.' },
  astar: { label:'A★',   full:'A* Search',             cx:'O(E log V)',    col:'#00f0c8', desc:'f(n)=g(n)+h(n). Both optimal and efficient — the best general algorithm.' },
}

const DELAYS = [2200, 1400, 900, 500, 250]

/* ── Leaflet marker factory ── */
const mkIcon = (short, variant = 'default') => {
  const big = variant === 'start' || variant === 'current' || variant === 'dest'
  const sz = big ? 36 : 30
  return L.divIcon({
    className: '',
    html: `<div class="mk mk-${variant}">${short}</div>`,
    iconSize: [sz, sz], iconAnchor: [sz / 2, sz / 2],
  })
}

export default function App() {
  const mapDiv   = useRef(null)
  const lmap     = useRef(null)
  const mkrs     = useRef({})
  const pathLyrs = useRef([])
  const timerRef = useRef(null)
  const runFlag  = useRef(false)

  /* ── UI state ── */
  const [appMode,  setAppMode]  = useState('p2p')   // 'p2p' | 'tsp'
  const [mode,     setMode]     = useState('walk')
  const [algo,     setAlgo]     = useState('astar')
  const [speed,    setSpeed]    = useState(3)
  const [running,  setRunning]  = useState(false)

  /* P2P state */
  const [srcId,    setSrcId]    = useState('Campus 1')
  const [dstId,    setDstId]    = useState('Campus 15')
  const [p2pResult,setP2pResult]= useState(null)   // { path, dist, time, explored }

  /* TSP state */
  const [tspStart, setTspStart] = useState('Campus 1')
  const [steps,    setSteps]    = useState([])
  const [totals,   setTotals]   = useState({ dist: 0, time: 0, stops: 0 })

  /* Shared */
  const [status, setStatus] = useState({ type: 'idle', text: 'Select a mode and configure your route' })

  const cmap = Object.fromEntries(CAMPUS_LIST.map(c => [c.id, c]))
  const wFn  = useCallback((a, b) => haversine(cmap[a], cmap[b]), [cmap])
  const hFn  = useCallback((a, b) => haversine(cmap[a], cmap[b]), [cmap])

  /* ── Init map ── */
  useEffect(() => {
    if (lmap.current) return
    lmap.current = L.map(mapDiv.current, { zoomControl: true })
      .setView([20.3535, 85.8190], 14)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors', maxZoom: 19,
    }).addTo(lmap.current)
    return () => { lmap.current?.remove(); lmap.current = null }
  }, [])

  /* ── Place all campus markers once ── */
  useEffect(() => {
    if (!lmap.current) return
    Object.values(mkrs.current).forEach(m => m.remove())
    mkrs.current = {}
    CAMPUS_LIST.forEach(c => {
      const m = L.marker([c.lat, c.lng], { icon: mkIcon(c.short, 'default') })
        .addTo(lmap.current)
        .bindPopup(
          `<div class="pi">
            <b class="pid">${c.id}</b>
            <div class="pnm">${c.name}</div>
            <div class="pco">${c.lat.toFixed(6)}, ${c.lng.toFixed(6)}</div>
          </div>`, { maxWidth: 240 }
        )
      mkrs.current[c.id] = m
    })
    lmap.current.fitBounds(CAMPUS_LIST.map(c => [c.lat, c.lng]), { padding: [30, 30] })
  }, [])

  /* ── Helpers ── */
  const clearPaths = () => { pathLyrs.current.forEach(l => l.remove()); pathLyrs.current = [] }
  const resetMkrs  = () => CAMPUS_LIST.forEach(c => mkrs.current[c.id]?.setIcon(mkIcon(c.short, 'default')))
  const setMk      = (id, v) => { const c = cmap[id]; if (c && mkrs.current[id]) mkrs.current[id].setIcon(mkIcon(c.short, v)) }

  const drawGlow = (coords, modeOverride) => {
    const isW = (modeOverride || mode) === 'walk'
    const col = isW ? '#39e08c' : '#ff8040'
    const glo = isW ? 'rgba(57,224,140,.15)' : 'rgba(255,128,64,.15)'
    const o = L.polyline(coords, { color: glo,  weight: 26, opacity: 1, lineCap: 'round', lineJoin: 'round' }).addTo(lmap.current)
    const l = L.polyline(coords, { color: col, weight: 4.5, opacity: 1, lineCap: 'round', lineJoin: 'round', dashArray: isW ? null : '10 5' }).addTo(lmap.current)
    /* arrow at midpoint */
    if (coords.length >= 2) {
      const mid = [(coords[0][0] + coords[coords.length-1][0])/2, (coords[0][1] + coords[coords.length-1][1])/2]
      const ang = Math.atan2(coords[coords.length-1][0]-coords[0][0], coords[coords.length-1][1]-coords[0][1]) * 180/Math.PI
      const a = L.marker(mid, {
        icon: L.divIcon({ className:'', html:`<div style="color:${col};font-size:13px;transform:rotate(${ang}deg);filter:drop-shadow(0 0 4px ${col})">➤</div>`, iconSize:[13,13], iconAnchor:[6,6] }),
        interactive: false,
      }).addTo(lmap.current)
      pathLyrs.current.push(a)
    }
    pathLyrs.current.push(o, l)
  }

  const runAlgo = useCallback((from, to) => {
    if (from === to) return { path:[from], explored:0 }
    if (algo==='bfs')   return bfs(from, to, ADJACENCY)
    if (algo==='dfs')   return dfs(from, to, ADJACENCY)
    if (algo==='ucs')   return ucs(from, to, ADJACENCY, wFn)
    if (algo==='gbfs')  return greedyBFS(from, to, ADJACENCY, hFn)
    if (algo==='astar') return aStar(from, to, ADJACENCY, wFn, hFn)
    return bfs(from, to, ADJACENCY)
  }, [algo, wFn, hFn])

  const sleep = ms => new Promise(r => { timerRef.current = setTimeout(r, ms) })

  /* ════════════════════════════════════════
     POINT-TO-POINT NAVIGATION
  ════════════════════════════════════════ */
  const findRoute = useCallback(() => {
    if (srcId === dstId) { setStatus({ type:'err', text:'Start and destination must be different.' }); return }
    clearPaths(); resetMkrs()
    const { path, explored } = runAlgo(srcId, dstId)
    if (!path) { setStatus({ type:'err', text:`No path found from ${srcId} to ${dstId}.` }); setP2pResult(null); return }
    /* compute metrics */
    let dist = 0, time = 0
    for (let i = 0; i < path.length-1; i++) {
      const d = haversine(cmap[path[i]], cmap[path[i+1]])
      dist += d; time += mode==='walk' ? (d/5)*60 : (d/15)*60
    }
    setP2pResult({ path, dist: dist.toFixed(2), time: Math.round(time), explored, algo })
    /* draw */
    const coords = path.map(id => [cmap[id].lat, cmap[id].lng])
    drawGlow(coords)
    path.forEach((id, i) => {
      if (i === 0) setMk(id, 'start')
      else if (i === path.length-1) setMk(id, 'dest')
      else setMk(id, 'onpath')
    })
    lmap.current?.fitBounds(L.polyline(coords).getBounds(), { padding:[60,60], animate:true })
    setStatus({ type:'done', text:`Route found: ${dist.toFixed(2)} km · ${Math.round(time)} min · ${path.length-1} hops` })
  }, [srcId, dstId, mode, runAlgo, cmap])

  /* ════════════════════════════════════════
     TSP FULL TOUR
  ════════════════════════════════════════ */
  const startTour = async () => {
    if (running) {
      runFlag.current = false; setRunning(false); clearTimeout(timerRef.current)
      setStatus({ type:'idle', text:'Tour stopped.' }); return
    }
    runFlag.current = true; setRunning(true)
    clearPaths(); resetMkrs(); setP2pResult(null)
    const tour = tspNN(tspStart, CAMPUS_LIST)
    const total = tour.length - 1
    setSteps(tour.slice(0,-1).map((from, i) => ({ from, to:tour[i+1], dist:null, state:'pending' })))
    setTotals({ dist:0, time:0, stops:total })
    setStatus({ type:'running', text:`Building tour from ${tspStart}…` })
    setMk(tspStart, 'start')
    let totD = 0, totT = 0
    for (let i = 0; i < tour.length-1; i++) {
      if (!runFlag.current) break
      const from = tour[i], to = tour[i+1]
      setSteps(p => p.map((s,idx) => idx===i ? {...s, state:'active'} : s))
      if (i > 0) setMk(from, 'visited')
      setMk(to, 'current')
      setStatus({ type:'running', text:`Step ${i+1}/${total}: ${from} → ${to}` })
      const { path } = runAlgo(from, to)
      const ap = path || [from, to]
      let segD = 0, segT = 0
      for (let j = 0; j < ap.length-1; j++) {
        const d = haversine(cmap[ap[j]], cmap[ap[j+1]])
        segD += d; segT += mode==='walk' ? (d/5)*60 : (d/15)*60
      }
      totD += segD; totT += segT
      setTotals({ dist: totD.toFixed(2), time: Math.round(totT), stops: total })
      setSteps(p => p.map((s,idx) => idx===i ? {...s, dist:segD.toFixed(2), state:'active'} : s))
      drawGlow(ap.map(id => [cmap[id].lat, cmap[id].lng]))
      lmap.current?.panTo([cmap[to].lat, cmap[to].lng], { animate:true, duration:0.5 })
      await sleep(DELAYS[speed-1])
      if (!runFlag.current) break
      setSteps(p => p.map((s,idx) => idx===i ? {...s, state:'done'} : s))
    }
    if (runFlag.current) {
      setMk(tspStart, 'start')
      setStatus({ type:'done', text:`Tour complete! ${totD.toFixed(2)} km · ${Math.round(totT)} min` })
      lmap.current?.fitBounds(CAMPUS_LIST.map(c => [c.lat, c.lng]), { padding:[40,40], animate:true })
    }
    setRunning(false); runFlag.current = false
  }

  /* Switch mode — clear everything */
  const switchMode = (m) => {
    runFlag.current = false; clearTimeout(timerRef.current); setRunning(false)
    clearPaths(); resetMkrs(); setP2pResult(null); setSteps([]); setTotals({ dist:0, time:0, stops:0 })
    setStatus({ type:'idle', text:'Select a mode and configure your route' })
    setAppMode(m)
  }

  /* ── RENDER ── */
  return (
    <div className="app">

      {/* HEADER */}
      <header className="hdr">
        <div className="brand">
          <div className="bic">🗺</div>
          <div className="bnm">KIIT <span>Campus Navigator</span></div>
        </div>
        <div className="mode-tabs">
          <button className={`mtab ${appMode==='p2p'?'mtab-on':''}`} onClick={()=>switchMode('p2p')}>
            📍 Point-to-Point
          </button>
          <button className={`mtab ${appMode==='tsp'?'mtab-on':''}`} onClick={()=>switchMode('tsp')}>
            🔄 Full Campus Tour (TSP)
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className="side">
          <div className="sb">

            {/* ── TRAVEL MODE (both modes share this) ── */}
            <div className="pn">
              <div className="plbl">Travel Mode</div>
              <div className="mr">
                <button className={`mb ${mode==='walk'?'mb-w':''}`} onClick={()=>setMode('walk')}>🚶 Walking</button>
                <button className={`mb ${mode==='bike'?'mb-b':''}`} onClick={()=>setMode('bike')}>🚲 Biking</button>
              </div>
            </div>

            {/* ── ALGORITHM (both modes) ── */}
            <div className="pn">
              <div className="plbl">Algorithm</div>
              <div className="al">
                {Object.entries(ALGO_META).map(([key, m]) => (
                  <div key={key} className={`ac ${algo===key?'ac-on':''}`} onClick={()=>setAlgo(key)}>
                    <div className="ab" style={{ color:m.col, borderColor:m.col+'44', background:m.col+'14' }}>{m.label}</div>
                    <div className="ai">
                      <div className="an" style={algo===key?{color:m.col}:{}}>{m.full}</div>
                      <div className="acx">{m.cx}</div>
                    </div>
                  </div>
                ))}
              </div>
              {algo && <div className="adsc">{ALGO_META[algo].desc}</div>}
            </div>

            {/* ══════════════════════════════════
                P2P MODE
            ══════════════════════════════════ */}
            {appMode === 'p2p' && (
              <>
                <div className="pn">
                  <div className="plbl">Route</div>
                  <div className="fld">
                    <div className="flbl"><span className="dot dot-g"/>From</div>
                    <select value={srcId} onChange={e=>setSrcId(e.target.value)}>
                      {CAMPUS_LIST.map(c=><option key={c.id} value={c.id}>{c.id} · {c.name}</option>)}
                    </select>
                  </div>
                  <div className="swap-row">
                    <button className="swap-btn" onClick={()=>{ setSrcId(dstId); setDstId(srcId) }} title="Swap">⇅ Swap</button>
                  </div>
                  <div className="fld">
                    <div className="flbl"><span className="dot dot-r"/>To</div>
                    <select value={dstId} onChange={e=>setDstId(e.target.value)}>
                      {CAMPUS_LIST.map(c=><option key={c.id} value={c.id}>{c.id} · {c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="pn">
                  <button className="run" onClick={findRoute}>🔍 Find Shortest Route</button>
                </div>

                {/* P2P RESULT */}
                {p2pResult && (
                  <div className="pn">
                    <div className="plbl">Result</div>
                    <div className="res-card">
                      <div className="res-stats">
                        <div className="rs"><span className="rn" style={{color: mode==='walk'?'#39e08c':'#ff8040'}}>{p2pResult.dist}</span><span className="rl">km</span></div>
                        <div className="rs"><span className="rn" style={{color: mode==='walk'?'#39e08c':'#ff8040'}}>{p2pResult.time}</span><span className="rl">min</span></div>
                        <div className="rs"><span className="rn">{p2pResult.path.length-1}</span><span className="rl">hops</span></div>
                        <div className="rs"><span className="rn">{p2pResult.explored}</span><span className="rl">explored</span></div>
                      </div>
                      <div className="res-path">
                        {p2pResult.path.map((id,i)=>(
                          <span key={id}>
                            <span className={`chip ${i===0?'chip-s':i===p2pResult.path.length-1?'chip-e':'chip-m'}`}>
                              {id.replace('Campus ','')}
                            </span>
                            {i<p2pResult.path.length-1&&<span className="arr">›</span>}
                          </span>
                        ))}
                      </div>
                      <div className="res-algo" style={{color: ALGO_META[p2pResult.algo]?.col}}>
                        via {ALGO_META[p2pResult.algo]?.full}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ══════════════════════════════════
                TSP MODE
            ══════════════════════════════════ */}
            {appMode === 'tsp' && (
              <>
                <div className="pn">
                  <div className="plbl">Start Campus</div>
                  <div className="fld">
                    <div className="flbl"><span className="dot dot-g"/>Start &amp; Return point</div>
                    <select value={tspStart} onChange={e=>setTspStart(e.target.value)} disabled={running}>
                      {CAMPUS_LIST.map(c=><option key={c.id} value={c.id}>{c.id} · {c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="pn">
                  <div className="sprow">
                    <span className="splb">Animation speed</span>
                    <input type="range" min="1" max="5" value={speed} onChange={e=>setSpeed(+e.target.value)}/>
                    <span className="spvl">{speed}×</span>
                  </div>
                  <button className={`run ${running?'run-s':''}`} onClick={startTour} disabled={false}>
                    {running?'⏹ Stop Tour':'⚡ Start Full Campus Tour'}
                  </button>
                </div>

                {/* TSP STEPS */}
                {steps.length > 0 && (
                  <div className="stps">
                    <div className="stps-h">Tour Progress</div>
                    {steps.map((s,i)=>(
                      <div key={i} className={`stp stp-${s.state}`}
                        ref={el=>{if(s.state==='active'&&el)el.scrollIntoView({behavior:'smooth',block:'nearest'})}}>
                        <div className="snum">{i+1}</div>
                        <div className="stxt">
                          {s.from.replace('Campus ','C')} → {s.to.replace('Campus ','C')}
                          {i===steps.length-1?' ↩':''}
                        </div>
                        <div className="skm">{s.dist?`${s.dist}km`:'—'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

          </div>

          {/* TOTALS (TSP only) */}
          {appMode==='tsp' && totals.stops>0 && (
            <div className="tots">
              <div className="tc"><span className="tn">{totals.dist}</span><span className="tl">km</span></div>
              <div className="tc"><span className="tn grn">{totals.time}</span><span className="tl">min</span></div>
              <div className="tc"><span className="tn org">{totals.stops}</span><span className="tl">stops</span></div>
            </div>
          )}

          {/* STATUS BAR */}
          <div className="stbar">
            <div className={`sd sd-${status.type}`}/>
            <span>{status.text}</span>
          </div>
        </aside>

        <div ref={mapDiv} className="map"/>
      </div>
    </div>
  )
}