## 🤖 ChatBot com WhatsApp Web.js

Este projeto implementa um **ChatBot** utilizando a biblioteca **`whatsapp-web.js`** para interagir com o WhatsApp. A principal funcionalidade é responder automaticamente a mensagens e comandos, funcionando como um assistente de comunicação via WhatsApp.

----------

### ✨ Recursos Principais

-   **Integração com WhatsApp:** Usa a biblioteca `whatsapp-web.js` para conectar-se e controlar uma sessão do WhatsApp Web.
    
-   **Mensagens Automáticas:** Capacidade de responder a comandos ou palavras-chave predefinidas.
    
-   **Escaneamento QR Code:** Interface para autenticar a sessão do WhatsApp Web através de um QR Code.
    
-   **Desenvolvimento em JavaScript/Node.js:** Construído sobre a plataforma Node.js, garantindo alta performance e escalabilidade.
    

----------

### ⚙️ Tecnologias Utilizadas

**Tecnologia**

**Descrição**

**Node.js**

Ambiente de _runtime_ para execução do código JavaScript no servidor.

**`whatsapp-web.js`**

Biblioteca que fornece uma interface para o WhatsApp Web.

**JavaScript (ES6+)**

Linguagem de programação principal.

----------

### 🚀 Começando

Estas instruções permitirão que você configure e execute o _chatbot_ em sua máquina local para desenvolvimento e testes.

#### Pré-requisitos

Você precisará ter instalado em sua máquina:

1.  **Node.js** (versão 14 ou superior).
    
2.  **npm** (gerenciador de pacotes do Node.js).
    

#### Instalação e Execução

1.  **Clone o repositório:**
    
    Bash
    
    ```
    git clone https://github.com/thaliadani/chatbot-wwebjs.git
    ```
    
2.  **Navegue até o diretório do projeto:**
    
    Bash
    
    ```
    cd chatbot-wwebjs
    ```
    
3.  **Instale as dependências:**
    
    Bash
    
    ```
    npm install
    ```
    
4.  **Inicie o projeto:**
    
    Bash
    
    ```
    npm start
    # Ou 'node index.js' (se 'index.js' for o arquivo principal)
    ```
    

#### Autenticação

Ao iniciar o projeto pela primeira vez, será gerado um **QR Code** no terminal. Você precisará escanear este código com o seu celular (Vá em **WhatsApp > Aparelhos conectados > Conectar um aparelho**) para autenticar a sessão do _chatbot_.

----------

### ✍️ Uso

O _chatbot_ foi configurado para responder a comandos específicos (geralmente prefixados, como `!help` ou `!comando`).

**Exemplo de Configuração:**

Para customizar as respostas, você deve editar o arquivo principal (provavelmente `index.js` ou `app.js`) na seção onde as mensagens são processadas:

JavaScript

```
// Exemplo de como a lógica de resposta deve estar estruturada no código
client.on('message', message => {
    if (message.body === '!ping') {
        message.reply('pong');
    } else if (message.body === '!ajuda') {
        message.reply('Os comandos disponíveis são: !ping, !status.');
    }
});

```

_(**Nota:** Verifique o código-fonte para ver a lista exata de comandos implementados.)_
