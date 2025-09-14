defFator = document.getElementById("def_fator");
armor = document.getElementById("armor");
armorBonus = document.getElementById("armor_bonus");
rdf = document.getElementById("rdf");
hp_effecttiveness = document.getElementById("hp_effecttiveness");
effect_hp = document.getElementById("effect_hp");

defFator.addEventListener("input", calculate);
armor.addEventListener("input", calculate);
armorBonus.addEventListener("input", calculate);
rdf.addEventListener("input", calculate);

function getHPEffectiveness(defFator, armor, armorBonus, rdf) {
    armor = armor * (1 + armorBonus / 100);
    red_multiplier = 1 - (rdf / 100);
    dmg_received = defFator / (defFator + armor) * red_multiplier;
    return 1 / dmg_received;
}

function calculate() {
    hp_effecttiveness.value = getHPEffectiveness(parseFloat(defFator.value), parseFloat(armor.value), parseFloat(armorBonus.value), parseFloat(rdf.value))
    effect_hp.value = Math.round(hp_effecttiveness.value * parseFloat(hp.value));
}