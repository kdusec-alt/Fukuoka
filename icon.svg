const ICONS={接送:'🚐',飯店:'🏨',餐飲:'🍽️',親子:'🧒',休息:'🛏️',景點:'📍',地鐵:'🚇',轉乘:'↔️',JR:'🚆',交通:'🚌',購物:'🛍️',拍照:'📸',包車:'🚐',機場:'✈️',航班:'🛫'};
const STORAGE_KEY='tino-fukuoka-trip-progress-v2';
const TRAVEL_MODE={接送:'driving',包車:'driving',地鐵:'transit',JR:'transit',轉乘:'transit',交通:'transit'};
let currentDay=Number(localStorage.getItem('tino-fukuoka-current-day'))||1;
let map=null,markers=[],routeLine=null,deferredPrompt=null;
let completed=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');

const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const searchUrl=stop=>`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.name)}`;
const routeUrl=(from,to)=>`https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}&travelmode=${TRAVEL_MODE[to.type]||'walking'}`;
const dayRouteUrl=day=>`https://www.google.com/maps/dir/?api=1&origin=${day.stops[0].lat},${day.stops[0].lng}&destination=${day.stops.at(-1).lat},${day.stops.at(-1).lng}&waypoints=${day.stops.slice(1,-1).map(s=>`${s.lat},${s.lng}`).join('%7C')}&travelmode=transit`;
const key=(dayId,index)=>`${dayId}-${index}`;

function renderTabs(){
  $('dayTabs').innerHTML=ITINERARY.map(day=>`<button class="day-tab ${day.id===currentDay?'active':''}" data-day="${day.id}"><b>Day ${day.id}</b><small>${esc(day.date.split(' ')[0])}</small></button>`).join('');
  document.querySelectorAll('.day-tab').forEach(button=>button.addEventListener('click',()=>selectDay(Number(button.dataset.day))));
  requestAnimationFrame(()=>document.querySelector('.day-tab.active')?.scrollIntoView({inline:'center',block:'nearest'}));
}

function renderDay(){
  const day=ITINERARY.find(item=>item.id===currentDay);
  const done=day.stops.filter((_,i)=>completed[key(day.id,i)]).length;
  const pct=Math.round(done/day.stops.length*100);
  $('daySummary').innerHTML=`<article class="summary-card"><div class="summary-top"><div><p class="date-line">${esc(day.date)} · DAY ${day.id}</p><h2>${esc(day.title)}</h2></div><div class="progress-ring" style="--progress:${pct}%"><b>${pct}%</b></div></div><p class="theme">${esc(day.theme)}</p><div class="summary-tags"><span>📍 ${day.stops.length} 站</span><span>♿ 長輩可休</span><span>👶 推車優先</span><span>☂ 雨天可刪減</span></div></article>`;
  $('timeline').innerHTML=day.stops.map((stop,index)=>{
    const isDone=Boolean(completed[key(day.id,index)]);
    const prior=day.stops[index-1];
    return `<article class="stop-card ${isDone?'done':''}" data-index="${index}"><div class="stop-icon">${ICONS[stop.type]||'•'}</div><div class="stop-header"><div><div class="stop-time">${esc(stop.time)} <span class="stop-type">｜${esc(stop.type)}</span></div><h3 class="stop-name">${esc(stop.name)}</h3></div><button class="complete" data-complete="${index}" aria-label="${isDone?'取消完成':'標記完成'}">✓</button></div><p class="stop-note">${esc(stop.note)}</p>${index?`<div class="travel-note">${TRAVEL_MODE[stop.type]==='transit'?'🚇':TRAVEL_MODE[stop.type]==='driving'?'🚐':'🚶'} 從上一站前往 · 依現場班次與體力調整</div>`:''}<div class="badges"><span class="badge elder">長輩｜${esc(stop.elder)}</span><span class="badge kid">嘟嘟｜${esc(stop.kid)}</span></div><div class="actions"><a class="action map" href="${searchUrl(stop)}" target="_blank" rel="noopener">📍 查看地點</a>${prior?`<a class="action route" href="${routeUrl(prior,stop)}" target="_blank" rel="noopener">🧭 從上一站導航</a>`:''}</div></article>`;
  }).join('');
  document.querySelectorAll('[data-complete]').forEach(button=>button.addEventListener('click',()=>toggleComplete(day.id,Number(button.dataset.complete))));
  $('openDayMap').href=dayRouteUrl(day);
  updateMap(day);
}

function selectDay(id){currentDay=id;localStorage.setItem('tino-fukuoka-current-day',String(id));renderTabs();renderDay();window.scrollTo({top:0,behavior:'smooth'});}
function toggleComplete(dayId,index){const item=key(dayId,index);completed[item]=!completed[item];if(!completed[item])delete completed[item];localStorage.setItem(STORAGE_KEY,JSON.stringify(completed));renderDay();}

function initMap(){
  if(!window.L){$('mapFallback').hidden=false;return;}
  map=L.map('map',{zoomControl:false}).setView([33.5902,130.4017],13);
  L.control.zoom({position:'bottomright'}).addTo(map);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);
}
function updateMap(day){
  if(!map)return;
  markers.forEach(marker=>map.removeLayer(marker));markers=[];if(routeLine)map.removeLayer(routeLine);
  const points=day.stops.map((stop,index)=>{
    const icon=L.divIcon({className:'',html:`<div class="number-marker">${index+1}</div>`,iconSize:[30,30],iconAnchor:[15,15]});
    markers.push(L.marker([stop.lat,stop.lng],{icon}).addTo(map).bindPopup(`<strong>${esc(stop.time)}｜${esc(stop.name)}</strong><br>${esc(stop.note)}`));
    return [stop.lat,stop.lng];
  });
  routeLine=L.polyline(points,{color:'#2f75df',weight:4,dashArray:'7 9',opacity:.8}).addTo(map);
  fitMap(day);
}
function fitMap(day=ITINERARY.find(item=>item.id===currentDay)){if(map)setTimeout(()=>{map.invalidateSize();map.fitBounds(L.latLngBounds(day.stops.map(s=>[s.lat,s.lng])).pad(.14));},80);}

document.querySelectorAll('.nav-item').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('.nav-item').forEach(item=>item.classList.toggle('active',item===button));
  document.querySelectorAll('.view').forEach(view=>view.classList.toggle('active',view.id===button.dataset.view));
  if(button.dataset.view==='mapView')fitMap();
  window.scrollTo({top:0,behavior:'smooth'});
}));
$('fitMap').addEventListener('click',()=>fitMap());
$('resetProgress').addEventListener('click',()=>{if(confirm('確定清除所有行程完成紀錄？')){completed={};localStorage.removeItem(STORAGE_KEY);renderDay();}});
addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredPrompt=event;$('installBtn').hidden=false;});
$('installBtn').addEventListener('click',async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$('installBtn').hidden=true;});
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'));
initMap();renderTabs();renderDay();
