
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

var currentSelectedArtifact = 0;
var currentSelectedTrophy = 0;
var currentSelectedOrb = 0;

async function loadInfo() {
    const resposta = await fetch("drakantos_builder.json");
    data = await resposta.json();
    main();
};

function isItemCharacterAllowed(item, characterID) {
    if (!item) {
        return false;
    };

    if (!item.ALLOWED_CHARACTERS || !Array.isArray(item.ALLOWED_CHARACTERS)) {
        return true;
    }

    return item.ALLOWED_CHARACTERS.includes(parseInt(characterID));
};

function filterArtifacts(event) {
    var filterInput = document.getElementById('search-artifact-input');
    var artifactOptions = document.getElementsByClassName('artifact-options')[0].children;

    const filterText = filterInput.value.toLowerCase();

    for (let i = 0; i < artifactOptions.length; i++) {
        const artifact = artifactOptions[i];
        const id = artifact.getAttribute('data-id');
        if (!data.ARTIFACTS[id]) {
            continue;
        };
        const itemText = data.ARTIFACTS[id].NAME.toLowerCase();
        
        if (itemText.includes(filterText)) {
            artifact.classList.remove('hidden')
        }
        else {
            artifact.classList.add('hidden');
        }
    };
}

function filterTrophies(event) {
    var filterInput = document.getElementById('search-trophy-input');
    var trophyOptions = document.getElementsByClassName('trophy-options')[0].children;

    const filterText = filterInput.value.toLowerCase();

    for (let i = 0; i < trophyOptions.length; i++) {
        const trophy = trophyOptions[i];
        const id = trophy.getAttribute('data-id');
        if (!data.TROPHIES[id]) {
            continue;
        };
        const itemText = data.TROPHIES[id].NAME.toLowerCase();

        if (itemText.includes(filterText)) {
            trophy.classList.remove('hidden');
        }
        else {
            trophy.classList.add('hidden');
        }
    }
}

function filterOrbs(event) {
    const character = data.CHARACTERS[build.character];
    if (!character) {
        return;
    }
    const slot = character.SKILLS['SKILL' + (parseInt(currentSkillSlotID)+1)];
    if (!slot) {
        return;
    }

    var filterInput = document.getElementById('search-orb-input');
    var orbOptions = document.getElementsByClassName('orb-options')[0].children;    

    const filterText = filterInput.value.toLowerCase();

    for (let i = 0; i < orbOptions.length; i++) {
        const orb = orbOptions[i];
        const id = orb.getAttribute('data-id');
        const skill = slot[i];
        if (!skill) {
            continue
        };

        const itemText = skill.NAME.toLowerCase();

        if (itemText.includes(filterText)) {
            orb.classList.remove('hidden');
        }
        else {
            orb.classList.add('hidden');
        }
    }
}

function loadArtifacts() {
    const filteredArtifacts = data.ARTIFACTS.map((artifact, index) => ({artifact, index})).filter(artifact => isItemCharacterAllowed(artifact.artifact, build.character));

    const artifactOptions = document.getElementsByClassName('artifact-options')[0];
    artifactOptions.innerHTML = "";

    filteredArtifacts.forEach((artifact) => {
        var div = document.createElement('div');
        div.className = 'artifact-option';

        var img = document.createElement('img');
        img.src = "imgs/drakantos/artifacts/"+artifact.index+".PNG";
        img.className = 'artifact-option-image';

        div.setAttribute('data-id', artifact.index);
        div.appendChild(img);
        img.addEventListener("click", (event) => {
            artifactClick(artifact.index, event)
        });

        artifactOptions.appendChild(div);
    });
}

function loadTrophies() {
    const filteredTrophies = data.TROPHIES.map((trophy, index) => ({trophy, index})).filter(trophy => isItemCharacterAllowed(trophy.trophy, build.character));

    const trophyOptions = document.getElementsByClassName('trophy-options')[0];
    trophyOptions.innerHTML = "";

    filteredTrophies.forEach((trophy) => {
        var div = document.createElement('div');
        div.className = 'trophy-option';

        var img = document.createElement('img');
        img.src = "imgs/drakantos/trophies/"+trophy.index+".PNG";
        img.className = 'trophy-option-image';

        div.setAttribute('data-id', trophy.index)
        div.appendChild(img);
        img.addEventListener("click", (event) => {
            trophyClick(trophy.index, event)  
        });
        
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

        div.setAttribute('data-id', index)
        div.appendChild(img);

        img.addEventListener("click", (event) => {
            orbClick(skillID, index, event)
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
        trophy1Name.textContent = 'Selecione o Troféu';
        trophy1Image.src = `imgs/drakantos/trophies/NULL.PNG`;
    }
    else {
        trophy1Name.textContent = data.TROPHIES[build.trophies[0]].NAME;
        trophy1Image.src = `imgs/drakantos/trophies/${build.trophies[0]}.PNG`;
    };

    if (build.trophies[1] == null || data.TROPHIES[build.trophies[1]] == null) {
        trophy2Name.textContent = 'Selecione o Troféu';
        trophy2Image.src = `imgs/drakantos/trophies/NULL.PNG`;
    }
    else {
        trophy2Name.textContent = data.TROPHIES[build.trophies[1]].NAME;
        trophy2Image.src = `imgs/drakantos/trophies/${build.trophies[1]}.PNG`;
    };    
};

function updateOrb() {
    var character = null
    if (build.character != null) {
        character = data.CHARACTERS[build.character]
    };

    build.orbs.forEach((orbID, skillID) => {
        var orbDiv = document.getElementById('skill-' + skillID);
        var orbImage = orbDiv.getElementsByClassName('skill-slot-image')[0];

        if (character == null || build.orbs[skillID] == null || 
            data.CHARACTERS[build.character].SKILLS["SKILL" + (parseInt(skillID)+1)] == null) {
            orbImage.src = "imgs/drakantos/orbs/NULL.PNG";        
        }
        else {
            orbImage.src = "imgs/drakantos/orbs/"+data.CHARACTERS[build.character].NAME.toUpperCase() + "/" + skillID + "_" + orbID + ".PNG";        
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

function artifactClick(artifactID, event) {
    currentSelectedArtifact = artifactID;

    const artifactName = document.getElementById('artifact-name');
    const artifactImage = document.getElementById('artifact-image');
    const artifactDesc = document.getElementById('artifact-description');

    const artifact = data.ARTIFACTS[artifactID];
    artifactName.textContent = artifact.NAME;
    artifactImage.src = `imgs/drakantos/artifacts/preview/${artifactID}.PNG`;
    artifactDesc.textContent = artifact.DESCRIPTION;

    const artifactDiv = event.currentTarget;

    selectedList = document.getElementsByClassName('selected');
    if (selectedList) {
        for (let i = 0; i < selectedList.length; i++) {
            selectedList[i].classList.remove('selected');
       };
    };
    artifactDiv.classList.add('selected');
};

function setTrophy(slot, trophyID) {
    build.trophies[slot] = trophyID;
    updateBuild();
};

function trophyClick(trophyID, event) {
    currentSelectedTrophy = trophyID;

    const trophyName = document.getElementById('trophy-name');
    const trophyImage = document.getElementById('trophy-image');
    const trophyDesc = document.getElementById('trophy-description');

    const trophy = data.TROPHIES[trophyID];
    trophyName.textContent = trophy.NAME;
    trophyImage.src = `imgs/drakantos/trophies/preview/${trophyID}.PNG`;
    trophyDesc.textContent = trophy.DESCRIPTION;

    const trophyDiv = event.currentTarget;

    selectedList = document.getElementsByClassName('selected');
    if (selectedList) {
        for (let i = 0; i < selectedList.length; i++) {
            selectedList[i].classList.remove('selected');
       };
    };
    trophyDiv.classList.add('selected');
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
    updateBuild();
};

function orbClick(skillID, orbID, event) {
    const character = data.CHARACTERS[build.character];
    if (!character) {
        return
    };

    slot = character.SKILLS['SKILL' + (parseInt(skillID) + 1)];
    if (!slot) {
        return
    }

    currentSelectedOrb = orbID;

    const orbName = document.getElementById('orb-name');
    const orbImage = document.getElementById('orb-image');
    const orbDesc = document.getElementById('orb-description');

    const orb = slot[orbID];
    orbName.textContent = orb.NAME;
    orbImage.src = `imgs/drakantos/orbs/${character.NAME.toUpperCase()}/preview/${orbID}.PNG`;
    orbDesc.textContent = orb.DESCRIPTION;

    const orbDiv = event.currentTarget;

    selectedList = document.getElementsByClassName('selected');
    if (selectedList) {
        for (let i = 0; i < selectedList.length; i++) {
            selectedList[i].classList.remove('selected');
       };
    };
    orbDiv.classList.add('selected');
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
    if (build.character == null) {
        return
    };
        
    loadArtifacts();
    
    modalArtifact.style.display = "block";

    currentArtifactSlotID = event.target.parentElement.getAttribute('data-artifact-slot');
};

function trophySlotClick(event) {
    if (build.character == null) {
        return
    };

    loadTrophies();

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
    
    const artifactOkButton = document.getElementById('artifact-ok-button');    
    artifactOkButton.addEventListener('click', () => {
        setArtifact(currentArtifactSlotID, currentSelectedArtifact);
        modalArtifact.style.display = "none";        
        currentSelectedArtifact = 0;
    })

    const artifactCancelButton = document.getElementById('artifact-cancel-button');
    artifactCancelButton.addEventListener('click', () => {
        modalArtifact.style.display = "none";        
        currentSelectedArtifact = 0;
    });
    
    const trophies = document.querySelectorAll(".trophy-slot-image");
    trophies.forEach(trophy => {
        trophy.addEventListener("click", trophySlotClick)
    });

    const trophyOkButton = document.getElementById('trophy-ok-button');
    trophyOkButton.addEventListener('click', () => {
        setTrophy(currentTrophySlotID, currentSelectedTrophy);
        modalTrophy.style.display = "none";
        currentSelectedTrophy = 0;
    });

    const trophyCancelButton = document.getElementById('trophy-cancel-button');
    trophyCancelButton.addEventListener('click', () => {
        modalTrophy.style.display = "none";
        currentSelectedTrophy = 0;
    });

    var characterImage = characterSlot.getElementsByClassName('character-slot-image')[0];
    characterImage.addEventListener("click", characterSlotClick);

    const skills = document.querySelectorAll(".skill-slot-image");
    skills.forEach((skill, index) => {
        skill.addEventListener("click", skillSlotClick);
    });

    const orbOkButton = document.getElementById('orb-ok-button');
    orbOkButton.addEventListener('click', () => {
        setOrb(currentSkillSlotID, currentSelectedOrb);        
        modalOrb.style.display = "none";
        currentSelectedOrb = 0;
    });

    const orbCancelButton = document.getElementById('orb-cancel-button');
    orbCancelButton.addEventListener('click', () => {
        modalOrb.style.display = "none";
        currentSelectedOrb = 0;
    });

    const artifactInput = document.getElementById('search-artifact-input');
    artifactInput.addEventListener('input', filterArtifacts);

    const trophyInput = document.getElementById('search-trophy-input');
    trophyInput.addEventListener('input', filterTrophies);

    const orbInput = document.getElementById('search-orb-input');
    orbInput.addEventListener('input', filterOrbs);

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

    updateBuild();
    loadParamQuery();
}

loadInfo();    





