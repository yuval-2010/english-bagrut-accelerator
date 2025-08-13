# English Bagrut Accelerator — Upgrade (v2)

## מה יש כאן
- **api/** — Node/Express + PostgreSQL + JWT (הרשמה/כניסה, בחירת יחידות, קטלוג).
- **web/** — פרונט סטטי (דשבורד) + Nginx proxy ל-/api.
- **docker-compose.yml** — Postgres + API + Nginx בפקודה אחת.
- **seed.js** — זריעה בסיסית (דמו) בשביל לראות תוכן מיידית.

## הרצה מקומית
1) העתק `.env.example` ל-`api/.env` ועדכן ערכים.
2) הרמה:
```bash
docker compose up --build
# Web: http://localhost:8088
# API: http://localhost:8080/api/health
```

## פריסה
- אם Pages מגיש מה־root, אפשר להעתיק את תוכן `web/dist` לשורש; אחרת הגדר Pages לשרת מתוך `web/dist`.
- עדכן את `API='/api'` ב־`web/dist/index.html` לכתובת ה־API האמיתית אם רץ בדומיין אחר.
