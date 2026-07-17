/* Shared, dependency-free itinerary rules. Kept separately so backup data and
   the UI use exactly the same ordering and distance behaviour. */
(function(root){
  const validTime=value=>typeof value==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(value.trim());
  const stableTimeSort=stops=>stops.map((stop,index)=>({stop,index})).sort((a,b)=>{
    const at=validTime(String(a.stop.time||'')),bt=validTime(String(b.stop.time||''));
    if(at&&bt){const diff=a.stop.time.localeCompare(b.stop.time);return diff||a.index-b.index;}
    if(at)return -1;if(bt)return 1;return a.index-b.index;
  }).map(item=>item.stop);
  const hasCoord=stop=>stop&&stop.lat!==''&&stop.lat!==null&&stop.lat!==undefined&&stop.lng!==''&&stop.lng!==null&&stop.lng!==undefined&&Number.isFinite(Number(stop.lat))&&Number.isFinite(Number(stop.lng))&&Number(stop.lat)>=-90&&Number(stop.lat)<=90&&Number(stop.lng)>=-180&&Number(stop.lng)<=180;
  const haversineKm=(a,b)=>{if(!hasCoord(a)||!hasCoord(b))return null;const r=Math.PI/180,lat1=Number(a.lat)*r,lat2=Number(b.lat)*r,dlat=lat2-lat1,dlng=(Number(b.lng)-Number(a.lng))*r;const h=Math.sin(dlat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dlng/2)**2;return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));};
  const formatDistance=km=>km===null||!Number.isFinite(km)?'尚未取得地點位置':km<1?`${Math.round(km*1000)} 公尺`:`${km.toFixed(1)} 公里`;
  const api={validTime,stableTimeSort,hasCoord,haversineKm,formatDistance};
  root.ItineraryCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
