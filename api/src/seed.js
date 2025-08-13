import pkg from 'pg'; import 'dotenv/config';
const { Pool } = pkg;
const pool = new Pool({ host:process.env.PGHOST, port:process.env.PGPORT, database:process.env.PGDATABASE, user:process.env.PGUSER, password:process.env.PGPASSWORD });

const units = await pool.query('SELECT id, code FROM units'); const map = Object.fromEntries(units.rows.map(r=>[r.code,r.id]));
const c = await pool.query('SELECT COUNT(*)::int AS c FROM topics'); if (c.rows[0].c>0){ console.log('Skip seed'); process.exit(0); }

async function topic(unit_code, category, title){ return (await pool.query('INSERT INTO topics(unit_id, category, title) VALUES($1,$2,$3) RETURNING id',[map[unit_code],category,title])).rows[0].id; }
async function lesson(topic_id, title, objective, reading_html, grammar_html, duration_min){ return (await pool.query('INSERT INTO lessons(topic_id,title,objective,reading_html,grammar_html,duration_min) VALUES($1,$2,$3,$4,$5,$6) RETURNING id',[topic_id,title,JSON.stringify(objective||[]),reading_html||'',grammar_html||'',duration_min||25])).rows[0].id; }
async function exercise(lesson_id, qtype, payload, difficulty){ await pool.query('INSERT INTO exercises(lesson_id,qtype,payload,difficulty) VALUES($1,$2,$3,$4)',[lesson_id,qtype,JSON.stringify(payload),difficulty||'med']); }

// U3 sample
const t3r = await topic('3','reading','Main Idea & Details');
const l3r = await lesson(t3r,'Urban Gardens',['main idea','detail'],'<p>Community gardens turn empty lots into green spaces.</p>','',25);
await exercise(l3r,'MCQ',{prompt:'What is the main idea?',options:[{key:'A',text:'Expensive'},{key:'B',text:'Improve communities'},{key:'C',text:'Need tools'},{key:'D',text:'Cause traffic'}],answer:'B',hint:'overall message'},'med');

console.log('Seed complete'); process.exit(0);
