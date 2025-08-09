// Lendo o arquivo JSON local
fetch("dados.json")
    .then(response => response.json())
    .then(data => {
        document.getElementById("mensagem").textContent = data.mensagem;
    })
    .catch(error => {
        console.error("Erro ao carregar JSON:", error);
        document.getElementById("mensagem").textContent = "Não foi possível carregar os dados.";
    });
