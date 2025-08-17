
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

function formatPlaceHolder(text, format) {
    switch (format) {
        case 0: return `<span class="white-highlight">${text}</span>`;
        case 1: return `<span class="cyan-highlight">${text}</span>`;
        case 2: return `<span class="damage-highlight">${text}</span>`;
        default: return text;
    }
};

function formatAbilityDescription(ability) {
  let description = ability.DESCRIPTION;
  const values = ability.VALUES;

  let i = 0;
  while (description.includes('%s') && i < values.length) {
    description = description.replace('%s', formatPlaceHolder(values[i][0], values[i][1]));
    i++;
  }
  
  return description;
}

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
    const slot = character.SKILLS[currentSkillSlotID];
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

        if (artifact.index == build.artifacts[currentArtifactSlotID]) {
            div.classList.add('selected')
        }      

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

        if (trophy.index == build.trophies[currentTrophySlotID]) {
            div.classList.add('selected')
        }        
        
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

    if (character.SKILLS == null) {
        return
    }

    const orbsOptions = document.getElementsByClassName('orb-options')[0];
    orbsOptions.innerHTML = '';

    orbs = character.SKILLS[skillID]
    
    orbs.forEach((orb, index) => {
        var div = document.createElement('div');
        div.className = 'orb-option';         

        var img = document.createElement('img');
        img.src = "imgs/drakantos/orbs/"+character.NAME.toUpperCase() + "/" + skillID + "_" + index + ".PNG";
        img.className = 'orb-option-image';

        div.setAttribute('data-id', index)
        div.appendChild(img);

        img.addEventListener("click", (event) => {
            orbClick(skillID, index, event)
        });

        if (index == build.orbs[currentSkillSlotID]) {
            div.classList.add('selected')
        }

        orbsOptions.appendChild(div);
    });
};

function updateCharacter() {
    var characterName = characterSlot.getElementsByClassName('character-slot-name')[0];
    var characterImage = characterSlot.getElementsByClassName('character-slot-image')[0];

    if (build.character == null || data.CHARACTERS[build.character] == null) { 
        characterName.textContent = 'SELECT THE CHARACTER';
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
        artifact1Name.textContent = 'Select the artifact';
        artifact1Image.src = 'imgs/drakantos/artifacts/NULL.PNG';
    }
    else {
        artifact1Name.textContent = data.ARTIFACTS[build.artifacts[0]].NAME;
        artifact1Image.src = `imgs/drakantos/artifacts/${build.artifacts[0]}.PNG`;
    };

    if (build.artifacts[1] == null || data.ARTIFACTS[build.artifacts[1]] == null) {
        artifact2Name.textContent = 'Select the artifact';
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
        trophy1Name.textContent = 'Select the trophy';
        trophy1Image.src = `imgs/drakantos/trophies/NULL.PNG`;
    }
    else {
        trophy1Name.textContent = data.TROPHIES[build.trophies[0]].NAME;
        trophy1Image.src = `imgs/drakantos/trophies/${build.trophies[0]}.PNG`;
    };

    if (build.trophies[1] == null || data.TROPHIES[build.trophies[1]] == null) {
        trophy2Name.textContent = 'Select the trophy';
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
            data.CHARACTERS[build.character].SKILLS == null || data.CHARACTERS[build.character].SKILLS[skillID] == null) {
            orbImage.src = "imgs/drakantos/orbs/NULL.PNG";        
        }
        else {
            orbImage.src = "imgs/drakantos/orbs/"+data.CHARACTERS[build.character].NAME.toUpperCase() + "/S_" + skillID + ".PNG";        
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

function updateArtifactPreview(artifactID) {
    const artifactName = document.getElementById('artifact-name');
    const artifactImage = document.getElementById('artifact-image');
    const artifactDesc = document.getElementById('artifact-description');
    const artifactCharge = document.getElementById('artifact-charge');
    
    const artifact = data.ARTIFACTS[artifactID];

    if (artifact) {
        artifactName.textContent = artifact.NAME;
        artifactImage.src = `imgs/drakantos/artifacts/preview/${artifactID}.GIF`;
        artifactDesc.innerHTML = artifact.DESCRIPTION;
        artifactCharge.textContent = 'Charges: ' + artifact.CHARGES;
    }
    else {
        artifactName.textContent = '';
        artifactImage.src = 'imgs/drakantos/artifacts/preview/NULL.GIF';
        artifactDesc.textContent = '';
        artifactCharge.textContent = '';
    }
}

function artifactClick(artifactID, event) {
    currentSelectedArtifact = artifactID;

    const artifactDiv = event.currentTarget;

    selectedList = document.getElementsByClassName('selected');
    if (selectedList) {
        for (let i = 0; i < selectedList.length; i++) {
            selectedList[i].classList.remove('selected');
       };
    };
    artifactDiv.classList.add('selected');

    updateArtifactPreview(artifactID)
};

function setTrophy(slot, trophyID) {
    build.trophies[slot] = trophyID;
    updateBuild();
};

function updateTrophyPreview(trophyID) {
    const trophyName = document.getElementById('trophy-name');
    const trophyImage = document.getElementById('trophy-image');
    const trophyDesc = document.getElementById('trophy-description');
    
    const trophy = data.TROPHIES[trophyID];

    if (trophy) {
        trophyName.textContent = trophy.NAME;
        trophyImage.src = `imgs/drakantos/trophies/preview/${trophyID}.PNG`;
        trophyDesc.textContent = trophy.DESCRIPTION;
    }
    else {
        trophyName.textContent = '';
        trophyImage.src = 'imgs/drakantos/trophies/preview/NULL.PNG';
        trophyDesc.textContent = '';
    }
};

function trophyClick(trophyID, event) {
    const trophyDiv = event.currentTarget;

    currentSelectedTrophy = trophyID;

    selectedList = document.getElementsByClassName('selected');
    if (selectedList) {
        for (let i = 0; i < selectedList.length; i++) {
            selectedList[i].classList.remove('selected');
       };
    };
    trophyDiv.classList.add('selected');

    updateTrophyPreview(trophyID);
};

function setCharacter(characterID) {
    if (build.character != characterID) {
        build.character = characterID;
        build.orbs = [0, 0, 0, 0, 0, 0]
        updateBuild();
    };
};

function characterOptionClick(character) {
    modalCharacter.style.display = "none";
    setCharacter(character);
};

function setOrb(skillID, orbID) {
    build.orbs[skillID] = orbID;
    updateBuild();
};

function updateOrbPreview(skillID, orbID) {
    const character = data.CHARACTERS[build.character];
    if (!character) {
        return
    };

    slot = character.SKILLS[skillID];
    if (!slot) {
        return
    }

    currentSelectedOrb = orbID;

    const orbName = document.getElementById('orb-name');
    const orbImage = document.getElementById('orb-image');
    const orbDesc = document.getElementById('orb-description');
    const orbCooldown = document.getElementById('orb-cooldown');

    const orb = slot[orbID];
    orbName.textContent = orb.NAME;
    orbImage.src = `imgs/drakantos/orbs/${character.NAME.toUpperCase()}/preview/${skillID}${orbID}.GIF`;
    orbDesc.innerHTML = formatAbilityDescription(orb);
    if (orb.COOLDOWN) {
        orbCooldown.textContent = 'Cooldown: ' + orb.COOLDOWN;
    }
    else if (orb.ENERGY) {
        orbCooldown.textContent = 'Energy: ' + orb.ENERGY;
    }
};

function orbClick(skillID, orbID, event) {
    const orbDiv = event.currentTarget;    

    selectedList = document.getElementsByClassName('selected');
    if (selectedList) {
        for (let i = 0; i < selectedList.length; i++) {
            selectedList[i].classList.remove('selected');
       };
    };
    orbDiv.classList.add('selected');

    updateOrbPreview(skillID, orbID);
};

function selectArtifact() {    
    loadArtifacts();    
    updateArtifactPreview(build.artifacts[currentArtifactSlotID]);

    modalArtifact.style.display = "block";    
};

function selectTrophy() {
    loadTrophies();
    updateTrophyPreview(build.trophies[currentTrophySlotID])

    modalTrophy.style.display = "block";
};

function selectCharacter() {
    modalCharacter.style.display = "block";
}

function selectOrb() {
    loadOrbs(build.character, currentSkillSlotID);
    updateOrbPreview(currentSkillSlotID, build.orbs[currentSkillSlotID]);

    modalOrb.style.display = "block";
};

function artifactSlotClick(event) {
    if (build.character == null) {
        return
    };
        
    currentArtifactSlotID = event.target.parentElement.getAttribute('data-artifact-slot');

    selectArtifact();
};

function trophySlotClick(event) {
    if (build.character == null) {
        return
    };

    currentTrophySlotID = event.target.parentElement.getAttribute('data-trophy-slot');

    selectTrophy();
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

    selectOrb();
};

function updateArtifactTooltip(artifactID) {
    const name = document.getElementById('tooltip-name');
    const image = document.getElementById('tooltip-image');
    const description = document.getElementById('tooltip-description');
    const charge = document.getElementById('tooltip-charge');
    const orbImage = document.getElementById('tooltip-orb-preview');

    orbImage.style.display = 'none';    

    const artifact = data.ARTIFACTS[artifactID];

    if (artifact) {
        name.textContent = artifact.NAME;
        image.src = `imgs/drakantos/artifacts/preview/${artifactID}.GIF`;
        description.textContent = artifact.DESCRIPTION;
        charge.textContent = 'Charges: ' + artifact.CHARGES;
    };
};

function updateTrophyTooltip(trophyID) {
    const name = document.getElementById('tooltip-name');
    const image = document.getElementById('tooltip-image');
    const description = document.getElementById('tooltip-description');
    const charge = document.getElementById('tooltip-charge');
    const orbImage = document.getElementById('tooltip-orb-preview');

    orbImage.style.display = 'none';    

    const trophy = data.TROPHIES[trophyID];

    if (trophy) {
        name.textContent = trophy.NAME;
        image.src = `imgs/drakantos/trophies/preview/${trophyID}.GIF`;
        description.textContent = trophy.DESCRIPTION;
        charge.textContent = '';
    };
};

function updateOrbTooltip(slotID, skillID) {
    const name = document.getElementById('tooltip-name');
    const image = document.getElementById('tooltip-image');
    const description = document.getElementById('tooltip-description');
    const cooldown = document.getElementById('tooltip-charge');
    const orbImage = document.getElementById('tooltip-orb-preview');

    const character = data.CHARACTERS[build.character];

    if (!character ||
        !character.SKILLS || 
        !character.SKILLS[slotID] || 
        !character.SKILLS[slotID][skillID]) {
        return
    };

    const orb = character.SKILLS[slotID][skillID];

    if (orb) {
        name.textContent = orb.NAME;
        image.src = `imgs/drakantos/orbs/${character.NAME.toUpperCase()}/preview/${slotID}_${skillID}.GIF`;
        if (skillID == 0) {
            orbImage.style.display = 'none';
        }
        else {
            orbImage.src = `imgs/drakantos/orbs/${character.NAME.toUpperCase()}/${slotID}_${skillID}.PNG`;
            orbImage.style.display = 'flex';
        }
        description.innerHTML = formatAbilityDescription(orb);
        if (orb.COOLDOWN) {
            cooldown.textContent = 'Cooldown: ' + orb.COOLDOWN;
        }
        else if (orb.ENERGY) {
            cooldown.textContent = 'Energy: ' + orb.ENERGY;
        };
    };
};

function setModalEvents() {
    const artifacts = document.querySelectorAll(".artifact-slot-image");
    artifacts.forEach(artifact => {
        artifact.addEventListener("click", artifactSlotClick);
        artifact.addEventListener('mouseenter', () => {
            const slotID = artifact.getAttribute('data-artifact-slot');

            if (!data.ARTIFACTS[build.artifacts[slotID]]) {
                return
            };
            
            const tooltip = document.getElementById('tooltip');
            const rect = artifact.getBoundingClientRect();
            updateArtifactTooltip(build.artifacts[slotID]);
            const tooltipHeight = tooltip.getBoundingClientRect().height;

            if (window.innerWidth > 600) {
                tooltip.style.top  = `${rect.top + window.scrollY + 70}px`;
                tooltip.style.left  = `${rect.left + window.scrollX}px`;
            }
            else {
                tooltip.style.top  = `${rect.top + window.scrollY - tooltipHeight}px`;
                tooltip.style.left  = `0px`;
            };
            tooltip.style.visibility = 'visible';
        });
        artifact.addEventListener('mouseleave', () => {
            tooltip.style.visibility = 'hidden';
        });
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
        trophy.addEventListener("click", trophySlotClick);
        trophy.addEventListener('mouseenter', () => {
            const slotID = trophy.getAttribute('data-trophy-slot');

            if (!data.TROPHIES[build.trophies[slotID]]) {
                return
            };
            
            const tooltip = document.getElementById('tooltip');
            const rect = trophy.getBoundingClientRect();
            updateTrophyTooltip(build.trophies[slotID]);
            const tooltipHeight = tooltip.getBoundingClientRect().height;

            if (window.innerWidth > 600) {
                tooltip.style.top  = `${rect.top + window.scrollY + 70}px`;
                tooltip.style.left  = `${rect.left + window.scrollX}px`;
            }
            else {
                tooltip.style.top  = `${rect.top + window.scrollY - tooltipHeight}px`;
                tooltip.style.left  = `0px`;
            };            
            tooltip.style.visibility = 'visible';
        });
        trophy.addEventListener('mouseleave', () => {
            tooltip.style.visibility = 'hidden';
        });        
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
        skill.addEventListener('mouseenter', () => {
            if (!data.CHARACTERS[build.character] ||
                !data.CHARACTERS[build.character].SKILLS || 
                !data.CHARACTERS[build.character].SKILLS[index] || 
                !data.CHARACTERS[build.character].SKILLS[index][build.orbs[index]]) {
                return
            };
            
            const tooltip = document.getElementById('tooltip');
            const rect = skill.getBoundingClientRect();
            updateOrbTooltip(index, build.orbs[index]);
            const tooltipHeight = tooltip.getBoundingClientRect().height;
            tooltip.style.top  = `${rect.top + window.scrollY - tooltipHeight}px`;
            if (window.innerWidth > 600) {
                tooltip.style.left  = `${rect.left + window.scrollX}px`;
            }
            else {
                tooltip.style.left  = `0px`;
            }
            tooltip.style.visibility = 'visible';
        });
        skill.addEventListener('mouseleave', () => {
            tooltip.style.visibility = 'hidden';
        });        
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
    window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    });    
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





