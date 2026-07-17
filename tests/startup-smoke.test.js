const assert=require('assert');
const fs=require('fs');

const html=fs.readFileSync('index.html','utf8');
const app=fs.readFileSync('app.js','utf8');
const styles=fs.readFileSync('styles.css','utf8');
const fixedDomIds=[
  'appStatus','brandLine','hero','heroTitle','heroSubtitle','tripFacts','tripSelect','dayTabs',
  'homePanel','daySummary','timeline','openDayMap','fitMap','mapFallback',
  'settingsPanel','importFile','coverPhotoInput','editToggle','installBtn','newTrip','copyTrip',
  'stopSheet','stopForm','moreSettings','moreFields','mapParseStatus','mapUrlInput',
  'googlePlaceSearch','sheetTitle','parseMapLink','snackbar','placeResults',
  'placeSearchStatus','retryPlaceSearch','placeSearchInput','tripWizard',
  'tripWizardForm','wizardProgress','wizardBack','wizardNext','wizardCreate'
];
const generatedDomIds=[
  'addDay','addStop','autoSort','backupAll','copyDay','dayDown','dayUp',
  'deleteDay','deleteTrip','exportTrip','importTrip','quickAddStop',
  'resetProgress','restoreDefault','undoDelete','backupAll','dayWeather',
  'refreshWeather','chooseCoverPhoto','removeCoverPhoto'
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
console.log('startup smoke test passed');
