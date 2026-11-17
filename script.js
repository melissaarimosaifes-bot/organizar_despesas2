const form = document.getElementById("formCadastro");
if (form) {
    form.addEventListener("submit", function (event) {
        event.preventDefault();
        const nome = document.getElementById("nome").value;
       const email = document.getElementById("email").value;
       localStorage.setItem("nome", nome);
       localStorage.setItem("email", email);
       window.location.href = "cartoes.html"; 
    });
}
const saudacao = document.getElementById("saudacao");
if (saudacao) {
    const nome = localStorage.getItem("nome");
    saudacao.textContent = nome 
    ? "Olá, "+nome+"!"
    : "Faça seu cadastro para começar!";
}
const botoesCartao = document.querySelectorAll(".botoes-cartao");
if (botoesCartao.length>0) {
    botoesCartao.forEach(function (botao) {
    botao.addEventListener("click", function (){
        localStorage.setItem("ultimoCartao", botao.textContent);
});
    });
}
