const torchTop = document.getElementsByClassName("torch-top")[0];   
const torchMid = document.getElementsByClassName("torch-mid")[0];   
const torchBot = document.getElementsByClassName("torch-bot")[0];   

let torchList = [0, 1, 0, 1, 0, 1, 0, 1];
function shuffle(array) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
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
    console.log(tochaId, prev, next);
}

function updateTochas() {
    torchTop.innerHTML = "";
    torchMid.innerHTML = "";
    torchBot.innerHTML = "";
    for (let i = 0; i < torchList.length; i++) {
        torch = document.createElement("div");
        if (torchList[i] === 1) {
            torch.style.backgroundColor = "yellow";
        } else {
            torch.style.backgroundColor = "gray";
        }
        torch.className = "torch";
        torch.id = "tocha" + (i + 1);

        torch.addEventListener("click", function() {
            changeState(i);
            updateTochas();
        })

        if ([0, 4].includes(i)) {
            torchMid.appendChild(torch);
        }
        else if ([1, 2, 3].includes(i)) {
            torchTop.appendChild(torch);
        }
        else if ([5, 6, 7].includes(i)) {
            torchBot.appendChild(torch);
        }
    }
}

shuffle(torchList);
updateTochas();