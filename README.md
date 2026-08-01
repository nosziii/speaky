# Itt vagyok

Privát, valós idejű családi beszélgetőalkalmazás beszédfelismeréssel és játékos betűtanulással.

## Indítás Dockerrel

1. Másold le a `.env.example` fájlt `.env` néven.
2. Cseréld le a két jelszót és a `SESSION_SECRET` értékét.
3. Indítsd el: `docker compose up --build`
4. Nyisd meg: `http://localhost:8080`

A két előre beállított fiók az apa és a gyermek. Regisztráció szándékosan nincs. Az üzenetek PostgreSQL-ben, a Docker `postgres-data` kötetében maradnak meg.

A fiókok jelszavai Argon2id lenyomatként kerülnek PostgreSQL-be. A beállítások oldalon mindkét felhasználó bármikor megváltoztathatja a saját jelszavát; ilyenkor minden korábbi munkamenet érvénytelenné válik.

A beszélgetésben a „Küldj hangjelzést” gomb valós időben megszólaltatja a másik bejelentkezett fél eszközét. A küldő saját eszközén nem szólal meg.

## Beszédfelismerés

A mikrofonos diktálás Chrome és Edge alatt működik a legjobban. Éles, interneten elérhető környezetben HTTPS szükséges a mikrofon engedélyezéséhez. A felismert magyar szöveget a Python szerver tisztítja, menti és WebSocketen továbbítja.

## Fejlesztés és teszt

- Frontend build: `npm run build`
- Backend teszt: a `backend` mappában `pytest`
- API állapot: `/api/health`

## Android alkalmazás

Az Android-változat Capacitorra épül, és ugyanahhoz a Python/PostgreSQL szerverhez kapcsolódik.

- Android-emulátor és a helyi Docker-szerver: `npm run android:sync`
- Saját szerver használata PowerShellben: `$env:CAPACITOR_SERVER_URL='https://sajat-domain.hu'; npm run android:sync`
- Projekt megnyitása Android Studióban: `npm run android:open`

Az alapértelmezett `http://10.0.2.2:8080` cím az Android-emulátorból a fejlesztői számítógépet éri el. Valódi telefonos és kiadási buildhez HTTPS-es publikus szervercímet kell megadni. Az Android Studio és az Android SDK telepítése szükséges az APK/AAB elkészítéséhez.
