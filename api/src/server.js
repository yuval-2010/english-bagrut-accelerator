import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pkg from 'pg';
import { z } from 'zod';
import 'dotenv/config';

const { Pool } = pkg;
const app = express();
const port = process.env.PORT || 8080;
const pool = new Pool({ host:process.env.PGHOST, port:process.env.PGPORT, database:process.env.PGDATABASE, user:process.env.PGUSER, password:process.env.PGPASSWORD });

app.use(helmet()); app.use(cors()); app.use(express.json({ limit: '1mb' })); app.use(morgan('combined'));
app.set('trust proxy', 1);
const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 60 });
const signToken = (payload)=> jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: Number(process.env.JWT_EXPIRES||3600) });
const auth = (req,res,next)=>{ const h=req.headers.authorization||''; const tok=h.startsWith('Bearer ')?h.slice(7):null; if(!tok) return res.status(401).json({error:'missing token'}); try{ req.user=jwt.verify(tok, process.env.JWT_SECRET); next(); }catch{ return res.status(401).json({error:'invalid token'});} };

app.post('/api/auth/register', authLimiter, async (req,res)=>{
  const p = z.object({ email:z.string().email(), password:z.string().min(8), full_name:z.string().min(2) }).safeParse(req.body);
  if(!p.success) return res.status(400).json({error:'invalid payload'});
  const { email, password, full_name } = p.data;
  const pass_hash = await bcrypt.hash(password, 10);
  try{
    const u = await pool.query('INSERT INTO users(email, pass_hash, role) VALUES($1,$2,\'student\') RETURNING id,email,role', [email, pass_hash]);
    await pool.query('INSERT INTO profiles(user_id, full_name) VALUES($1,$2)', [u.rows[0].id, full_name]);
    res.status(201).json({ok:true});
  } catch(e){ if(String(e).includes('unique')) return res.status(400).json({error:'email exists'}); res.status(500).json({error:'server error'}); }
});

app.post('/api/auth/login', authLimiter, async (req,res)=>{
  const p = z.object({ email:z.string().email(), password:z.string() }).safeParse(req.body);
  if(!p.success) return res.status(400).json({error:'invalid payload'});
  const r = await pool.query('SELECT id,email,pass_hash,role FROM users WHERE email=$1',[p.data.email]);
  if(!r.rowCount) return res.status(401).json({error:'invalid creds'});
  const ok = await bcrypt.compare(p.data.password, r.rows[0].pass_hash);
  if(!ok) return res.status(401).json({error:'invalid creds'});
  const token = signToken({ uid:r.rows[0].id, role:r.rows[0].role });
  res.json({ token });
});

app.get('/api/me', auth, async (req,res)=>{
  const user = await pool.query('SELECT u.id,u.email,u.role,p.full_name FROM users u JOIN profiles p ON p.user_id=u.id WHERE u.id=$1',[req.user.uid]);
  const units = await pool.query('SELECT code FROM user_units uu JOIN units un ON un.id=uu.unit_id WHERE uu.user_id=$1',[req.user.uid]);
  res.json({ profile:user.rows[0], units: units.rows.map(r=>r.code) });
});

app.put('/api/me/units', auth, async (req,res)=>{
  const p = z.object({ unit_codes:z.array(z.enum(['3','4','5'])).min(1) }).safeParse(req.body);
  if(!p.success) return res.status(400).json({error:'invalid payload'});
  const client = await pool.connect();
  try{
    await client.query('BEGIN');
    await client.query('DELETE FROM user_units WHERE user_id=$1',[req.user.uid]);
    for(const code of p.data.unit_codes){
      const uid = await client.query('SELECT id FROM units WHERE code=$1',[code]);
      await client.query('INSERT INTO user_units(user_id, unit_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[req.user.uid, uid.rows[0].id]);
    }
    await client.query('COMMIT'); res.status(204).end();
  } catch(e){ await client.query('ROLLBACK'); res.status(500).json({error:'server error'}); }
  finally{ client.release(); }
});

app.get('/api/catalog/units', async (_req,res)=>{
  const r = await pool.query('SELECT code,title FROM units ORDER BY code');
  res.json(r.rows);
});

app.get('/api/health', (_req,res)=> res.json({ok:true}));
app.listen(port, ()=> console.log('API on :' + port));
