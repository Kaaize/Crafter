const torchGrid = document.getElementById("torch-grid");
const resetButton = document.getElementById("reset-button");
const countDisplay = document.getElementById("count");

let torchList = [0, 0, 0, 0, 0, 0, 0, 0];
let count = 0;

// Mapping indices to Grid Positions (Row, Col)
// 1-based indexing for CSS Grid
const positions = [
    { r: 2, c: 1 }, // Index 0: Mid Left
    { r: 1, c: 2 }, // Index 1: Top Left
    { r: 1, c: 3 }, // Index 2: Top Mid
    { r: 1, c: 4 }, // Index 3: Top Right
    { r: 2, c: 5 }, // Index 4: Mid Right
    { r: 3, c: 4 }, // Index 5: Bot Right
    { r: 3, c: 3 }, // Index 6: Bot Mid
    { r: 3, c: 2 }  // Index 7: Bot Left
];

function shuffle(array) {
    for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 2);
    }
}

function getPrev(index) {
    if (index === 0) {
        return torchList.length - 1;
    } else {
        return index - 1;
    }
}

function getNext(index) {
    if (index === torchList.length - 1) {
        return 0;
    } else {
        return index + 1;
    }
}

function changeState(tochaId) {
    let prev = getNext(tochaId);
    let next = getPrev(tochaId);

    torchList[tochaId] = torchList[tochaId] === 1 ? 0 : 1;
    torchList[prev] = torchList[prev] === 1 ? 0 : 1;
    torchList[next] = torchList[next] === 1 ? 0 : 1;
}

function updateTochas() {
    torchGrid.innerHTML = "";

    for (let i = 0; i < torchList.length; i++) {
        let torch = document.createElement("div");
        torch.className = "torch";

        // Grid Positioning
        torch.style.gridRow = positions[i].r;
        torch.style.gridColumn = positions[i].c;

        if (torchList[i] === 1) {
            torch.classList.add("active");
        } else {
            torch.classList.remove("active");
        }

        torch.id = "tocha" + (i + 1);

        torch.addEventListener("click", function () {
            changeState(i);
            updateTochas();
        })

        torchGrid.appendChild(torch);
    }

    if (!torchList.includes(1)) {
        // Need a small timeout to let the last render happen before alert
        setTimeout(() => {
            alert("Parabéns! Você apagou tudo");
            while (!torchList.includes(1)) {
                shuffle(torchList);
            }
            updateTochas();
            count += 1;
            countDisplay.innerText = count;
        }, 100);
    }
}

resetButton.addEventListener("click", function () {
    shuffle(torchList);
    updateTochas();
});

shuffle(torchList);
updateTochas();