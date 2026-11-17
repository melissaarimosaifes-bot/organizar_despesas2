
let compras = JSON.parse(localStorage.getItem("nubankCompras")) || [];
let pagamentos = JSON.parse(localStorage.getItem("nubankPagamentos")) || [];
let configuracao = JSON.parse(localStorage.getItem("nubankConfiguracao")) || {};

const formConfiguracao = document.getElementById("formConfiguracao");
const formCompra = document.getElementById("formCompra");
const formPagamento = document.getElementById("formPagamento");

formConfiguracao.addEventListener("submit", function(e) {
    e.preventDefault();

    configuracao = {
        fechamento: document.getElementById("fechamento").value,
        vencimento: document.getElementById("vencimento").value,
        juros: Number(document.getElementById("juros").value)
    };

    localStorage.setItem("nubankConfiguracao", JSON.stringify(configuracao));

    atualizarResumo();
});

formCompra.addEventListener("submit", function(e) {
    e.preventDefault();

    const descricao = document.getElementById("descricao").value;
    const valor = Number(document.getElementById("valor").value);
    const data = document.getElementById("dataCompra").value;

    compras.push({
        descricao: descricao,
        valor: valor,
        data: data
    });

    localStorage.setItem("nubankCompras", JSON.stringify(compras));

    formCompra.reset();
    atualizarResumo();
});

formPagamento.addEventListener("submit", function(e) {
    e.preventDefault();

    const valor = Number(document.getElementById("valorPago").value);
    const data = document.getElementById("dataPagamento").value;

    pagamentos.push({
        valor: valor,
        data: data
    });

    localStorage.setItem("nubankPagamentos", JSON.stringify(pagamentos));

    formPagamento.reset();
    atualizarResumo();
});

function atualizarResumo() {
    const totalCompras = compras.reduce((total, compra) => total + compra.valor, 0);
    const totalPago = pagamentos.reduce((total, pagamento) => total + pagamento.valor, 0);

    let saldo = Math.max(0, totalCompras - totalPago);
    let totalJuros = 0;

    if (configuracao.vencimento && configuracao.juros > 0) {
        const vencimento = new Date(configuracao.vencimento + "T00:00:00");
        const hojeData = new Date();

        const hoje = new Date(
            hojeData.getFullYear(),
            hojeData.getMonth(),
            hojeData.getDate()
        );

        let dataAtual = new Date(vencimento);
        dataAtual.setDate(dataAtual.getDate() + 1);

        while (dataAtual <= hoje && saldo > 0) {
            const pagamentosDoDia = pagamentos
                .filter(p => p.data === dataAtual.toISOString().slice(0, 10))
                .reduce((total, p) => total + p.valor, 0);

            saldo = Math.max(0, saldo - pagamentosDoDia);

            if (saldo > 0) {
                saldo += saldo * (configuracao.juros / 100);
            }

            dataAtual.setDate(dataAtual.getDate() + 1);
        }

        totalJuros = saldo - Math.max(0, totalCompras - totalPago);
        totalJuros = Math.max(0, totalJuros);
    }

    document.getElementById("totalCompras").textContent = totalCompras.toFixed(2);
    document.getElementById("totalPago").textContent = totalPago.toFixed(2);
    document.getElementById("totalJuros").textContent = totalJuros.toFixed(2);
    document.getElementById("saldo").textContent = saldo.toFixed(2);

    document.getElementById("listaCompras").innerHTML = compras
        .map(c => `<li>${c.descricao} - R$ ${c.valor.toFixed(2)} - ${c.data}</li>`)
        .join("");

    document.getElementById("listaPagamentos").innerHTML = pagamentos
        .map(p => `<li>R$ ${p.valor.toFixed(2)} - ${p.data}</li>`)
        .join("");
}

atualizarResumo();
