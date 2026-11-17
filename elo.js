
// RECUPERAR AS INFORMAÇÕES SALVAS

let compras = JSON.parse(localStorage.getItem("eloCompras")) || [];

let pagamentos = JSON.parse(localStorage.getItem("eloPagamentos")) || [];

let configuracao = JSON.parse(localStorage.getItem("eloConfiguracao")) || {};


// LOCALIZAR OS FORMULÁRIOS

const formConfiguracao = document.getElementById("formConfiguracao");

const formCompra = document.getElementById("formCompra");

const formPagamento = document.getElementById("formPagamento");


// CARREGAR AS CONFIGURAÇÕES SALVAS

if (configuracao.fechamento) {
    document.getElementById("fechamento").value = configuracao.fechamento;
    document.getElementById("vencimento").value = configuracao.vencimento;
    document.getElementById("juros").value = configuracao.juros;
}


// SALVAR AS CONFIGURAÇÕES

formConfiguracao.addEventListener("submit", function(event) {

    event.preventDefault();

    configuracao = {
        fechamento: document.getElementById("fechamento").value,
        vencimento: document.getElementById("vencimento").value,
        juros: Number(document.getElementById("juros").value)
    };

    localStorage.setItem("eloConfiguracao", JSON.stringify(configuracao));

    atualizarTela();

    alert("Configurações salvas!");

});


// CADASTRAR UMA COMPRA

formCompra.addEventListener("submit", function(event) {

    event.preventDefault();

    const descricao = document.getElementById("descricao").value;

    const valor = Number(document.getElementById("valor").value);

    const dataCompra = document.getElementById("dataCompra").value;

    compras.push({
        descricao: descricao,
        valor: valor,
        data: dataCompra
    });

    localStorage.setItem("eloCompras", JSON.stringify(compras));

    formCompra.reset();

    atualizarTela();

});


// REGISTRAR UM PAGAMENTO

formPagamento.addEventListener("submit", function(event) {

    event.preventDefault();

    const valorPago = Number(document.getElementById("valorPago").value);

    const dataPagamento = document.getElementById("dataPagamento").value;

    pagamentos.push({
        valor: valorPago,
        data: dataPagamento
    });

    localStorage.setItem("eloPagamentos", JSON.stringify(pagamentos));

    formPagamento.reset();

    atualizarTela();

});


// CONVERTER DATA PARA CALCULAR OS DIAS

function converterData(data) {

    const [ano, mes, dia] = data.split("-").map(Number);

    return new Date(Date.UTC(ano, mes - 1, dia));

}


// FORMATO DE DINHEIRO

function dinheiro(valor) {

    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

}


// CALCULAR O SALDO E OS JUROS

function calcularFatura() {

    const totalCompras = compras.reduce((soma, compra) => {
        return soma + compra.valor;
    }, 0);

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    let saldo = totalCompras;
    let jurosAcumulados = 0;

    const totalPago = pagamentos.reduce((soma, pagamento) => {
        return soma + pagamento.valor;
    }, 0);

    const vencimento = configuracao.vencimento;
    const taxaMensal = Number(configuracao.juros) || 0;

    // APLICAR OS PAGAMENTOS REALIZADOS ATÉ HOJE

    const pagamentosValidos = pagamentos
        .filter(p => converterData(p.data) <= hoje)
        .sort((a, b) => a.data.localeCompare(b.data));

    if (vencimento) {

        const dataVencimento = converterData(vencimento);

        // PAGAMENTOS FEITOS ANTES DO VENCIMENTO

        pagamentosValidos.forEach(pagamento => {

            if (converterData(pagamento.data) < dataVencimento) {
                saldo -= pagamento.valor;
            }

        });

        saldo = Math.max(0, saldo);

        // CALCULAR A TAXA DIÁRIA EQUIVALENTE

        const taxaDiaria = Math.pow(1 + taxaMensal / 100, 1 / 30) - 1;

        // CALCULAR JUROS DIA A DIA

        if (hoje > dataVencimento) {

            let dataAtual = new Date(dataVencimento);

            while (dataAtual <= hoje) {

                // APLICAR PAGAMENTOS DO DIA

                pagamentosValidos.forEach(pagamento => {

                    if (converterData(pagamento.data).getTime() === dataAtual.getTime()
                        && dataAtual > dataVencimento) {

                        saldo -= pagamento.valor;
                        saldo = Math.max(0, saldo);

                    }

                });

                // OS JUROS COMEÇAM NO DIA SEGUINTE AO VENCIMENTO

                if (dataAtual > dataVencimento && saldo > 0) {

                    const jurosDoDia = saldo * taxaDiaria;

                    saldo += jurosDoDia;

                    jurosAcumulados += jurosDoDia;

                }

                dataAtual.setUTCDate(dataAtual.getUTCDate() + 1);

            }

        }

    } else {

        // SEM DATA DE VENCIMENTO, CONSIDERAR OS PAGAMENTOS

        pagamentosValidos.forEach(pagamento => {
            saldo -= pagamento.valor;
        });

        saldo = Math.max(0, saldo);

    }

    return {
        totalCompras,
        totalPago,
        saldo,
        jurosAcumulados
    };

}


// MOSTRAR AS COMPRAS NA TELA

function mostrarCompras() {

    const lista = document.getElementById("listaCompras");

    lista.innerHTML = "";

    compras.forEach(compra => {

        const item = document.createElement("li");

        item.textContent =
            compra.descricao + " - " +
            dinheiro(compra.valor) + " - " +
            compra.data;

        lista.appendChild(item);

    });

}


// MOSTRAR OS PAGAMENTOS NA TELA

function mostrarPagamentos() {

    const lista = document.getElementById("listaPagamentos");

    lista.innerHTML = "";

    pagamentos.forEach(pagamento => {

        const item = document.createElement("li");

        item.textContent =
            dinheiro(pagamento.valor) + " - " +
            pagamento.data;

        lista.appendChild(item);

    });

}


// ATUALIZAR OS VALORES DA PÁGINA

function atualizarTela() {

    const resultado = calcularFatura();

    document.getElementById("totalCompras").textContent =
        dinheiro(resultado.totalCompras);

    document.getElementById("totalPago").textContent =
        dinheiro(resultado.totalPago);

    document.getElementById("totalJuros").textContent =
        dinheiro(resultado.jurosAcumulados);

    document.getElementById("saldo").textContent =
        dinheiro(resultado.saldo);

    mostrarCompras();

    mostrarPagamentos();

}


// EXECUTAR AO ABRIR A PÁGINA

atualizarTela();
