
export const go = (url)=> window.location.href = url;
export const getParam = (k)=> new URLSearchParams(window.location.search).get(k);

export async function loadIndex(u='5', cat='reading'){
  // In a real app, fetch from backend. Here: static sample index.
  const idx = await fetch(`data/sample/index.json`).then(r=>r.json());
  return idx.filter(x=> String(x.unit)===String(u) && x.category.toLowerCase()===cat.toLowerCase());
}
export async function loadExercise(id){
  const res = await fetch(`data/sample/${id}.json`);
  return res.json();
}

/* UI helpers */
export function setupRing(){
  const CIRC = 2*Math.PI*18; // ~113
  const ring = document.getElementById('ringVal');
  const label = document.getElementById('ringLabel');
  const setProgress = (p)=>{ const off = CIRC*(1-p); ring.style.strokeDashoffset = off; label.textContent = Math.round(p*100)+'%'; };
  setProgress(0);
  return { setProgress };
}

export function setupMCQ(q, onAnswer){
  const wrap = document.createElement('div');
  wrap.className = 'q';
  wrap.dataset.correct = q.answer;
  const prompt = document.createElement('p');
  prompt.innerHTML = `<strong>שאלה:</strong> ${q.prompt}`;
  wrap.appendChild(prompt);
  const opts = document.createElement('div');
  opts.className = 'options'; opts.setAttribute('role','radiogroup');
  q.options.forEach(v=>{
    const o = document.createElement('div');
    o.className = 'option'; o.tabIndex = 0; o.dataset.v = v.key;
    o.setAttribute('role','radio'); o.textContent = v.text;
    const select = ()=>{
      [...opts.children].forEach(x=>x.setAttribute('aria-checked','false'));
      o.setAttribute('aria-checked','true');
      const ok = (o.dataset.v === q.answer);
      if(!document.body.hasAttribute('data-exam')){
        res.textContent = ok ? (q.okMsg || 'נכון!') : (q.hint || 'נסה שוב…');
        res.className = ok ? 'result ok' : 'result no';
      }
      onAnswer && onAnswer(ok);
    };
    o.addEventListener('click', select);
    o.addEventListener('keyup', (e)=> (e.key==='Enter'||e.key===' ') && select());
    opts.appendChild(o);
  });
  wrap.appendChild(opts);
  const res = document.createElement('div'); res.className = 'result'; res.style.marginTop = '12px';
  wrap.appendChild(res);
  return wrap;
}

export function setupCloze(q, onAnswer){
  const wrap = document.createElement('div'); wrap.className = 'q card'; 
  const p = document.createElement('p'); p.innerHTML = `<strong>השלם:</strong> ${q.prompt}`; wrap.appendChild(p);
  const input = document.createElement('input');
  input.type = 'text'; input.placeholder = 'הקלד/י תשובה'; input.className = 'option';
  const btn = document.createElement('button'); btn.textContent = 'בדיקה'; btn.className = 'btn'; btn.style.marginTop='12px';
  const res = document.createElement('div'); res.className = 'result'; res.style.marginTop='12px';
  const check = ()=>{
    const val = (input.value||'').trim().toLowerCase();
    const ok = [q.answer, ...(q.accept||[])].map(s=>s.toLowerCase()).includes(val);
    if(!document.body.hasAttribute('data-exam')){
      res.textContent = ok ? (q.okMsg || 'נכון!') : (q.hint || 'טיפ: בדוק הטיה/איות');
      res.className = ok ? 'result ok' : 'result no';
    }
    onAnswer && onAnswer(ok);
  };
  btn.addEventListener('click', check);
  input.addEventListener('keyup', e=> e.key==='Enter' && check());
  wrap.appendChild(input); wrap.appendChild(btn); wrap.appendChild(res);
  return wrap;
}
