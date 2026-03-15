import { useState, useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CAMPUS_LIST, ADJACENCY } from './data/campuses'
import { haversine, bfs, dfs, ucs, greedyBFS, aStar, tspNN } from './algorithms'
import './App.css'

const ALGO_META = {
  bfs:   { label:'BFS',  full:'Breadth-First Search',  cx:'O(V+E)',       col:'#4dabf7', desc:'Explores level-by-level via queue. Finds fewest hops, ignores weights.' },
  dfs:   { label:'DFS',  full:'Depth-First Search',    cx:'O(V+E)',       col:'#be8aff', desc:'Goes deep before backtracking. Not optimal but finds any valid path.' },
  ucs:   { label:'UCS',  full:'Uniform Cost Search',   cx:'O(b^(1+C/ε))',col:'#ffd60a', desc:'Expands lowest-cost node first (Dijkstra). Guarantees optimal path.' },
  gbfs:  { label:'GBFS', full:'Greedy Best-First',     cx:'O(b^m)',       col:'#ff8040', desc:'Uses only heuristic h(n) to pick next node. Fast but not always optimal.' },
  astar: { label:'A★',   full:'A* Search',             cx:'O(E log V)',   col:'#00f0c8', desc:'f(n)=g(n)+h(n). Optimal AND efficient. The best general algorithm.' },
}

const DELAYS = [2200, 1400, 900, 500, 250]

const loadCamps = () => {
  try { const s=localStorage.getItem('kiit_v2'); if(s) return JSON.parse(s); } catch{}
  return CAMPUS_LIST.map(c=>({...c}))
}
const saveCamps = (list) => localStorage.setItem('kiit_v2', JSON.stringify(list))

const mkIcon = (short, variant='default') => {
  const big = variant==='start' || variant==='current'
  const sz = big ? 36 : 30
  return L.divIcon({
    className: '',
    html: `<div class="mk mk-${variant}">${short}</div>`,
    iconSize: [sz,sz], iconAnchor: [sz/2,sz/2]
  })
}

export default function App() {
  const mapDiv    = useRef(null)
  const lmap      = useRef(null)
  const mkrs      = useRef({})
  const pathLyrs  = useRef([])
  const timerRef  = useRef(null)
  const runFlag   = useRef(false)

  const [camps,    setCamps]    = useState(loadCamps)
  const [mode,     setMode]     = useState('walk')
  const [algo,     setAlgo]     = useState('bfs')
  const [startId,  setStartId]  = useState('Campus 1')
  const [running,  setRunning]  = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editTgt,  setEditTgt]  = useState(null)
  const [steps,    setSteps]    = useState([])
  const [totals,   setTotals]   = useState({dist:0,time:0,stops:0})
  const [status,   setStatus]   = useState({type:'idle',text:'Ready — select start campus and hit Start TSP Tour'})
  const [speed,    setSpeed]    = useState(3)

  const cmap = Object.fromEntries(camps.map(c=>[c.id,c]))
  const wFn  = useCallback((a,b)=>haversine(cmap[a],cmap[b]),[cmap])
  const hFn  = useCallback((a,b)=>haversine(cmap[a],cmap[b]),[cmap])

  // Init map
  useEffect(()=>{
    if(lmap.current) return
    lmap.current = L.map(mapDiv.current,{zoomControl:true}).setView([20.3520,85.8170],16)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
      attribution:'© OpenStreetMap contributors', maxZoom:19
    }).addTo(lmap.current)
    return ()=>{ lmap.current?.remove(); lmap.current=null }
  },[])

  // Markers
  useEffect(()=>{
    if(!lmap.current) return
    Object.values(mkrs.current).forEach(m=>m.remove())
    mkrs.current={}
    camps.forEach(c=>{
      const m=L.marker([c.lat,c.lng],{icon:mkIcon(c.short,'default')})
        .addTo(lmap.current)
        .bindPopup(`<div class="pi"><b class="pid">${c.id}</b><div class="pnm">${c.name}</div><div class="pco">${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}</div>${editMode?'<div class="ped">Click map to reposition this pin</div>':''}</div>`,{maxWidth:240})
      if(editMode) m.on('click',()=>{ setEditTgt(c.id); setStatus({type:'edit',text:`Click the correct location for ${c.id} on the map`}) })
      mkrs.current[c.id]=m
    })
    lmap.current.fitBounds(camps.map(c=>[c.lat,c.lng]),{padding:[30,30]})
  },[camps,editMode])

  // Edit click
  useEffect(()=>{
    if(!lmap.current) return
    const h=(e)=>{
      if(!editMode||!editTgt) return
      const {lat,lng}=e.latlng
      setCamps(prev=>{ const u=prev.map(c=>c.id===editTgt?{...c,lat,lng}:c); saveCamps(u); return u })
      setEditTgt(null)
      setStatus({type:'edit',text:'Pin moved ✓  Click another pin to fix it'})
    }
    lmap.current.on('click',h)
    return ()=>lmap.current?.off('click',h)
  },[editMode,editTgt])

  const clearPaths = ()=>{ pathLyrs.current.forEach(l=>l.remove()); pathLyrs.current=[] }
  const resetMkrs  = ()=>camps.forEach(c=>mkrs.current[c.id]?.setIcon(mkIcon(c.short,'default')))
  const setMk      = (id,v)=>{ const c=cmap[id]; if(c&&mkrs.current[id]) mkrs.current[id].setIcon(mkIcon(c.short,v)) }

  const drawGlow = (coords)=>{
    const isW=mode==='walk', col=isW?'#39e08c':'#ff8040', glo=isW?'rgba(57,224,140,.18)':'rgba(255,128,64,.18)'
    const o=L.polyline(coords,{color:glo, weight:28,opacity:1,lineCap:'round'}).addTo(lmap.current)
    const l=L.polyline(coords,{color:col,weight:4.5,opacity:1,lineCap:'round',dashArray:isW?null:'10 5'}).addTo(lmap.current)
    if(coords.length>=2){
      const mid=[(coords[0][0]+coords[coords.length-1][0])/2,(coords[0][1]+coords[coords.length-1][1])/2]
      const ang=Math.atan2(coords[coords.length-1][0]-coords[0][0],coords[coords.length-1][1]-coords[0][1])*180/Math.PI
      const a=L.marker(mid,{icon:L.divIcon({className:'',html:`<div style="color:${col};font-size:13px;transform:rotate(${ang}deg);filter:drop-shadow(0 0 4px ${col})">➤</div>`,iconSize:[13,13],iconAnchor:[6,6]}),interactive:false}).addTo(lmap.current)
      pathLyrs.current.push(a)
    }
    pathLyrs.current.push(o,l)
  }

  const runAlgo = useCallback((from,to)=>{
    if(from===to) return {path:[from],explored:0}
    if(algo==='bfs')   return bfs(from,to,ADJACENCY)
    if(algo==='dfs')   return dfs(from,to,ADJACENCY)
    if(algo==='ucs')   return ucs(from,to,ADJACENCY,wFn)
    if(algo==='gbfs')  return greedyBFS(from,to,ADJACENCY,hFn)
    if(algo==='astar') return aStar(from,to,ADJACENCY,wFn,hFn)
    return bfs(from,to,ADJACENCY)
  },[algo,wFn,hFn])

  const sleep=(ms)=>new Promise(r=>{ timerRef.current=setTimeout(r,ms) })

  const startTour = async()=>{
    if(running){
      runFlag.current=false
      setRunning(false)
      clearTimeout(timerRef.current)
      setStatus({type:'idle',text:'Tour stopped.'})
      return
    }
    runFlag.current=true
    setRunning(true)
    clearPaths()
    resetMkrs()

    const tour=tspNN(startId,camps)
    const total=tour.length-1
    setSteps(tour.slice(0,-1).map((from,i)=>({from,to:tour[i+1],dist:null,state:'pending'})))
    setTotals({dist:0,time:0,stops:total})
    setStatus({type:'running',text:`Building tour from ${startId}…`})
    setMk(startId,'start')

    let totD=0, totT=0

    for(let i=0;i<tour.length-1;i++){
      if(!runFlag.current) break
      const from=tour[i], to=tour[i+1]
      setSteps(p=>p.map((s,idx)=>idx===i?{...s,state:'active'}:s))
      if(i>0) setMk(from,'visited')
      setMk(to,'current')
      setStatus({type:'running',text:`Step ${i+1}/${total}: ${from} → ${to}`})

      const {path}=runAlgo(from,to)
      const ap=path||[from,to]
      let segD=0,segT=0
      for(let j=0;j<ap.length-1;j++){
        const d=haversine(cmap[ap[j]],cmap[ap[j+1]])
        segD+=d; segT+=mode==='walk'?(d/5)*60:(d/15)*60
      }
      totD+=segD; totT+=segT
      setTotals({dist:totD.toFixed(2),time:Math.round(totT),stops:total})
      setSteps(p=>p.map((s,idx)=>idx===i?{...s,dist:segD.toFixed(2),state:'active'}:s))
      drawGlow(ap.map(id=>[cmap[id].lat,cmap[id].lng]))
      lmap.current?.panTo([cmap[to].lat,cmap[to].lng],{animate:true,duration:0.5})
      await sleep(DELAYS[speed-1])
      if(!runFlag.current) break
      setSteps(p=>p.map((s,idx)=>idx===i?{...s,state:'done'}:s))
    }

    if(runFlag.current){
      setMk(startId,'start')
      setStatus({type:'done',text:`Tour complete! ${totD.toFixed(2)} km · ${Math.round(totT)} min`})
      lmap.current?.fitBounds(camps.map(c=>[c.lat,c.lng]),{padding:[40,40],animate:true})
    }
    setRunning(false)
    runFlag.current=false
  }

  const exportCoords=()=>{
    const blob=new Blob([JSON.stringify(camps.map(c=>({id:c.id,lat:c.lat,lng:c.lng,short:c.short,name:c.name})),null,2)],{type:'application/json'})
    const url=URL.createObjectURL(blob); const a=document.createElement('a')
    a.href=url; a.download='kiit_coords.json'; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="app">
      <header className="hdr">
        <div className="brand">
          <div className="bic">🗺</div>
          <div className="bnm">KIIT <span>Campus Navigator</span></div>
        </div>
        <div className="hdr-r">
          {editMode && <button className="bsm b-exp" onClick={exportCoords}>⬇ Export Coords</button>}
          {editMode && <button className="bsm b-rst" onClick={()=>{ localStorage.removeItem('kiit_v2'); setCamps(CAMPUS_LIST.map(c=>({...c})))}}>↺ Reset</button>}
          <button className={`bsm ${editMode?'b-edon':'b-edoff'}`} onClick={()=>{setEditMode(!editMode);setEditTgt(null)}}>
            {editMode?'✓ Done Editing':'✏ Fix Campus Locations'}
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className="side">
          <div className="sb">

            {editMode&&(
              <div className="edbr">
                <div className="ebt">📍 Edit Mode Active</div>
                <div className="ebb">{editTgt?`Click the correct spot for ${editTgt}`:'Click any campus pin → then click its real location on the map'}</div>
              </div>
            )}

            <div className="pn">
              <div className="plbl">Start Campus</div>
              <select value={startId} onChange={e=>setStartId(e.target.value)} disabled={running}>
                {camps.map(c=><option key={c.id} value={c.id}>{c.id} · {c.name}</option>)}
              </select>
            </div>

            <div className="pn">
              <div className="plbl">Travel Mode</div>
              <div className="mr">
                <button className={`mb ${mode==='walk'?'mb-w':''}`} onClick={()=>setMode('walk')}>🚶 Walking</button>
                <button className={`mb ${mode==='bike'?'mb-b':''}`} onClick={()=>setMode('bike')}>🚲 Biking</button>
              </div>
            </div>

            <div className="pn">
              <div className="plbl">Algorithm</div>
              <div className="al">
                {Object.entries(ALGO_META).map(([key,m])=>(
                  <div key={key} className={`ac ${algo===key?'ac-on':''}`} onClick={()=>setAlgo(key)}>
                    <div className="ab" style={{color:m.col,borderColor:m.col+'44',background:m.col+'14'}}>{m.label}</div>
                    <div className="ai">
                      <div className="an" style={algo===key?{color:m.col}:{}}>{m.full}</div>
                      <div className="acx">{m.cx}</div>
                    </div>
                  </div>
                ))}
              </div>
              {algo&&<div className="adsc">{ALGO_META[algo].desc}</div>}
            </div>

            <div className="pn">
              <div className="sprow">
                <span className="splb">Speed</span>
                <input type="range" min="1" max="5" value={speed} onChange={e=>setSpeed(+e.target.value)}/>
                <span className="spvl">{speed}×</span>
              </div>
              <button className={`run ${running?'run-s':''}`} onClick={startTour} disabled={editMode}>
                {running?'⏹ Stop Tour':'⚡ Start TSP Tour'}
              </button>
            </div>

            {steps.length>0&&(
              <div className="stps">
                <div className="stps-h">Tour Progress</div>
                {steps.map((s,i)=>(
                  <div key={i} className={`stp stp-${s.state}`}
                    ref={el=>{if(s.state==='active'&&el)el.scrollIntoView({behavior:'smooth',block:'nearest'})}}>
                    <div className="snum">{i+1}</div>
                    <div className="stxt">{s.from.replace('Campus ','C')} → {s.to.replace('Campus ','C')}{i===steps.length-1?' ↩':''}</div>
                    <div className="skm">{s.dist?`${s.dist}km`:'—'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {totals.stops>0&&(
            <div className="tots">
              <div className="tc"><span className="tn">{totals.dist}</span><span className="tl">km</span></div>
              <div className="tc"><span className="tn grn">{totals.time}</span><span className="tl">min</span></div>
              <div className="tc"><span className="tn org">{totals.stops}</span><span className="tl">stops</span></div>
            </div>
          )}

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