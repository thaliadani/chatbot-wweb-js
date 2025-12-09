const fs = require("fs");
const path = require("path");

const reservasPath = path.join(__dirname, "..", "reservas.json");

// Lê o arquivo de reservas
function carregarReservas() {
    try {
        const data = fs.readFileSync(reservasPath, "utf8");
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Salva reservas no arquivo JSON
function salvarReservas(novaReserva) {
    const reservas = carregarReservas();
    reservas.push(novaReserva);

    salvarTodasReservas(reservas);
}

// Salva todas as reservas no arquivo JSON
function salvarTodasReservas(reservas) {
    fs.writeFileSync(reservasPath, JSON.stringify(reservas, null, 4), "utf8");
}

// Buscar reserva no arquivo json
function buscarReserva(nome, celular) {
    const reservas = carregarReservas();

    return reservas.find(r =>
        r.nome.toLowerCase() === nome.toLowerCase() &&
        r.celular.replace(/\D/g, "") === celular.replace(/\D/g, "")
    );
}

// Buscar reserva por celular no arquivo json
function buscarReservaPorCelular(celular) {
    const reservas = carregarReservas();

    return reservas.find(r =>
        r.celular.replace(/\D/g, "") === celular.replace(/\D/g, "")
    );
}

module.exports = {
    carregarReservas,
    salvarReservas,
    salvarTodasReservas,
    buscarReserva,
    buscarReservaPorCelular
};