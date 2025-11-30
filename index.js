const { generate } = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy:new LocalAuth({
        dataPath: 'data'
    }),
    puppeteer: {
        headless: false,
        args: [ 
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    }
});

client.on('qr',(qr)=>{
    console.log('QR Code recebido, escaneie no seu terminal:');
    generate(qr,{small: true});
});

client.on('auth_failure', msg => {
    console.error('FALHA NA AUTENTICAÇÃO:', msg);
    console.error('Por favor, apague a pasta "data" e tente novamente.');
});

client.on('disconnected', reason => {
    console.log('Cliente desconectado!', reason);
})

client.on('ready', () =>{
    console.log('Client is ready!');
});

client.on('message', message =>{
    if(message.body === "!ping"){
        message.reply('pong');
    };
});

client.on('error', err => {
    console.error('O cliente encontrou um erro:', err);
});

client.initialize();