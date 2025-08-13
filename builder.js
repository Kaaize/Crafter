
var data = {};
var modalArtifact = document.getElementById("artifact-modal");
var modalTrophy = document.getElementById("trophy-modal");   
var modalCharacter = document.getElementById("character-modal");
var modalOrb = document.getElementById("orb-modal");

var copyButton = document.getElementById("copy-button");
var linkInput = document.getElementById('link-input');

var artifactSlots = document.getElementsByClassName('artifact-slot');
var trophySlots = document.getElementsByClassName('trophy-slot');
var orbSlots = document.getElementsByClassName('skill-slot');
var characterSlot = document.getElementsByClassName('character-container')[0];

var build = {
    artifacts: [null, null],
    trophies: [null, null],
    character: null,
    orbs: [null, null, null, null, null, null]
}
var currentArtifactSlotID = 0;
var currentTrophySlotID = 0;
var currentSkillSlotID = 0;

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
        img.src = "imgs/drakantos/artifacts/"+index+".PNG";
        img.className = 'artifact-option-image';

        div.appendChild(img);
        
        img.addEventListener("click", () => {
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
        img.src = "imgs/drakantos/trophies/"+index+".PNG";
        img.className = 'trophy-option-image';

        var p = document.createElement('p');
        p.textContent = trophy.NAME;
        p.className = 'trophy-name';

        div.appendChild(img);
        div.appendChild(p);

        img.addEventListener("click", () => {
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
        img.src = "imgs/drakantos/portraits/"+character.NAME.toUpperCase()+".PNG";
        img.className = 'character-option-image';

        var p = document.createElement('p');
        p.textContent = character.NAME;
        p.className = 'character-option-name';

        div.appendChild(img);
        div.appendChild(p);

        img.addEventListener("click", () => {
            characterOptionClick(index)
        });

        const characterOptions = document.getElementsByClassName('character-options')[0];
        characterOptions.appendChild(div);
    });
};

function loadOrbs(characterID, skillID) {
    var orbs = null;
    var character = data.CHARACTERS[characterID];

    switch (parseInt(skillID)) {
        case 0: orbs = character.SKILLS.SKILL1; break;
        case 1: orbs = character.SKILLS.SKILL2; break;
        case 2: orbs = character.SKILLS.SKILL3; break;
        case 3: orbs = character.SKILLS.SKILL4; break;
        case 4: orbs = character.SKILLS.SKILL5; break;
        case 5: orbs = character.SKILLS.SKILL6; break;
    };
    
    orbs.forEach((orb, index) => {
        var div = document.createElement('div');
        div.className = 'orb-option';         

        var img = document.createElement('img');
        img.src = "imgs/drakantos/orbs/"+character.NAME.toUpperCase() + "/" + skillID + "_" + index + ".PNG";
        img.className = 'orb-image';

        var p = document.createElement('p');
        p.textContent = orb.NAME;
        p.className = 'orb-name';

        div.appendChild(img);
        div.appendChild(p);

        img.addEventListener("click", () => {
            orbClick(skillID, index)
        });

        const orbsOptions = document.getElementsByClassName('orb-options')[0];
        orbsOptions.appendChild(div);
    });
};

function updateCharacter() {
    var characterName = characterSlot.getElementsByClassName('character-slot-name')[0];
    var characterImage = characterSlot.getElementsByClassName('character-slot-image')[0];

    if (build.character == null || data.CHARACTERS[build.character] == null) { 
        characterName.textContent = 'SELECIONE O PERSONAGEM';
        characterImage.src = 'imgs/drakantos/characters/NULL.PNG';
    }
    else {
        characterName.textContent = data.CHARACTERS[build.character].NAME
        characterImage.src = "imgs/drakantos/characters/" + data.CHARACTERS[build.character].NAME.toUpperCase() + ".PNG";
    };
};

function updateArtifact() {
    var artifact1Name = artifactSlots[0].getElementsByClassName('artifact-slot-name')[0];
    var artifact1Image = artifactSlots[0].getElementsByClassName('artifact-slot-image')[0];
    var artifact2Name = artifactSlots[1].getElementsByClassName('artifact-slot-name')[0];
    var artifact2Image = artifactSlots[1].getElementsByClassName('artifact-slot-image')[0];

    if (build.artifacts[0] == null || data.ARTIFACTS[build.artifacts[0]] == null) {
        artifact1Name.textContent = 'Selecione o Artefato';
        artifact1Image.src = 'imgs/drakantos/artifacts/NULL.PNG';
    }
    else {
        artifact1Name.textContent = data.ARTIFACTS[build.artifacts[0]].NAME;
        artifact1Image.src = `imgs/drakantos/artifacts/${build.artifacts[0]}.PNG`;
    };

    if (build.artifacts[1] == null || data.ARTIFACTS[build.artifacts[1]] == null) {
        artifact2Name.textContent = 'Selecione o Artefato';
        artifact2Image.src = 'imgs/drakantos/artifacts/NULL.PNG';
    }
    else {
        artifact2Name.textContent = data.ARTIFACTS[build.artifacts[1]].NAME;
        artifact2Image.src = `imgs/drakantos/artifacts/${build.artifacts[1]}.PNG`;        
    };
};

function updateTrophy() {
    var trophy1Name = trophySlots[0].getElementsByClassName('trophy-slot-name')[0];
    var trophy1Image = trophySlots[0].getElementsByClassName('trophy-slot-image')[0];
    var trophy2Name = trophySlots[1].getElementsByClassName('trophy-slot-name')[0];
    var trophy2Image = trophySlots[1].getElementsByClassName('trophy-slot-image')[0];

    if (build.trophies[0] == null || data.TROPHIES[build.trophies[0]] == null) {
        trophy1Name.textContent = 'Selecione o Personagem';
        trophy1Image.src = `imgs/drakantos/trophies/NULL.PNG`;
    }
    else {
        trophy1Name.textContent = data.TROPHIES[build.trophies[0]].NAME;
        trophy1Image.src = `imgs/drakantos/trophies/${build.trophies[0]}.PNG`;
    };

    if (build.trophies[1] == null || data.TROPHIES[build.trophies[1]] == null) {
        trophy2Name.textContent = 'Selecione o Personagem';
        trophy2Image.src = `imgs/drakantos/trophies/NULL.PNG`;
    }
    else {
        trophy2Name.textContent = data.TROPHIES[build.trophies[0]].NAME;
        trophy2Image.src = `imgs/drakantos/trophies/${build.trophies[0]}.PNG`;
    };    
};

function updateOrb() {
    if (build.character == null) {
        return
    };

    var character = data.CHARACTERS[build.character];

    if (character == null) { 
        return
    };

    build.orbs.forEach((orbID, skillID) => {
        var orbDiv = document.getElementById('skill-' + skillID);
        var orbImage = orbDiv.getElementsByClassName('skill-slot-image')[0];

        if (build.orbs[skillID] == null || character.SKILLS["SKILL" + (parseInt(skillID)+1)] == null) {
            orbImage.src = "imgs/drakantos/orbs/NULL.PNG";        
        }
        else {
            orbImage.src = "imgs/drakantos/orbs/"+character.NAME.toUpperCase() + "/" + skillID + "_" + orbID + ".PNG";        
        };

        
    });
};

function updateBuild() {
    updateCharacter();
    updateArtifact();
    updateTrophy();
    updateOrb();

    setLink();    
};

function setArtifact(slot, artifactID) {
    build.artifacts[slot] = artifactID;
    updateBuild();
};

function artifactClick(artifactID) {
    modalArtifact.style.display = "none";
    setArtifact(currentArtifactSlotID, artifactID);
};

function setTrophy(slot, trophyID) {
    build.trophies[slot] = trophyID;
    updateBuild();

};

function trophyClick(trophyID) {
    modalTrophy.style.display = "none";
    setTrophy(currentTrophySlotID, trophyID);
};

function setCharacter(characterID) {
    build.character = characterID;
    updateBuild();
};

function characterOptionClick(character) {
    modalCharacter.style.display = "none";
    setCharacter(character);
};

function setOrb(skillID, orbID) {
    build.orbs[skillID] = orbID;
    setLink();
};

function orbClick(skillID, orbID) {
    modalOrb.style.display = "none";
    setOrb(skillID, orbID);
    updateBuild();
};

function selectArtifact() {
    modalArtifact.style.display = "block";
};

function selectTrophy(slot) {
    modalTrophy.style.display = "block";
};

function selectCharacter() {
    modalCharacter.style.display = "block";
}

function selectOrb() {
    modalOrb.style.display = "block";
};

function artifactSlotClick(event) {
    modalArtifact.style.display = "block";

    currentArtifactSlotID = event.target.parentElement.getAttribute('data-artifact-slot');
};

function trophySlotClick(event) {
    modalTrophy.style.display = "block";

    currentTrophySlotID = event.target.parentElement.getAttribute('data-trophy-slot');
};

function characterSlotClick(event) {
    selectCharacter();
};

function skillSlotClick(event) {
    if (build.character == null) {
        return
    };

    var character = data.CHARACTERS[build.character];

    if (character == null) {
        return
    };

    currentSkillSlotID = event.target.parentElement.getAttribute('data-skill-slot');

    const orbsOptions = document.getElementsByClassName('orb-options')[0];
    orbsOptions.innerHTML = '';
    loadOrbs(build.character, currentSkillSlotID);
    selectOrb();
};

function setModalEvents() {
    const artifacts = document.querySelectorAll(".artifact-slot-image");
    artifacts.forEach(artifact => {
        artifact.addEventListener("click", artifactSlotClick);
    });

    const trophies = document.querySelectorAll(".trophy-slot-image");
    trophies.forEach(trophy => {
        trophy.addEventListener("click", trophySlotClick)
    });

    var characterImage = characterSlot.getElementsByClassName('character-slot-image')[0];
    characterImage.addEventListener("click", characterSlotClick);

    const skills = document.querySelectorAll(".skill-slot-image");
    skills.forEach((skill, index) => {
        skill.addEventListener("click", skillSlotClick);
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

function setLink() {
    var code = `${window.location.origin+window.location.pathname}?code=`+
    `${build.character}-${build.artifacts[0]}-${build.artifacts[1]}-${build.trophies[0]}-${build.trophies[1]}` +
    `-${build.orbs[0]}-${build.orbs[1]}-${build.orbs[2]}-${build.orbs[3]}-${build.orbs[4]}-${build.orbs[5]}`;

    var linkInput = document.getElementById('link-input');
    linkInput.value = code;
};

function loadBuild(codigo) {
    if (!codigo) {
        return
    }
    var codList = codigo.split("-");

    build.character = codList[0];
    build.artifacts[0] = codList[1];
    build.artifacts[1] = codList[2];
    build.trophies[0] = codList[3];
    build.trophies[1] = codList[4];
    build.orbs[0] = codList[5];
    build.orbs[1] = codList[6];
    build.orbs[2] = codList[7];
    build.orbs[3] = codList[8];
    build.orbs[4] = codList[9];
    build.orbs[5] = codList[10];

    updateBuild();
    setLink();
};

function loadParamQuery() {
    var query = location.search.slice(1);
    var partes = query.split('&');
    var dataQuery = {};

    partes.forEach(function (parte) {
        var chaveValor = parte.split('=');
        var chave = chaveValor[0];
        var valor = chaveValor[1];
        dataQuery[chave] = valor;
    });

    loadBuild(dataQuery.code) 
};


function main() {
    loadArtifacts();    
    loadTrophies();
    loadCharacters()
    setModalEvents();      

    copyButton.addEventListener("click", () =>{
        navigator.clipboard.writeText(linkInput.value)
    });

    loadBuild('0-0-0-0-0-0-0-0-0-0-0');    
    loadParamQuery();
}

loadInfo();    





