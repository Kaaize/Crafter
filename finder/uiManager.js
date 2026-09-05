import { directionsMap } from './geometryService.js';

export class UIManager {
    constructor(onDeleteClick) {    
        this.display = document.getElementById('coords-display');
        this.listContainer = document.getElementById('pos-list');
        this.regionSelect = document.getElementById('regionSelect');
        
        this.onDeleteClick = onDeleteClick;
    }

    onRegionChange(callback) {
        if (!this.regionSelect) return;
        this.regionSelect.addEventListener('change', (e) => {
            const selectedRegion = e.target.value;
            callback(selectedRegion)
        });
    }

    setRegion(regionKey) {
        if (this.regionSelect) {
            this.regionSelect.value = regionKey;
        }
    }

    updateCoords(x, y, z) {
        this.display.innerText = `X: ${Math.floor(x)}, Y: ${Math.floor(y)}, Z: ${z}`;
    }

    renderList(infos) {
        this.listContainer.innerHTML = '';

        infos.forEach((info, index) => {
            const div = document.createElement('div');
            div.className = 'pos-item';

            const span = document.createElement('span');
            span.innerText = `${info.x - 0.5}, ${info.y - 0.5}, ${info.z} `;
            div.appendChild(span);

            const dirbtn = document.createElement('img');
            const dirImg = (info.ang === -45) ? 'Center' : directionsMap[info.ang];
            dirbtn.src = `imgs_finder/${dirImg}.png`;
            dirbtn.className = 'del-btn';

            const delbtn = document.createElement('img');
            delbtn.src = 'imgs_finder/Delete.png';
            delbtn.className = 'del-btn';
            delbtn.onclick = () => this.onDeleteClick(index);

            div.appendChild(dirbtn);
            div.appendChild(delbtn);
            this.listContainer.appendChild(div);
        });
    }
}