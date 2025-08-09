async function carregarReceitas() {
    try {
        const resposta = await fetch("dados.json");
        const data = await resposta.json();

        const listaReceitas = document.getElementById("lista-receitas");
        const selecionadas = document.getElementById("selecionadas");
        const listaIngredientes = document.getElementById("lista-ingredientes");

        const receitasSelecionadas = {};

        // Atualiza painel das receitas selecionadas (meio)
        function atualizarSelecionadas() {
            selecionadas.innerHTML = "";

            Object.entries(receitasSelecionadas).forEach(([id, info]) => {
                const div = document.createElement("div");
                div.classList.add("selected-recipe");

                const img = document.createElement("img");
                img.src = info.receita.image;
                img.alt = info.receita.nome;

                const detalhes = document.createElement("div");
                detalhes.classList.add("selected-recipe-details");

                const nome = document.createElement("h3");
                nome.textContent = info.receita.nome;

                const labelQtd = document.createElement("label");
                labelQtd.textContent = "Quantidade:";

                const inputQtd = document.createElement("input");
                inputQtd.type = "number";
                inputQtd.min = 1;
                inputQtd.value = info.quantidade;

                inputQtd.addEventListener("input", () => {
                    let val = parseInt(inputQtd.value);
                    if (isNaN(val) || val < 1) {
                        val = 1;
                        inputQtd.value = val;
                    }
                    receitasSelecionadas[id].quantidade = val;
                    atualizarIngredientes();
                });

                detalhes.appendChild(nome);
                detalhes.appendChild(labelQtd);
                detalhes.appendChild(inputQtd);

                div.appendChild(img);
                div.appendChild(detalhes);

                selecionadas.appendChild(div);
            });

            atualizarIngredientes(); // Atualiza ingredientes toda vez que mudar selecionadas
        }

        // Função recursiva para agregar ingredientes
        // idReceita = id da receita ou ingrediente
        // quantidade = multiplicador da receita (ex: se receita for 2x, ingredientes também)
        // acumulador = objeto para somar ingredientes por id
        function agregarIngredientes(idReceita, quantidade, acumulador) {
            const receita = data.RECIPES[idReceita];
            if (receita) {
                // É uma receita, itera ingredientes recursivamente
                receita.ingredientes.forEach(idIng => {
                    agregarIngredientes(String(idIng), quantidade, acumulador);
                });
            } else {
                // Não é receita, é ingrediente simples
                if (!acumulador[idReceita]) acumulador[idReceita] = 0;
                acumulador[idReceita] += quantidade;
            }
        }

        // Atualiza painel ingredientes totais (direita)
        function atualizarIngredientes() {
            listaIngredientes.innerHTML = "";

            const acumulador = {};

            // Para cada receita selecionada, agrega ingredientes recursivamente
            Object.entries(receitasSelecionadas).forEach(([id, info]) => {
                agregarIngredientes(id, info.quantidade, acumulador);
            });

            // Monta a lista final de ingredientes
            Object.entries(acumulador).forEach(([idIng, quantidade]) => {
                const item = data.ITEMS[idIng];
                if (!item) return; // ignorar IDs inválidos

                const div = document.createElement("div");
                div.classList.add("ingredient-item");

                div.textContent = `${item.nome}: ${quantidade} unidade(s)`;

                listaIngredientes.appendChild(div);
            });
        }

        // Monta a lista da sidebar com imagem + nome
        Object.entries(data.RECIPES).forEach(([idReceita, receita]) => {
            const div = document.createElement("div");
            div.classList.add("recipe");

            const img = document.createElement("img");
            img.src = receita.image;
            img.alt = receita.nome;

            const span = document.createElement("span");
            span.textContent = receita.nome;

            div.appendChild(img);
            div.appendChild(span);

            div.addEventListener("click", () => {
                if (receitasSelecionadas[idReceita]) {
                    receitasSelecionadas[idReceita].quantidade++;
                } else {
                    receitasSelecionadas[idReceita] = { receita, quantidade: 1 };
                }
                atualizarSelecionadas();
            });

            listaReceitas.appendChild(div);
        });

    } catch (error) {
        console.error("Erro ao carregar receitas:", error);
    }
}

carregarReceitas();
