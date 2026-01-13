import { db } from '../../core/Store.js';

export class IdeasView {
    constructor() {
        this.container = null;
    }

    mount(elementId) {
        this.container = document.getElementById(elementId);
    }

    render(ideas) {
        this.container.innerHTML = `
            <div style="padding: 25px; animation: fadeIn 0.3s; height: 100%; overflow-y: auto;">
                
                <div class="idea-input-box">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <h4 style="margin:0; color:#fff;"><i class="fa-regular fa-lightbulb"></i> NOVO INSIGHT</h4>
                        <span style="font-size:0.7rem; color:#666;">Classificação Automática Ativa</span>
                    </div>
                    <textarea id="idea-text" placeholder="Digite sua ideia aqui... (Ex: Criar app de vendas urgente)"></textarea>
                    <div style="display:flex; justify-content:flex-end; margin-top:10px;">
                        <button id="btn-save-idea" class="btn-neon">
                            <i class="fa-solid fa-paper-plane"></i> REGISTRAR
                        </button>
                    </div>
                </div>

                <div class="divider-neon"></div>

                <div class="ideas-grid">
                    ${ideas.map(idea => {
                        // Formata Data
                        const date = new Date(idea.date).toLocaleDateString('pt-BR');
                        
                        // Gera Tags HTML
                        const tagsHTML = idea.tags.map(tag => {
                            let color = '#666'; // Geral
                            if(tag === 'Financeiro') color = '#00ff9d';
                            if(tag === 'Tech') color = '#00f0ff';
                            if(tag === 'Prioridade') color = '#ff003c';
                            
                            return `<span class="idea-tag" style="border-color:${color}; color:${color};">${tag}</span>`;
                        }).join('');

                        return `
                            <div class="idea-card">
                                <div class="idea-content">
                                    "${idea.text}"
                                </div>
                                <div class="idea-footer">
                                    <div class="tags-container">
                                        ${tagsHTML}
                                    </div>
                                    <div style="display:flex; align-items:center; gap:10px;">
                                        <span class="idea-date">${date}</span>
                                        <button class="btn-del-idea" data-id="${idea.id}"><i class="fa-solid fa-trash"></i></button>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                    ${ideas.length === 0 ? '<div style="grid-column: 1/-1; text-align:center; color:#444; margin-top:50px;">O mural está vazio. Tenha uma ideia!</div>' : ''}
                </div>
            </div>

            <style>
                .idea-input-box {
                    background: rgba(21, 26, 35, 0.6); border: 1px solid #333; padding: 20px; border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                }
                .idea-input-box textarea {
                    width: 100%; height: 80px; background: #0b0e14; border: 1px solid #334155; color: #fff;
                    padding: 15px; border-radius: 8px; outline: none; font-family: var(--font-main); font-size: 1.1rem; resize: none;
                }
                .idea-input-box textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 15px rgba(0,240,255,0.1); }

                .divider-neon { height: 1px; background: linear-gradient(90deg, transparent, var(--color-primary), transparent); margin: 30px 0; opacity: 0.3; }

                .ideas-grid {
                    display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;
                }

                .idea-card {
                    background: rgba(255,255,255,0.02); border: 1px solid #333; border-radius: 12px; padding: 20px;
                    display: flex; flex-direction: column; justify-content: space-between; gap: 15px; transition: 0.2s;
                    min-height: 150px;
                }
                .idea-card:hover { transform: translateY(-5px); border-color: #555; background: rgba(255,255,255,0.04); }

                .idea-content { font-family: 'Inter', sans-serif; font-style: italic; color: #e0e6ed; line-height: 1.5; font-size: 0.95rem; }

                .idea-footer { display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px; }
                
                .tags-container { display: flex; flex-wrap: wrap; gap: 5px; }
                .idea-tag {
                    font-size: 0.65rem; border: 1px solid; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; font-weight: bold;
                }

                .idea-date { font-size: 0.7rem; color: #666; font-family: var(--font-code); }
                .btn-del-idea { background: none; border: none; color: #444; cursor: pointer; transition: 0.2s; }
                .btn-del-idea:hover { color: var(--color-accent); }
            </style>
        `;
    }
}