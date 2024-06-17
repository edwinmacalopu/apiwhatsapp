const express = require('express');
const app = express();
const morgan = require('morgan');
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrImage = require('qr-image');
const wwebVersion = '2.3000.1012058694-alpha';
// Middleware
app.use(express.json());
app.use(morgan('dev'));

const client = new Client({
    webVersionCache: 
    {
        type: 'remote',
        remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${wwebVersion}.html`,
   } ,
    authStrategy: new LocalAuth(),
    puppeteer: { args: ["--no-sandbox", '--disable-setuid-sandbox'], headless: true, }
});

// Initialize WhatsApp client
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', message => {
    if (message.body === '!ping') {
        client.sendMessage(message.from, 'pong');
    }
});

client.initialize();

// Routes
app.get('/', (req, res) => {
    res.send('You are at the root of the project');
});

app.post('/api/login', (req, res) => {
    console.log("Entering API...");

    client.on('qr', qr => {
        console.log("Generating QR...");
        var qrbase64 = qrImage.imageSync(qr, { type: 'png' });
        res.send({ status: true, message: "Scan the QR to log in", image: qrbase64.toString('base64') });
    });

    client.on('ready', () => {
        console.log('Client is ready!');
        res.send({ status: true, message: "Client is already logged in" });
    });

    client.initialize();
});

app.post('/api/sendmessage', (req, res) => {
    const { message, to } = req.body;
    const chatId = to.substring(1) + "@c.us";
    
    client.sendMessage(chatId, message).then(response => {
        res.send({ status: true, message: 'Message sent successfully', response });
    }).catch(error => {
        res.status(500).send({ status: false, message: 'Failed to send message', error });
    });
});

// Commented out section for file sending
// app.post('/api/sendfile', (req, res) => {
//     const { message, to, file64 } = req.body;
//     console.log("Sending file...");
//     const media = new MessageMedia('application/pdf', file64, message);
//     client.sendMessage(to, media, { caption: message })
//         .then(response => {
//             res.send({ status: true, message: 'File sent successfully', response });
//         })
//         .catch(error => {
//             res.status(500).send({ status: false, message: 'Failed to send file', error });
//         });
// });

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));