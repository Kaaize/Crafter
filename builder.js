
var data = {};
var modalArtifact = document.getElementById("artifact-modal");
var modalTrophy = document.getElementById("trophy-modal");   
var selectedArtifactSlot = null;
var selectedTrophySlot = null;

async function loadInfo() {
    const resposta = await fetch("drakantos_builder.json");
    data = await resposta.json();
    main();
};

function loadArtifacts() {
    data.ARTIFACTS.forEach((artifact, index) => {
        var div = document.createElement('div');
        div.className = 'artifact-option';

        var img = document.createElement('img');
        img.src = "imgs/drakantos/artifact"+index+".png";
        img.className = 'artifact-image';

        var p = document.createElement('p');
        p.textContent = artifact.NAME;
        p.className = 'artifact-name';

        div.appendChild(img);
        div.appendChild(p);
        
        div.addEventListener("click", () => {
            artifactClick(index)
        });

        const artifactOptions = document.getElementsByClassName('artifact-options')[0];
        artifactOptions.appendChild(div);
    });
}

function loadTrophies() {
    data.TROPHIES.forEach((trophy, index) => {
        var div = document.createElement('div');
        div.className = 'trophy-option';

        var img = document.createElement('img');
        img.src = "imgs/drakantos/trophy"+index+".png";
        img.className = 'trophy-image';

        var p = document.createElement('p');
        p.textContent = trophy.NAME;
        p.className = 'trophy-name';

        div.appendChild(img);
        div.appendChild(p);

        div.addEventListener("click", () => {
            trophyClick(index)  
        });
        
        const trophyOptions = document.getElementsByClassName('trophy-options')[0];
        trophyOptions.appendChild(div);
    });
}

function loadParamQuery() {
    var query = location.search.slice(1);
    var partes = query.split('&');
    var dataQuery = {};
    var linkInput = document.getElementById('input-link');

    partes.forEach(function (parte) {
        var chaveValor = parte.split('=');
        var chave = chaveValor[0];
        var valor = chaveValor[1];
        dataQuery[chave] = valor;
    });

    if (dataQuery.codigo) {
        linkInput.value = data.codigo || 'AA-BB-CCC-DDD-EEE-FFF-000-001-002-003-004-005';
    };  
};

function artifactClick(artifactID) {
    modalArtifact.style.display = "none";

    var slotName = selectedArtifactSlot.getElementsByClassName('artifact-name')[0];
    if (slotName) {
        slotName.textContent = data.ARTIFACTS[artifactID].NAME;
    };        
};

function trophyClick(trophyID) {
    modalTrophy.style.display = "none";
    var slotName = selectedTrophySlot.getElementsByClassName('trophy-name')[0];
    if (slotName) {     
        slotName.textContent = data.TROPHIES[trophyID].NAME;
    };
};

function selectArtifact(slot) {
    selectedArtifactSlot = slot;

    modalArtifact.style.display = "block";
};

function selectTrophy(slot) {
    selectedTrophySlot = slot;

    modalTrophy.style.display = "block";
};

function setModalEvents() {
    const artifacts = document.querySelectorAll(".artifact");
    artifacts.forEach(artifact => {
        artifact.addEventListener("click", () => {
            selectArtifact(artifact)
        });
    });

    const trophies = document.querySelectorAll(".trophy");
    trophies.forEach(trophy => {
        trophy.addEventListener("click", () => {
            selectTrophy(trophy)
        });
    });

    window.onclick = function (event) {
        if (event.target == modalArtifact) {        
            modalArtifact.style.display = "none";
        }
        else if (event.target == modalTrophy) {        
            modalTrophy.style.display = "none";
        };
    };    
};

function main() {
    loadArtifacts();    
    loadTrophies();
    loadParamQuery();
    setModalEvents();    
}

loadInfo();    





