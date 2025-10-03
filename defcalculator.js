defFator = document.getElementById("def_fator");
armor = document.getElementById("armor");
armorBonus = document.getElementById("armor_bonus");
rdf = document.getElementById("rdf");
hp_effecttiveness = document.getElementById("hp_effecttiveness");
effect_hp = document.getElementById("effect_hp");

defFator2 = document.getElementById("def_fator2");
armor2 = document.getElementById("armor2");
armorBonus2 = document.getElementById("armor_bonus2");
rdf2 = document.getElementById("rdf2");
hp_effecttiveness2 = document.getElementById("hp_effecttiveness2");
effect_hp2 = document.getElementById("effect_hp2");

dif_hp_effecttiveness = document.getElementById("dif_hp_effecttiveness");
dif_effect_hp = document.getElementById("dif_effect_hp");

hp_effecttiveness.addEventListener("input", calculate)
defFator.addEventListener("input", calculate);
armor.addEventListener("input", calculate);
armorBonus.addEventListener("input", calculate);
rdf.addEventListener("input", calculate);
hp_effecttiveness2.addEventListener("input", calculate)
defFator2.addEventListener("input", calculate);
armor2.addEventListener("input", calculate);
armorBonus2.addEventListener("input", calculate);
rdf2.addEventListener("input", calculate);

function getHPEffectiveness(defFator, armor, armorBonus, rdf) {
    armor = armor * (1 + armorBonus / 100);
    red_multiplier = 1 - (rdf / 100);
    dmg_received = defFator / (defFator + armor) * red_multiplier;
    return 1 / dmg_received;
}

function calculate() {
    hp_effecttiveness.value = getHPEffectiveness(parseFloat(defFator.value), parseFloat(armor.value), parseFloat(armorBonus.value), parseFloat(rdf.value))
    effect_hp.value = Math.round(hp_effecttiveness.value * parseFloat(hp.value));

    hp_effecttiveness2.value = getHPEffectiveness(parseFloat(defFator2.value), parseFloat(armor2.value), parseFloat(armorBonus2.value), parseFloat(rdf2.value))
    effect_hp2.value = Math.round(hp_effecttiveness2.value * parseFloat(hp2.value));

    dif_effect_hp.value = Math.round(parseFloat(effect_hp2.value) - parseFloat(effect_hp.value));
    dif_hp_effecttiveness.value = parseFloat(hp_effecttiveness2.value) - parseFloat(hp_effecttiveness.value);
}