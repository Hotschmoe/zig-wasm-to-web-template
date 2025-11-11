/**
 * WebAudio JavaScript glue
 * This module is only loaded if WebAudio is enabled in the WASM build
 */

export function setupWebAudio(wasmInstance) {
    console.log('[JS] WebAudio glue loaded successfully');
    
    // You would add WebAudio-specific imports to the WASM instance here
    // For now, just confirm the feature is available
    if (wasmInstance.exports.init) {
        console.log('[JS] WebAudio ready to initialize');
    }
}

