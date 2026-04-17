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
            <div style="display: flex; min-height: 400px; background-color: #f3f4f6; color: #111827;">
                <div style="flex: 1; padding: 60px; display: flex; flex-direction: column; justify-content: center;">
                    <h2 style="font-size: 36px; font-weight: 800; margin-bottom: 20px;">${block.content.title}</h2>
                    <p style="font-size: 18px; line-height: 1.6;">${block.content.text}</p>
                </div>
                <div style="flex: 1; background-image: url('${block.content.image}'); background-size: cover; background-position: center;">
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
    
    elements.properties.innerHTML = `
        <div style="margin-bottom: 20px;">
            <label style="display:block; margin-bottom:8px; font-size:12px; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; font-weight:600;">Block Type</label>
            <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 6px; font-size: 14px; display:flex; align-items:center; gap:10px;">
                <i class="fa-solid ${blockTypeInfo.icon}" style="color:var(--accent-color);"></i>
                <span>${blockTypeInfo.name}</span>
            </div>
        </div>
        
        <div style="padding-top: 15px; border-top: 1px solid var(--border-color);">
            <p style="font-size: 13px; color: var(--text-muted); text-align:center; padding: 20px 0;">
                <i class="fa-solid fa-wrench" style="display:block; font-size:24px; margin-bottom:10px; opacity:0.5;"></i>
                Content and Animation settings for this block will go here.
            </p>
        </div>
    `;
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
        animations: {} // Will hold GSAP settings
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
