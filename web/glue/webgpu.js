/**
 * WebGPU JavaScript glue
 * This module is only loaded if WebGPU is enabled in the WASM build
 */

export function setupWebGPU(wasmInstance) {
    console.log('[JS] WebGPU glue loaded successfully');
    
    // You would add WebGPU-specific imports to the WASM instance here
    // For now, just confirm the feature is available
    if (wasmInstance.exports.init) {
        console.log('[JS] WebGPU ready to initialize');
    }
}

