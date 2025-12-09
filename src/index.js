const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { salvarReservas, buscarReserva, carregarReservas, salvarTodasReservas, buscarReservaPorCelular } = require('./reservas.js')

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
    const userId = message.from;
    const userName = message._data.notifyName || chat.name;

    if (message.body === "Quero ver minha reserva") {
        usuarios[userId] = {
            estado: "ver_reserva_celular_inicio",
            dados: {},
        };
        await chat.sendMessage(`*${nameBot}*: Olá, *${userName}*! 👋 Para encontrar sua reserva, pode me informar seu número de celular, por favor? (ex: (99) 99999-9999)`);
        return;
    }

    if (message.body === "Quero fazer uma reserva") {
        iniciarFluxo(userId)
        await chat.sendMessage(`*${nameBot}*: Olá, *${userName}*! Que bom ter você por aqui. 😊 Vamos começar sua reserva. Qual seu nome completo?`);
        return;
    } 

    if (!usuarios[userId]) return;

    const fluxo = usuarios[userId];

    switch (fluxo.estado) {
        //Fazer reserva
        case "esperando_nome":
            fluxo.dados.nome = message.body;
            fluxo.estado = "esperando_celular";
            await chat.sendMessage(`*${nameBot}*: Obrigada, ${fluxo.dados.nome}! Agora, qual o seu número de celular? 📱 (ex: (99) 99999-9999)`);
            break;

        case "esperando_celular":
            fluxo.dados.celular = message.body;
            fluxo.estado = "esperando_data";
            await chat.sendMessage(`*${nameBot}*: Perfeito! E para qual data você gostaria de reservar? 📅 (ex: DD/MM/AAAA)`);
            break;

        case "esperando_data":
            fluxo.dados.data = message.body;
            fluxo.estado = "esperando_hora";
            await chat.sendMessage(`*${nameBot}*: Anotado! E qual seria o horário? ⌚ (ex: 19:30)`);
            break;

        case "esperando_hora":
            fluxo.dados.hora = message.body;
            fluxo.estado = "esperando_pessoas";
            await chat.sendMessage(`*${nameBot}*: Ótimo! A reserva será para quantas pessoas? 👨‍👩‍👧 (ex: 5)`);
            break;

        case "esperando_pessoas":
            fluxo.dados.pessoas = message.body;
            fluxo.estado = "esperando_obs";
            await chat.sendMessage(`*${nameBot}*: Estamos quase lá! Você tem alguma observação ou pedido especial? 📝 (ex: mesa perto da janela, comemoração de aniversário, etc.)`);
            break;

        case "esperando_obs":
            fluxo.dados.observacao = message.body;
            fluxo.estado = "pergunta_email";
            await chat.sendMessage(`*${nameBot}*: Legal! Gostaria de receber a confirmação da reserva por e-mail também? 📧 (sim/não)`);
            break;

        case "pergunta_email":
            if (message.body.toLowerCase() === "sim") {
                fluxo.estado = "esperando_email";
                await chat.sendMessage(`*${nameBot}*: Claro! Qual o seu melhor e-mail? (ex: seuemail@dominio.com)`);
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
            if (message.body.toLowerCase() === "não") {
                fluxo.estado = "alterar_reserva_em_criacao";
                await chat.sendMessage(`*${nameBot}*: Sem problemas! Me diga o que você gostaria de alterar (nome, celular, data, etc.).`);
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

                await chat.sendMessage(`*${nameBot}*: 🍕 Sua reserva foi confirmada! Até breve!`);

                delete usuarios[userId];
            }
            break;

        case "alterar_reserva_em_criacao":
            const campoParaAlterar = message.body.toLowerCase();
            const camposValidos = ["nome", "celular", "data", "hora", "pessoas", "observacao", "email"];

            if (camposValidos.includes(campoParaAlterar)) {
                fluxo.campoEdicao = campoParaAlterar;
                fluxo.estado = "aguardando_novo_valor";
                await chat.sendMessage(`*${nameBot}*: Certo! Qual é a nova informação para *${campoParaAlterar}*?`);
            } else {
                await chat.sendMessage(`*${nameBot}*: Hmm, não entendi. Por favor, digite um dos campos que aparecem no resumo para que eu possa alterar.`);
            }
            break;

        case "aguardando_novo_valor":
            const novoValorReserva = message.body;
            fluxo.dados[fluxo.campoEdicao] = novoValorReserva;
            fluxo.estado = "confirmar"; 
            await chat.sendMessage("Prontinho, informação alterada! ✅");
            await mostrarResumo(chat, fluxo);
            break;


        // Ver reserva
        case "ver_reserva_celular_inicio":
            fluxo.dados.celular = message.body;
            const reservaPorCelular = buscarReservaPorCelular(fluxo.dados.celular);

            if (!reservaPorCelular) {
                await chat.sendMessage(`*${nameBot}*: Puxa, não encontrei nenhuma reserva com este número de celular. 😞 Vamos tentar de novo?`); 
                delete usuarios[userId];
                return;
            }

            fluxo.reservaEncontrada = reservaPorCelular;
            fluxo.estado = "confirmar_identidade_reserva";
            await chat.sendMessage(`*${nameBot}*: Encontrei uma reserva em nome de *${reservaPorCelular.nome}*. É você? (sim/não)`);
            break;

        case "confirmar_identidade_reserva":
            if (message.body.toLowerCase() !== 'sim') {
                await chat.sendMessage(`*${nameBot}*: Tudo bem! Se mudar de ideia ou precisar de outra coisa, é só chamar. 😉`);
                delete usuarios[userId];
                return;
            }

            const reservaEncontrada = fluxo.reservaEncontrada;

            if (!reservaEncontrada) {
                await chat.sendMessage(`*${nameBot}*: Que estranho, não estou conseguindo carregar os dados da sua reserva. 😥`);
                delete usuarios[userId];
                return;
            }

            fluxo.estado = "acao_sobre_reserva";

            await chat.sendMessage(`*${nameBot}*: 📌 *RESERVA ENCONTRADA*
Aqui estão os detalhes:
 Nome: ${reservaEncontrada.nome}
📱 Celular: ${reservaEncontrada.celular}
📅 Data: ${reservaEncontrada.data}
⌚ Hora: ${reservaEncontrada.hora}
👥 Pessoas: ${reservaEncontrada.pessoas}
📝 Observação: ${reservaEncontrada.observacao}
📧 E-mail: ${reservaEncontrada.email || "Não informado"}

O que você gostaria de fazer agora?

1️⃣ Alterar  
2️⃣ Excluir  
3️⃣ Cancelar`);
            break;

        case "acao_sobre_reserva":
            if (message.body === "1") {
                fluxo.estado = "escolher_campo";
                await chat.sendMessage(`*${nameBot}*: Qual campo deseja alterar?

1 - Nome  
2 - Celular  
3 - Data  
4 - Hora  
5 - Pessoas  
6 - Observação  
7 - E-mail`);
            }else if (message.body === "2") {
                fluxo.estado = "confirmar_exclusao";
                await chat.sendMessage(`*${nameBot}*: ⚠️ Tem certeza que deseja excluir a reserva? (sim/não)`);
            } else { 
                await chat.sendMessage("👍 Certo, ação cancelada. Sua reserva continua confirmada!");
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
                await chat.sendMessage(`*${nameBot}*: Opção inválida. Por favor, escolha um número entre 1 e 7.`);
                return;
            }

            fluxo.campoEdicao = campos[opcao];
            fluxo.estado = "alterar_campo";
            await chat.sendMessage(`*${nameBot}*: Entendi. Por favor, digite a nova informação para *${campos[opcao]}*.`);
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
                await chat.sendMessage("❌ Ops! Ocorreu um erro ao tentar encontrar sua reserva para atualizar. Tente novamente, por favor.");
                delete usuarios[userId];
                return;
            }

            // altera o valor
            lista[index][fluxo.campoEdicao] = novoValor;

            // salva
            salvarTodasReservas(lista);

            await chat.sendMessage("✔️ Prontinho! Sua reserva foi atualizada com sucesso!");
            
            delete usuarios[userId];
            break;

        case "confirmar_exclusao":
            if (message.body.toLowerCase() !== "sim") {
                await chat.sendMessage("Ufa, que bom! Sua reserva não foi excluída. 😄");
                delete usuarios[userId];
                return;
            }

            const reservas = carregarReservas();

            const filtradas = reservas.filter(r =>
                !(r.nome === fluxo.reservaEncontrada.nome &&
                r.celular === fluxo.reservaEncontrada.celular)
            );

            salvarTodasReservas(filtradas);

            await chat.sendMessage(`*${nameBot}*: 🗑️ A reserva foi excluída com sucesso.`);

            delete usuarios[userId];
            break;

    }
});

async function mostrarResumo(chat, fluxo) {
    await chat.sendMessage(`*${nameBot}*: ✨ *RESUMO DA RESERVA* ✨

👤 Nome: ${fluxo.dados.nome}
📱 Celular: ${fluxo.dados.celular}
📅 Data: ${fluxo.dados.data}
⌚ Hora: ${fluxo.dados.hora}
👥 Pessoas: ${fluxo.dados.pessoas}
📝 Observação: ${fluxo.dados.observacao}
📧 E-mail: ${fluxo.dados.email || "Não informado"}

*${nameBot}*: As informações estão corretas? Se quiser mudar algo, é só dizer "não".`);
}

client.initialize();