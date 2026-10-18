// Test harness for TEST-REPORT.md (not part of the app). Needs: npm i --no-save playwright-core axe-core, a Chromium, and the app served locally.
// Usage: node docs/e2e/e2e.js http://127.0.0.1:8080/index.html <out-dir>

const { chromium } = require('./node_modules/playwright-core'); const fs=require('fs');
const URL_=process.argv[2]; const SHOTS=process.argv[3]; fs.mkdirSync(SHOTS,{recursive:true});
const results=[]; const ok=(name,pass,detail='')=>{ results.push({name,pass:!!pass,detail}); console.log((pass?'PASS':'FAIL')+' | '+name+(detail?' | '+detail:'')); };
(async()=>{
 const b=await chromium.launch({args:['--no-sandbox']});
 const ctx=await b.newContext({viewport:{width:1440,height:900},acceptDownloads:true});
 const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e))); p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
 await p.goto(URL_,{waitUntil:'load'}); await p.waitForTimeout(1200);
 // 1 first visit intro
 const introShown = await p.evaluate(()=>getComputedStyle(document.getElementById('firstload')).display!=='none');
 ok('First visit shows the intro', introShown);
 await p.click('#closeintro'); await p.waitForTimeout(400);
 ok('Closing the intro shows the timer', await p.evaluate(()=>getComputedStyle(document.getElementById('main')).display!=='none'));
 // create tasks via UI
 await p.click('#managetaskbtn'); await p.waitForTimeout(500);
 for (const t of ['Calculus','Chemistry']) { await p.fill('#new-task-name', t); await p.click('#new-task-btn'); await p.waitForTimeout(200); }
 const nt = await p.evaluate(()=>JSON.parse(localStorage.getItem('pomo-tasks')||'[]'));
 ok('Create two tasks in the Tasks panel', nt.includes('Calculus')&&nt.includes('Chemistry'), JSON.stringify(nt));
 await p.keyboard.press('Escape'); await p.waitForTimeout(600);
 ok('Escape closes the Tasks panel', await p.evaluate(()=>viewState==='timer'));
 await p.selectOption('#task-select','Chemistry'); await p.waitForTimeout(200);
 await p.reload(); await p.waitForTimeout(1200);
 const pick = await p.evaluate(()=>({v:document.getElementById('task-select').value, s:selectedTask}));
 ok('After a reload the task picker shows the task time is logged to (upstream bug, run 19)', pick.v==='Chemistry' && pick.s==='Chemistry', JSON.stringify(pick));
 // 2 timer start/pause
 await p.click('#pauseplay'); await p.waitForTimeout(2300);
 const running = await p.evaluate(()=>roundInfo.running && roundInfo.t>=1);
 ok('Start button runs the timer', running, 't='+await p.evaluate(()=>roundInfo.t));
 await p.click('#pauseplay'); await p.waitForTimeout(300);
 ok('Pause button stops the timer', await p.evaluate(()=>!roundInfo.running));
 // 3 space shortcuts
 await p.click('body',{position:{x:200,y:600}}); await p.keyboard.press('Space'); await p.waitForTimeout(300);
 const spaceStarts = await p.evaluate(()=>roundInfo.running); await p.keyboard.press('Space'); await p.waitForTimeout(200);
 ok('Space toggles the timer on the main screen', spaceStarts && await p.evaluate(()=>!roundInfo.running));
 await p.click('#round-note'); await p.keyboard.type('Chem ch. 4, problem set 2'); await p.waitForTimeout(200);
 const noteVal=await p.inputValue('#round-note'); const stillPaused=await p.evaluate(()=>!roundInfo.running);
 ok('Typing spaces in the round note does not start the timer (#8 + run 18 fix)', noteVal==='Chem ch. 4, problem set 2' && stillPaused, noteVal);
 // 7 note saved with record
 await p.evaluate(()=>focusEnd(1500)); await p.waitForTimeout(400);
 const recs = await p.evaluate(()=>new Promise(r=>{ const q=db.transaction('records','readonly').objectStore('records').getAll(); q.onsuccess=()=>r(q.result); }));
 const last=recs[recs.length-1]||{};
 ok('Round note is saved with the focus record (issue #8)', last.m==='Chem ch. 4, problem set 2' && last.n==='Chemistry' && last.t===25, JSON.stringify(last));
 ok('Round note input clears after the round is saved', (await p.inputValue('#round-note'))==='');
 // a record without note
 await p.evaluate(()=>focusEnd(1200)); await p.waitForTimeout(300);
 // 8 records list edit
 await p.click('#statbtn'); await p.waitForTimeout(900);
 await p.evaluate(()=>{ document.getElementById('stat-details').open=true; }); await p.waitForTimeout(500);
 const notesShown = await p.$$eval('.round-entry-note', els=>els.map(e=>e.innerText));
 ok('Records list shows the note under its round', notesShown.includes('Chem ch. 4, problem set 2'), JSON.stringify(notesShown));
 await p.screenshot({path:SHOTS+'/d-records.png'});
 // count puts during edit
 await p.evaluate(()=>{ window.__puts=0; const orig=IDBObjectStore.prototype.put; IDBObjectStore.prototype.put=function(...a){ window.__puts++; return orig.apply(this,a); }; });
 const entries = await p.$$('.round-entry');
 let target=null; for (const e of entries){ const t=await e.innerText(); if(t.includes('Chem ch. 4')) { target=e; break; } }
 await (await target.$('.entry-edit-note')).click(); await p.waitForTimeout(200);
 await p.keyboard.press('End'); await p.keyboard.type(' (done)'); await p.keyboard.press('Enter'); await p.waitForTimeout(500);
 const recs2 = await p.evaluate(()=>new Promise(r=>{ const q=db.transaction('records','readonly').objectStore('records').getAll(); q.onsuccess=()=>r(q.result); }));
 const edited = recs2.find(r=>r.m && r.m.startsWith('Chem ch. 4'));
 ok('Edit note + Enter saves the new note', edited && edited.m==='Chem ch. 4, problem set 2 (done)', edited&&edited.m);
 ok('Edit note writes to the database exactly once (review F3)', await p.evaluate(()=>window.__puts)===1, 'puts='+await p.evaluate(()=>window.__puts));
 // Escape cancels and keeps panel open
 const entries2 = await p.$$('.round-entry'); let t2=null; for (const e of entries2){ if((await e.innerText()).includes('(done)')) { t2=e; break; } }
 await (await t2.$('.entry-edit-note')).click(); await p.waitForTimeout(200); await p.keyboard.type(' XYZ'); await p.keyboard.press('Escape'); await p.waitForTimeout(500);
 const recs3 = await p.evaluate(()=>new Promise(r=>{ const q=db.transaction('records','readonly').objectStore('records').getAll(); q.onsuccess=()=>r(q.result); }));
 ok('Escape in the note editor cancels without saving', !recs3.some(r=>(r.m||'').includes('XYZ')));
 ok('Escape in the note editor keeps the Statistics panel open (run 18 fix)', await p.evaluate(()=>viewState==='statistics'));
 await p.keyboard.press('Escape'); await p.waitForTimeout(700);
 ok('Escape (outside a field) closes the Statistics panel', await p.evaluate(()=>viewState==='timer'));
 // 9 backup export includes notes
 await p.click('#menubtn'); await p.waitForTimeout(700);
 const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#create-backup')]);
 const bpath = SHOTS+'/backup.json'; await dl.saveAs(bpath); const bj=JSON.parse(fs.readFileSync(bpath,'utf8'));
 ok('Create Backup exports notes with the records', bj.some(r=>r.m==='Chem ch. 4, problem set 2 (done)'), bj.length+' records');
 // restore into fresh context
 const bj2 = bj.concat([{t:30,d:1700000000000,n:'History',m:'Essay outline'},{t:30,d:1700000000000,n:'History',m:'dup'},{t:15,d:1700000500000,n:'History',m:123}]);
 const rpath=SHOTS+'/restore.json'; fs.writeFileSync(rpath, JSON.stringify(bj2));
 // 4 speech settings
 await p.evaluate(()=>document.getElementById('speech-interval').closest('section').scrollIntoView({block:'center'}));
 await p.selectOption('#speech-interval','5'); await p.selectOption('#speech-transitions','true'); await p.waitForTimeout(200);
 await p.screenshot({path:SHOTS+'/d-settings-speech.png'});
 ok('Speech settings persist to localStorage', await p.evaluate(()=>localStorage.getItem('pomo-speech-interval')==='5' && localStorage.getItem('pomo-speech-transitions')==='true'));
 await p.evaluate(()=>{ window.__said=[]; if(window.speechSynthesis){ speechSynthesis.speak=function(u){ window.__said.push(u.text); }; speechSynthesis.cancel=function(){}; } });
 await p.click('#speech-test'); await p.waitForTimeout(200);
 ok('Test voice button speaks', (await p.evaluate(()=>window.__said)).length===1, JSON.stringify(await p.evaluate(()=>window.__said)));
 await p.evaluate(()=>{ window.__said=[]; roundInfo.current='focus'; roundInfo.t=config.focus-300; setTime(); });
 const said1 = await p.evaluate(()=>window.__said);
 ok('Spoken reminder at 5 minutes left (issue #11)', said1[0]==='5 minutes left in your focus round', JSON.stringify(said1));
 await p.evaluate(()=>{ window.__said=[]; roundInfo.t=config.focus-299; setTime(); });
 ok('No reminder between interval marks', (await p.evaluate(()=>window.__said)).length===0);
 // transitions
 await p.evaluate(()=>{ window.__said=[]; roundInfo.running=true; roundInfo.t=config.focus; nextRound(); });
 const said2=await p.evaluate(()=>window.__said);
 ok('Round-end announcement when reminders are on and the timer was running', said2.some(s=>/Focus round done/.test(s)), JSON.stringify(said2));
 await p.evaluate(()=>{ if(roundInfo.running) pauseplay(); });
 await p.evaluate(()=>{ window.__said=[]; roundInfo.running=false; nextRound(); });
 ok('No announcement on a manual skip while paused (review F2)', (await p.evaluate(()=>window.__said)).filter(s=>/done|over/.test(s)).length===0, JSON.stringify(await p.evaluate(()=>window.__said)));
 await p.selectOption('#speech-interval','0'); await p.waitForTimeout(100);
 await p.evaluate(()=>{ window.__said=[]; roundInfo.running=true; nextRound(); if(roundInfo.running) pauseplay(); });
 ok('No announcement when spoken reminders are Off (review F1)', (await p.evaluate(()=>window.__said)).length===0);
 await p.keyboard.press('Escape'); await p.waitForTimeout(600);
 ok('Escape closes the Settings panel', await p.evaluate(()=>viewState==='timer'));
 await p.screenshot({path:SHOTS+'/d-main.png'});
 ok('No JavaScript errors during the desktop run', errs.length===0, errs.join(' || ').slice(0,300));
 await ctx.close();
 // restore in fresh context
 const ctx2=await b.newContext({viewport:{width:1440,height:900}}); await ctx2.addInitScript(()=>{ if(!localStorage.getItem('pomo-version')) localStorage.setItem('pomo-version','1'); });
 const p2=await ctx2.newPage(); const errs2=[]; p2.on('pageerror',e=>errs2.push(String(e)));
 p2.on('dialog', d=>d.accept());
 await p2.goto(URL_,{waitUntil:'load'}); await p2.waitForTimeout(1000);
 await p2.click('#menubtn'); await p2.waitForTimeout(600);
 await p2.setInputFiles('#backup-restore', rpath); await p2.waitForTimeout(1200);
 const rr = await p2.evaluate(()=>new Promise(r=>{ const q=db.transaction('records','readonly').objectStore('records').getAll(); q.onsuccess=()=>r(q.result); }));
 ok('Restore Backup brings notes back', rr.some(r=>r.m==='Chem ch. 4, problem set 2 (done)') && rr.some(r=>r.m==='Essay outline'), rr.length+' records');
 ok('Restore keeps the first of duplicate keys and drops a non-string note', !rr.some(r=>r.m==='dup') && rr.some(r=>r.d===1700000500000 && r.m===undefined), JSON.stringify(rr.filter(r=>r.n==='History')));
 const tasks2 = await p2.evaluate(()=>JSON.parse(localStorage.getItem('pomo-tasks')||'[]'));
 ok('Restore recreates the tasks', tasks2.includes('History') && tasks2.includes('Chemistry'), JSON.stringify(tasks2));
 ok('No JavaScript errors during restore', errs2.length===0, errs2.join(' || '));
 await ctx2.close();
 // phone
 const ctx3=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 await ctx3.addInitScript(()=>{ if(!localStorage.getItem('pomo-version')){ localStorage.setItem('pomo-version','1'); localStorage.setItem('pomo-tasks', JSON.stringify(['Calculus','Chemistry'])); localStorage.setItem('pomo-selected-task','Chemistry'); } });
 const p3=await ctx3.newPage(); const errs3=[]; p3.on('pageerror',e=>errs3.push(String(e)));
 await p3.goto(URL_,{waitUntil:'load'}); await p3.waitForTimeout(1000);
 const ov = await p3.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1);
 ok('Phone 390px: no sideways scroll on the main screen', ov);
 const noteBox = await p3.evaluate(()=>{ const r=document.getElementById('round-note').getBoundingClientRect(); const t=document.getElementById('taskswitcher').getBoundingClientRect(); return {l:r.left,r:r.right,top:r.top,tb:t.bottom}; });
 ok('Phone 390px: round note fits on screen under the task picker', noteBox.l>=0 && noteBox.r<=390 && noteBox.top>=noteBox.tb-2, JSON.stringify(noteBox));
 await p3.screenshot({path:SHOTS+'/m-main.png'});
 await p3.tap('#round-note'); await p3.keyboard.type('Lab report intro'); await p3.evaluate(()=>focusEnd(1500)); await p3.waitForTimeout(300);
 await p3.tap('#menubtn'); await p3.waitForTimeout(800);
 await p3.evaluate(()=>document.getElementById('speech-interval').closest('section').scrollIntoView({block:'center'})); await p3.waitForTimeout(300);
 await p3.screenshot({path:SHOTS+'/m-settings-speech.png'});
 await p3.tap('#menubtn'); await p3.waitForTimeout(700);
 await p3.tap('#statbtn'); await p3.waitForTimeout(900); await p3.evaluate(()=>{ const d=document.getElementById('stat-details'); d.open=true; d.scrollIntoView(); }); await p3.waitForTimeout(500);
 await p3.screenshot({path:SHOTS+'/m-records.png'});
 const ov2 = await p3.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1);
 ok('Phone 390px: statistics + records fit the screen', ov2);
 ok('No JavaScript errors on phone', errs3.length===0, errs3.join(' || '));
 await b.close();
 fs.writeFileSync(SHOTS+'/results.json', JSON.stringify(results,null,1));
 console.log(results.filter(r=>r.pass).length+'/'+results.length+' passed');
 if (results.some(r=>!r.pass)) process.exitCode = 1;
})().catch(e=>{ console.error('E2E CRASH', e); process.exit(1); });
