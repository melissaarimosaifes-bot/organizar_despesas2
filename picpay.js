
// RECUPERAR AS INFORMAÇÕES SALVAS

let compras = JSON.parse(localStorage.getItem("picpayCompras")) || [];

let pagamentos = JSON.parse(localStorage.getItem("picpayPagamentos")) || [];

let configuracao = JSON.parse(localStorage.getItem("picpayConfiguracao")) || {};


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

    const fechamento = document.getElementById("fechamento").value;

    const vencimento = document.getElementById("vencimento").value;

    const juros = Number(document.getElementById("juros").value);

    if (vencimento < fechamento) {
        alert("O vencimento não pode ser anterior ao fechamento.");
        return;
    }

    configuracao = {
        fechamento: fechamento,
        vencimento: vencimento,
        juros: juros
    };

    localStorage.setItem(
        "picpayConfiguracao",
        JSON.stringify(configuracao)
    );

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

    localStorage.setItem(
        "picpayCompras",
        JSON.stringify(compras)
    );

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

    localStorage.setItem(
        "picpayPagamentos",
        JSON.stringify(pagamentos)
    );

    formPagamento.reset();

    atualizarTela();

});


// CONVERTER DATA

function converterData(data) {

    const [ano, mes, dia] = data.split("-").map(Number);

    return new Date(Date.UTC(ano, mes - 1, dia));

}


// FORMATAR VALORES EM DINHEIRO

function dinheiro(valor) {

    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

}


// CALCULAR A FATURA

function calcularFatura() {

    const hojeData = new Date();

    const hoje = new Date(Date.UTC(
        hojeData.getFullYear(),
        hojeData.getMonth(),
        hojeData.getDate()
    ));

    const totalCompras = compras.reduce((soma, compra) => {
        return soma + compra.valor;
    }, 0);

    const totalPago = pagamentos.reduce((soma, pagamento) => {
        return soma + pagamento.valor;
    }, 0);

    let saldo = totalCompras;

    let jurosAcumulados = 0;

    const pagamentosValidos = pagamentos
        .filter(p => converterData(p.data) <= hoje)
        .sort((a, b) => a.data.localeCompare(b.data));

    // CALCULAR O SALDO SEM JUROS

    if (!configuracao.vencimento) {

        pagamentosValidos.forEach(pagamento => {
            saldo -= pagamento.valor;
        });

        saldo = Math.max(0, saldo);

    } else {

        const vencimento = converterData(configuracao.vencimento);

        const taxaMensal = Number(configuracao.juros) || 0;

        const taxaDiaria = Math.pow(
            1 + taxaMensal / 100,
            1 / 30
        ) - 1;

        // APLICAR PAGAMENTOS FEITOS ATÉ O VENCIMENTO

        pagamentosValidos.forEach(pagamento => {

            if (converterData(pagamento.data) <= vencimento) {
                saldo -= pagamento.valor;
            }

        });

        saldo = Math.max(0, saldo);

        // CALCULAR JUROS APÓS O VENCIMENTO

        if (hoje > vencimento) {

            let dataAtual = new Date(vencimento);

            dataAtual.setUTCDate(dataAtual.getUTCDate() + 1);

            while (dataAtual <= hoje) {

                // APLICAR OS PAGAMENTOS DO DIA

                pagamentosValidos.forEach(pagamento => {

                    if (
                        converterData(pagamento.data).getTime() ===
                        dataAtual.getTime()
                    ) {

                        saldo -= pagamento.valor;

                        saldo = Math.max(0, saldo);

                    }

                });

                // ACRESCENTAR JUROS AO SALDO RESTANTE

                if (saldo > 0) {

                    const jurosDoDia = saldo * taxaDiaria;

                    saldo += jurosDoDia;

                    jurosAcumulados += jurosDoDia;

                }

                dataAtual.setUTCDate(dataAtual.getUTCDate() + 1);

            }

        }

    }

    return {
        totalCompras,
        totalPago,
        saldo,
        jurosAcumulados
    };

}


// MOSTRAR AS COMPRAS

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


// MOSTRAR OS PAGAMENTOS

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


// EXECUTAR QUANDO ABRIR A PÁGINA

atualizarTela();
