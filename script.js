async function carregarReceitas() {
    try {
        const resposta = await fetch("dados.json");
        const data = await resposta.json();

        const listaReceitas = document.getElementById("lista-receitas");

        Object.entries(data.RECIPES).forEach(([idReceita, receita]) => {
            // Cria o container da receita
            const recipeDiv = document.createElement("div");
            recipeDiv.classList.add("recipe");

            // Botão para expandir/fechar
            const btn = document.createElement("button");
            btn.textContent = receita.nome;

            // Lista de ingredientes
            const ul = document.createElement("ul");
            ul.classList.add("ingredients");

            receita.ingredientes.forEach(idIngrediente => {
                const item = data.ITEMS[idIngrediente];
                const li = document.createElement("li");
                li.textContent = `${item.nome} (Custo: ${item.custo})`;
                ul.appendChild(li);
            });

            // Evento para expandir/recolher
            btn.addEventListener("click", () => {
                ul.style.display = ul.style.display === "block" ? "none" : "block";
            });

            recipeDiv.appendChild(btn);
            recipeDiv.appendChild(ul);
            listaReceitas.appendChild(recipeDiv);
        });

    } catch (error) {
        console.error("Erro ao carregar receitas:", error);
    }
}

carregarReceitas();
