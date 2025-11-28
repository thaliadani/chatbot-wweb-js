import { generate } from 'qrcode-terminal';
import { Client, LocalAuth } from 'whatsapp-web.js';

const client = new Client({
    authStrategy:new LocalAuth({
            dataPath: 'data'
        })
});

client.on('qr',(qr)=>{
    generate(qr,{small: true});
})

client.on('ready', () =>{
    console.log('Client is ready!');
});

client.on('message_create', message =>{
    if(message.body =="!ping"){
        message.reply('pong');
    };
});

client.initialize();