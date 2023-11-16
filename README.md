# sum11-bot

Bot for Telegram (https://t.me/sum11_bot) with Ukrainian dictionary.
Using site sum.in.ua.

## Run

```bash
cp .env.example .env
```

Put bot token into `.env`.

```bash
npm run start
```

## Build and run production

```bash
npm run build
node ./dist/server.js
```

## Run as service (POSIX systems with systemd)

```bash
sudo mkdir /opt/sum11-bot
sudo cp ./.env /opt/sum11-bot
sudo cp ./dist /opt/sum11-bot -r
sudo cp ./node_modules /opt/sum11-bot -r
sudo cp ./systemd/sum11-bot.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now sum11-bot.service
```

Show log:

```bash
journalctl -xeu sum11-bot.service
```
