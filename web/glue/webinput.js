/**
 * WebInput JavaScript glue
 * This module is only loaded if WebInput is enabled in the WASM build
 */

export function setupWebInput(wasmInstance) {
    console.log('[JS] WebInput glue loaded successfully');
    
    // You would add input handling imports to the WASM instance here
    // For now, just confirm the feature is available
    if (wasmInstance.exports.init) {
        console.log('[JS] WebInput ready to initialize');
    }
}

