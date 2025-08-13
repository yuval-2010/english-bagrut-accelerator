// Minimal static 'backend' using localStorage so it works on GitHub Pages
const db = {
  users: JSON.parse(localStorage.getItem('users')||'[]'),
  save(){ localStorage.setItem('users', JSON.stringify(this.users)); }
};

const byId = s => document.getElementById(s);
const $ = sel => document.querySelector(sel);
const all = sel => Array.from(document.querySelectorAll(sel));

function currentUser(){ return JSON.parse(localStorage.getItem('currentUser')||'null'); }
function setCurrent(u){ localStorage.setItem('currentUser', JSON.stringify(u)); }
function logout(){ localStorage.removeItem('currentUser'); location.reload(); }

// Seed catalog (static, MOE-aligned skills but original text)
const catalog = [
  { unit:'3', cat:'reading', title:'Main Idea & Details', items:[
    { kind:'MCQ', prompt:'What is the main idea?', options:['Gardens are expensive','Gardens improve communities','Gardens cause traffic','Gardens need many tools'], answer:1,
      text:'Community gardens turn empty lots into green spaces. They supply fresh produce and strengthen neighborhood ties through shared work.' }
  ]},
  { unit:'4', cat:'grammar', title:'Modal Advice', items:[
    { kind:'Cloze', prompt:'You ___ wear a helmet when cycling. (obligation)', answer:['must','have to'] }
  ]},
  { unit:'5', cat:'vocab', title:'Tech Collocations', items:[
    { kind:'Cloze', prompt:'The system can ______ heavy network loads.', answer:['withstand','handle','sustain'] }
  ]},
];

function renderCatalog(units){
  const allowed = new Set(units);
  const wrap = byId('catalog'); wrap.innerHTML = '';
  catalog.filter(x=>allowed.has(x.unit)).forEach(topic=>{
    const t = document.createElement('div'); t.className='tile';
    t.innerHTML = `<h4>${topic.title} <span class="badge">יח${topic.unit}</span> <span class="badge">${topic.cat}</span></h4>`;
    topic.items.forEach((it, idx)=>{
      const box = document.createElement('div'); box.className='tile';
      if(it.kind==='MCQ'){
        box.innerHTML = `<div>${it.text||''}</div><div style="margin:6px 0"><strong>Q${idx+1}:</strong> ${it.prompt}</div>`;
        it.options.forEach((opt,i)=>{
          const btn = document.createElement('button'); btn.textContent = opt;
          btn.onclick = ()=>{ btn.textContent += (i===it.answer?' ✓':' ✗'); };
          box.appendChild(btn);
        });
      } else if(it.kind==='Cloze'){
        box.innerHTML = `<div style="margin:6px 0"><strong>Q${idx+1}:</strong> ${it.prompt}</div>`;
        const inp = document.createElement('input'); inp.placeholder='Answer';
        const ok = document.createElement('button'); ok.textContent='בדיקה';
        ok.onclick = ()=>{
          const val = (inp.value||'').trim().toLowerCase();
          const accept = it.answer.map(s=>String(s).toLowerCase());
          if(accept.includes(val)){ inp.classList.add('correct'); inp.classList.remove('wrong'); }
          else { inp.classList.add('wrong'); inp.classList.remove('correct'); }
        };
        box.appendChild(inp); box.appendChild(ok);
      }
      t.appendChild(box);
    });
    wrap.appendChild(t);
  });
}

// --- Auth UI ---
function showDash(u){
  $('#auth').hidden = true;
  $('#dash').hidden = false;
  byId('who').textContent = u.name;
  const units = u.units || [];
  all('.u').forEach(c=> c.checked = units.includes(c.value));
  renderCatalog(units.length?units:['3','4','5']); // default show all until saved
}

$('#btnRegister').onclick = ()=>{
  const name = byId('regName').value.trim();
  const email = byId('regEmail').value.trim().toLowerCase();
  const pass = byId('regPass').value;
  if(!name || !email || pass.length<8){ alert('מלא/י פרטים וודא/י סיסמה 8+'); return; }
  if(db.users.find(x=>x.email===email)){ alert('אימייל קיים'); return; }
  const user = { id:crypto.randomUUID(), name, email, pass, units:[] };
  db.users.push(user); db.save(); setCurrent({id:user.id}); alert('נרשמת — כנס/י');
};

$('#btnLogin').onclick = ()=>{
  const email = byId('loginEmail').value.trim().toLowerCase();
  const pass = byId('loginPass').value;
  const u = db.users.find(x=>x.email===email && x.pass===pass);
  if(!u){ byId('authMsg').textContent='פרטים שגויים'; return; }
  setCurrent({id:u.id}); showDash(u);
};

$('#btnLogout').onclick = logout;

$('#btnSaveUnits').onclick = ()=>{
  const uId = (currentUser()||{}).id;
  const u = db.users.find(x=>x.id===uId); if(!u){ return; }
  u.units = all('.u').filter(x=>x.checked).map(x=>x.value);
  db.save();
  renderCatalog(u.units);
};

// boot
(() => {
  const uId = (currentUser()||{}).id;
  if(!uId){ return; }
  const u = db.users.find(x=>x.id===uId);
  if(u){ showDash(u); }
})();
