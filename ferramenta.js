async function carregarReceitas() {
    try {
        const resposta = await fetch("dados.json");
        const data = await resposta.json();

        const listaItens = document.getElementById("lista-receitas");
        const selecionadas = document.getElementById("selecionadas");
        const listaResultado = document.getElementById("lista-resultado");

        const itensSelecionados = {};
        var valorTotal = 0;

        const searchInput = document.getElementById("search-input");
        searchInput.addEventListener("input", () => {
            carregarItens(filtrarItensPorNome(data.ITEMS, searchInput.value));
        });

        function carregarItens(filteredData) {
            listaItens.innerHTML = "";
            Object.entries(filteredData).forEach(([itemID, info]) => {
                const div = document.createElement("div");
                div.classList.add("item");
                div.id = itemID;

                const img = document.createElement("img");
                img.src = info.image;
                img.alt = info.nome;

                const span = document.createElement("span");
                span.textContent = info.nome;

                div.appendChild(img);
                div.appendChild(span);

                div.addEventListener("click", () => {
                    searchInput.focus();
                    searchInput.select();
                    if (itensSelecionados[itemID]) {
                        itensSelecionados[itemID].quantidade++;
                    } else {
                        itensSelecionados[itemID] = {quantidade: 1};
                    }
                    atualizarSelecionadas();
                });

                listaItens.appendChild(div);
            });
        };

        function filtrarItensPorNome(itens, termoPesquisa) {
            // 1. Converte o termo de pesquisa para minúsculas e remove acentos
            const termoLimpo = termoPesquisa.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            
            // Se o termo de pesquisa estiver vazio, retorna o objeto original
            if (!termoLimpo) {
                return itens;
            }

            // 2. Converte o objeto em um array de entradas [chave, valor]
            const entradas = Object.entries(itens);

            // 3. Filtra o array de entradas
            const entradasFiltradas = entradas.filter(([chave, item]) => {
                const nomeItemLimpo = item.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return nomeItemLimpo.includes(termoLimpo);
            });

            // 4. Converte o array filtrado de volta para um objeto
            return Object.fromEntries(entradasFiltradas);
        };

        // Atualiza painel das receitas selecionadas (meio)
        function atualizarSelecionadas() {
            selecionadas.innerHTML = "";

            const memo = document.getElementById("lista-resultado");
            memo.value = "";

            const jsonResultado = {
                nome: "",
                ingredientes: [],
                image: ""
            };

            Object.keys(itensSelecionados).forEach(id => {
                const info = data.ITEMS[id];

                const div = document.createElement("div");
                div.classList.add("selected-recipe");

                const img = document.createElement("img");
                img.src = info.image;
                img.alt = info.nome;

                const detalhes = document.createElement("div");
                detalhes.classList.add("selected-recipe-details");

                const nome = document.createElement("h3");
                nome.textContent = info.nome;

                const labelQtd = document.createElement("label");
                labelQtd.textContent = "Quantidade:";

                const inputQtd = document.createElement("input");
                inputQtd.type = "number";
                inputQtd.min = 1;
                inputQtd.value = itensSelecionados[id].quantidade || 1;

                const delBtn = document.createElement("button");
                delBtn.classList.add("delete-btn");
                delBtn.addEventListener("click", () => {
                    delete itensSelecionados[id];
                    atualizarSelecionadas();
                });
        
                const delBtnImg = document.createElement("img");
                delBtnImg.src = "/Crafter/images/CANCELAR.PNG";
                delBtnImg.alt = "Cancelar";
        
                delBtn.appendChild(delBtnImg);

                detalhes.appendChild(nome);
                detalhes.appendChild(labelQtd);
                detalhes.appendChild(inputQtd);
                detalhes.appendChild(delBtn);

                div.appendChild(img);
                div.appendChild(detalhes);

                selecionadas.appendChild(div);

                jsonResultado.nome = "NOME DA RECEITA";
                jsonResultado.image = "/CRAFT/images/NOME.png";
                jsonResultado.ingredientes.push({
                    id: id,
                    quantidade: itensSelecionados[id].quantidade || 1
                });
                memo.value = JSON.stringify(jsonResultado, null, 2);
            });
        }

        carregarItens(data.ITEMS);

    } catch (error) {
        console.error("Erro ao carregar receitas:", error);
    }
}

carregarReceitas();
