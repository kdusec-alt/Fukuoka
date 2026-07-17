const assert=require('assert');
const fs=require('fs');

const html=fs.readFileSync('index.html','utf8');
const app=fs.readFileSync('app.js','utf8');
const fixedDomIds=[
  'brandLine','heroTitle','heroSubtitle','tripFacts','tripSelect','dayTabs',
  'homePanel','daySummary','timeline','openDayMap','fitMap','mapFallback',
  'settingsPanel','importFile','editToggle','installBtn','newTrip','copyTrip',
  'stopSheet','stopForm','moreSettings','moreFields','snackbar'
];
const generatedDomIds=[
  'addDay','addStop','autoSort','backupAll','copyDay','dayDown','dayUp',
  'deleteDay','deleteTrip','exportTrip','importTrip','quickAddStop',
  'resetProgress','restoreDefault','undoDelete'
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
console.log('startup smoke test passed');
