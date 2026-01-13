import { db } from './Store.js';

export class ClientView {
    constructor() {
        this.container = null;
    }

    mount(elementId) {
        this.container = document.getElementById(elementId);
    }

    render(stats, isEditingId = null) {
        // Encontra o cliente que está sendo editado (se houver)
        let editData = null;
        if (isEditingId) {
            editData = db.state.clients.find(c => c.id == isEditingId);
        }

        // Define valores padrão se não estiver editando
        const formValues = {
            name: editData ? editData.name : '',
            contact: editData ? editData.contact : '',
            color: editData ? editData.color : '#00f0ff',
            btnText: editData ? 'SALVAR ALTERAÇÕES' : 'ADICIONAR PARCEIRO',
            btnIcon: editData ? 'fa-check' : 'fa-plus',
            headerTitle: editData ? 'EDITANDO REGISTRO' : 'NOVO PARCEIRO'
        };

        this.container.innerHTML = `
            <div class="crm-container">
                
                <div class="crm-header-card ${isEditingId ? 'editing-mode' : ''}">
                    <div class="header-title-row">
                        <h4 style="margin:0; color:${isEditingId ? 'var(--color-warning)' : 'var(--color-primary)'}; display:flex; align-items:center; gap:10px;">
                            <i class="fa-solid ${isEditingId ? 'fa-pen-to-square' : 'fa-user-plus'}"></i> 
                            ${formValues.headerTitle}
                        </h4>
                        ${isEditingId ? '<span class="edit-badge">MODO EDIÇÃO ATIVO</span>' : ''}
                    </div>

                    <div class="form-grid">
                        <div class="input-wrapper" style="flex: 2;">
                            <label>NOME DA EMPRESA</label>
                            <div class="input-icon-box">
                                <i class="fa-solid fa-building"></i>
                                <input type="text" id="client-name" placeholder="Ex: SAMENGO LOGÍSTICA" value="${formValues.name}">
                            </div>
                        </div>

                        <div class="input-wrapper" style="flex: 1;">
                            <label>ÁREA / CONTATO</label>
                            <div class="input-icon-box">
                                <i class="fa-solid fa-address-card"></i>
                                <input type="text" id="client-contact" placeholder="Ex: Financeiro" value="${formValues.contact}">
                            </div>
                        </div>

                        <div class="input-wrapper" style="width: 100px;">
                            <label>COR ID</label>
                            <div class="color-picker-wrapper">
                                <input type="color" id="client-color" value="${formValues.color}">
                            </div>
                        </div>
                        
                        <div class="buttons-wrapper">
                            ${isEditingId ? 
                                `<button id="btn-cancel-edit" class="btn-cancel">
                                    <i class="fa-solid fa-xmark"></i> CANCELAR
                                 </button>` 
                                : ''
                            }
                            
                            <button id="${isEditingId ? 'btn-update-client' : 'btn-add-client'}" class="btn-submit ${isEditingId ? 'btn-warning' : 'btn-primary'}" ${isEditingId ? `data-id="${isEditingId}"` : ''}>
                                <i class="fa-solid ${formValues.btnIcon}"></i> ${formValues.btnText}
                            </button>
                        </div>
                    </div>
                </div>

                <div class="divider-line"></div>

                <div class="clients-grid">
                    ${db.state.clients.map(client => {
                        // Pega estatísticas calculadas
                        const data = stats[client.name] || { count: 0, value: 0 };
                        const valueFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.value);
                        
                        // Verifica se este card está sendo editado para destacar
                        const activeClass = (client.id == isEditingId) ? 'card-editing' : '';
                        
                        return `
                        <div class="client-card ${activeClass}" style="border-top-color: ${client.color}">
                            
                            <div class="card-header">
                                <div class="avatar-circle" style="background: ${client.color}20; color: ${client.color}; border: 1px solid ${client.color}">
                                    ${client.name.substring(0,2).toUpperCase()}
                                </div>
                                <div class="card-titles">
                                    <h3>${client.name}</h3>
                                    <span>${client.contact}</span>
                                </div>
                                <div class="card-tools">
                                    <button class="tool-btn edit btn-edit-client" data-id="${client.id}" title="Editar Dados">
                                        <i class="fa-solid fa-pen"></i>
                                    </button>
                                    <button class="tool-btn delete btn-delete-client" data-id="${client.id}" title="Excluir Parceiro">
                                        <i class="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="card-stats-box">
                                <div class="stat-row">
                                    <span class="lbl"><i class="fa-solid fa-list-check"></i> Missões Ativas</span>
                                    <span class="val">${data.count}</span>
                                </div>
                                <div class="stat-row">
                                    <span class="lbl"><i class="fa-solid fa-sack-dollar"></i> Valor em Aberto</span>
                                    <span class="val money">${valueFmt}</span>
                                </div>
                            </div>

                            <div class="card-footer">
                                <div class="status-pill"><div class="dot"></div> ATIVO</div>
                                <button class="btn-filter btn-view-tasks" data-client="${client.name}">
                                    VER TAREFAS <i class="fa-solid fa-arrow-right"></i>
                                </button>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <style>
                .crm-container { padding: 25px; height: 100%; overflow-y: auto; overflow-x: hidden; animation: fadeIn 0.4s ease; }

                /* HEADER CARD */
                .crm-header-card {
                    background: linear-gradient(145deg, rgba(21, 26, 35, 0.9) 0%, rgba(15, 20, 28, 0.95) 100%);
                    border: 1px solid #334155; padding: 25px; border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.4); transition: 0.3s;
                }
                .crm-header-card.editing-mode { border-color: var(--color-warning); box-shadow: 0 0 20px rgba(252, 238, 10, 0.1); }
                
                .header-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .edit-badge { background: var(--color-warning); color: #000; font-weight: bold; font-size: 0.6rem; padding: 2px 8px; border-radius: 4px; }

                .form-grid { display: flex; gap: 20px; align-items: flex-end; flex-wrap: wrap; }
                
                .input-wrapper { display: flex; flex-direction: column; gap: 8px; min-width: 150px; }
                .input-wrapper label { font-size: 0.7rem; color: #94a3b8; font-weight: 700; letter-spacing: 1px; }
                
                .input-icon-box { position: relative; display: flex; align-items: center; }
                .input-icon-box i { position: absolute; left: 12px; color: #64748b; font-size: 0.9rem; }
                .input-icon-box input {
                    width: 100%; background: #0b0e14; border: 1px solid #334155; color: #fff;
                    padding: 12px 12px 12px 38px; border-radius: 6px; outline: none; font-family: var(--font-main); transition: 0.3s;
                }
                .input-icon-box input:focus { border-color: var(--color-primary); box-shadow: 0 0 15px rgba(0, 240, 255, 0.1); }

                .color-picker-wrapper input { width: 100%; height: 42px; padding: 2px; background: #0b0e14; border: 1px solid #334155; border-radius: 6px; cursor: pointer; }

                .buttons-wrapper { display: flex; gap: 10px; margin-left: auto; }
                
                .btn-submit {
                    padding: 0 25px; height: 42px; border: none; border-radius: 6px;
                    font-weight: 700; cursor: pointer; font-family: var(--font-main); transition: 0.3s;
                    display: flex; align-items: center; gap: 8px;
                }
                .btn-primary { background: var(--color-primary); color: #000; box-shadow: 0 0 15px rgba(0, 240, 255, 0.2); }
                .btn-primary:hover { filter: brightness(1.1); transform: translateY(-2px); }
                
                .btn-warning { background: var(--color-warning); color: #000; box-shadow: 0 0 15px rgba(252, 238, 10, 0.2); }
                .btn-warning:hover { filter: brightness(1.1); transform: translateY(-2px); }

                .btn-cancel {
                    background: transparent; border: 1px solid #444; color: #ccc; height: 42px; padding: 0 15px;
                    border-radius: 6px; cursor: pointer; font-family: var(--font-main); transition: 0.2s;
                }
                .btn-cancel:hover { background: rgba(255,255,255,0.1); color: #fff; }

                .divider-line { height: 1px; background: #334155; margin: 30px 0; opacity: 0.5; }

                /* GRID CARDS */
                .clients-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 25px; }

                .client-card {
                    background: #151a23; border: 1px solid #334155; border-top-width: 4px;
                    border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 20px;
                    transition: all 0.3s ease; position: relative; overflow: hidden;
                }
                .client-card:hover { transform: translateY(-5px); border-color: #475569; box-shadow: 0 15px 30px rgba(0,0,0,0.5); }
                .client-card.card-editing { border: 2px solid var(--color-warning); transform: scale(1.02); z-index: 10; }

                .card-header { display: flex; gap: 15px; align-items: center; }
                .avatar-circle {
                    width: 55px; height: 55px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
                    font-size: 1.4rem; font-weight: 800; font-family: var(--font-main);
                }
                .card-titles { flex: 1; }
                .card-titles h3 { margin: 0; font-size: 1.1rem; color: #e0e6ed; }
                .card-titles span { font-size: 0.8rem; color: #64748b; font-weight: 600; }

                .card-tools { display: flex; gap: 8px; }
                .tool-btn {
                    width: 32px; height: 32px; border-radius: 6px; border: 1px solid #334155; background: #0b0e14;
                    color: #94a3b8; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center;
                }
                .tool-btn:hover { color: #fff; border-color: #fff; }
                .tool-btn.edit:hover { color: var(--color-primary); border-color: var(--color-primary); }
                .tool-btn.delete:hover { color: var(--color-accent); border-color: var(--color-accent); }

                .card-stats-box { background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; display: flex; flex-direction: column; gap: 8px; }
                .stat-row { display: flex; justify-content: space-between; align-items: center; }
                .stat-row .lbl { font-size: 0.8rem; color: #64748b; display: flex; gap: 8px; align-items: center; }
                .stat-row .val { font-size: 0.9rem; color: #fff; font-weight: 700; font-family: var(--font-code); }
                .stat-row .val.money { color: var(--color-success); font-size: 1rem; }

                .card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
                .status-pill { 
                    display: flex; align-items: center; gap: 6px; font-size: 0.7rem; color: var(--color-success); font-weight: 700;
                    background: rgba(0, 255, 157, 0.1); padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(0, 255, 157, 0.2);
                }
                .status-pill .dot { width: 6px; height: 6px; background: var(--color-success); border-radius: 50%; box-shadow: 0 0 5px var(--color-success); }

                .btn-filter {
                    background: transparent; border: 1px solid var(--color-primary); color: var(--color-primary);
                    padding: 6px 15px; border-radius: 6px; font-size: 0.75rem; cursor: pointer; font-weight: 700;
                    display: flex; align-items: center; gap: 8px; transition: 0.2s;
                }
                .btn-filter:hover { background: var(--color-primary); color: #000; box-shadow: 0 0 10px rgba(0, 240, 255, 0.3); }
            </style>
        `;
    }
}
