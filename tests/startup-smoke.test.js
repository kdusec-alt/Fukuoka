const assert=require('assert');
const fs=require('fs');

const html=fs.readFileSync('index.html','utf8');
const app=fs.readFileSync('app.js','utf8');
const styles=fs.readFileSync('styles.css','utf8');
const fixedDomIds=[
  'appStatus','brandLine','hero','heroTitle','heroSubtitle','tripFacts','tripSelect','dayTabs',
  'homePanel','daySummary','timeline','openDayMap','fitMap','mapDayTabs','mapStatus','mapFallback',
  'settingsPanel','importFile','restoreFile','coverPhotoInput','editToggle','installBtn','newTrip','copyTrip',
  'stopSheet','stopForm','moreSettings','moreFields','targetDaySelect','mapParseStatus','mapUrlInput',
  'googlePlaceSearch','sheetTitle','parseMapLink','snackbar','placeResults',
  'placeSearchStatus','retryPlaceSearch','placeSearchInput','tripWizard',
  'tripWizardForm','wizardProgress','wizardBack','wizardNext','wizardCreate',
  'restoreSheet','restorePreview','mergeRestore','replaceRestore'
];
const generatedDomIds=[
  'addDay','addStop','autoSort','backupAll','copyDay','dayDown','dayUp',
  'deleteDay','deleteTrip','exportTrip','importTrip','quickAddStop',
  'resetProgress','restoreDefault','undoDelete','backupAll','dayWeather',
  'refreshWeather','chooseCoverPhoto','removeCoverPhoto','quickBackup','restoreBackup','shareDay'
];
const appDomIds=[...new Set([...app.matchAll(/\$\('([^']+)'\)/g)].map(match=>match[1]))];

for(const id of appDomIds){
  assert.ok(
    fixedDomIds.includes(id)||generatedDomIds.includes(id),
    `classify every fixed or generated app DOM id: ${id}`
  );
}
for(const id of fixedDomIds){
  assert.match(html,new RegExp(`\\bid=["']${id}["']`),`index.html contains #${id}`);
}
const appScriptIndex=html.indexOf('<script src="./app.js"');
assert.ok(appScriptIndex>=0,'index.html loads app.js');
assert.ok(html.indexOf('id="stopForm"')<appScriptIndex,'#stopForm precedes app.js');
assert.ok(html.indexOf('id="stopSheet"')<appScriptIndex,'#stopSheet precedes app.js');
assert.ok(html.indexOf('id="moreSettings"')<appScriptIndex,'#moreSettings precedes app.js');
assert.ok(html.indexOf('id="moreFields"')<appScriptIndex,'#moreFields precedes app.js');
assert.ok(html.indexOf('id="snackbar"')<appScriptIndex,'#snackbar precedes app.js');
const heroMarkup=html.slice(html.indexOf('<header class="hero"'),html.indexOf('</header>')+9);
const scheduleMarkup=html.slice(html.indexOf('id="scheduleView"'),html.indexOf('id="mapView"'));
assert.doesNotMatch(heroMarkup,/id="dayTabs"/,'Overview cover does not own itinerary tabs');
assert.match(scheduleMarkup,/id="dayTabs"/,'itinerary owns the Day tabs');
assert.match(app,/classList\.toggle\('hidden',id!==\'homeView\'\)/,'cover is visible only on Overview');
assert.match(styles,/\.more-fields\[hidden\]\{display:none\}/,'collapsed advanced stop settings stay hidden');
assert.match(app,/coverPhoto:String\(t\.coverPhoto\|\|''\)/,'trip schema preserves its memory photo');
assert.match(app,/canvas\.toDataURL\('image\/jpeg',\.78\)/,'cover photos are resized and compressed before storage');
assert.match(app,/t\.coverPhoto=''/,'trip copies do not duplicate the original memory photo');
assert.match(app,/id!==\'homeView\'&&editMode\)setEditMode\(false\)/,'leaving Overview always exits global edit mode');
assert.match(app,/BACKUP_KEY='tino-travel-last-backup-v1'/,'full backup time is stored separately from trip data');
assert.match(app,/14\*86400000/,'backup reminder becomes due after fourteen days');
assert.match(app,/exportedAt:new Date\(\)\.toISOString\(\)/,'full backups record their export time');
assert.match(app,/請改用「完整還原」預覽後再處理/,'single-trip import refuses full backups');
assert.match(app,/mode==='replace'/,'full restore offers an explicit replace path');
assert.match(app,/raw\.trips\.map\(remapImportedTrip\)/,'merge restore remaps imported trip identities');
assert.match(app,/showAllMap=true;updateMap\(day\(\),true\)/,'Show all plots the whole trip instead of only refitting one day');
assert.match(app,/data-map-day=/,'map renders direct Day selectors');
assert.match(app,/days=all\?t\.days:\[d\]/,'all-map mode plots every trip day');
assert.match(app,/pts\.length===1\)map\.setView/,'a single map point receives a useful zoom level');
assert.match(app,/target=t\.days\.find\(d=>d\.id===raw\.targetDay\)\|\|source/,'stop form resolves its selected destination Day');
assert.match(app,/t\.progress\[pkey\(target\.id,existing\.id\)\]=true/,'moving a completed stop preserves completion state');
assert.match(app,/navigator\.share/,'day sharing prefers the native mobile share sheet');
assert.match(app,/Google Maps 路線：\$\{dayRouteUrl\(d\)\}/,'shared day text includes its Google Maps route');
assert.match(styles,/\.sheet-panel\{width:100%;max-width:100vw;overflow-x:hidden;overflow-y:auto;/,'stop editor cannot scroll horizontally');
assert.match(styles,/touch-action:pan-y/,'stop editor keeps vertical touch movement only');
assert.match(styles,/grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/,'editor grid columns may shrink within the phone width');
console.log('startup smoke test passed');
