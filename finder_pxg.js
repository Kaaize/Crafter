var data = {};
var allItems = {};
var recipeList = {}
var resultList = {};
const customPrices = {};
const selectedRecipes = {};
const recipeListDiv = document.getElementById("lista-receitas");
const finalListDiv = document.getElementById("lista-ingredientes");

async function initializeCrafter() {
    const response = await fetch("finder_recipe.json");
    data = await response.json();

    allItems = data.ITEMS;
    recipeList = filterItemsByGroup(allItems, "archeologist");

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
}

function copyResultList() {
    try {
        const jsonString = JSON.stringify(resultList, null, 2);
        navigator.clipboard.writeText(jsonString)
            .then(() => {
                alert("Lista de ingredientes copiada para a área de transferência!");
            })
            .catch(err => {
                console.error("Erro ao copiar para a área de transferência: ", err);
                alert("Falha ao copiar para a área de transferência.");
            });
    }   
    catch (err) {
        console.error("Erro ao converter a lista de ingredientes para JSON: ", err);
        alert("Falha ao converter a lista de ingredientes para JSON.");
    }
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
    let totalPrice = 0;

    const totalPriceLabel = document.getElementById("total-price");

    Object.entries(resultList).forEach(([group, items]) => {
        const divGroup = document.createElement("div");
        divGroup.classList.add("result-group");

        const divGroupDetail = document.createElement("div");
        divGroupDetail.classList.add("result-group-detail");
        divGroupDetail.id = 'group-' + group.toUpperCase();

        const divGroupTitle = document.createElement("div");
        divGroupTitle.classList.add("result-group-title");
        divGroupTitle.addEventListener("click", () => {
            document.getElementById('group-' + group.toLocaleUpperCase()).classList.toggle("hidden");
        });

        const divGroupText = document.createElement("h3");
        divGroupText.textContent = group.toUpperCase();
        divGroupTitle.appendChild(divGroupText);
        divGroup.appendChild(divGroupTitle);

        Object.entries(items).forEach(([id, qty]) => {
            const info = allItems[id];
            const divItem = document.createElement("div");
            divItem.classList.add("result-item");

            const inputPrice = document.createElement("input");
            inputPrice.type = "number";
            inputPrice.min = 1;

            let vUn = customPrices[id] !== undefined ? customPrices[id] : (info.price || 1);
            inputPrice.value = vUn

            const resultInfo = document.createElement("div");
            resultInfo.classList.add("result-info");

            const img = document.createElement("img");
            if (info.image) {
                img.src = info.image;
            }
            else {
                img.src = "images/Finder/" + id.toUpperCase() + ".PNG"; 
            }
            img.alt = info.name;
            img.classList.add("result-item-img");

            const spanQty = document.createElement("span");
            spanQty.textContent = `${info.name}: ${qty}`;

            const spanPrice = document.createElement("span");
            price = vUn * qty
            spanPrice.textContent = `Custo Total: $${price}`;

            totalPrice += price;

            inputPrice.addEventListener("input", (e) => {
                let newVal = parseInt(e.target.value);

                if (isNaN(newVal) || newVal < 0) {
                    newVal = 0;
                }

                customPrices[id] = newVal;

                spanPrice.textContent = `Custo Total $${newVal * qty}`

                recalculateGlobalTotal();
            });

            divItem.appendChild(img);
            resultInfo.appendChild(spanQty);
            resultInfo.appendChild(spanPrice);
            divItem.appendChild(resultInfo);
            divGroupDetail.appendChild(divItem);
            divItem.appendChild(inputPrice)                    
            
        });
        divGroup.appendChild(divGroupDetail);

        finalListDiv.appendChild(divGroup);
    });

    totalPriceLabel.innerHTML = `
        <div>Preço Total: $${totalPrice}</div>
    `;

    function recalculateGlobalTotal() {
        let newTotalPrice = 0;
        
        Object.values(resultList).forEach(items => {
            Object.entries(items).forEach(([id, qty]) => {
                let itemPrice = customPrices[id] !== undefined ? customPrices[id] : (allItems[id].price || 1);
                newTotalPrice += itemPrice * qty;
            });
        });

        totalPriceLabel.innerHTML = `
            <div>Preço Total: $${newTotalPrice}</div>
        `;
    }

    recalculateGlobalTotal();    
}

function updateSelectedRecipesDisplay() {
    const selectedRecipesDiv = document.getElementById("selecionadas");
    selectedRecipesDiv.innerHTML = "";
    Object.entries(selectedRecipes).forEach(([id]) => {
        const info = allItems[id];
        const div = document.createElement("div");
        div.classList.add("selected-recipe");

        const img = document.createElement("img");
        if (info.image) {
            img.src = info.image;
        } else {
            img.src = "images/Finder/" + id.toUpperCase() + ".PNG";
        }
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

    Object.keys(recipeList).forEach(id => {
        item = allItems[id];

        const div = document.createElement("div");
        div.classList.add("recipe");

        const img = document.createElement("img");
        if (item.image) {
            img.src = item.image;
        } else {
            img.src = 'images/Finder/' + id.toUpperCase() + '.PNG';
        }

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