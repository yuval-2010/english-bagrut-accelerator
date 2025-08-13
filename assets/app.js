// SPA + localStorage "backend"

const STATE = {
  user: null,
  catalog: null,
  selectedUnit: null,
  selectedCat: 'reading',
  selectedTopicId: null,
  selectedLessonId: null,
  attempts: JSON.parse(localStorage.getItem('attempts')||'[]') // {exId, correct, ts}
};

const db = {
  users: JSON.parse(localStorage.getItem('users')||'[]'),
  save(){ localStorage.setItem('users', JSON.stringify(this.users)); }
};

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

function saveAttempts(){ localStorage.setItem('attempts', JSON.stringify(STATE.attempts)); }
function currentUser() {
  const id = localStorage.getItem('currentUserId');
  return db.users.find(u=>u.id===id) || null;
}
function setCurrentUser(u){ localStorage.setItem('currentUserId', u.id); STATE.user = u; }

async function loadCatalog(){
  if(STATE.catalog) return STATE.catalog;
  const res = await fetch('data/catalog.json'); STATE.catalog = await res.json(); return STATE.catalog;
}

// Routing
window.addEventListener('hashchange', renderRoute);
function renderRoute(){
  const hash = location.hash || '#/';
  $$('.view').forEach(v=> v.hidden = true);
  if(!STATE.user){ $('#view-auth').hidden = false; return; }

  if(hash.startsWith('#/practice')) $('#view-practice').hidden = false;
  else if(hash.startsWith('#/progress')) $('#view-progress').hidden = false;
  else $('#view-dash').hidden = false;

  if(!STATE.selectedUnit){
    // default to first chosen unit or 3
    const units = STATE.user.units?.length ? STATE.user.units : ['3'];
    STATE.selectedUnit = units[0];
  }
  if($('#view-dash') && !$('#view-dash').hidden) renderDash();
  if($('#view-practice') && !$('#view-practice').hidden) renderPractice();
  if($('#view-progress') && !$('#view-progress').hidden) renderProgress();
}

// Auth
$('#btnRegister').onclick = ()=>{
  const name = $('#regName').value.trim();
  const email = $('#regEmail').value.trim().toLowerCase();
  const pass = $('#regPass').value;
  if(!name || !email || pass.length<8){ alert('מלא/י פרטים וודא/י סיסמה 8+'); return; }
  if(db.users.find(x=>x.email===email)){ alert('אימייל קיים'); return; }
  const u = { id: crypto.randomUUID(), name, email, pass, units:[] };
  db.users.push(u); db.save();
  $('#authMsg').textContent = 'נרשמת — אפשר להתחבר';
};

$('#btnLogin').onclick = ()=>{
  const email = $('#loginEmail').value.trim().toLowerCase();
  const pass = $('#loginPass').value;
  const u = db.users.find(x=>x.email===email && x.pass===pass);
  if(!u){ $('#authMsg').textContent = 'פרטים שגויים'; return; }
  setCurrentUser(u);
  $('#who').textContent = u.name;
  renderRoute();
};

$('#btnLogout').onclick = ()=>{
  localStorage.removeItem('currentUserId');
  STATE.user = null;
  location.hash = '#/';
  renderRoute();
};

// Dash
async function renderDash(){
  $('#who').textContent = STATE.user.name;
  const cat = await loadCatalog();
  const unitsDiv = $('#units'); unitsDiv.innerHTML='';
  cat.units.forEach(u=>{
    const id = `unit-${u.code}`;
    const lab = document.createElement('label');
    lab.innerHTML = `<input type="checkbox" id="${id}" value="${u.code}"> יחידה ${u.code} — ${u.title}`;
    unitsDiv.appendChild(lab);
  });
  // set checked
  (STATE.user.units||[]).forEach(code=>{
    const c = document.getElementById(`unit-${code}`);
    if(c) c.checked = true;
  });
  $('#btnSaveUnits').onclick = ()=>{
    STATE.user.units = $$('#units input[type=checkbox]:checked').map(x=>x.value);
    db.save();
    alert('נשמר!');
  };
}

// Practice
async function renderPractice(){
  const cat = await loadCatalog();
  const units = STATE.user.units?.length ? STATE.user.units : ['3','4','5'];
  if(!units.includes(STATE.selectedUnit)) STATE.selectedUnit = units[0];

  // unit badge + category tabs
  $('#unitBadge').innerHTML = `<span class="badge">יחידה ${STATE.selectedUnit}</span>`;
  const cats = ['reading','vocab','grammar','exams'];
  const catTabs = $('#catTabs'); catTabs.innerHTML='';
  cats.forEach(c=>{
    const lab = document.createElement('label');
    const checked = STATE.selectedCat===c ? 'checked' : '';
    lab.innerHTML = `<input type="radio" name="cat" value="${c}" ${checked}> ${c}`;
    catTabs.appendChild(lab);
  });
  $$('#catTabs input[type=radio]').forEach(r=> r.onchange = (e)=>{ STATE.selectedCat = e.target.value; renderPractice(); });

  // topics grid
  const topics = cat.topics.filter(t=> t.unit===STATE.selectedUnit && t.category===STATE.selectedCat);
  const wrap = $('#topics'); wrap.innerHTML='';
  topics.forEach(t=>{
    const div = document.createElement('div'); div.className='tile';
    div.innerHTML = `<h4>${t.title} <span class="badge">${t.category}</span></h4>
      <button class="go">לשיעורים</button>`;
    div.querySelector('.go').onclick = ()=>{
      STATE.selectedTopicId = t.id;
      renderLessons();
    };
    wrap.appendChild(div);
  });

  // unit switcher (chips)
  const unitChips = document.createElement('div'); unitChips.className='chips';
  (STATE.user.units?.length ? STATE.user.units : cat.units.map(u=>u.code)).forEach(code=>{
    const lab = document.createElement('label');
    lab.innerHTML = `<input type="radio" name="unit" value="${code}" ${code===STATE.selectedUnit?'checked':''}> יח ${code}`;
    unitChips.appendChild(lab);
  });
  $('#unitBadge').appendChild(unitChips);
  $$('#unitBadge input[name=unit]').forEach(r=> r.onchange=(e)=>{ STATE.selectedUnit = e.target.value; renderPractice(); });

  // clear lesson/exercise areas
  $('#lessons').innerHTML=''; $('#exArea').innerHTML='';
}

function renderLessons(){
  const cat = STATE.catalog;
  const lessons = cat.lessons.filter(l=> l.unit===STATE.selectedUnit && l.category===STATE.selectedCat && l.topic_title === (cat.topics.find(t=>t.id===STATE.selectedTopicId).title));
  const wrap = $('#lessons'); wrap.innerHTML = '<h3>שיעורים</h3>';
  lessons.forEach(l=>{
    const div = document.createElement('div'); div.className='tile';
    const objs = (l.objective||[]).join(', ');
    div.innerHTML = `<strong>${l.title}</strong><div class="muted">${objs}</div>`;
    const btn = document.createElement('button'); btn.textContent = 'תרגול';
    btn.onclick = ()=> renderExercises(l.id);
    div.appendChild(btn);
    if(l.reading_html){ const rd = document.createElement('div'); rd.innerHTML = l.reading_html; rd.className='tile'; div.appendChild(rd); }
    if(l.grammar_html){ const gr = document.createElement('div'); gr.innerHTML = l.grammar_html; gr.className='tile'; div.appendChild(gr); }
    wrap.appendChild(div);
  });
  $('#exArea').innerHTML='';
}

function renderExercises(lessonId){
  const cat = STATE.catalog;
  const list = cat.exercises.filter(e=> e.lesson_id===lessonId);
  const wrap = $('#exArea'); wrap.innerHTML = '<h3>תרגילים</h3>';
  list.forEach((ex,i)=>{
    const box = document.createElement('div'); box.className='tile';
    if(ex.qtype==='MCQ'){
      box.innerHTML = `<div><strong>Q${i+1}:</strong> ${ex.prompt}</div>`;
      (ex.options||[]).forEach((opt, idx)=>{
        const b = document.createElement('div'); b.className='option'; b.textContent = `${String.fromCharCode(65+idx)}. ${opt}`;
        b.onclick = ()=>{
          const correctKey = ex.answer;
          const chosen = String.fromCharCode(65+idx);
          const ok = chosen===correctKey;
          b.classList.add(ok?'correct':'wrong');
          recordAttempt(ex.id, ok);
        };
        box.appendChild(b);
      });
      if(ex.hint){ const h=document.createElement('div'); h.className='muted'; h.textContent='רמז: '+ex.hint; box.appendChild(h); }
    } else if(ex.qtype==='Cloze'){
      box.innerHTML = `<div><strong>Q${i+1}:</strong> ${ex.prompt}</div>`;
      const inp = document.createElement('input'); inp.placeholder='Answer';
      const btn = document.createElement('button'); btn.textContent='בדיקה';
      btn.onclick = ()=>{
        const val=(inp.value||'').trim().toLowerCase();
        const acc=(ex.answer||[]).map(s=>String(s).toLowerCase());
        const ok=acc.includes(val);
        inp.classList.toggle('correct', ok); inp.classList.toggle('wrong', !ok);
        recordAttempt(ex.id, ok);
      };
      box.appendChild(inp); box.appendChild(btn);
    } else if(ex.qtype==='Transform'){
      box.innerHTML = `<div><strong>Q${i+1}:</strong> ${ex.prompt}</div>`;
      const inp = document.createElement('input'); inp.placeholder='נסחו מחדש';
      const btn = document.createElement('button'); btn.textContent='הצג תשובה לדוגמה';
      btn.onclick = ()=> alert(ex.answer || '—');
      box.appendChild(inp); box.appendChild(btn);
    }
    wrap.appendChild(box);
  });
}

function recordAttempt(exId, ok){
  STATE.attempts.push({ exId, correct: !!ok, ts: Date.now() });
  saveAttempts();
}

function renderProgress(){
  const total = STATE.attempts.length;
  const correct = STATE.attempts.filter(a=>a.correct).length;
  const acc = total? Math.round(correct*100/total) : 0;
  $('#progressBody').innerHTML = `סה\"כ נסיונות: ${total} | נכונות: ${acc}%`;
}

// Boot
(async function init(){
  STATE.user = currentUser();
  STATE.catalog = await loadCatalog();
  renderRoute();
})();