const qrcode = require('qrcode-terminal');
const { useId } = require('react');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { salvarReservas, buscarReserva } = require('./reservas.js')

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: 'data'
    }),
});

const nameBot = "Maria";

let usuarios = {};

function iniciarFluxo(userId) {
    usuarios[userId] = {
        estado: "esperando_nome",
        dados: {
            nome: "",
            celular: "",
            data: "",
            hora: "",
            pessoas: "",
            observacao: "",
            email: ""
        }
    };
}

client.on('qr', (qr) => {
    console.log('QR Code recebido, escaneie no seu terminal:');
    qrcode.generate(qr, { small: true });
});

client.on('auth_failure', msg => {
    console.error('FALHA NA AUTENTICAÇÃO:', msg);
    console.error('Por favor, apague a pasta "data" e tente novamente.');
});

client.on('disconnected', reason => {
    console.log('Cliente desconectado!', reason);
})

client.on('error', err => {
    console.error('O cliente encontrou um erro:', err);
});

client.on('ready', () => {
    console.log('Cliente conectado!');
});

client.on('message', async message => {
    const chat = await message.getChat();
    let user = await message.getContact();

    if (message.body === "Quero ver minha reserva") {
        usuarios[userId] = {
            estado: "ver_reserva_nome",
            dados: {}
        };
        await chat.sendMessage("🔎 Vamos localizar sua reserva!\nQual seu nome completo?");
        return;
    }

    if (message.body === "Quero fazer uma reserva") {
        iniciarFluxo(userId)
        await chat.sendMessage(`🙋‍♀️ Oi ${user.pushname} meu nome é ${nameBot} 🤖. Vamos fazer sua reserva!\nQual seu nome completo?`);
        return;
    }

    if (!usuarios[useId]) return;

    const fluxo = usuarios[useId];

    switch (fluxo.estado) {
        //Fazer reserva
        case "esperando_nome":
            fluxo.dados.nome = message.body;
            fluxo.estado = "esperando_celular";
            await chat.sendMessage("📱 Qual é seu número de celular?");
            break;

        case "esperando_celular":
            fluxo.dados.celular = message.body;
            fluxo.estado = "esperando_data";
            await chat.sendMessage("📅 Qual a data da reserva?");
            break;

        case "esperando_data":
            fluxo.dados.data = message.body;
            fluxo.estado = "esperando_hora";
            await chat.sendMessage("⌚ Qual horário?");
            break;

        case "esperando_hora":
            fluxo.dados.hora = message.body;
            fluxo.estado = "esperando_pessoas";
            await chat.sendMessage("👨‍👩‍👧 Quantas pessoas?");
            break;

        case "esperando_pessoas":
            fluxo.dados.pessoas = message.body;
            fluxo.estado = "esperando_obs";
            await chat.sendMessage("📝 Alguma observação?");
            break;

        case "esperando_obs":
            fluxo.dados.observacao = message.body;
            fluxo.estado = "pergunta_email";
            await chat.sendMessage("📧 Deseja receber confirmação por e-mail? (sim/não)");
            break;

        case "pergunta_email":
            if (message.body.toLowerCase() === "sim") {
                fluxo.estado = "esperando_email";
                await chat.sendMessage("Digite seu e-mail:");
            } else {
                fluxo.estado = "confirmar";
                await mostrarResumo(chat, fluxo);
            }
            break;

        case "esperando_email":
            fluxo.dados.email = message.body;
            fluxo.estado = "confirmar";
            await mostrarResumo(chat, fluxo);
            break;

        case "confirmar":
            if (message.body.toLowerCase() === "sim") {
                await chat.sendMessage("😄 Pode digitar o que deseja alterar.");
            } else {
                // SALVAR NO JSON AQUI
                salvarReservas({
                    nome: fluxo.dados.nome,
                    celular: fluxo.dados.celular,
                    data: fluxo.dados.data,
                    hora: fluxo.dados.hora,
                    pessoas: fluxo.dados.pessoas,
                    observacao: fluxo.dados.observacao,
                    email: fluxo.dados.email || ""
                });

                await chat.sendMessage("🍕 Sua reserva foi confirmada! Até breve!");

                delete usuarios[userId];
            }
            break;
        
        // Ver reserva
        case "ver_reserva_nome":
            fluxo.dados.nome = message.body;
            fluxo.estado = "ver_reserva_celular";
            await chat.sendMessage("📱 Qual seu número de celular?");
            break;

        case "ver_reserva_celular":
            fluxo.dados.celular = message.body;

            const reservaEncontrada = buscarReserva(fluxo.dados.nome, fluxo.dados.celular);

            if (!reserva) {
                await chat.sendMessage("❌ Não encontrei nenhuma reserva 😞");
                delete usuarios[userId];
                return;
            }

            fluxo.reservaEncontrada = reserva;
            fluxo.estado = "acao_sobre_reserva";

            await chat.sendMessage(`
                📌 *RESERVA ENCONTRADA*

                👤 Nome: ${reserva.nome}
                📱 Celular: ${reserva.celular}
                📅 Data: ${reserva.data}
                ⌚ Hora: ${reserva.hora}
                👥 Pessoas: ${reserva.pessoas}
                📝 Observação: ${reserva.observacao}
                📧 E-mail: ${reserva.email || "Não informado"}

                O que deseja fazer?

                1️⃣ Alterar  
                2️⃣ Excluir  
                3️⃣ Cancelar
                `);
            break;

        case "acao_sobre_reserva":
            if (message.body === "1") {
                fluxo.estado = "escolher_campo";
                await chat.sendMessage(`
                    Qual campo deseja alterar?

                    1 - Nome  
                    2 - Celular  
                    3 - Data  
                    4 - Hora  
                    5 - Pessoas  
                    6 - Observação  
                    7 - E-mail
                `);
            }else if (message.body === "2") {
                fluxo.estado = "confirmar_exclusao";
                await chat.sendMessage("⚠️ Tem certeza que deseja excluir a reserva? (sim/não)");
            } else {
                await chat.sendMessage("👍 Ok, cancelado.");
                delete usuarios[userId];
            }
            break;

        case "escolher_campo":
            const opcao = message.body;

            const campos = {
                "1": "nome",
                "2": "celular",
                "3": "data",
                "4": "hora",
                "5": "pessoas",
                "6": "observacao",
                "7": "email"
            };

            if (!campos[opcao]) {
                await chat.sendMessage("Opção inválida. Escolha entre 1 e 7.");
                return;
            }

            fluxo.campoEdicao = campos[opcao];
            fluxo.estado = "alterar_campo";
            await chat.sendMessage(`Digite o novo valor para *${campos[opcao]}*`);
            break;

        case "alterar_campo":
            const novoValor = message.body;

            // carregar reservas
            const lista = carregarReservas();

            const index = lista.findIndex(r =>
                r.nome === fluxo.reservaEncontrada.nome &&
                r.celular === fluxo.reservaEncontrada.celular
            );

            if (index === -1) {
                await chat.sendMessage("❌ Erro: reserva não encontrada na base de dados.");
                delete usuarios[userId];
                return;
            }

            // altera o valor
            lista[index][fluxo.campoEdicao] = novoValor;

            // salva
            salvarTodasReservas(lista);

            await chat.sendMessage("✔️ Valor atualizado com sucesso!");

            delete usuarios[userId];
            break;

        case "confirmar_exclusao":
            if (message.body.toLowerCase() !== "sim") {
                await chat.sendMessage("Ufa! A reserva não foi excluída 😄");
                delete usuarios[userId];
                return;
            }

            const reservas = carregarReservas();

            const filtradas = reservas.filter(r =>
                !(r.nome === fluxo.reservaEncontrada.nome &&
                r.celular === fluxo.reservaEncontrada.celular)
            );

            salvarTodasReservas(filtradas);

            await chat.sendMessage("🗑️ A reserva foi excluída com sucesso.");

            delete usuarios[userId];
            break;

    }
});

async function mostrarResumo(chat, fluxo) {
    await chat.sendMessage(`
    ✨ *RESUMO DA RESERVA* ✨

    👤 Nome: ${fluxo.dados.nome}
    📱 Celular: ${fluxo.dados.celular}
    📅 Data: ${fluxo.dados.data}
    ⌚ Hora: ${fluxo.dados.hora}
    👥 Pessoas: ${fluxo.dados.pessoas}
    📝 Observação: ${fluxo.dados.observacao}
    📧 E-mail: ${fluxo.dados.email || "Não informado"}

    Deseja alterar algo? (sim/não)
    `);
}

client.initialize();