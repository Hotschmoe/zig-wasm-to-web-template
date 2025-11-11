/**
 * Main entry point for WASM application
 * Dynamically loads only the required JS glue modules based on WASM feature flags
 */

async function init() {
    try {
        console.log('[Main] Loading WASM module...');

        // Create imports object that will be populated by glue modules
        const importObject = {
            env: {
                // Console logging function that WASM can call
                consoleLog: (ptr, len) => {
                    const memory = wasmInstance.exports.memory;
                    const buffer = new Uint8Array(memory.buffer, ptr, len);
                    const text = new TextDecoder().decode(buffer);
                    console.log(`[WASM] ${text}`);
                }
            }
        };

        // Load and instantiate WASM
        const response = await fetch('zig_wasm_to_web_template.wasm');
        const wasmBytes = await response.arrayBuffer();
        const wasmModule = await WebAssembly.compile(wasmBytes);
        const wasmInstance = await WebAssembly.instantiate(wasmModule, importObject);

        console.log('[Main] WASM loaded successfully');
        
        // Debug: Log all available exports
        console.log('[Main] Available exports:', Object.keys(wasmInstance.exports));

        // Read feature list from WASM
        const featuresPtr = wasmInstance.exports.getRequiredFeatures();
        const featuresLen = wasmInstance.exports.getRequiredFeaturesLength();
        
        let features = [];
        if (featuresLen > 0) {
            const memory = wasmInstance.exports.memory;
            const buffer = new Uint8Array(memory.buffer, featuresPtr, featuresLen);
            const featuresString = new TextDecoder().decode(buffer);
            features = featuresString.split(',').filter(f => f.length > 0);
            console.log(`[Main] Required features: ${features.join(', ')}`);
        } else {
            console.log('[Main] No features enabled (minimal build)');
        }

        // Dynamically load only required glue modules
        const glueLoaders = {
            'webgpu': async () => {
                const module = await import('./glue/webgpu.js');
                module.setupWebGPU(wasmInstance);
            },
            'webaudio': async () => {
                const module = await import('./glue/webaudio.js');
                module.setupWebAudio(wasmInstance);
            },
            'webinput': async () => {
                const module = await import('./glue/webinput.js');
                module.setupWebInput(wasmInstance);
            },
            'webnn': async () => {
                const module = await import('./glue/webnn.js');
                module.setupWebNN(wasmInstance);
            }
        };

        // Load each required feature's glue code
        for (const feature of features) {
            if (glueLoaders[feature]) {
                console.log(`[Main] Loading ${feature} glue...`);
                await glueLoaders[feature]();
            } else {
                console.warn(`[Main] Unknown feature: ${feature}`);
            }
        }

        // Initialize WASM features
        if (wasmInstance.exports.init) {
            console.log('[Main] Initializing WASM features...');
            wasmInstance.exports.init();
        }

        console.log('[Main] Initialization complete!');
        
        // Update status on page
        const statusDiv = document.getElementById('status');
        if (features.length > 0) {
            statusDiv.textContent = `✅ Initialized with features: ${features.join(', ')}`;
            statusDiv.style.background = '#e8f5e9';
            statusDiv.style.color = '#2e7d32';
        } else {
            statusDiv.textContent = '✅ Initialized (minimal build - no features)';
            statusDiv.style.background = '#e3f2fd';
            statusDiv.style.color = '#1565c0';
        }
        
        // Store instance globally for debugging
        window.wasmInstance = wasmInstance;

    } catch (error) {
        console.error('[Main] Initialization failed:', error);
        const statusDiv = document.getElementById('status');
        statusDiv.textContent = `❌ Error: ${error.message}`;
        statusDiv.style.background = '#ffebee';
        statusDiv.style.color = '#c62828';
    }
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

