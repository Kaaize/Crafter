async function carregarReceitas() {
    try {
        const resposta = await fetch("dados.json");
        const data = await resposta.json();

        const listaReceitas = document.getElementById("lista-receitas");
        const selecionadas = document.getElementById("selecionadas");
        const listaIngredientes = document.getElementById("lista-ingredientes");

        const receitasSelecionadas = {};
        var valorTotal = 0;
        var slotInventario = 0;

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

                const delBtn = document.createElement("button");
                delBtn.classList.add("delete-btn");
                delBtn.addEventListener("click", () => {
                    delete receitasSelecionadas[id];
                    atualizarSelecionadas();
                });
        
                const delBtnImg = document.createElement("img");
                delBtnImg.src = "/Crafter/images/CANCELAR.PNG";
                delBtnImg.alt = "Cancelar";
        
                delBtn.appendChild(delBtnImg);

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
                detalhes.appendChild(delBtn);

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
        function agregarIngredientes(idItem, quantidade, acumulador) {            
            const ingredientes = data.RECIPES[idItem].ingredientes;
            ingredientes.forEach(ingrediente => {
                idItem = String(ingrediente.id);

                const item = data.ITEMS[idItem];
                if (!item) {
                    // Item desconhecido, aborta
                    return;
                }

                if (item.craftid) {
                    // Este item é fabricado por uma receita, expandimos essa receita
                    const idReceita = String(item.craftid);
                    const receita = data.RECIPES[idReceita];
                    if (!receita) return;
                    agregarIngredientes(item.craftid, quantidade * ingrediente.quantidade, acumulador);
                } else {
                    // Ingrediente básico, acumula
                    if (!acumulador[idItem]) acumulador[idItem] = 0;
                    acumulador[idItem] += quantidade * ingrediente.quantidade;
                    valorTotal += item.custo * quantidade * ingrediente.quantidade;
                }
            });
        }


        // Atualiza painel ingredientes totais (direita)
        function atualizarIngredientes() {
            listaIngredientes.innerHTML = "";

            const acumulador = {};
            valorTotal = 0;

            // Para cada receita selecionada, agrega ingredientes recursivamente
            Object.entries(receitasSelecionadas).forEach(([id, info]) => {
                agregarIngredientes(id, info.quantidade, acumulador);
            });

            // Monta a lista final de ingredientes
            Object.entries(acumulador).forEach(([idIng, quantidade]) => {
                const item = data.ITEMS[idIng];
                if (!item) return; // ignorar IDs inválidos

                slotInventario += Math.ceil(quantidade / 100);

                const div = document.createElement("div");
                div.classList.add("ingredient-item");

                const img = document.createElement("img");
                img.src = item.image;
                img.alt = item.image;

                const divInfo = document.createElement("div");
                divInfo.classList.add("ingredient-info");

                const span = document.createElement("span");
                span.textContent = `${item.nome}: ${quantidade}`;
                span.classList.add("ingredient-name");

                const span2 = document.createElement("span");
                span2.textContent = `Custo total: $${item.custo * quantidade}`;
                span2.classList.add("total-cost");

                divInfo.appendChild(span);
                divInfo.appendChild(span2);
                div.appendChild(img);
                div.appendChild(divInfo);

                listaIngredientes.appendChild(div);
            });

            const caption = document.querySelector(".caption-incredientes");
            caption.textContent = `Ingredientes Totais ($${valorTotal}) | Slots Necessários: ${slotInventario}`;
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
