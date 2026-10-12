// Test harness for TEST-REPORT.md (not part of the app). Needs: npm i --no-save playwright-core axe-core, a Chromium, and the app served locally.
// Usage: node docs/e2e/axe4.js http://127.0.0.1:8080/index.html <out-dir>

const { chromium } = require('./node_modules/playwright-core'); const fs=require('fs');
(async()=>{ const [url,out]=process.argv.slice(2);
const b=await chromium.launch({args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:1280,height:800}});
await ctx.addInitScript(()=>{ try{ if(!localStorage.getItem('pomo-version')){ localStorage.setItem('pomo-version','1'); localStorage.setItem('pomo-tasks', JSON.stringify(['Calculus','Chemistry'])); localStorage.setItem('pomo-selected-task','Calculus'); } }catch(e){} });
const p=await ctx.newPage();
await p.goto(url,{waitUntil:'load'}); await p.waitForTimeout(1200);
const axeSrc=fs.readFileSync('./node_modules/axe-core/axe.min.js','utf8');
const states={main:null, settings:'#menubtn', statistics:'#statbtn', tasks:'#managetaskbtn'};
const all={};
for (const [name,btn] of Object.entries(states)){
  await p.goto(url,{waitUntil:'load'}); await p.waitForTimeout(800);
  if(btn){ await p.click(btn); await p.waitForTimeout(900); }
  await p.addScriptTag({content: axeSrc});
  all[name] = await p.evaluate(async()=>{ const r=await axe.run(document,{resultTypes:['violations']}); return r.violations.map(v=>({id:v.id,impact:v.impact,help:v.help,nodes:v.nodes.length,targets:v.nodes.slice(0,8).map(n=>n.target.join(' '))})); });
}
// merge unique by rule+target
const merged={}; for(const [s,vs] of Object.entries(all)) for(const v of vs){ merged[v.id]=merged[v.id]||{id:v.id,impact:v.impact,help:v.help,targets:new Set()}; v.targets.forEach(t=>merged[v.id].targets.add(t)); }
const list=Object.values(merged).map(v=>({...v,targets:[...v.targets],nodes:v.targets.size}));
fs.writeFileSync(out, JSON.stringify({by_state:all, merged:list},null,1));
console.log(list.length+' rules, '+list.reduce((a,v)=>a+v.nodes,0)+' unique nodes'); list.forEach(v=>console.log(v.impact, v.id, v.nodes, v.help, v.targets.slice(0,4).join(' | ')));
await b.close(); })();
