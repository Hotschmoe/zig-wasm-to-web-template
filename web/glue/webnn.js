/**
 * WebNN JavaScript glue
 * This module is only loaded if WebNN is enabled in the WASM build
 */

export function setupWebNN(wasmInstance) {
    console.log('[JS] WebNN glue loaded successfully');
    
    // You would add WebNN-specific imports to the WASM instance here
    // For now, just confirm the feature is available
    if (wasmInstance.exports.init) {
        console.log('[JS] WebNN ready to initialize');
    }
}

