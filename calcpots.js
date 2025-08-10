function getExp(lv) {
    lv = lv - 1
    return ((50 * lv * lv * lv) - (150 * lv * lv) + (400 * lv)) / 3
}

function calculate() {
    tier_values = { 'Bronze': 3, 'Prata': 2, 'Ouro': 1, 'Diamante': 0.5 }
    selected_tier = document.getElementsByClassName("active")[0]

    tier = tier_values[selected_tier.id]

    now_lvl = parseInt(document.getElementById("now_lvl").value)
    now_exp = getExp(now_lvl)

    next_lvl = now_lvl + 1
    next_exp = getExp(next_lvl)

    dif_exp = next_exp - now_exp

    percent = 1 - document.getElementById("percent").value / 100
    now_exp += dif_exp * percent

    target_lvl = parseInt(document.getElementById("target_lvl").value)
    target_exp = getExp(target_lvl)

    needed_exp = target_exp - now_exp

    big_pots = parseInt(document.getElementById("big_pots").value)
    med_pots = parseInt(document.getElementById("med_pots").value)
    sml_pots = parseInt(document.getElementById("sml_pots").value)

    big_exp = 100000 * tier
    med_exp = 10000 * tier
    sml_exp = 1000 * tier

    pots_exp = big_pots * big_exp + med_pots * med_exp + sml_pots * sml_exp

    total_exp = now_exp + pots_exp
    console.log('------')
    for (i = 1; i < 601; i++) {
        exp_i = getExp(i)
        console.log(exp_i, total_exp, getExp(i + 1))
        if (total_exp >= exp_i & total_exp < getExp(i + 1)) {
            reached_lvl = i

            exp_to_up = getExp(i + 1) - exp_i
            exceeded = total_exp - exp_i
            percent_lvl = (1 - exceeded / exp_to_up) * 100
            break
        }
    }

    needed_exp = target_exp - total_exp



    big_needed = Math.floor(needed_exp / big_exp)
    needed = needed_exp % big_exp

    med_needed = Math.floor(needed / med_exp)
    needed = needed_exp % med_exp

    sml_needed = Math.floor(needed / sml_exp)
    needed = needed_exp % sml_exp
    if ((needed % sml_exp) > 0) { sml_needed += 1 }

    if (needed_exp < 0) {
        big_needed = 0
        med_needed = 0
        sml_needed = 0
    }
    document.getElementById("exp-need").innerHTML = needed_exp
    document.getElementById("nivel-atingido").innerHTML = reached_lvl
    document.getElementById("percent-up").innerHTML = percent_lvl.toFixed(2)
    document.getElementById("exp-up").innerHTML = exp_to_up - exceeded
    document.getElementById("rbig").innerHTML = big_needed
    document.getElementById("rmed").innerHTML = med_needed
    document.getElementById("rsml").innerHTML = sml_needed

}

function changeActive() {
    let current = document.getElementsByClassName("active");
    if (current.length > 0) {
        current[0].className = current[0].className.replace(" active", "");
    }
    this.className += " active";
}


inputs = document.getElementsByClassName("form-control")

for (i of inputs) {
    i.addEventListener("input", calculate)
}

stars = document.getElementsByClassName("filter-icon")
for (i of stars) {
    i.addEventListener("click", changeActive)
    i.addEventListener("click", calculate)
}

calculate()