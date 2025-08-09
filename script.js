async function carregarReceitas() {
    try {
        const resposta = await fetch("dados.json");
        const data = await resposta.json();

        const listaReceitas = document.getElementById("lista-receitas");
        const selecionadas = document.getElementById("selecionadas");

        // Objeto para controlar receitas selecionadas e quantidades
        const receitasSelecionadas = {};

        // Função para atualizar o painel das selecionadas
        function atualizarSelecionadas() {
            selecionadas.innerHTML = ""; // limpa tudo

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

                // Atualiza quantidade ao mudar o input
                inputQtd.addEventListener("input", () => {
                    let val = parseInt(inputQtd.value);
                    if (isNaN(val) || val < 1) {
                        val = 1;
                        inputQtd.value = val;
                    }
                    receitasSelecionadas[id].quantidade = val;
                });

                detalhes.appendChild(nome);
                detalhes.appendChild(labelQtd);
                detalhes.appendChild(inputQtd);

                div.appendChild(img);
                div.appendChild(detalhes);

                selecionadas.appendChild(div);
            });
        }

        // Cria lista de receitas na sidebar com imagem + nome
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

            // Ao clicar adiciona/atualiza a receita selecionada
            div.addEventListener("click", () => {
                if (receitasSelecionadas[idReceita]) {
                    // Se já existe, incrementa a quantidade
                    receitasSelecionadas[idReceita].quantidade++;
                } else {
                    // Senão cria com quantidade 1
                    receitasSelecionadas[idReceita] = {
                        receita,
                        quantidade: 1
                    };
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
