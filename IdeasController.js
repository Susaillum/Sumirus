import { db } from './Store.js';
import { IdeasView } from './IdeasView.js';

export class IdeasController {
    constructor() {
        this.view = new IdeasView();
    }

    init() {
        console.log('[IDEAS] Quadro de Insights Iniciado.');
        this.view.mount('kanban-container'); // Reusa o container principal
        this.render();
    }

    render() {
        // Pega as ideias e inverte para mostrar as mais novas primeiro
        const list = (db.state.ideas || []).slice().reverse();
        this.view.render(list);
        this.bindEvents();
    }

    bindEvents() {
        // SALVAR
        const btnSave = document.getElementById('btn-save-idea');
        if(btnSave) {
            btnSave.onclick = () => {
                const text = document.getElementById('idea-text').value;
                if(!text.trim()) return window.SumirusSystem.notify('Escreva algo...', 'warning');

                // A "IA" de classificação está dentro do Store.js no método addIdea
                db.addIdea(text);
                
                window.SumirusSystem.notify('Insight registrado!', 'success');
                this.render();
            };
        }

        // DELETAR
        const deleteBtns = document.querySelectorAll('.btn-del-idea');
        deleteBtns.forEach(btn => {
            btn.onclick = () => {
                if(confirm('Descartar ideia?')) {
                    db.removeIdea(btn.getAttribute('data-id'));
                    this.render();
                }
            };
        });
    }
}
