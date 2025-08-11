
var data = {};
var modalArtifact = document.getElementById("artifact-modal");
var modalTrophy = document.getElementById("trophy-modal");   
var modalCharacter = document.getElementById("character-modal");
var modalOrb = document.getElementById("orbs-modal");

var copyButton = document.getElementById("copy-button");

var artifactSlots = document.getElementsByClassName('artifact-slot');
var trophySlots = document.getElementsByClassName('trophy-slot');
var orbSlots = document.getElementsByClassName('skill-slot');
var characterSlot = document.getElementsByClassName('character-container')[0];

var selectedArtifactSlot = null;
var selectedTrophySlot = null;
var build = {
    artifacts: [null, null],
    trophies: [null, null],
    character: null,
    orbs: [null, null, null, null, null, null]
}

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
        img.src = "imgs/drakantos/artifacts/"+index+".png";
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
        img.src = "imgs/drakantos/trophies/"+index+".png";
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

function loadCharacters() {
    Object.values(data.CHARACTERS).forEach((character, index) => {
        var div = document.createElement('div');
        div.className = 'character-option';         

        var img = document.createElement('img');
        img.src = "imgs/drakantos/characters/"+character.NAME+".png";
        img.className = 'character-image';

        var p = document.createElement('p');
        p.textContent = character.NAME;
        p.className = 'character-name';

        div.appendChild(img);
        div.appendChild(p);

        div.addEventListener("click", () => {
            characterClick(character)
        });

        const characterOptions = document.getElementsByClassName('character-options')[0];
        characterOptions.appendChild(div);
    });
};

function loadOrbs(character, skillID) {
    var orbs = null;
    switch (skillID) {
        case 0: orbs = character.SKILLS.SKILL1; break;
        case 1: orbs = character.SKILLS.SKILL2; break;
        case 2: orbs = character.SKILLS.SKILL3; break;
        case 3: orbs = character.SKILLS.SKILL4; break;
        case 4: orbs = character.SKILLS.SKILL5; break;
        case 5: orbs = character.SKILLS.SKILL6; break;
    }
    
    orbs.forEach((orb, index) => {
        var div = document.createElement('div');
        div.className = 'orb-option';         

        var img = document.createElement('img');
        img.src = "imgs/drakantos/orbs/"+character.NAME + skillID + "_" + index + ".png";
        img.className = 'orb-image';

        var p = document.createElement('p');
        p.textContent = orb.NAME;
        p.className = 'orb-name';

        div.appendChild(img);
        div.appendChild(p);

        div.addEventListener("click", () => {
            orbClick(orb, skillID, index)
        });

        const orbsOptions = document.getElementsByClassName('orbs-options')[0];
        orbsOptions.appendChild(div);
    });
};

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

function setArtifact(slot, artifactID) {
    var slotImg = slot.getElementsByClassName('artifact-image')[0];
    var slotName = slot.getElementsByClassName('artifact-name')[0];
    
    slotName.textContent = data.ARTIFACTS[artifactID].NAME;
    slotImg.src = `imgs/drakantos/artifacts/${artifactID}.png`;

    var slotNum = slot.getAttribute('data-artifact-slot');
    build.artifacts[slotNum] = artifactID;
};

function artifactClick(artifactID) {
    modalArtifact.style.display = "none";
    setArtifact(selectedArtifactSlot, artifactID)
};

function setTrophy(slot, trophyID) {
    var slotImg = slot.getElementsByClassName('trophy-image')[0];
    var slotName = slot.getElementsByClassName('trophy-name')[0];

    slotName.textContent = data.TROPHIES[trophyID].NAME;
    slotImg.src = `imgs/drakantos/trophies/${trophyID}.png`;

    var slotNum = slot.getAttribute('data-trophy-slot');
    build.trophies[slotNum] = trophyID;
};

function trophyClick(trophyID) {
    modalTrophy.style.display = "none";
    setTrophy(selectedTrophySlot, trophyID);
};

function setCharacter(character) {
    var characterImage = document.getElementsByClassName('character-image')[0];
    var characterName = document.getElementsByClassName('character-name')[0];

    characterImage.src = "imgs/drakantos/characters/" + character.NAME + ".png";
    characterName.textContent = character.NAME;

    build.character = character.NAME;
};

function characterClick(character) {
    modalCharacter.style.display = "none";
    setCharacter(character);
};

function setOrb(orb, skillID, orbID) {
    var orbDiv = document.getElementById('skill-'+skillID);
    var orbImage = orbDiv.getElementsByClassName('skill-image')[0];
    
    orbImage.src = "imgs/drakantos/orbs/"+build.character + skillID + "_" + orbID + ".png"

    build.orbs[skillID] = orbID
};

function orbClick(orb, skillID, orbID) {
    modalOrb.style.display = "none";
    setOrb(orb, skillID, orbID);
};

function selectArtifact(slot) {
    selectedArtifactSlot = slot;

    modalArtifact.style.display = "block";
};

function selectTrophy(slot) {
    selectedTrophySlot = slot;

    modalTrophy.style.display = "block";
};

function selectCharacter() {
    modalCharacter.style.display = "block";
}

function selectOrb() {
    modalOrb.style.display = "block";
};

function setModalEvents() {
    const artifacts = document.querySelectorAll(".artifact-slot");
    artifacts.forEach(artifact => {
        artifact.addEventListener("click", () => {
            selectArtifact(artifact)
        });
    });

    const trophies = document.querySelectorAll(".trophy-slot");
    trophies.forEach(trophy => {
        trophy.addEventListener("click", () => {
            selectTrophy(trophy)
        });
    });

    characterSlot.addEventListener("click", () => {
        selectCharacter()
    });


    const skills = document.querySelectorAll(".skill-slot");
    skills.forEach((skill, index) => {
        skill.addEventListener("click", () => {
            const characterName = document.getElementsByClassName('character-name')[0].textContent;
            const character = Object.values(data.CHARACTERS).find(char => char.NAME === characterName);
            if (character) {
                const orbsOptions = document.getElementsByClassName('orbs-options')[0];
                orbsOptions.innerHTML = '';
                loadOrbs(character, index);
                selectOrb();
            } else {
                alert("Selecione um personagem primeiro.");
            }
        });
    });

    window.onclick = function (event) {
        if (event.target == modalArtifact) {        
            modalArtifact.style.display = "none";
        }
        else if (event.target == modalTrophy) {        
            modalTrophy.style.display = "none";
        }
        else if (event.target == modalCharacter) {
            modalCharacter.style.display = "none";
        }
        else if (event.target == modalOrb) {
            modalOrb.style.display = "none";
        }
    };    
};

function getLink() {
    var code = `${build.character}-${build.artifacts[0]}-${build.artifacts[1]}-${build.trophies[0]}-${build.trophies[1]}-${build.orbs[0]}-${build.orbs[1]}-${build.orbs[2]}-${build.orbs[3]}-${build.orbs[4]}-${build.orbs[5]}`;
    console.log(code)

    var linkInput = document.getElementById('link-input');
    linkInput.value = code;
};

function loadBuild(codigo) {
    var codList = codigo.split("-");

    var name = codList[0];
    var artifact1 = codList[1];
    var artifact2 = codList[2];
    var trophy1 = codList[3];
    var trophy2 = codList[4];
    var skill1 = codList[5];
    var skill2 = codList[6];
    var skill3 = codList[7];
    var skill4 = codList[8];
    var skill5 = codList[9];    
    var skill6 = codList[10];

    setCharacter(data.CHARACTERS[name]);
    setArtifact(artifactSlots[0], artifact1);
    setArtifact(artifactSlots[1], artifact2);
    setTrophy(trophySlots[0], trophy1);
    setTrophy(trophySlots[1], trophy2);    
    setOrb(data.CHARACTERS[name].SKILLS.SKILL1, 0, skill1);
    setOrb(data.CHARACTERS[name].SKILLS.SKILL2, 1, skill2);
    setOrb(data.CHARACTERS[name].SKILLS.SKILL3, 2, skill3);
    setOrb(data.CHARACTERS[name].SKILLS.SKILL4, 3, skill4);
    setOrb(data.CHARACTERS[name].SKILLS.SKILL5, 4, skill5);
    setOrb(data.CHARACTERS[name].SKILLS.SKILL6, 5, skill6);
    getLink();
};

function main() {
    loadArtifacts();    
    loadTrophies();
    loadCharacters()
    loadParamQuery();
    setModalEvents();  
    
    loadBuild('KORZ-0-0-0-0-0-0-0-0-0-0')

    copyButton.addEventListener("click", () => {
        getLink();
    });
}

loadInfo();    





