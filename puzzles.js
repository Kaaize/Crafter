function SetFilter() {
    img = document.getElementById("puzzle-img")
    puzz = this.id
    img.src = "imgs/puzzles/"+this.id+".PNG"    
  }
  
  function changeActive(){
      let current = document.getElementsByClassName("active");
      if (current.length > 0) {
          current[0].className = current[0].className.replace(" active", "");
      }
      this.className += " active";
  }

  



let tierbtns = document.getElementsByClassName("filter-icon")
console.log(tierbtns)

for (let i=0; i<tierbtns.length; i++) {
    tierbtns[i].addEventListener("click", changeActive)
    tierbtns[i].addEventListener("click", SetFilter)
}

