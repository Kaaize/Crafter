var data = {};
var allItems = {};
var recipeList = {}
var resultList = {};
const selectedRecipes = {};
const recipeListDiv = document.getElementById("lista-receitas");
const finalListDiv = document.getElementById("lista-ingredientes");

async function initializeCrafter() {
    const response = await fetch("crafter_ship.json");
    data = await response.json();

    loadRecipes();
}

/**
 * Função para filtrar os itens de um objeto pelo valor da propriedade 'group'.
 * @param {object} items - O objeto ITEMS a ser filtrado.
 * @param {string} groupName - O nome do grupo que você quer incluir.
 * @returns {object} Um novo objeto contendo apenas os itens do grupo especificado.
 */
function filterItemsByGroup(items, groupName) {
    return Object.keys(items)
        // 1. Filtra as chaves: Retorna apenas as chaves onde o grupo é o que desejamos.
        .filter(key => items[key].group === groupName)
        // 2. Constrói o novo objeto: Transforma as chaves filtradas em um novo objeto.
        .reduce((obj, key) => {
            obj[key] = items[key];
            return obj;
        }, {});
}

function insertItemInResultList(id, quantity, resultList = {}) {
    info = allItems[id];
    if (info.craft) {
        Object.entries(info.craft).forEach(([idx, ing]) => {
            ingInfo = allItems[ing.id];
            if (resultList[ingInfo.group] === undefined) {
                resultList[ingInfo.group] = {};
            }
            if (resultList[ingInfo.group][ing.id]) {
                resultList[ingInfo.group][ing.id] += ing.qty * quantity;
            } 
            else {
                resultList[ingInfo.group][ing.id] = ing.qty * quantity;
            }
            if (allItems[ing.id].craft) {
                insertItemInResultList(ing.id, ing.qty * quantity, resultList);
            }
        });
    }
    return resultList
}

function updateResultList() {
    resultList = {};
    Object.entries(selectedRecipes).forEach(([id, qty]) => {
        insertItemInResultList(id, qty, resultList);
    });
    updateResultListDisplay();
}

function updateResultListDisplay() {
    finalListDiv.innerHTML = "";
    totalPrice = 0;

    totalPriceLabel =  document.getElementById("total-price");

    Object.entries(resultList).forEach(([group, items]) => {
        divGroup = document.createElement("div");
        divGroup.classList.add("result-group");

        divGroupDetail = document.createElement("div");
        divGroupDetail.classList.add("result-group-detail");
        divGroupDetail.id = 'group-' + group.toUpperCase();

        divGroupTitle = document.createElement("div");
        divGroupTitle.classList.add("result-group-title");
        divGroupTitle.addEventListener("click", () => {
            document.getElementById('group-' + group.toLocaleUpperCase()).classList.toggle("hidden");
        });

        divGroupText = document.createElement("h3");
        divGroupText.textContent = group.toUpperCase();
        divGroupTitle.appendChild(divGroupText);
        divGroup.appendChild(divGroupTitle);


        Object.entries(items).forEach(([id, qty]) => {
            const info = allItems[id];

            const divItem = document.createElement("div");
            divItem.classList.add("result-item");

            resultInfo = document.createElement("div");
            resultInfo.classList.add("result-info");

            const img = document.createElement("img");
            img.src = "ship_images/" + id.toUpperCase() + ".PNG";
            img.alt = info.name;
            img.classList.add("result-item-img");
            const spanQty = document.createElement("span");
            price = info.price * qty;
            totalPrice += price;
            spanQty.textContent = `${info.name}: ${qty}`;
            const spanPrice = document.createElement("span");
            spanPrice.textContent = `Custo Total: $${price}`;

            divItem.appendChild(img);
            resultInfo.appendChild(spanQty);
            resultInfo.appendChild(spanPrice);
            divItem.appendChild(resultInfo);
            divGroupDetail.appendChild(divItem);
        });
        divGroup.appendChild(divGroupDetail);

        finalListDiv.appendChild(divGroup);
    });
    
    totalPriceLabel.textContent = `Preço Total: $${totalPrice}`;
}

function updateSelectedRecipesDisplay() {
    const selectedRecipesDiv = document.getElementById("selecionadas");
    selectedRecipesDiv.innerHTML = "";
    Object.entries(selectedRecipes).forEach(([id]) => {
        const info = allItems[id];
        const div = document.createElement("div");
        div.classList.add("selected-recipe");

        const img = document.createElement("img");
        img.src = "ship_images/" + id.toUpperCase() + ".PNG";
        img.alt = info.name;
        img.classList.add("selected-recipe-img");

        const detalhes = document.createElement("div");
        detalhes.classList.add("selected-recipe-details");

        const nome = document.createElement("h3");
        nome.textContent = info.name;

        const labelQtd = document.createElement("label");
        labelQtd.textContent = "Quantidade:";

        const inputQtd = document.createElement("input");
        inputQtd.type = "number";
        inputQtd.min = 1;
        inputQtd.value = selectedRecipes[id];

        const delBtn = document.createElement("button");
        delBtn.classList.add("delete-btn");
        delBtn.addEventListener("click", () => {
            delete selectedRecipes[id];
            updateSelectedRecipesDisplay();
            updateResultList();
        });

        const delBtnImg = document.createElement("img");
        delBtnImg.src = "images/CANCELAR.PNG";
        delBtnImg.alt = "Cancelar";

        delBtn.appendChild(delBtnImg);

        inputQtd.addEventListener("input", () => {
            let val = parseInt(inputQtd.value);
            if (isNaN(val) || val < 1) {
                val = 1;
                inputQtd.value = val;
            }
            selectedRecipes[id] = val;
            updateResultList();
        });

        detalhes.appendChild(nome);
        detalhes.appendChild(labelQtd);
        detalhes.appendChild(inputQtd);
        detalhes.appendChild(delBtn);

        div.appendChild(img);
        div.appendChild(detalhes);

        selecionadas.appendChild(div);
    });
}

function loadRecipes() {
    allItems = data.ITEMS;
    recipeListDiv.innerHTML = "";

    arsenal2 = document.getElementById("filter-arsenal_2");
    arsenal2.addEventListener("click", () => {
        recipeList = filterItemsByGroup(allItems, "arsenal_2");
        loadRecipes();
    });
        
    arsenal3 = document.getElementById("filter-arsenal_3");
    arsenal3.addEventListener("click", () => {
        recipeList = filterItemsByGroup(allItems, "arsenal_3");
        loadRecipes()
    });

    arsenal4 = document.getElementById("filter-arsenal_4");
    arsenal4.addEventListener("click", () => {
        recipeList = filterItemsByGroup(allItems, "arsenal_4");
        loadRecipes()
    });

    console.log(recipeList)

    Object.keys(recipeList).forEach(id => {
        item = allItems[id];

        const div = document.createElement("div");
        div.classList.add("recipe");

        const img = document.createElement("img");
        img.src = 'ship_images/' + id.toUpperCase() + '.PNG';
        img.alt = item.name;

        const span = document.createElement("span");
        span.textContent = item.name;

        div.appendChild(img);
        div.appendChild(span);

        div.addEventListener("click", () => {
            if (selectedRecipes[id]) {
                selectedRecipes[id]++;
            } else {
                selectedRecipes[id] = 1;
            }
            updateSelectedRecipesDisplay();
            updateResultList();
        })

        recipeListDiv.appendChild(div);
    });
}

initializeCrafter();