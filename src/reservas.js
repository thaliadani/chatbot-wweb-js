const fs = require("fs");

// Lê o arquivo de reservas
function carregarReservas() {
    try {
        const data = fs.readFileSync("../reservas.json", "utf8");
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Salva reservas no arquivo JSON
function salvarReservas(novaReserva) {
    const reservas = carregarReservas();
    reservas.push(novaReserva);

    fs.writeFileSync("../reservas.json", JSON.stringify(reservas, null, 4), "utf8");
}

// Buscar reserva no arquivo json
function buscarReserva(nome, celular) {
    const reservas = carregarReservas();

    return reservas.find(r =>
        r.nome.toLowerCase() === nome.toLowerCase() &&
        r.celular.replace(/\D/g, "") === celular.replace(/\D/g, "")
    );
}