// State Management
let state = {
    projectId: Date.now().toString(),
    projectName: 'Untitled Project',
    elements: [],
    selectedElementId: null,
    deviceView: 'desktop',
    colorPalette: {},
    activeColorReplace: null,
    canvasSettings: {
        height: 2000,
        backgroundColor: '#ffffff'
    }
};

// Available Element Definitions
const ELEMENT_TYPES = [
    { id: 'text', name: 'Text', icon: 'fa-font', description: 'Add a text box' },
    { id: 'image', name: 'Image', icon: 'fa-image', description: 'Add an image' },
    { id: 'video', name: 'Video', icon: 'fa-video', description: 'Add a local video' },
    { id: 'youtube', name: 'YouTube', icon: 'fa-youtube', description: 'Embed a YouTube video' },
    { id: 'button', name: 'Button', icon: 'fa-square-up-right', description: 'Interactive button' },
    { id: 'grid', name: 'Image Grid', icon: 'fa-border-all', description: 'Grid of images' }
];

// DOM Elements
const dom = {
    palette: document.getElementById('block-palette'),
    canvas: document.getElementById('canvas'),
    properties: document.getElementById('properties-panel')
};

// Initialize App
function init() {
    renderPalette();
    renderCanvas();
    setupEventListeners();
    initInteractJS();
}

function initInteractJS() {
    if (typeof interact === 'undefined') return;
    
    interact('.canvas-element')
        .draggable({
            modifiers: [
                interact.modifiers.restrictRect({
                    restriction: 'parent',
                    endOnly: false
                })
            ],
            listeners: {
                start(event) {
                    const target = event.target.closest('.canvas-element');
                    if (!target) return;
                    const id = target.dataset.id;
                    if (state.selectedElementId !== id) {
                        selectElement(id);
                    }
                },
                move(event) {
                    const target = event.target.closest('.canvas-element');
                    if (!target) return;
                    const id = target.dataset.id;
                    const element = state.elements.find(e => e.id === id);
                    if (!element) return;
                    
                    element.content.x += event.dx;
                    element.content.y += event.dy;
                    
                    target.style.transform = `translate(${element.content.x}px, ${element.content.y}px)`;
                }
            }
        })
        .resizable({
            edges: { left: true, right: true, bottom: true, top: true },
            modifiers: [
                interact.modifiers.restrictEdges({
                    outer: 'parent'
                })
            ],
            listeners: {
                move(event) {
                    const target = event.target.closest('.canvas-element');
                    if (!target) return;
                    const id = target.dataset.id;
                    const element = state.elements.find(e => e.id === id);
                    if (!element) return;

                    element.content.x += event.deltaRect.left;
                    element.content.y += event.deltaRect.top;
                    element.content.width = event.rect.width;
                    element.content.height = event.rect.height;

                    target.style.width = `${element.content.width}px`;
                    target.style.height = `${element.content.height}px`;
                    target.style.transform = `translate(${element.content.x}px, ${element.content.y}px)`;
                }
            }
        });
}

function renderPalette() {
    dom.palette.innerHTML = ELEMENT_TYPES.map(el => {
        if (el.id === 'image') {
            return `
                <div class="palette-block-wrapper">
                    <div class="palette-block" data-type="${el.id}">
                        <i class="fa-solid ${el.icon}"></i>
                        <div class="palette-block-info">
                            <h4>${el.name}</h4>
                            <p>${el.description}</p>
                        </div>
                        <i class="fa-solid fa-caret-down" style="margin-left: auto; color: var(--text-muted);"></i>
                    </div>
                    <div class="palette-dropdown">
                        <button class="palette-dropdown-btn" data-type="image">1 Image (Single)</button>
                        <button class="palette-dropdown-btn" data-type="grid-2">2 Image Grid</button>
                        <button class="palette-dropdown-btn" data-type="grid-4">4 Image Grid</button>
                        <button class="palette-dropdown-btn" data-type="grid-8">8 Image Grid</button>
                    </div>
                </div>
            `;
        }
        if (el.id === 'grid') return ''; // Don't show base grid type in palette
        
        return `
            <div class="palette-block" data-type="${el.id}">
                <i class="fa-solid ${el.icon}"></i>
                <div class="palette-block-info">
                    <h4>${el.name}</h4>
                    <p>${el.description}</p>
                </div>
                <i class="fa-solid fa-plus" style="margin-left: auto; color: var(--text-muted);"></i>
            </div>
        `;
    }).join('');
}

function renderCanvas() {
    let html = `<div class="canvas-inner" style="height: ${state.canvasSettings.height}px; background-color: ${state.canvasSettings.backgroundColor};">`;
    
    if (state.elements.length === 0) {
        html += `
            <div class="empty-state">
                <i class="fa-solid fa-object-group"></i>
                <p>Drag or click an element from the left to start building</p>
            </div>
        `;
    } else {
        html += state.elements.map(el => `
            <div class="canvas-element ${el.id === state.selectedElementId ? 'selected' : ''}" 
                 data-id="${el.id}"
                 style="transform: translate(${el.content.x}px, ${el.content.y}px); width: ${el.content.width}px; height: ${el.content.height}px; z-index: ${el.content.zIndex};">
                
                <div class="block-controls">
                    <button class="btn-delete-element" data-id="${el.id}"><i class="fa-solid fa-trash"></i></button>
                </div>
                
                ${renderElementContent(el)}
                
                <div class="resize-handle resize-tl"></div>
                <div class="resize-handle resize-tr"></div>
                <div class="resize-handle resize-bl"></div>
                <div class="resize-handle resize-br"></div>
            </div>
        `).join('');
    }
    
    html += `</div>`;
    dom.canvas.innerHTML = html;

    setTimeout(initAnimations, 50);
}

function renderElementContent(el) {
    if (el.type === 'text') {
        const fontWeight = el.content.isBold ? 'bold' : 'normal';
        const fontStyle = el.content.isItalic ? 'italic' : 'normal';
        return `
            <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: flex-start; padding: 10px; box-sizing: border-box; overflow: hidden; pointer-events: none;
                        background-color: ${el.content.bgColor}; color: ${el.content.textColor}; font-size: ${el.content.fontSize}px; text-align: ${el.content.align}; font-weight: ${fontWeight}; font-style: ${fontStyle};">
                ${el.content.text.replace(/\n/g, '<br>')}
            </div>
        `;
    } else if (el.type === 'image') {
        return `<img src="${el.content.src}" class="media-content" style="object-fit: ${el.content.objectFit};">`;
    } else if (el.type === 'video') {
        return `<video src="${el.content.src}" class="media-content" style="object-fit: ${el.content.objectFit};" autoplay loop muted playsinline></video>`;
    } else if (el.type === 'youtube') {
        return `<iframe src="https://www.youtube.com/embed/${el.content.src}?autoplay=1&mute=1&loop=1&controls=0" class="media-content" frameborder="0" allow="autoplay; fullscreen" style="object-fit: ${el.content.objectFit}; pointer-events:none;"></iframe>`;
    } else if (el.type === 'button') {
        return `
            <div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; pointer-events: none;">
                <a href="${el.content.link}" class="btn-block-btn btn-shape-${el.content.shape}" style="background-color: ${el.content.color}; color: ${el.content.textColor}; width: 100%; height: 100%; display:flex; justify-content:center; align-items:center;">
                    ${el.content.text}
                </a>
            </div>
        `;
    } else if (el.type === 'grid') {
        let cols = el.content.columns;
        let imagesHtml = el.content.images.map(src => `<div style="background-image: url('${src}'); background-size: ${el.content.objectFit}; background-position: center; background-repeat: no-repeat; width: 100%; height: 100%; border-radius: 4px;"></div>`).join('');
        return `
            <div class="grid-element-container" style="grid-template-columns: repeat(${cols}, 1fr); pointer-events: none;">
                ${imagesHtml}
            </div>
        `;
    }
    return `<div>Unknown element</div>`;
}

function renderProperties() {
    if (!state.selectedElementId) {
        dom.properties.innerHTML = `
            <div style="margin-bottom: 20px;">
                <label style="display:block; margin-bottom:8px; font-size:12px; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; font-weight:600;">Canvas Settings</label>
                <div class="form-group">
                    <label>Canvas Height (px)</label>
                    <input type="number" class="form-control prop-input-canvas" data-field="height" value="${state.canvasSettings.height}">
                </div>
                <div class="form-group">
                    <label>Background Color</label>
                    <input type="color" class="form-control prop-input-canvas" data-field="backgroundColor" value="${state.canvasSettings.backgroundColor}">
                </div>
            </div>
        `;
        return;
    }

    const el = state.elements.find(e => e.id === state.selectedElementId);
    const typeInfo = ELEMENT_TYPES.find(t => t.id === el.type);
    
    let html = `
        <div style="margin-bottom: 20px;">
            <label style="display:block; margin-bottom:8px; font-size:12px; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; font-weight:600;">Element Type</label>
            <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 6px; font-size: 14px; display:flex; align-items:center; gap:10px;">
                <i class="fa-solid ${typeInfo.icon}" style="color:var(--accent-color);"></i>
                <span>${typeInfo.name}</span>
            </div>
        </div>
        
        <div style="padding-top: 15px; border-top: 1px solid var(--border-color);">
            <h4 style="margin-bottom: 15px; font-size: 14px;">Content Settings</h4>
    `;

    // Dynamic Fields
    if (el.type === 'text') {
        html += `
            <div class="form-group">
                <label>Text Content</label>
                <textarea class="form-control prop-input" data-field="content.text">${el.content.text}</textarea>
            </div>
            <div class="form-group">
                <label>Font Size (px)</label>
                <input type="number" class="form-control prop-input" data-field="content.fontSize" value="${el.content.fontSize}">
            </div>
            <div class="form-group">
                <label>Text Color</label>
                <input type="color" class="form-control prop-input" data-field="content.textColor" value="${el.content.textColor}">
            </div>
            <div class="form-group">
                <label>Background Color</label>
                <input type="color" class="form-control prop-input" data-field="content.bgColor" value="${el.content.bgColor}">
            </div>
            <div class="form-group">
                <label>Alignment</label>
                <select class="form-control prop-input" data-field="content.align">
                    <option value="left" ${el.content.align === 'left' ? 'selected' : ''}>Left</option>
                    <option value="center" ${el.content.align === 'center' ? 'selected' : ''}>Center</option>
                    <option value="right" ${el.content.align === 'right' ? 'selected' : ''}>Right</option>
                </select>
            </div>
            <div class="form-group" style="display: flex; gap: 10px;">
                <label style="display:flex; align-items:center; gap:5px;"><input type="checkbox" class="prop-input-check" data-field="content.isBold" ${el.content.isBold ? 'checked' : ''}> Bold</label>
                <label style="display:flex; align-items:center; gap:5px;"><input type="checkbox" class="prop-input-check" data-field="content.isItalic" ${el.content.isItalic ? 'checked' : ''}> Italic</label>
            </div>
        `;
    } else if (el.type === 'image' || el.type === 'video' || el.type === 'youtube') {
        html += `
            <div class="form-group">
                <label>Source (URL or ID)</label>
                <div style="display: flex; gap: 5px;">
                    <input type="text" class="form-control prop-input" data-field="content.src" value="${el.content.src}" style="flex: 1;">
                    <button class="btn-icon btn-upload-specific" data-field="content.src" title="Upload from PC" style="background: var(--primary-color); color: white; border-radius: 4px; border: none; padding: 0 12px; cursor: pointer;"><i class="fa-solid fa-upload"></i></button>
                </div>
            </div>
            <div class="form-group">
                <label>Resizing Mode</label>
                <select class="form-control prop-input" data-field="content.objectFit">
                    <option value="cover" ${el.content.objectFit === 'cover' ? 'selected' : ''}>Crop to fill</option>
                    <option value="fill" ${el.content.objectFit === 'fill' ? 'selected' : ''}>Stretch to fill</option>
                    <option value="contain" ${el.content.objectFit === 'contain' ? 'selected' : ''}>Fit inside</option>
                </select>
            </div>
        `;
        if (el.type === 'image') {
            html += `
            <div class="form-group" style="margin-top: 15px;">
                <button id="btn-remove-bg" class="btn-block-btn btn-shape-rounded" style="width:100%; background-color:#8b5cf6; color:#fff; border:none; padding:10px; cursor:pointer; font-size:14px;">
                    <i class="fa-solid fa-wand-magic-sparkles"></i> Remove Background
                </button>
                <p style="font-size:11px; color:var(--text-muted); margin-top:5px; text-align:center;">Uses local AI (downloads ~40MB model once)</p>
            </div>
            
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid var(--border-color);">
                <h4 style="margin-bottom: 10px; font-size: 13px;">Color Replacement</h4>
            `;

            if (!state.colorPalette[el.id]) {
                html += `
                    <button id="btn-extract-colors" class="btn-block-btn btn-shape-rounded" style="width:100%; background-color:var(--secondary-color); color:var(--text-color); border:1px solid var(--border-color); padding:10px; cursor:pointer; font-size:14px;">
                        <i class="fa-solid fa-eye-dropper"></i> Extract Colors
                    </button>
                `;
            } else {
                html += `<div style="display:flex; gap:8px; margin-bottom:15px; justify-content:center;">`;
                state.colorPalette[el.id].forEach(rgb => {
                    html += `<div class="palette-color-circle" data-rgb="${rgb.join(',')}" style="width:30px; height:30px; border-radius:50%; background-color:rgb(${rgb.join(',')}); cursor:pointer; border: 2px solid ${state.activeColorReplace && state.activeColorReplace.sourceColor.join(',') === rgb.join(',') ? '#fff' : 'transparent'}; box-shadow: 0 0 0 1px var(--border-color);"></div>`;
                });
                html += `</div>`;
            }

            if (state.activeColorReplace && state.activeColorReplace.id === el.id) {
                html += `
                    <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px;">
                        <div class="form-group" style="margin-bottom: 10px;">
                            <label>Replace with:</label>
                            <input type="color" id="swap-new-color" class="form-control prop-input-ignore" value="${state.activeColorReplace.newColor}">
                        </div>
                        <div class="form-group" style="margin-bottom: 15px;">
                            <label>Tolerance: <span id="swap-tol-val">${state.activeColorReplace.tolerance}</span></label>
                            <input type="range" id="swap-tolerance" class="form-control prop-input-ignore" min="0" max="150" value="${state.activeColorReplace.tolerance}">
                        </div>
                        <button id="btn-apply-color-swap" class="btn-block-btn btn-shape-rounded" style="width:100%; background-color:var(--primary-color); color:#fff; border:none; padding:8px; cursor:pointer; font-size:13px;">
                            Apply Swap
                        </button>
                    </div>
                `;
            }

            html += `</div>`;
        }
    } else if (el.type === 'button') {
        html += `
            <div class="form-group"><label>Button Text</label><input type="text" class="form-control prop-input" data-field="content.text" value="${el.content.text}"></div>
            <div class="form-group"><label>Link URL</label><input type="text" class="form-control prop-input" data-field="content.link" value="${el.content.link}"></div>
            <div class="form-group"><label>Shape</label>
                <select class="form-control prop-input" data-field="content.shape">
                    <option value="square" ${el.content.shape === 'square' ? 'selected' : ''}>Square</option>
                    <option value="rounded" ${el.content.shape === 'rounded' ? 'selected' : ''}>Rounded</option>
                    <option value="pill" ${el.content.shape === 'pill' ? 'selected' : ''}>Pill</option>
                </select>
            </div>
            <div class="form-group"><label>Button Color</label><input type="color" class="form-control prop-input" data-field="content.color" value="${el.content.color}"></div>
            <div class="form-group"><label>Text Color</label><input type="color" class="form-control prop-input" data-field="content.textColor" value="${el.content.textColor}"></div>
        `;
    } else if (el.type === 'grid') {
        html += `
            <div class="form-group">
                <label>Resizing Mode</label>
                <select class="form-control prop-input" data-field="content.objectFit">
                    <option value="cover" ${el.content.objectFit === 'cover' ? 'selected' : ''}>Crop to fill</option>
                    <option value="contain" ${el.content.objectFit === 'contain' ? 'selected' : ''}>Fit inside</option>
                </select>
            </div>
        `;
        el.content.images.forEach((src, idx) => {
            html += `
                <div class="form-group">
                    <label>Image ${idx + 1} Source</label>
                    <div style="display: flex; gap: 5px;">
                        <input type="text" class="form-control prop-input" data-field="content.images.${idx}" value="${src}" style="flex: 1;">
                        <button class="btn-icon btn-upload-specific" data-field="content.images.${idx}" title="Upload from PC" style="background: var(--primary-color); color: white; border-radius: 4px; border: none; padding: 0 12px; cursor: pointer;"><i class="fa-solid fa-upload"></i></button>
                    </div>
                </div>
            `;
        });
    }

    // Advanced Positioning
    html += `
            <div class="form-group" style="margin-top: 15px; border-top: 1px dashed var(--border-color); padding-top: 15px;">
                <label>Layer (Z-Index)</label>
                <input type="number" class="form-control prop-input" data-field="content.zIndex" value="${el.content.zIndex}">
            </div>
        </div>
        <div style="padding-top: 15px; border-top: 1px solid var(--border-color); margin-top: 20px;">
            <h4 style="margin-bottom: 15px; font-size: 14px;">Scroll Animations</h4>
            
            <div class="form-group">
                <label>Entrance Animation</label>
                <select class="form-control prop-input" data-field="animations.type">
                    <option value="none" ${el.animations.type === 'none' ? 'selected' : ''}>None</option>
                    <option value="fade" ${el.animations.type === 'fade' ? 'selected' : ''}>Fade In</option>
                    <option value="slideUp" ${el.animations.type === 'slideUp' ? 'selected' : ''}>Slide Up</option>
                    <option value="slideDown" ${el.animations.type === 'slideDown' ? 'selected' : ''}>Slide Down</option>
                    <option value="slideLeft" ${el.animations.type === 'slideLeft' ? 'selected' : ''}>Slide Left</option>
                    <option value="slideRight" ${el.animations.type === 'slideRight' ? 'selected' : ''}>Slide Right</option>
                    <option value="zoomIn" ${el.animations.type === 'zoomIn' ? 'selected' : ''}>Zoom In</option>
                    <option value="zoomOut" ${el.animations.type === 'zoomOut' ? 'selected' : ''}>Zoom Out</option>
                    <option value="rotate" ${el.animations.type === 'rotate' ? 'selected' : ''}>Rotate In</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Exit Animation</label>
                <select class="form-control prop-input" data-field="animations.leaveType">
                    <option value="none" ${el.animations.leaveType === 'none' ? 'selected' : ''}>None</option>
                    <option value="fade" ${el.animations.leaveType === 'fade' ? 'selected' : ''}>Fade Out</option>
                    <option value="slideUp" ${el.animations.leaveType === 'slideUp' ? 'selected' : ''}>Slide Up</option>
                    <option value="slideDown" ${el.animations.leaveType === 'slideDown' ? 'selected' : ''}>Slide Down</option>
                    <option value="slideLeft" ${el.animations.leaveType === 'slideLeft' ? 'selected' : ''}>Slide Left</option>
                    <option value="slideRight" ${el.animations.leaveType === 'slideRight' ? 'selected' : ''}>Slide Right</option>
                    <option value="zoomIn" ${el.animations.leaveType === 'zoomIn' ? 'selected' : ''}>Zoom In</option>
                    <option value="zoomOut" ${el.animations.leaveType === 'zoomOut' ? 'selected' : ''}>Zoom Out</option>
                    <option value="rotate" ${el.animations.leaveType === 'rotate' ? 'selected' : ''}>Rotate Out</option>
                </select>
            </div>

            <div class="form-group">
                <label>Animation Duration: <span id="dur-val-${el.id}">${el.animations.duration}s</span></label>
                <input type="range" class="form-control prop-input" data-field="animations.duration" min="0.2" max="5" step="0.1" value="${el.animations.duration}" oninput="document.getElementById('dur-val-${el.id}').textContent = this.value + 's'">
            </div>
            
            <div class="form-group">
                <label>Appearance Trigger %: <span id="start-val-${el.id}">${el.animations.scrollStart || 90}%</span></label>
                <input type="range" class="form-control prop-input" data-field="animations.scrollStart" min="0" max="100" step="1" value="${el.animations.scrollStart || 90}" oninput="document.getElementById('start-val-${el.id}').textContent = this.value + '%'">
                <p style="font-size: 11px; color: var(--text-muted); margin-top: 5px;">Appears when scrolled to this % of the screen.</p>
            </div>
            
            <div class="form-group">
                <label>Disappearance Trigger %: <span id="end-val-${el.id}">${el.animations.scrollEnd || 10}%</span></label>
                <input type="range" class="form-control prop-input" data-field="animations.scrollEnd" min="0" max="100" step="1" value="${el.animations.scrollEnd || 10}" oninput="document.getElementById('end-val-${el.id}').textContent = this.value + '%'">
                <p style="font-size: 11px; color: var(--text-muted); margin-top: 5px;">Disappears when it reaches this %.</p>
            </div>
        </div>
    `;

    dom.properties.innerHTML = html;
}

function initAnimations() {
    ScrollTrigger.getAll().forEach(t => t.kill());

    state.elements.forEach(el => {
        const wrapper = document.querySelector(`[data-id="${el.id}"]`);
        if (!wrapper) return;

        // Entrance Animation
        if (el.animations.type && el.animations.type !== 'none') {
            let fromVars = {
                opacity: 0,
                duration: parseFloat(el.animations.duration),
                delay: parseFloat(el.animations.delay || 0),
                ease: "power2.out",
                scrollTrigger: {
                    trigger: wrapper,
                    scroller: dom.canvas,
                    start: `top ${el.animations.scrollStart || 90}%`, 
                    toggleActions: "play none none reverse"
                }
            };

            if (el.animations.type === 'slideUp') fromVars.y = 100;
            if (el.animations.type === 'slideDown') fromVars.y = -100;
            if (el.animations.type === 'slideLeft') fromVars.x = 100;
            if (el.animations.type === 'slideRight') fromVars.x = -100;
            if (el.animations.type === 'zoomIn') fromVars.scale = 0.5;
            if (el.animations.type === 'zoomOut') fromVars.scale = 1.5;
            if (el.animations.type === 'rotate') { fromVars.rotation = 180; fromVars.scale = 0.5; }

            gsap.from(wrapper, fromVars);
        }

        // Exit Animation
        if (el.animations.leaveType && el.animations.leaveType !== 'none') {
            let toVars = {
                opacity: 0,
                duration: parseFloat(el.animations.duration),
                ease: "power2.in",
                immediateRender: false,
                scrollTrigger: {
                    trigger: wrapper,
                    scroller: dom.canvas,
                    start: `bottom ${el.animations.scrollEnd || 10}%`,
                    toggleActions: "play none none reverse"
                }
            };

            if (el.animations.leaveType === 'slideUp') toVars.y = -100;
            if (el.animations.leaveType === 'slideDown') toVars.y = 100;
            if (el.animations.leaveType === 'slideLeft') toVars.x = -100;
            if (el.animations.leaveType === 'slideRight') toVars.x = 100;
            if (el.animations.leaveType === 'zoomIn') toVars.scale = 1.5;
            if (el.animations.leaveType === 'zoomOut') toVars.scale = 0.5;
            if (el.animations.leaveType === 'rotate') { toVars.rotation = -180; toVars.scale = 0.5; }

            gsap.to(wrapper, toVars);
        }
    });
}

function setupEventListeners() {
    // Project Management
    document.getElementById('btn-projects').addEventListener('click', () => {
        document.getElementById('projects-modal').classList.remove('hidden');
        renderProjectList();
    });

    document.getElementById('btn-close-projects-modal').addEventListener('click', () => {
        document.getElementById('projects-modal').classList.add('hidden');
    });

    document.getElementById('btn-save-project').addEventListener('click', async () => {
        if (state.projectName === 'Untitled Project') {
            const name = prompt('Enter a name for your project:', state.projectName);
            if (!name) return;
            state.projectName = name;
        }
        
        try {
            const btn = document.getElementById('btn-save-project');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
            
            // 1. Auto-save to Browser Database backup
            let projects = await localforage.getItem('scrolly_projects') || {};
            projects[state.projectId] = {
                id: state.projectId,
                name: state.projectName,
                lastSaved: new Date().toISOString(),
                stateData: JSON.parse(JSON.stringify(state))
            };
            await localforage.setItem('scrolly_projects', projects);
            
            // 2. Save directly to PC
            const projectData = projects[state.projectId];
            const dataStr = JSON.stringify(projectData);
            const exportFileDefaultName = (state.projectName || 'project').replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.scrolly';

            if (window.showSaveFilePicker) {
                try {
                    const handle = await window.showSaveFilePicker({
                        suggestedName: exportFileDefaultName,
                        types: [{
                            description: 'Scrollytelling Project',
                            accept: { 'application/json': ['.scrolly'] },
                        }],
                    });
                    const writable = await handle.createWritable();
                    await writable.write(dataStr);
                    await writable.close();
                } catch (err) {
                    console.log('Save to PC cancelled or failed.');
                }
            } else {
                // Fallback for older browsers
                const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                const linkElement = document.createElement('a');
                linkElement.setAttribute('href', dataUri);
                linkElement.setAttribute('download', exportFileDefaultName);
                linkElement.click();
            }
            
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Saved!';
            setTimeout(() => btn.innerHTML = originalText, 2000);
        } catch (err) {
            console.error('Error saving project:', err);
            alert('Failed to save project.');
        }
    });

    document.getElementById('btn-new-project').addEventListener('click', () => {
        if (confirm('Create a new project? Unsaved changes in your current project will be lost.')) {
            state = {
                projectId: Date.now().toString(),
                projectName: 'Untitled Project',
                elements: [],
                selectedElementId: null,
                deviceView: 'desktop',
                colorPalette: {},
                activeColorReplace: null,
                canvasSettings: { height: 2000, backgroundColor: '#ffffff' }
            };
            renderCanvas();
            renderProperties();
            document.getElementById('projects-modal').classList.add('hidden');
        }
    });

    document.getElementById('btn-upload-project').addEventListener('click', () => {
        document.getElementById('input-upload-project').click();
    });

    document.getElementById('input-upload-project').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';
        
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const projectData = JSON.parse(event.target.result);
                if (!projectData.id || !projectData.stateData) throw new Error('Invalid project file format');
                
                let projects = await localforage.getItem('scrolly_projects') || {};
                projects[projectData.id] = projectData;
                await localforage.setItem('scrolly_projects', projects);
                
                loadProject(projectData.id);
            } catch (err) {
                alert('Error importing project file: ' + err.message);
            }
        };
        reader.readAsText(file);
    });

    const deviceToggles = document.querySelectorAll('#device-toggles .btn-icon');
    deviceToggles.forEach(btn => {
        btn.addEventListener('click', (e) => {
            deviceToggles.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            state.deviceView = e.currentTarget.dataset.view;
            dom.canvas.className = 'canvas view-' + state.deviceView;
        });
    });

    dom.palette.addEventListener('click', (e) => {
        const dropBtn = e.target.closest('.palette-dropdown-btn');
        if (dropBtn) {
            addElement(dropBtn.dataset.type);
            return;
        }

        const paletteBlock = e.target.closest('.palette-block');
        if (paletteBlock) addElement(paletteBlock.dataset.type);
    });

    // Upload Logic
    document.getElementById('btn-upload-media').addEventListener('click', () => {
        document.getElementById('media-upload-input').click();
    });

    document.getElementById('media-upload-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Reset input so you can select the same file again
        e.target.value = '';

        let isVideo = file.type.startsWith('video/');
        let isImage = file.type.startsWith('image/');

        // Fallback for Windows if MIME type is missing or wrong
        const ext = file.name.split('.').pop().toLowerCase();
        if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
            isImage = true;
            isVideo = false;
        } else if (['mp4', 'webm', 'mov', 'ogg'].includes(ext)) {
            isVideo = true;
            isImage = false;
        }

        if (isVideo && file.size > 15 * 1024 * 1024) {
            alert('This video is larger than 15MB. Large videos may crash the browser when exported. Please use a smaller video or embed a YouTube link.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64Data = event.target.result;
            if (isImage) {
                addElement('image', { src: base64Data });
            } else if (isVideo) {
                addElement('video', { src: base64Data });
            } else {
                // Absolute fallback
                if (base64Data.startsWith('data:video')) {
                    addElement('video', { src: base64Data });
                } else {
                    addElement('image', { src: base64Data });
                }
            }
        };
        reader.readAsDataURL(file);
    });

    dom.canvas.addEventListener('click', (e) => {
        // Prevent default browser behaviors (like following links) inside the canvas builder
        if (e.target.closest('a')) {
            e.preventDefault();
        }

        const wrapper = e.target.closest('.canvas-element');
        const deleteBtn = e.target.closest('.btn-delete-element');
        
        if (deleteBtn) {
            deleteElement(deleteBtn.dataset.id);
            return;
        }

        if (wrapper) {
            selectElement(wrapper.dataset.id);
        } else {
            selectElement(null);
        }
    });

    dom.properties.addEventListener('click', async (e) => {
        const btnUploadSpecific = e.target.closest('.btn-upload-specific');
        if (btnUploadSpecific && state.selectedElementId) {
            const field = btnUploadSpecific.dataset.field;
            
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*,video/*';
            fileInput.onchange = (event) => {
                const file = event.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = (readerEvent) => {
                    const base64Data = readerEvent.target.result;
                    const el = state.elements.find(e => e.id === state.selectedElementId);
                    
                    const parts = field.split('.');
                    if (parts.length === 2) {
                        el[parts[0]][parts[1]] = base64Data;
                    } else if (parts.length === 3) {
                        el[parts[0]][parts[1]][parts[2]] = base64Data;
                    }
                    
                    const scrollPos = dom.canvas.scrollTop;
                    renderCanvas();
                    renderProperties();
                    dom.canvas.scrollTop = scrollPos;
                };
                reader.readAsDataURL(file);
            };
            fileInput.click();
            return;
        }

        const btnRemoveBg = e.target.closest('#btn-remove-bg');
        if (btnRemoveBg && state.selectedElementId) {
            const el = state.elements.find(e => e.id === state.selectedElementId);
            if (el && el.type === 'image') {
                try {
                    btnRemoveBg.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
                    btnRemoveBg.disabled = true;
                    btnRemoveBg.style.opacity = '0.7';

                    const module = await import('https://esm.sh/@imgly/background-removal@1.7.0');
                    const imglyRemoveBackground = module.default || module.removeBackground;

                    const config = {
                        publicPath: 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/dist/'
                    };

                    const blob = await imglyRemoveBackground(el.content.src, config);
                    
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        el.content.src = reader.result;
                        renderCanvas();
                        renderProperties();
                    };
                    reader.readAsDataURL(blob);

                } catch (error) {
                    console.error(error);
                    alert('Background removal failed. Please check the console for errors. Try using a local image upload instead of a web URL.');
                    btnRemoveBg.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Remove Background';
                    btnRemoveBg.disabled = false;
                    btnRemoveBg.style.opacity = '1';
                }
            }
        }

        // Extract Colors
        const btnExtractColors = e.target.closest('#btn-extract-colors');
        if (btnExtractColors && state.selectedElementId) {
            const el = state.elements.find(e => e.id === state.selectedElementId);
            const img = new Image();
            img.crossOrigin = "Anonymous";
            btnExtractColors.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
            img.onload = () => {
                const colorThief = new ColorThief();
                try {
                    const palette = colorThief.getPalette(img, 5);
                    state.colorPalette[el.id] = palette;
                    renderProperties();
                } catch(err) {
                    alert('Could not extract colors. Image may be blocked by CORS.');
                    renderProperties();
                }
            };
            img.onerror = () => {
                alert('Failed to load image for color extraction.');
                renderProperties();
            }
            img.src = el.content.src;
        }

        // Click a color to swap
        const colorCircle = e.target.closest('.palette-color-circle');
        if (colorCircle && state.selectedElementId) {
            const rgb = colorCircle.dataset.rgb.split(',').map(Number);
            const rgbToHex = (r, g, b) => "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
            state.activeColorReplace = {
                id: state.selectedElementId,
                sourceColor: rgb,
                newColor: rgbToHex(rgb[0], rgb[1], rgb[2]),
                tolerance: 40
            };
            renderProperties();
        }

        // Apply Swap
        const btnApplySwap = e.target.closest('#btn-apply-color-swap');
        if (btnApplySwap && state.selectedElementId && state.activeColorReplace) {
            btnApplySwap.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
            btnApplySwap.disabled = true;
            await swapImageColor(state.selectedElementId, state.activeColorReplace.sourceColor, state.activeColorReplace.newColor, state.activeColorReplace.tolerance);
        }
    });

    dom.properties.addEventListener('input', (e) => {
        if (e.target.id === 'swap-new-color' && state.activeColorReplace) {
            state.activeColorReplace.newColor = e.target.value;
        }
        if (e.target.id === 'swap-tolerance' && state.activeColorReplace) {
            state.activeColorReplace.tolerance = parseInt(e.target.value);
            document.getElementById('swap-tol-val').textContent = e.target.value;
        }

        if (e.target.classList.contains('prop-input-canvas')) {
            const field = e.target.dataset.field;
            state.canvasSettings[field] = e.target.value;
            renderCanvas();
            return;
        }

        if (!state.selectedElementId) return;

        if (e.target.classList.contains('prop-input') || e.target.classList.contains('prop-input-check')) {
            const field = e.target.dataset.field;
            const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
            
            const el = state.elements.find(e => e.id === state.selectedElementId);
            
            const parts = field.split('.');
            if (parts.length === 2) {
                el[parts[0]][parts[1]] = value;
            } else if (parts.length === 3) {
                el[parts[0]][parts[1]][parts[2]] = value;
            }

            const scrollPos = dom.canvas.scrollTop;
            renderCanvas();
            dom.canvas.scrollTop = scrollPos;
        }
    });

    // Export Modal Logic
    document.getElementById('btn-export').addEventListener('click', () => {
        const exportedData = generateExportCode();
        document.getElementById('export-code-html').value = exportedData.html;
        document.getElementById('export-code-css').value = exportedData.css;
        document.getElementById('export-modal').classList.remove('hidden');
    });

    // Preview Logic
    document.getElementById('btn-preview').addEventListener('click', () => {
        const exportedData = generateExportCode();
        const previewWindow = window.open('', '_blank');
        if (previewWindow) {
            // Inline the CSS for the live preview so it works without needing a style.css file
            const fullHtml = exportedData.html.replace('<link rel="stylesheet" href="style.css">', `<style>${exportedData.css}</style>`);
            previewWindow.document.write(fullHtml);
            previewWindow.document.close();
        } else {
            alert('Please allow pop-ups to use the Preview feature.');
        }
    });

    document.getElementById('btn-close-modal').addEventListener('click', () => {
        document.getElementById('export-modal').classList.add('hidden');
    });

    const copyToClipboard = (inputId, btnId, originalText) => {
        const copyText = document.getElementById(inputId);
        copyText.select();
        document.execCommand('copy');
        const btn = document.getElementById(btnId);
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        setTimeout(() => btn.innerHTML = originalText, 2000);
    };

    document.getElementById('btn-copy-html').addEventListener('click', () => copyToClipboard('export-code-html', 'btn-copy-html', '<i class="fa-solid fa-copy"></i> Copy HTML'));
    document.getElementById('btn-copy-css').addEventListener('click', () => copyToClipboard('export-code-css', 'btn-copy-css', '<i class="fa-solid fa-copy"></i> Copy CSS'));
}

function generateExportCode() {
    let elementsHtml = state.elements.map(el => `
        <!-- Element: ${el.type} -->
        <div class="site-element" data-anim-type="${el.animations.type}" data-leave-type="${el.animations.leaveType || 'none'}" data-scroll-start="${el.animations.scrollStart || 90}" data-scroll-end="${el.animations.scrollEnd || 10}" data-anim-duration="${el.animations.duration}" style="position: absolute; left: 0; top: 0; transform: translate(${el.content.x}px, ${el.content.y}px); width: ${el.content.width}px; height: ${el.content.height}px; z-index: ${el.content.zIndex};">
            ${renderElementContent(el)}
        </div>
    `).join('\n');

    const cssCode = `body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; overflow-x: hidden; background-color: ${state.canvasSettings.backgroundColor}; }
* { box-sizing: border-box; }
.canvas-inner { position: relative; width: 100%; height: ${state.canvasSettings.height}px; margin: 0 auto; overflow: hidden; }

/* Buttons */
.btn-block-btn { display: inline-block; padding: 12px 24px; font-size: 16px; font-weight: 600; text-align: center; text-decoration: none; cursor: pointer; transition: all 0.2s; }
.btn-shape-square { border-radius: 0; }
.btn-shape-rounded { border-radius: 8px; }
.btn-shape-pill { border-radius: 50px; }

/* Grids */
.grid-element-container { display: grid; gap: 10px; width: 100%; height: 100%; }

/* Media */
.media-content { width: 100%; height: 100%; pointer-events: none; }

/* Responsive adjustments */
@media (max-width: 768px) {
    .site-element { transform: scale(0.8) translate(calc(${state.canvasSettings.height} * 0.1px), 0) !important; transform-origin: top left; }
}
`;

    const htmlCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exported Scrollytelling Site</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="canvas-inner">
        ${elementsHtml}
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
    <script>
        gsap.registerPlugin(ScrollTrigger);
        
        document.querySelectorAll('.site-element').forEach(wrapper => {
            const type = wrapper.dataset.animType;
            const leaveType = wrapper.dataset.leaveType;
            const duration = parseFloat(wrapper.dataset.animDuration);
            const scrollStart = parseInt(wrapper.dataset.scrollStart || 90);
            const scrollEnd = parseInt(wrapper.dataset.scrollEnd || 10);
            
            if (type && type !== 'none') {
                let fromVars = {
                    opacity: 0,
                    duration: duration,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: wrapper,
                        start: 'top ' + scrollStart + '%',
                        toggleActions: "play none none reverse"
                    }
                };

                if (type === 'slideUp') fromVars.y = 100;
                if (type === 'slideDown') fromVars.y = -100;
                if (type === 'slideLeft') fromVars.x = 100;
                if (type === 'slideRight') fromVars.x = -100;
                if (type === 'zoomIn') fromVars.scale = 0.5;
                if (type === 'zoomOut') fromVars.scale = 1.5;
                if (type === 'rotate') { fromVars.rotation = 180; fromVars.scale = 0.5; }

                gsap.from(wrapper, fromVars);
            }

            if (leaveType && leaveType !== 'none') {
                let toVars = {
                    opacity: 0,
                    duration: duration,
                    ease: "power2.in",
                    immediateRender: false,
                    scrollTrigger: {
                        trigger: wrapper,
                        start: 'bottom ' + scrollEnd + '%',
                        toggleActions: "play none none reverse"
                    }
                };

                if (leaveType === 'slideUp') toVars.y = -100;
                if (leaveType === 'slideDown') toVars.y = 100;
                if (leaveType === 'slideLeft') toVars.x = -100;
                if (leaveType === 'slideRight') toVars.x = 100;
                if (leaveType === 'zoomIn') toVars.scale = 1.5;
                if (leaveType === 'zoomOut') toVars.scale = 0.5;
                if (leaveType === 'rotate') { toVars.rotation = -180; toVars.scale = 0.5; }

                gsap.to(wrapper, toVars);
            }
        });
    </script>
</body>
</html>`;

    return { html: htmlCode, css: cssCode };
}

async function renderProjectList() {
    const list = document.getElementById('project-list');
    list.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding: 20px;">Loading projects...</p>';
    
    try {
        const projects = await localforage.getItem('scrolly_projects') || {};
        const projectArray = Object.values(projects).sort((a, b) => new Date(b.lastSaved) - new Date(a.lastSaved));
        
        if (projectArray.length === 0) {
            list.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding: 20px;">No saved projects yet.</p>';
            return;
        }
        
        let html = '';
        projectArray.forEach(p => {
            const date = new Date(p.lastSaved).toLocaleString();
            html += `
                <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--border-color);">
                    <div>
                        <h4 style="margin: 0 0 5px 0; font-size: 16px;">${p.name}</h4>
                        <p style="margin: 0; font-size: 12px; color: var(--text-muted);">Last saved: ${date}</p>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary" onclick="exportProjectFile('${p.id}')" title="Download .scrolly file"><i class="fa-solid fa-download"></i></button>
                        <button class="btn btn-primary" onclick="loadProject('${p.id}')">Load</button>
                        <button class="btn-icon" onclick="deleteProject('${p.id}')" style="color: #ef4444;" title="Delete Project"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            `;
        });
        list.innerHTML = html;
    } catch (err) {
        list.innerHTML = `<p style="color:#ef4444; text-align:center;">Error loading projects: ${err.message}</p>`;
    }
}

window.loadProject = async function(id) {
    try {
        const projects = await localforage.getItem('scrolly_projects') || {};
        if (projects[id]) {
            state = JSON.parse(JSON.stringify(projects[id].stateData));
            renderCanvas();
            renderProperties();
            document.getElementById('projects-modal').classList.add('hidden');
        }
    } catch (err) {
        alert('Failed to load project.');
    }
};

window.deleteProject = async function(id) {
    if (confirm('Are you sure you want to delete this project permanently?')) {
        try {
            let projects = await localforage.getItem('scrolly_projects') || {};
            delete projects[id];
            await localforage.setItem('scrolly_projects', projects);
            renderProjectList();
        } catch (err) {
            alert('Failed to delete project.');
        }
    }
};

window.exportProjectFile = async function(id) {
    try {
        const projects = await localforage.getItem('scrolly_projects') || {};
        const project = projects[id];
        if (!project) return;
        
        const dataStr = JSON.stringify(project);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = (project.name || 'project').replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.scrolly';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    } catch (err) {
        alert('Failed to export project.');
    }
};

window.swapImageColor = async function(elementId, sourceRgb, hexTarget, tolerance) {
    const el = state.elements.find(e => e.id === elementId);
    if (!el) return;
    
    const tr = parseInt(hexTarget.substr(1, 2), 16);
    const tg = parseInt(hexTarget.substr(3, 2), 16);
    const tb = parseInt(hexTarget.substr(5, 2), 16);
    
    const [sr, sg, sb] = sourceRgb;
    
    const img = new Image();
    img.crossOrigin = "Anonymous";
    
    return new Promise((resolve, reject) => {
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i+1];
                const b = data[i+2];
                const a = data[i+3];
                
                if (a === 0) continue;
                
                const distance = Math.sqrt((r-sr)**2 + (g-sg)**2 + (b-sb)**2);
                
                if (distance <= tolerance) {
                    data[i] = tr;
                    data[i+1] = tg;
                    data[i+2] = tb;
                }
            }
            
            ctx.putImageData(imageData, 0, 0);
            el.content.src = canvas.toDataURL('image/png');
            state.colorPalette[elementId] = null;
            state.activeColorReplace = null;
            renderCanvas();
            renderProperties();
            resolve();
        };
        img.onerror = () => {
            alert('Failed to process image.');
            reject();
        };
        img.src = el.content.src;
    });
};

function addElement(type, customContent = null) {
    const startY = dom.canvas.scrollTop + 50;
    let content = { x: 50, y: startY, zIndex: state.elements.length + 1 };
    
    let actualType = type;

    if (type === 'text') {
        content = { ...content, width: 400, height: 100, text: 'Click to edit your freeform text', fontSize: 32, textColor: '#111827', bgColor: 'transparent', align: 'left', isBold: true, isItalic: false };
    } else if (type === 'image') {
        content = { ...content, width: 400, height: 300, src: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop', objectFit: 'cover' };
    } else if (type === 'video') {
        content = { ...content, width: 400, height: 300, src: 'https://www.w3schools.com/html/mov_bbb.mp4', objectFit: 'cover' };
    } else if (type === 'youtube') {
        content = { ...content, width: 560, height: 315, src: 'dQw4w9WgXcQ', objectFit: 'cover' };
    } else if (type === 'button') {
        content = { ...content, width: 200, height: 60, text: 'Click Me', link: '#', shape: 'rounded', color: '#6366f1', textColor: '#ffffff' };
    } else if (type.startsWith('grid-')) {
        actualType = 'grid';
        let cols = parseInt(type.split('-')[1]);
        if (cols === 8) cols = 4; // 8-image grid is 4x2
        
        let count = parseInt(type.split('-')[1]);
        let defaultImages = [];
        for(let i=0; i<count; i++) defaultImages.push('https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?q=80&w=400&auto=format&fit=crop');
        
        content = { ...content, width: cols * 200, height: Math.ceil(count/cols) * 200, columns: cols, images: defaultImages, objectFit: 'cover' };
    }

    if (customContent) {
        content = { ...content, ...customContent };
    }

    const newEl = {
        id: 'el_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        type: actualType,
        content: content,
        animations: { type: 'none', leaveType: 'none', duration: '1.0', delay: '0', scrollStart: 90, scrollEnd: 10 }
    };
    
    state.elements.push(newEl);
    selectElement(newEl.id);
}

function selectElement(id) {
    state.selectedElementId = id;
    renderCanvas();
    renderProperties();
}

function deleteElement(id) {
    state.elements = state.elements.filter(e => e.id !== id);
    if (state.selectedElementId === id) {
        state.selectedElementId = null;
    }
    renderCanvas();
    renderProperties();
}

document.addEventListener('DOMContentLoaded', init);
