// State Management
const state = {
    blocks: [],
    selectedBlockId: null
};

// Available Block Definitions
const BLOCK_TYPES = [
    {
        id: 'hero',
        name: 'Hero Section',
        icon: 'fa-image',
        description: 'Large header with title and background'
    },
    {
        id: 'text',
        name: 'Text Block',
        icon: 'fa-align-left',
        description: 'Simple paragraph text'
    },
    {
        id: 'scrolly-image-text',
        name: 'Scroll: Pinned Image',
        icon: 'fa-film',
        description: 'Image pins while text scrolls'
    }
];

// DOM Elements
const elements = {
    palette: document.getElementById('block-palette'),
    canvas: document.getElementById('canvas'),
    properties: document.getElementById('properties-panel')
};

// Initialize App
function init() {
    renderPalette();
    renderCanvas();
    setupEventListeners();
}

function renderPalette() {
    elements.palette.innerHTML = BLOCK_TYPES.map(block => `
        <div class="palette-block" data-type="${block.id}">
            <i class="fa-solid ${block.icon}"></i>
            <div class="palette-block-info">
                <h4>${block.name}</h4>
                <p>${block.description}</p>
            </div>
            <i class="fa-solid fa-plus" style="margin-left: auto; color: var(--text-muted);"></i>
        </div>
    `).join('');
}

function renderCanvas() {
    if (state.blocks.length === 0) {
        elements.canvas.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-layer-group"></i>
                <p>Drag or click a block from the left to start building</p>
            </div>
        `;
        return;
    }

    elements.canvas.innerHTML = state.blocks.map(block => `
        <div class="canvas-block-wrapper ${block.id === state.selectedBlockId ? 'selected' : ''}" data-id="${block.id}">
            <div class="block-controls">
                <button class="btn-delete-block" data-id="${block.id}"><i class="fa-solid fa-trash"></i></button>
            </div>
            <div class="canvas-block">
                ${renderBlockContent(block)}
            </div>
        </div>
    `).join('');

    // Wait a brief moment for the DOM to update, then init animations
    setTimeout(initAnimations, 50);
}

function initAnimations() {
    // Clean up old triggers
    ScrollTrigger.getAll().forEach(t => t.kill());

    state.blocks.forEach(block => {
        const wrapper = document.querySelector(`[data-id="${block.id}"]`);
        if (!wrapper) return;
        
        const el = wrapper.querySelector('.canvas-block');

        // 1. Specialized Pinning Animation for Scrolly Block
        if (block.type === 'scrolly-image-text') {
            const imageEl = el.querySelector('.scrolly-img-col');
            if (imageEl) {
                ScrollTrigger.create({
                    trigger: el,
                    scroller: elements.canvas,
                    pin: imageEl,
                    start: "top top",
                    end: "bottom bottom"
                });
            }
        }

        // 2. Entrance Animations
        if (block.animations.type === 'none') return;

        let fromVars = {
            opacity: 0,
            duration: parseFloat(block.animations.duration),
            ease: "power2.out",
            clearProps: "all",
            scrollTrigger: {
                trigger: wrapper,
                scroller: elements.canvas,
                start: "top 85%", // trigger when top of element hits 85% down viewport
                toggleActions: "play none none reverse"
            }
        };

        if (block.animations.type === 'slideUp') {
            fromVars.y = 100;
        } else if (block.animations.type === 'zoomIn') {
            fromVars.scale = 0.8;
        }

        gsap.from(el, fromVars);
    });
}

function renderBlockContent(block) {
    if (block.type === 'hero') {
        return `
            <div style="background-color: #111827; color: white; padding: 100px 40px; text-align: center; background-image: url('${block.content.bgImage}'); background-size: cover; background-position: center; position: relative;">
                <div style="position: absolute; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.6);"></div>
                <div style="position: relative; z-index: 1;">
                    <h1 style="font-size: 48px; font-weight: 800; margin-bottom: 20px;">${block.content.title}</h1>
                    <p style="font-size: 20px; color: #d1d5db; max-width: 600px; margin: 0 auto;">${block.content.subtitle}</p>
                </div>
            </div>
        `;
    } else if (block.type === 'text') {
        return `
            <div style="background-color: white; color: #1f2937; padding: 60px 40px; max-width: 800px; margin: 0 auto;">
                <h2 style="font-size: 32px; font-weight: 700; margin-bottom: 20px;">${block.content.title}</h2>
                <p style="font-size: 18px; line-height: 1.6; color: #4b5563;">${block.content.text}</p>
            </div>
        `;
    } else if (block.type === 'scrolly-image-text') {
        return `
            <div style="display: flex; min-height: 800px; background-color: #f3f4f6; color: #111827;">
                <div style="flex: 1; padding: 60px; display: flex; flex-direction: column; justify-content: center;">
                    <h2 style="font-size: 36px; font-weight: 800; margin-bottom: 20px;">${block.content.title}</h2>
                    <p style="font-size: 18px; line-height: 1.6;">${block.content.text}</p>
                </div>
                <div style="flex: 1; position: relative;">
                    <div class="scrolly-img-col" style="position: absolute; top:0; left:0; width:100%; height:100vh; background-image: url('${block.content.image}'); background-size: cover; background-position: center;"></div>
                </div>
            </div>
        `;
    }
    return `<div>Unknown block type</div>`;
}

function renderProperties() {
    if (!state.selectedBlockId) {
        elements.properties.innerHTML = '<div class="empty-state-small">Select a block to edit its properties and animations</div>';
        return;
    }

    const block = state.blocks.find(b => b.id === state.selectedBlockId);
    const blockTypeInfo = BLOCK_TYPES.find(t => t.id === block.type);
    
    let html = `
        <div style="margin-bottom: 20px;">
            <label style="display:block; margin-bottom:8px; font-size:12px; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; font-weight:600;">Block Type</label>
            <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 6px; font-size: 14px; display:flex; align-items:center; gap:10px;">
                <i class="fa-solid ${blockTypeInfo.icon}" style="color:var(--accent-color);"></i>
                <span>${blockTypeInfo.name}</span>
            </div>
        </div>
        
        <div style="padding-top: 15px; border-top: 1px solid var(--border-color);">
            <h4 style="margin-bottom: 15px; font-size: 14px;">Content Settings</h4>
    `;

    // Dynamic Content Fields based on block type
    if (block.type === 'hero') {
        html += `
            <div class="form-group">
                <label>Title</label>
                <input type="text" class="form-control prop-input" data-field="content.title" value="${block.content.title}">
            </div>
            <div class="form-group">
                <label>Subtitle</label>
                <input type="text" class="form-control prop-input" data-field="content.subtitle" value="${block.content.subtitle}">
            </div>
            <div class="form-group">
                <label>Background Image URL</label>
                <input type="text" class="form-control prop-input" data-field="content.bgImage" value="${block.content.bgImage}">
            </div>
        `;
    } else if (block.type === 'text') {
        html += `
            <div class="form-group">
                <label>Title</label>
                <input type="text" class="form-control prop-input" data-field="content.title" value="${block.content.title}">
            </div>
            <div class="form-group">
                <label>Text Content</label>
                <textarea class="form-control prop-input" data-field="content.text">${block.content.text}</textarea>
            </div>
        `;
    } else if (block.type === 'scrolly-image-text') {
        html += `
            <div class="form-group">
                <label>Title</label>
                <input type="text" class="form-control prop-input" data-field="content.title" value="${block.content.title}">
            </div>
            <div class="form-group">
                <label>Text Content</label>
                <textarea class="form-control prop-input" data-field="content.text">${block.content.text}</textarea>
            </div>
            <div class="form-group">
                <label>Pinned Image URL</label>
                <input type="text" class="form-control prop-input" data-field="content.image" value="${block.content.image}">
            </div>
        `;
    }

    // Animation Settings (Common for all blocks)
    html += `
        </div>
        <div style="padding-top: 15px; border-top: 1px solid var(--border-color); margin-top: 20px;">
            <h4 style="margin-bottom: 15px; font-size: 14px;">Animation Settings</h4>
            
            <div class="form-group">
                <label>Entrance Animation</label>
                <select class="form-control prop-input" data-field="animations.type">
                    <option value="none" ${block.animations.type === 'none' ? 'selected' : ''}>None</option>
                    <option value="fade" ${block.animations.type === 'fade' ? 'selected' : ''}>Fade In</option>
                    <option value="slideUp" ${block.animations.type === 'slideUp' ? 'selected' : ''}>Slide Up</option>
                    <option value="zoomIn" ${block.animations.type === 'zoomIn' ? 'selected' : ''}>Zoom In</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Animation Duration: <span id="dur-val-${block.id}">${block.animations.duration}s</span></label>
                <input type="range" class="form-control prop-input" data-field="animations.duration" min="0.5" max="5" step="0.5" value="${block.animations.duration}" oninput="document.getElementById('dur-val-${block.id}').textContent = this.value + 's'">
            </div>
        </div>
    `;

    elements.properties.innerHTML = html;
}

function setupEventListeners() {
    // Add block from palette
    elements.palette.addEventListener('click', (e) => {
        const paletteBlock = e.target.closest('.palette-block');
        if (paletteBlock) {
            const type = paletteBlock.dataset.type;
            addBlock(type);
        }
    });

    // Select block in canvas
    elements.canvas.addEventListener('click', (e) => {
        const wrapper = e.target.closest('.canvas-block-wrapper');
        const deleteBtn = e.target.closest('.btn-delete-block');
        
        if (deleteBtn) {
            deleteBlock(deleteBtn.dataset.id);
            return;
        }

        if (wrapper) {
            selectBlock(wrapper.dataset.id);
        } else {
            selectBlock(null);
        }
    });

    // Handle property changes
    elements.properties.addEventListener('input', (e) => {
        if (!state.selectedBlockId) return;
        if (e.target.classList.contains('prop-input')) {
            const field = e.target.dataset.field; // e.g., "content.title" or "animations.duration"
            const value = e.target.value;
            
            const block = state.blocks.find(b => b.id === state.selectedBlockId);
            
            // Deep update object
            const parts = field.split('.');
            if (parts.length === 2) {
                block[parts[0]][parts[1]] = value;
            }

            // Re-render canvas but try to preserve scroll position
            const scrollPos = elements.canvas.scrollTop;
            renderCanvas();
            elements.canvas.scrollTop = scrollPos;
        }
    });

    // Export Code Modal
    document.getElementById('btn-export').addEventListener('click', () => {
        const exportedHTML = generateExportCode();
        document.getElementById('export-code').value = exportedHTML;
        document.getElementById('export-modal').classList.remove('hidden');
    });

    document.getElementById('btn-close-modal').addEventListener('click', () => {
        document.getElementById('export-modal').classList.add('hidden');
    });

    document.getElementById('btn-copy-code').addEventListener('click', () => {
        const copyText = document.getElementById('export-code');
        copyText.select();
        document.execCommand('copy');
        
        const btn = document.getElementById('btn-copy-code');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        setTimeout(() => btn.innerHTML = originalText, 2000);
    });
}

function generateExportCode() {
    let blocksHtml = state.blocks.map(block => `
        <!-- Block: ${block.type} -->
        <div class="site-block" data-anim-type="${block.animations.type}" data-anim-duration="${block.animations.duration}" data-block-type="${block.type}">
            ${renderBlockContent(block)}
        </div>
    `).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Scrollytelling Site</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; overflow-x: hidden; }
        * { box-sizing: border-box; }
    </style>
</head>
<body>
    
${blocksHtml}

    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
    <script>
        gsap.registerPlugin(ScrollTrigger);
        
        document.querySelectorAll('.site-block').forEach(wrapper => {
            const type = wrapper.dataset.blockType;
            const animType = wrapper.dataset.animType;
            const duration = parseFloat(wrapper.dataset.animDuration);
            
            // Pinning for scrolly block
            if (type === 'scrolly-image-text') {
                const imageEl = wrapper.querySelector('.scrolly-img-col');
                if (imageEl) {
                    ScrollTrigger.create({
                        trigger: wrapper,
                        pin: imageEl,
                        start: "top top",
                        end: "bottom bottom"
                    });
                }
            }

            // Entrance Animations
            if (animType === 'none') return;
            
            let fromVars = {
                opacity: 0,
                duration: duration,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: wrapper,
                    start: "top 85%",
                    toggleActions: "play none none reverse"
                }
            };
            
            if (animType === 'slideUp') fromVars.y = 100;
            if (animType === 'zoomIn') fromVars.scale = 0.8;
            
            gsap.from(wrapper.firstElementChild, fromVars);
        });
    </script>
</body>
</html>`;
}

function addBlock(type) {
    let defaultContent = {};
    if (type === 'hero') {
        defaultContent = {
            title: 'Scrollytelling Masterpiece',
            subtitle: 'Scroll down to discover the magic.',
            bgImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop'
        };
    } else if (type === 'text') {
        defaultContent = {
            title: 'The Art of Scrolling',
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.'
        };
    } else if (type === 'scrolly-image-text') {
        defaultContent = {
            title: 'Immersive Experiences',
            text: 'This image will pin to the side while you read this text, creating a beautiful scrollytelling effect.',
            image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop'
        };
    }

    const newBlock = {
        id: 'block_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        type: type,
        content: defaultContent,
        animations: {
            type: 'slideUp',
            duration: '1.5'
        }
    };
    
    state.blocks.push(newBlock);
    selectBlock(newBlock.id);
    
    // Scroll to bottom of canvas
    setTimeout(() => {
        elements.canvas.scrollTop = elements.canvas.scrollHeight;
    }, 10);
}

function selectBlock(id) {
    state.selectedBlockId = id;
    renderCanvas();
    renderProperties();
}

function deleteBlock(id) {
    state.blocks = state.blocks.filter(b => b.id !== id);
    if (state.selectedBlockId === id) {
        state.selectedBlockId = null;
    }
    renderCanvas();
    renderProperties();
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
