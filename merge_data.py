import json
import unicodedata
import re

def slugify(value):
    value = str(value)
    value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode('ascii')
    value = re.sub(r'[^\w\s-]', '', value).strip().lower()
    return re.sub(r'[-\s]+', '_', value)

def load_json(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(data, filename):
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

def main():
    dados = load_json('dados.json')
    ship_data = load_json('crafter_ship.json')
    
    new_items = ship_data['ITEMS'].copy()
    
    # Map old IDs to new slugified keys
    id_map = {}
    
    # Process Basic Items (Ingredients)
    for item_id, item in dados['ITEMS'].items():
        key = slugify(item['nome'])
        id_map[item_id] = key
        
        # Avoid overwriting if exists (names might collide, though unlikely between ship parts and food)
        if key not in new_items:
            new_items[key] = {
                "id": str(item_id), # Keep old ID ref just in case
                "group": "food_ingredient",
                "name": item['nome'],
                "price": item['custo'],
                "image": item['image'] # Preserve image path
            }
            
    # Process Recipes
    for recipe_id, recipe in dados['RECIPES'].items():
        key = slugify(recipe['nome'])
        
        # Convert ingredients to craft format
        craft_list = []
        if 'ingredientes' in recipe:
            for ing in recipe['ingredientes']:
                old_ing_id = str(ing['id'])
                if old_ing_id in id_map:
                    craft_list.append({
                        "id": id_map[old_ing_id],
                        "qty": ing['quantidade']
                    })
                else:
                    print(f"Warning: Ingredient ID {old_ing_id} not found for recipe {recipe['nome']}")

        new_items[key] = {
            "group": "food",
            "name": recipe['nome'],
            "price": 0, # Recipes usually 0 base price, calc from ingredients
            "craft": craft_list,
            "image": recipe['image']
        }

    unified_data = {"ITEMS": new_items}
    save_json(unified_data, 'unified_crafter.json')
    print("Successfully created unified_crafter.json")

if __name__ == "__main__":
    main()
