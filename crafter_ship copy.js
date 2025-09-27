var data = {};
var allItems = {};
var recipeList = {}
var resultList = {};
const selectedRecipes = {};
const recipeListDiv = document.getElementById("lista-receitas");

async function initializeCrafter() {
    const response = await fetch("crafter_ship.json");
    data = await response.json();

    loadRecipes();
}

function updateSelectedRecipesDisplay() {
    const selectedRecipesDiv = document.getElementById("selecionadas");
    selectedRecipesDiv.innerHTML = "";
    Object.entries(selectedRecipes).forEach(([id]) => {
        info = allItems.find(item => item[0] === id)[1];
        console.log(info);

        const div = document.createElement("div");
        div.classList.add("selected-recipe");

        const img = document.createElement("img");
        img.src = info.receita.image;
        img.alt = info.receita.nome;
        img.classList.add("selected-recipe-img");

        const detalhes = document.createElement("div");
        detalhes.classList.add("selected-recipe-details");

        const nome = document.createElement("h3");yyy
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
        delBtnImg.src = "images/CANCELAR.PNG";
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
}

function loadRecipes() {
    allItems = data.ITEMS.map(item => [item.id, item]);
    recipeList = allItems.filter(([id, item]) => item.group === "arsenal_2");

    recipeList.forEach(([id, item]) => {
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
        })

        recipeListDiv.appendChild(div);
    });
}

initializeCrafter();