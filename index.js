const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy:new LocalAuth({
        dataPath: 'data'
    }),
});

client.on('qr',(qr)=>{
    console.log('QR Code recebido, escaneie no seu terminal:');
    qrcode.generate(qr,{small: true});
});

client.on('auth_failure', msg => {
    console.error('FALHA NA AUTENTICAÇÃO:', msg);
    console.error('Por favor, apague a pasta "data" e tente novamente.');
});

client.on('disconnected', reason => {
    console.log('Cliente desconectado!', reason);
})

client.on('ready', () =>{
    console.log('Cliente conectado!');
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