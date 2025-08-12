// Simple hash router + app pages
const $app = document.getElementById('app');
const $nav = document.getElementById('top-nav');
const routes = new Map();
function route(path, handler){ routes.set(path, handler); }
function go(path){ if(location.hash!==`#${path}`) location.hash = `#${path}`; else render(); }
window.addEventListener('hashchange', render);

function el(tag, attrs={}, children=[]){
  const node = document.createElement(tag);
  for(const [k,v] of Object.entries(attrs||{})){
    if(k==='class') node.className = v;
    else if(k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if(k==='html') node.innerHTML = v;
    else node.setAttribute(k, v);
  }
  for(const c of (children||[])) node.append(c);
  return node;
}
function clear(n){ n.replaceChildren(); }

function nav(){
  clear($nav);
  $nav.append(
    btn('תוכנית יומית', ()=>go('/')),
    btn('אוצר מילים', ()=>go('/vocab')),
    btn('המילים שלי', ()=>go('/mywords')),
    btn('קריאה', ()=>go('/reading'))
  );
}
function btn(label, onclick, cls='btn ghost'){ const b=el('button',{class:cls,onclick}); b.textContent=label; return b; }

async function loadJSON(path){ const r = await fetch(path); return r.json(); }
const store = {
  get(k,def){ try{ return JSON.parse(localStorage.getItem(k)) ?? def }catch{return def} },
  set(k,v){ localStorage.setItem(k, JSON.stringify(v)) },
  push(k,v){ const a=store.get(k,[]); a.push(v); store.set(k,a) },
  remove(k,pred){ const a=store.get(k,[]); store.set(k, a.filter(x=>!pred(x))); }
};

// State for vocab session
let state = { idx: 0, seen: 0, known: 0 };
function nextIndex(vlen){ state.idx = (state.idx + 1 + Math.floor(Math.random()*3)) % vlen; state.seen++; }
function progressBar(){
  const pct = Math.min(100, Math.round((state.known / Math.max(1,state.seen)) * 100));
  const wrap = el('div', {class:'row', style:'gap:12px;align-items:center'});
  const p = el('div',{class:'progress', style:'width:220px'}, [el('span',{style:`width:${pct}%`})]);
  wrap.append(el('span',{class:'badge'},[`דיוק: ${isNaN(pct)?0:pct}%`]), p);
  return wrap;
}
function tabBtn(label, active, on){ const b=el('button',{class:'tab'+(active?' active':''), onclick:on}); b.textContent=label; return b; }
function list(items){
  const ul = el('ul',{class:'list'});
  items.forEach(txt=> ul.append(el('li',{class:'item'},[el('span',{},[txt]), el('span',{class:'badge'},['לבגרות'])])));
  return ul;
}

// Home: tracks + 14-day plan
route('/', async ()=>{
  nav(); clear($app);
  const data = await loadJSON('data/syllabus.json');

  // Tracks block
  const hero = el('div',{class:'card'},[
    el('h2',{},['בחרו מסלול: 3 / 4 / 5 יח״ל']),
    el('div',{class:'sub'},['לאחר הבחירה יוצג מה לומדים, איך מתכוננים, וקישורים מהירים לתרגול.'])
  ]);
  const grid = el('div',{class:'grid grid-3'});
  [['3u','3 יח״ל','יסודות חזקים'],['4u','4 יח״ל','העמקה וביטחון'],['5u','5 יח״ל','שליטה מלאה']]
  .forEach(([key,title,subtitle])=>{
    grid.append(el('div',{class:'card'},[
      el('div',{class:'pill'},[subtitle]),
      el('h3',{},[title]),
      el('div',{class:'hint'},['תוכנית ממוקדת לפי דרישות המבחן']),
      el('div',{class:'space'}),
      btn('פתח מסלול', ()=>go(`/track/${key}`),'btn full')
    ]));
  });

  // 14-day plan
  const planBlock = el('div',{class:'card'},[
    el('h3',{},['תכנית 14 ימים — לחץ לכניסה לשיעור']),
  ]);
  const planList = el('ul',{class:'list'});
  data.days.forEach((d,i)=>{
    const li = el('li',{class:'item'},[
      el('span',{},[d.title]),
      btn('פתח', ()=>go(`/plan/${i+1}`),'btn secondary')
    ]);
    planList.append(li);
  });
  planBlock.append(planList);

  $app.append(hero, grid, planBlock);
});

// Track page
route('/track/:id', async ({params})=>{
  nav(); clear($app);
  const data = await loadJSON('data/syllabus.json');
  const t = data.tracks[params.id];
  if(!t){ go('/'); return; }

  const title = el('div',{class:'card'},[ el('h2',{},[t.title]), el('div',{class:'sub'},['מה בתוכנית + איך להתכונן בפועל']) ]);
  const what = el('div',{class:'card'},[ el('h3',{},['מה לומדים']), list(t.what) ]);
  const how  = el('div',{class:'card'},[
    el('h3',{},['איך מתכוננים']),
    list(t.how),
    el('div',{class:'actions'},[
      btn('אוצר מילים', ()=>go('/vocab')),
      btn('המילים שלי', ()=>go('/mywords'),'btn secondary'),
      btn('תרגול קריאה', ()=>go('/reading'),'btn ghost')
    ])
  ]);

  $app.append(title, what, how);
});

// Plan day page
route('/plan/:n', async ({params})=>{
  nav(); clear($app);
  const data = await loadJSON('data/syllabus.json');
  const i = Math.max(1, Math.min(14, parseInt(params.n,10))) - 1;
  const d = data.days[i];

  const head = el('div',{class:'card'},[
    el('h2',{},[d.title]),
    el('div',{class:'sub'},['מסלול יום—כל מה שצריך להיום'])
  ]);
  const tasks = el('div',{class:'card'},[
    el('h3',{},['משימות']),
    (function(){ const ul = el('ul',{class:'list'}); d.tasks.forEach(t=>ul.append(el('li',{class:'item'},[t]))); return ul; })(),
    el('div',{class:'actions'},[ btn('כרטיסיות', ()=>go('/vocab')), btn('קריאה', ()=>go('/reading'),'btn ghost') ])
  ]);
  $app.append(head, tasks);
});

// Vocabulary
route('/vocab', async ()=>{
  nav(); clear($app);
  const voc = await loadJSON('data/vocab.json');
  const wordObj = voc[state.idx];

  const top = el('div',{class:'sticky-tabs'},[
    progressBar(),
    el('div',{class:'tabs'},[
      tabBtn('כרטיסיות', true, ()=>{}),
      tabBtn('המילים שלי', false, ()=>go('/mywords')),
      tabBtn('הגדרות', false, ()=>go('/settings')),
    ])
  ]);
  const card = el('div',{class:'card flash'},[
    el('div',{class:'big',id:'flash-word'},[wordObj.w]),
    el('div',{class:'muted'},['לחץ לא יודע כדי לראות תרגום ומשפט'])
  ]);
  const actions = el('div',{class:'actions'},[
    btn('יודע', ()=>{ state.known++; nextIndex(voc.length); go('/vocab'); }, 'btn'),
    btn('לא יודע', ()=>{ addToMyWords(wordObj); go(`/word/${encodeURIComponent(wordObj.w)}`); }, 'btn secondary'),
    btn('דילוג', ()=>{ nextIndex(voc.length); go('/vocab') }, 'btn ghost')
  ]);
  $app.append(top, card, actions);
});

function addToMyWords(w){
  const list = store.get('myWords', []);
  if(!list.find(x=>x.w===w.w)){ store.push('myWords', w); }
}

// Word details
route('/word/:w', async ({params})=>{
  nav(); clear($app);
  const voc = await loadJSON('data/vocab.json');
  const w = decodeURIComponent(params.w);
  const entry = voc.find(x=>x.w===w) || store.get('myWords',[]).find(x=>x.w===w);
  if(!entry){ go('/vocab'); return; }

  const c = el('div',{class:'card'},[
    el('h2',{},[entry.w]),
    el('div',{class:'hint'},[`תרגום: ${entry.t}`]),
    el('div',{style:'margin-top:8px'},[el('strong',{},['במשפט: ']), document.createTextNode(entry.ex)])
  ]);
  const actions = el('div',{class:'actions'},[
    btn('חזרה לכרטיסיות', ()=>go('/vocab')),
    btn('סמן נלמדה והסר מהמילים שלי', ()=>{ store.remove('myWords', x=>x.w===entry.w); go('/mywords'); }, 'btn secondary')
  ]);
  $app.append(c, actions);
});

// My Words
route('/mywords', ()=>{
  nav(); clear($app);
  const items = store.get('myWords', []);

  const head = el('div',{class:'card'},[ el('h2',{},['המילים שלי']), el('div',{class:'sub'},['מילים שסומנו כ"לא יודע" — לתרגול ממוקד']) ]);
  const listWrap = el('div',{class:'list'});
  if(items.length===0) listWrap.append(el('div',{class:'hint'},['אין עדיין מילים. היכנסו לכרטיסיות והוסיפו.']));
  items.forEach(x=>{
    const row = el('div',{class:'item'},[
      el('div',{},[el('strong',{},[x.w]), document.createTextNode(' — '+x.t)]),
      el('div',{class:'row'},[ btn('פרטים', ()=>go(`/word/${encodeURIComponent(x.w)}`), 'btn ghost'),
        btn('סמן נלמדה', ()=>{ store.remove('myWords', m=>m.w===x.w); go('/mywords'); }, 'btn secondary') ])
    ]);
    listWrap.append(row);
  });
  const actions = el('div',{class:'actions'},[ btn('תרגל את כולן (כרטיסיות)', ()=>{ sessionWords = items.length? shuffle([...items]) : []; go('/vocab-drill'); }) ]);
  $app.append(head, el('div',{class:'card'},[listWrap]), actions);
});

let sessionWords = [];
route('/vocab-drill', async ()=>{
  nav(); clear($app);
  const voc = await loadJSON('data/vocab.json');
  if(sessionWords.length===0){ sessionWords = shuffle([...voc]); }
  const current = sessionWords[0];
  const card = el('div',{class:'card flash'},[ el('div',{class:'big'},[current.w]), el('div',{class:'muted'},['לחץ לא יודע כדי לראות תרגום ומשפט']) ]);
  const actions = el('div',{class:'actions'},[
    btn('יודע', ()=>{ sessionWords.shift(); go('/vocab-drill'); }),
    btn('לא יודע', ()=>{ addToMyWords(current); go(`/word/${encodeURIComponent(current.w)}`) }, 'btn secondary'),
    btn('יציאה', ()=>go('/mywords'), 'btn ghost')
  ]);
  $app.append(card, actions);
});

// Reading
route('/reading', ()=>{
  nav(); clear($app);
  const head = el('div',{class:'card'},[ el('h2',{},['תרגול קריאה (דמו)']), el('div',{class:'sub'},['קטעי קריאה קצרים בסגנון בגרות + שאלות הבנה']) ]);
  const sample = el('div',{class:'card'},[
    el('h3',{},['קטע: The Value of Daily Reading']),
    el('p',{},['Daily reading helps students improve vocabulary, writing skills, and critical thinking. Even 10 minutes a day can lead to visible progress. Students who read regularly tend to perform better in exams and feel more confident when speaking.']),
    el('div',{class:'list'},[ q('1) What are two benefits of daily reading?', ['Improved vocabulary','Better writing skills']), q('2) How long should a student read to see progress?', ['About ten minutes a day']), q('3) Why do readers feel more confident when speaking?', ['Because they know more words and expressions']) ])
  ]);
  $app.append(head, sample);
});
function q(title, answers){
  const wrap = el('div',{class:'item'});
  wrap.append(el('div',{},[title]));
  const right = el('div');
  const show = btn('הצג תשובה', ()=>{ show.disabled = true; right.textContent = ' תשובה: ' + answers.join('; '); }, 'btn ghost');
  wrap.append(el('div',{class:'row'},[show]), right);
  return wrap;
}

// Helpers
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] } return a; }

// Route matcher
function match(path){
  const hash = location.hash.slice(1) || '/';
  const [p] = hash.split('?');
  const pathSeg = p.split('/').filter(Boolean);
  const routeSeg = path.split('/').filter(Boolean);
  if(routeSeg.length !== pathSeg.length) return null;
  const params = {};
  for(let i=0;i<routeSeg.length;i++){
    const r = routeSeg[i]; const s = pathSeg[i];
    if(r.startsWith(':')) params[r.slice(1)] = decodeURIComponent(s);
    else if(r!==s) return null;
  }
  return {params};
}

function render(){
  for(const [path, handler] of routes){
    const m = match(path);
    if(m){ handler(m); return; }
  }
  routes.get('/')();
}

(function init(){ render(); })();