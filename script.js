async function carregarReceitas() {
    try {
        const resposta = await fetch("dados.json");
        const data = await resposta.json();

        const listaReceitas = document.getElementById("lista-receitas");

        Object.entries(data.RECIPES).forEach(([idReceita, receita]) => {
            const recipeDiv = document.createElement("div");
            recipeDiv.classList.add("recipe");

            const btn = document.createElement("button");
            btn.textContent = receita.nome;
            btn.setAttribute("aria-expanded", "false");

            const ul = document.createElement("ul");
            ul.classList.add("ingredients");

            receita.ingredientes.forEach(idIngrediente => {
                const item = data.ITEMS[idIngrediente];
                const li = document.createElement("li");
                li.textContent = `${item.nome} (Custo: ${item.custo})`;
                ul.appendChild(li);
            });

            btn.addEventListener("click", () => {
                ul.classList.toggle("visible");
                const isExpanded = btn.getAttribute("aria-expanded") === "true";
                btn.setAttribute("aria-expanded", String(!isExpanded));
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
