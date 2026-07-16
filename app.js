const ICONS={接送:'🚐',飯店:'🏨',餐飲:'🍽️',親子:'🧒',休息:'🛏️',景點:'📍',地鐵:'🚇',轉乘:'↔️',JR:'🚆',交通:'🚌',購物:'🛍️',拍照:'📸',包車:'🚐',機場:'✈️',航班:'🛫',備案:'☂️'};
const PROGRESS_KEY='tino-fukuoka-trip-progress-v2';
const ITINERARY_KEY='tino-fukuoka-trip-itinerary-v1';
const CURRENT_DAY_KEY='tino-fukuoka-current-day';
const EDIT_KEY='tino-fukuoka-edit-mode';
const TRAVEL_MODE={接送:'driving',包車:'driving',地鐵:'transit',JR:'transit',轉乘:'transit',交通:'transit'};
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const num=value=>Number.isFinite(Number(value))?Number(value):0;
const clone=value=>JSON.parse(JSON.stringify(value));
const searchUrl=stop=>`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.name||`${stop.lat},${stop.lng}`)}`;
const routeUrl=(from,to)=>`https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}&travelmode=${TRAVEL_MODE[to.type]||'walking'}`;
const dayRouteUrl=day=>day?.stops?.length?`https://www.google.com/maps/dir/?api=1&origin=${day.stops[0].lat},${day.stops[0].lng}&destination=${day.stops.at(-1).lat},${day.stops.at(-1).lng}&waypoints=${day.stops.slice(1,-1).map(s=>`${s.lat},${s.lng}`).join('%7C')}&travelmode=transit`:'https://www.google.com/maps';
const key=(_dayId,stopId)=>String(stopId);
let itinerary=loadItinerary();
let currentDay=validDayId(Number(localStorage.getItem(CURRENT_DAY_KEY)))||itinerary[0]?.id||1;
let editMode=localStorage.getItem(EDIT_KEY)==='true';
let map=null,markers=[],routeLine=null,deferredPrompt=null;
let completed=safeJson(localStorage.getItem(PROGRESS_KEY),{});

function safeJson(text,fallback){try{return JSON.parse(text)||fallback;}catch{return fallback;}}
function normalize(raw){return raw.map((day,di)=>{const dayId=Number(day.id)||di+1;return {id:dayId,date:String(day.date||''),title:String(day.title||`Day ${di+1}`),theme:String(day.theme||''),area:String(day.area||''),center:Array.isArray(day.center)?[num(day.center[0]),num(day.center[1])]:[33.5902,130.4017],stops:(day.stops||[]).map((s,si)=>({id:String(s.id||`d${dayId}-s${si+1}`),time:String(s.time||''),name:String(s.name||'未命名景點'),type:String(s.type||'景點'),lat:num(s.lat),lng:num(s.lng),note:String(s.note||''),transport:String(s.transport||''),duration:String(s.duration||''),elder:String(s.elder||''),kid:String(s.kid||''),backup:String(s.backup||'')}))};});}
function validateItinerary(value){if(!Array.isArray(value)||!value.length)return 'JSON 必須是至少一天的陣列。';for(const [di,day]of value.entries()){if(typeof day!=='object'||!day)return `第 ${di+1} 天格式錯誤。`;if(!Array.isArray(day.stops))return `第 ${di+1} 天缺少 stops 陣列。`;for(const [si,stop]of day.stops.entries()){if(typeof stop!=='object'||!stop)return `第 ${di+1} 天第 ${si+1} 站格式錯誤。`;if(!Number.isFinite(Number(stop.lat))||!Number.isFinite(Number(stop.lng)))return `第 ${di+1} 天第 ${si+1} 站經緯度必須是數字。`;}}return '';}
function loadItinerary(){const saved=safeJson(localStorage.getItem(ITINERARY_KEY),null);const err=saved&&validateItinerary(saved);return normalize(!saved||err?clone(window.DEFAULT_ITINERARY):saved);}
function saveItinerary(){localStorage.setItem(ITINERARY_KEY,JSON.stringify(itinerary));}
function validDayId(id){return itinerary.some(day=>day.id===id)?id:null;}
function current(){return itinerary.find(day=>day.id===currentDay)||itinerary[0];}

function renderTabs(){
  $('dayTabs').innerHTML=itinerary.map((day,index)=>`<button class="day-tab ${day.id===currentDay?'active':''}" data-day="${day.id}"><b>Day ${index+1}</b><small>${esc((day.date||'').split(' ')[0])}</small></button>`).join('')+(editMode?'<button class="day-tab add-day" id="addDay">＋新增</button>':'');
  document.querySelectorAll('.day-tab[data-day]').forEach(button=>button.addEventListener('click',()=>selectDay(Number(button.dataset.day))));
  $('addDay')?.addEventListener('click',addDay);
  requestAnimationFrame(()=>document.querySelector('.day-tab.active')?.scrollIntoView({inline:'center',block:'nearest'}));
}
function renderDay(){
  const day=current(); if(!day)return;
  const dayNo=itinerary.indexOf(day)+1;
  const done=day.stops.filter(s=>completed[key(day.id,s.id)]).length;
  const pct=day.stops.length?Math.round(done/day.stops.length*100):0;
  $('daySummary').innerHTML=`<article class="summary-card"><div class="summary-top"><div><p class="date-line">${esc(day.date)} · DAY ${dayNo}${day.area?` · ${esc(day.area)}`:''}</p><h2>${esc(day.title)}</h2></div><div class="progress-ring" style="--progress:${pct}%"><b>${pct}%</b></div></div><p class="theme">${esc(day.theme)}</p><div class="summary-tags"><span>📍 ${day.stops.length} 站</span><span>♿ 長輩可休</span><span>👶 推車優先</span><span>☂ 雨天可刪減</span></div>${editMode?dayEditor(day):''}</article>`;
  $('timeline').innerHTML=day.stops.map((stop,index)=>stopCard(day,stop,index)).join('')||(editMode?'<p class="empty-state">目前沒有景點，請新增第一站。</p>':'');
  bindScheduleEvents(day);
  $('openDayMap').href=dayRouteUrl(day); updateMap(day);
}
function dayEditor(day){return `<div class="editor-panel day-editor"><label>日期<input data-day-field="date" value="${esc(day.date)}"></label><label>每日主題<input data-day-field="title" value="${esc(day.title)}"></label><label>區域<input data-day-field="area" value="${esc(day.area)}"></label><label class="wide">說明<textarea data-day-field="theme">${esc(day.theme)}</textarea></label><div class="edit-actions"><button class="edit-btn primary" id="addStop">＋新增景點</button><button class="edit-btn danger" id="deleteDay">刪除本日</button></div></div>`;}
function stopCard(day,stop,index){const isDone=Boolean(completed[key(day.id,stop.id)]),prior=day.stops[index-1];return `<article class="stop-card ${isDone?'done':''}" data-index="${index}"><div class="stop-icon">${ICONS[stop.type]||'•'}</div><div class="stop-header"><div><div class="stop-time">${esc(stop.time)} <span class="stop-type">｜${esc(stop.type)}</span></div><h3 class="stop-name">${esc(stop.name)}</h3></div><button class="complete" data-complete="${stop.id}" aria-label="${isDone?'取消完成':'標記完成'}">✓</button></div><p class="stop-note">${esc(stop.note)}</p>${index?`<div class="travel-note">${TRAVEL_MODE[stop.type]==='transit'?'🚇':TRAVEL_MODE[stop.type]==='driving'?'🚐':'🚶'} ${esc(stop.transport||'從上一站前往')} ${stop.duration?`· ${esc(stop.duration)}`:'· 依現場班次與體力調整'}</div>`:''}<div class="badges"><span class="badge elder">長輩｜${esc(stop.elder)}</span><span class="badge kid">嘟嘟｜${esc(stop.kid)}</span>${stop.backup?`<span class="badge backup">備案｜${esc(stop.backup)}</span>`:''}</div><div class="actions"><a class="action map" href="${searchUrl(stop)}" target="_blank" rel="noopener">📍 查看地點</a>${prior?`<a class="action route" href="${routeUrl(prior,stop)}" target="_blank" rel="noopener">🧭 從上一站導航</a>`:''}</div>${editMode?stopEditor(stop,index,day.stops.length):''}</article>`;}
function stopEditor(stop,index,total){const input=(f,label,type='text')=>`<label>${label}<input ${type==='number'?'inputmode="decimal"':''} data-stop-field="${f}" value="${esc(stop[f])}"></label>`;return `<div class="editor-panel stop-editor">${input('time','時間')}${input('name','名稱')}<label>類型<input list="typeList" data-stop-field="type" value="${esc(stop.type)}"></label>${input('transport','交通方式')}${input('duration','移動時間')}${input('lat','緯度','number')}${input('lng','經度','number')}<label class="wide">說明<textarea data-stop-field="note">${esc(stop.note)}</textarea></label><label>長輩提醒<input data-stop-field="elder" value="${esc(stop.elder)}"></label><label>幼兒提醒<input data-stop-field="kid" value="${esc(stop.kid)}"></label><label class="wide">備案<input data-stop-field="backup" value="${esc(stop.backup)}"></label><div class="edit-actions"><button class="edit-btn" data-move="up" ${index===0?'disabled':''}>↑ 上移</button><button class="edit-btn" data-move="down" ${index===total-1?'disabled':''}>↓ 下移</button><button class="edit-btn danger" data-delete-stop>刪除</button></div></div>`;}
function bindScheduleEvents(day){document.querySelectorAll('[data-complete]').forEach(b=>b.addEventListener('click',()=>toggleComplete(day.id,b.dataset.complete)));if(!editMode)return;document.querySelectorAll('[data-day-field]').forEach(el=>el.addEventListener('input',()=>{day[el.dataset.dayField]=el.value;saveItinerary();renderTabs();updateMap(day);}));$('addStop')?.addEventListener('click',()=>{day.stops.push({id:globalThis.crypto?.randomUUID?.()||String(Date.now()),time:'',name:'新景點',type:'景點',lat:day.center[0],lng:day.center[1],note:'',transport:'',duration:'',elder:'',kid:'',backup:''});saveItinerary();renderDay();});$('deleteDay')?.addEventListener('click',deleteDay);document.querySelectorAll('.stop-card').forEach(card=>{const stop=day.stops[Number(card.dataset.index)];card.querySelectorAll('[data-stop-field]').forEach(el=>el.addEventListener('change',()=>{stop[el.dataset.stopField]=['lat','lng'].includes(el.dataset.stopField)?num(el.value):el.value;saveItinerary();renderDay();}));card.querySelector('[data-delete-stop]')?.addEventListener('click',()=>{if(confirm('刪除此景點？')){day.stops.splice(Number(card.dataset.index),1);saveItinerary();renderDay();}});card.querySelectorAll('[data-move]').forEach(b=>b.addEventListener('click',()=>moveStop(Number(card.dataset.index),b.dataset.move)));});}
function selectDay(id){currentDay=id;localStorage.setItem(CURRENT_DAY_KEY,String(id));renderTabs();renderDay();window.scrollTo({top:0,behavior:'smooth'});}
function toggleComplete(dayId,stopId){const item=key(dayId,stopId);completed[item]=!completed[item];if(!completed[item])delete completed[item];localStorage.setItem(PROGRESS_KEY,JSON.stringify(completed));renderDay();}
function addDay(){const id=Math.max(0,...itinerary.map(day=>Number(day.id)||0))+1;itinerary.push({id,date:'新日期',title:'新行程日',theme:'請輸入今日主題。',area:'',center:[33.5902,130.4017],stops:[]});currentDay=id;saveItinerary();renderTabs();renderDay();}
function deleteDay(){if(itinerary.length<=1)return alert('至少需保留一天。');if(confirm('刪除本日與所有景點？')){const deleteIndex=itinerary.findIndex(d=>d.id===currentDay);itinerary=itinerary.filter(d=>d.id!==currentDay);currentDay=itinerary[Math.max(0,deleteIndex-1)]?.id||itinerary[0].id;saveItinerary();renderTabs();renderDay();}}
function moveStop(index,dir){const day=current(),to=dir==='up'?index-1:index+1;if(to<0||to>=day.stops.length)return;[day.stops[index],day.stops[to]]=[day.stops[to],day.stops[index]];saveItinerary();renderDay();}
function setEditMode(on){editMode=on;localStorage.setItem(EDIT_KEY,String(on));document.body.classList.toggle('edit-mode',on);$('editToggle').textContent=on?'完成編輯':'編輯模式';renderTabs();renderDay();}
function exportJson(){const blob=new Blob([JSON.stringify(itinerary,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='fukuoka-itinerary.json';a.click();URL.revokeObjectURL(url);}
function importJson(file){if(!file)return;const reader=new FileReader();reader.onload=()=>{const data=safeJson(reader.result,null),err=data?validateItinerary(data):'JSON 解析失敗。';if(err)return alert(`匯入失敗：${err}`);itinerary=normalize(data);currentDay=itinerary[0].id;saveItinerary();renderTabs();renderDay();alert('匯入完成，行程內容已儲存。');};reader.readAsText(file);}
function restoreDefault(){if(confirm('恢復原始福岡行程？完成勾選紀錄不會被清除。')){itinerary=normalize(clone(window.DEFAULT_ITINERARY));currentDay=1;saveItinerary();renderTabs();renderDay();}}
function initMap(){if(!window.L){$('mapFallback').hidden=false;return;}map=L.map('map',{zoomControl:false}).setView([33.5902,130.4017],13);L.control.zoom({position:'bottomright'}).addTo(map);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);}
function updateMap(day){if(!map)return;markers.forEach(m=>map.removeLayer(m));markers=[];if(routeLine)map.removeLayer(routeLine);const points=day.stops.filter(s=>Number.isFinite(s.lat)&&Number.isFinite(s.lng)).map((stop,index)=>{const icon=L.divIcon({className:'',html:`<div class="number-marker">${index+1}</div>`,iconSize:[30,30],iconAnchor:[15,15]});markers.push(L.marker([stop.lat,stop.lng],{icon}).addTo(map).bindPopup(`<strong>${esc(stop.time)}｜${esc(stop.name)}</strong><br>${esc(stop.note)}`));return [stop.lat,stop.lng];});if(points.length){routeLine=L.polyline(points,{color:'#2f75df',weight:4,dashArray:'7 9',opacity:.8}).addTo(map);fitMap(day);} }
function fitMap(day=current()){if(map&&day?.stops?.length)setTimeout(()=>{map.invalidateSize();map.fitBounds(L.latLngBounds(day.stops.map(s=>[s.lat,s.lng])).pad(.14));},80);}

document.querySelectorAll('.nav-item').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('.nav-item').forEach(item=>item.classList.toggle('active',item===button));document.querySelectorAll('.view').forEach(view=>view.classList.toggle('active',view.id===button.dataset.view));if(button.dataset.view==='mapView')fitMap();window.scrollTo({top:0,behavior:'smooth'});}));
$('fitMap').addEventListener('click',()=>fitMap());
$('resetProgress').addEventListener('click',()=>{if(confirm('確定清除所有行程完成紀錄？')){completed={};localStorage.removeItem(PROGRESS_KEY);renderDay();}});
$('editToggle').addEventListener('click',()=>setEditMode(!editMode));
$('exportJson').addEventListener('click',exportJson);
$('importJson').addEventListener('click',()=>$('importFile').click());
$('importFile').addEventListener('change',event=>{importJson(event.target.files[0]);event.target.value='';});
$('restoreDefault').addEventListener('click',restoreDefault);
addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredPrompt=event;$('installBtn').hidden=false;});
$('installBtn').addEventListener('click',async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$('installBtn').hidden=true;});
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'));
document.body.insertAdjacentHTML('beforeend','<datalist id="typeList"><option value="接送"><option value="飯店"><option value="餐飲"><option value="親子"><option value="休息"><option value="景點"><option value="地鐵"><option value="轉乘"><option value="JR"><option value="交通"><option value="購物"><option value="拍照"><option value="包車"><option value="機場"><option value="航班"><option value="備案"></datalist>');
document.body.classList.toggle('edit-mode',editMode);initMap();renderTabs();renderDay();setEditMode(editMode);
