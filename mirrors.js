function SetFilter() {
    let mirrors = document.getElementsByClassName("mirror-img")
    let mirrorsArray = [].slice.call(mirrors)
    let active = document.getElementsByClassName("active")
    for (let index=0; index < mirrors.length; index++) {
        let mirr = mirrorsArray[index]
        console.log(active.length)
        if (active.length < 1) {
            if (!mirr.className.includes("show")) {
                mirr.className += " show"
                continue
            }
        }

        if (mirr.hasAttribute("data-type-"+this.id)) {
            if (!mirr.className.includes("show")){
                mirr.className += " show"
            }
        } 
        else {
            mirr.className= mirr.className.replace(" show", "")
        }
    }
}


function changeActive(){
    let current = document.getElementsByClassName("active");
    if (current[0] === this) {
        this.className = this.className.replace(" active", "")
        return
    }
    if (current.length > 0) {
        current[0].className = current[0].className.replace(" active", "");
    }
    this.className += " active";
}


let tierbtns = document.getElementsByClassName("filter-icon")

for (let i=0; i<tierbtns.length; i++) {
    tierbtns[i].addEventListener("click", changeActive)
    tierbtns[i].addEventListener("click", SetFilter)
}

