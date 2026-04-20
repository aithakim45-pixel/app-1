// State Management
const state = {
    elements: [],
    selectedElementId: null,
    deviceView: 'desktop',
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
    { id: 'button', name: 'Button', icon: 'fa-square-up-right', description: 'Interactive button' }
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
                    const id = event.target.dataset.id;
                    if (state.selectedElementId !== id) {
                        selectElement(id);
                    }
                },
                move(event) {
                    const target = event.target;
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
            edges: { left: '.resize-tl, .resize-bl', right: '.resize-tr, .resize-br', bottom: '.resize-bl, .resize-br', top: '.resize-tl, .resize-tr' },
            modifiers: [
                interact.modifiers.restrictEdges({
                    outer: 'parent'
                })
            ],
            listeners: {
                move(event) {
                    const target = event.target;
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
    dom.palette.innerHTML = ELEMENT_TYPES.map(el => `
        <div class="palette-block" data-type="${el.id}">
            <i class="fa-solid ${el.icon}"></i>
            <div class="palette-block-info">
                <h4>${el.name}</h4>
                <p>${el.description}</p>
            </div>
            <i class="fa-solid fa-plus" style="margin-left: auto; color: var(--text-muted);"></i>
        </div>
    `).join('');
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
            <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: flex-start; padding: 10px; box-sizing: border-box; overflow: hidden;
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
            <div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;">
                <a href="${el.content.link}" class="btn-block-btn btn-shape-${el.content.shape}" style="background-color: ${el.content.color}; color: ${el.content.textColor}; width: 100%; height: 100%; display:flex; justify-content:center; align-items:center;">
                    ${el.content.text}
                </a>
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
                <input type="text" class="form-control prop-input" data-field="content.src" value="${el.content.src}">
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
    }

    // Advanced Positioning
    html += `
            <div class="form-group" style="margin-top: 15px; border-top: 1px dashed var(--border-color); padding-top: 15px;">
                <label>Layer (Z-Index)</label>
                <input type="number" class="form-control prop-input" data-field="content.zIndex" value="${el.content.zIndex}">
            </div>
        </div>
        <div style="padding-top: 15px; border-top: 1px solid var(--border-color); margin-top: 20px;">
            <h4 style="margin-bottom: 15px; font-size: 14px;">Animation on Scroll</h4>
            
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
                <label>Animation Duration: <span id="dur-val-${el.id}">${el.animations.duration}s</span></label>
                <input type="range" class="form-control prop-input" data-field="animations.duration" min="0.2" max="5" step="0.1" value="${el.animations.duration}" oninput="document.getElementById('dur-val-${el.id}').textContent = this.value + 's'">
            </div>
            <div class="form-group">
                <label>Delay: <span id="delay-val-${el.id}">${el.animations.delay || 0}s</span></label>
                <input type="range" class="form-control prop-input" data-field="animations.delay" min="0" max="3" step="0.1" value="${el.animations.delay || 0}" oninput="document.getElementById('delay-val-${el.id}').textContent = this.value + 's'">
            </div>
        </div>
    `;

    dom.properties.innerHTML = html;
}

function initAnimations() {
    ScrollTrigger.getAll().forEach(t => t.kill());

    state.elements.forEach(el => {
        if (el.animations.type === 'none') return;
        
        const wrapper = document.querySelector(`[data-id="${el.id}"]`);
        if (!wrapper) return;

        let fromVars = {
            opacity: 0,
            duration: parseFloat(el.animations.duration),
            delay: parseFloat(el.animations.delay || 0),
            ease: "power2.out",
            clearProps: "all",
            scrollTrigger: {
                trigger: wrapper,
                scroller: dom.canvas,
                start: "top 90%", 
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
    });
}

function setupEventListeners() {
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
        const paletteBlock = e.target.closest('.palette-block');
        if (paletteBlock) addElement(paletteBlock.dataset.type);
    });

    dom.canvas.addEventListener('click', (e) => {
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

    dom.properties.addEventListener('input', (e) => {
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
        <div class="site-element" data-anim-type="${el.animations.type}" data-anim-duration="${el.animations.duration}" data-anim-delay="${el.animations.delay || 0}" style="position: absolute; left: 0; top: 0; transform: translate(${el.content.x}px, ${el.content.y}px); width: ${el.content.width}px; height: ${el.content.height}px; z-index: ${el.content.zIndex};">
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

/* Media */
.media-content { width: 100%; height: 100%; display: block; }
`;

    const htmlCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Freeform Site</title>
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
            const animType = wrapper.dataset.animType;
            const duration = parseFloat(wrapper.dataset.animDuration);
            const delay = parseFloat(wrapper.dataset.animDelay);
            
            if (animType === 'none') return;
            
            let fromVars = {
                opacity: 0,
                duration: duration,
                delay: delay,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: wrapper,
                    start: "top 90%",
                    toggleActions: "play none none reverse"
                }
            };
            
            if (animType === 'slideUp') fromVars.y = 100;
            if (animType === 'slideDown') fromVars.y = -100;
            if (animType === 'slideLeft') fromVars.x = 100;
            if (animType === 'slideRight') fromVars.x = -100;
            if (animType === 'zoomIn') fromVars.scale = 0.5;
            if (animType === 'zoomOut') fromVars.scale = 1.5;
            if (animType === 'rotate') { fromVars.rotation = 180; fromVars.scale = 0.5; }
            
            gsap.from(wrapper, fromVars);
        });
    </script>
</body>
</html>`;

    return { html: htmlCode, css: cssCode };
}

function addElement(type) {
    // Determine random start pos based on scroll
    const startY = dom.canvas.scrollTop + 50;
    let content = { x: 50, y: startY, zIndex: state.elements.length + 1 };

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
    }

    const newEl = {
        id: 'el_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        type: type,
        content: content,
        animations: { type: 'slideUp', duration: '1.0', delay: '0' }
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
