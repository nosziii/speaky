# Itt vagyok

Privát, valós idejű családi beszélgetőalkalmazás beszédfelismeréssel és játékos betűtanulással.

## Indítás Dockerrel

1. Másold le a `.env.example` fájlt `.env` néven.
2. Cseréld le a két jelszót és a `SESSION_SECRET` értékét.
3. Indítsd el: `docker compose up --build`
4. Nyisd meg: `http://localhost:9004`

A két előre beállított fiók az apa és a gyermek. Regisztráció szándékosan nincs. Az üzenetek PostgreSQL-ben, a Docker `postgres-data` kötetében maradnak meg.

A fiókok jelszavai Argon2id lenyomatként kerülnek PostgreSQL-be. A beállítások oldalon mindkét felhasználó bármikor megváltoztathatja a saját jelszavát; ilyenkor minden korábbi munkamenet érvénytelenné válik.

### Családi fiókok és jogosultságok

- Az első szülő a családi csoport adminja.
- Az admin a Család oldalon gyermek- és további szülői fiókokat hozhat létre.
- A szülők felhasználónév alapján privát beszélgetést indíthatnak más szülői fiókokkal.
- A gyermekek nem kereshetnek külső felhasználót és nem férhetnek hozzá szülők privát beszélgetéseihez.
- A gyermekek alapból csak a saját üzeneteiket és a család szülőinek üzeneteit látják.
- A családi admin külön kapcsolóval engedélyezheti a gyermekek egymás közötti kommunikációját.
- Minden korlátozás a Python szerveren és a WebSocket-küldésnél is érvényesül.

A beszélgetésben a „Küldj hangjelzést” gomb valós időben megszólaltatja a másik bejelentkezett fél eszközét. A küldő saját eszközén nem szólal meg.

## Beszédfelismerés

A mikrofonos diktálás Chrome és Edge alatt működik a legjobban. Éles, interneten elérhető környezetben HTTPS szükséges a mikrofon engedélyezéséhez. A felismert magyar szöveget a Python szerver tisztítja, menti és WebSocketen továbbítja.

## Tesztszerver: speaky.kalandjatek.eu

A konténerek előtt a szerveren futó HTTPS reverse proxy szolgálja ki a domaint. A `.env` fájlban állítsd a `SPEAKY_BIND_ADDRESS` értékét `127.0.0.1`-re, így a Docker gateway csak a szerveren belül érhető el. A reverse proxy továbbítsa a `https://speaky.kalandjatek.eu` forgalmát a `http://127.0.0.1:9004` címre, WebSocket támogatással.

Példa Caddy konfiguráció:

```caddyfile
speaky.kalandjatek.eu {
  reverse_proxy 127.0.0.1:9004
}
```

Az éles `.env` fájlban a `SECURE_COOKIE=true` kötelező. A `.env` nincs verziókezelésben, ezért azt külön kell létrehozni a szerveren.

Telepítés/frissítés:

```sh
git pull
docker compose up -d --build
docker compose ps
curl -fsS https://speaky.kalandjatek.eu/api/health
```

## Fejlesztés és teszt

- Frontend build: `npm run build`
- Backend teszt: a `backend` mappában `pytest`
- API állapot: `/api/health`

## Android alkalmazás

Az Android-változat Capacitorra épül, és ugyanahhoz a Python/PostgreSQL szerverhez kapcsolódik.

- Android-emulátor és a helyi Docker-szerver: `npm run android:sync`
- Saját szerver használata PowerShellben: `$env:CAPACITOR_SERVER_URL='https://sajat-domain.hu'; npm run android:sync`
- Projekt megnyitása Android Studióban: `npm run android:open`

Az alapértelmezett `http://10.0.2.2:9004` cím az Android-emulátorból a fejlesztői számítógépet éri el. Valódi telefonos és kiadási buildhez HTTPS-es publikus szervercímet kell megadni. Az Android Studio és az Android SDK telepítése szükséges az APK/AAB elkészítéséhez.
