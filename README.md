# zig-wasm-to-web-template

(merge with zig-web-ffi project)

A reusable template for building freestanding WebAssembly (WASM) projects in Zig, integrated with web technologies. This setup focuses on minimalism, performance, and modularity: compile Zig code to tiny WASM binaries, use JavaScript for browser interop (e.g., WebGPU, WebNN, inputs), and lazy-load feature-specific "glue" files to keep initial downloads small. Ideal for web apps, games, or compute-heavy demos where size and load times matter.

## Why This Template?
- **Minimal Overhead**: Zig's freestanding WASM targets produce tiny binaries (often <10KB) with dead code elimination (DCE). We avoid bloat by conditionally compiling features and lazy-loading JS glue.
- **Modular Features**: Support for optional browser APIs (WebGPU, WebNN, inputs) without forcing them into every build. This keeps projects lean—users only download what's needed.
- **Developer-Friendly Workflow**: Separate source dirs for Zig and web assets. Build to a `dist/` folder for testing/production, with options for live editing without constant copies.
- **Performance Focus**: Lazy loading reduces initial payload, improving load times on web. Decisions like using plain JS (no TS for simplicity) and basic servers (Python/Node) prioritize lean setups over heavy tooling.
- **Reasons for Key Decisions**:
  - **Freestanding WASM**: No std lib means smaller binaries and full control, but requires manual JS interop—hence the glue files.
  - **Lazy Loading JS**: Instead of a monolithic file (which downloads everything upfront), separate glue allows browsers to fetch only used features at runtime. This saves bandwidth (e.g., no WebGPU code if unsupported or unused).
  - **No Bundlers Initially**: Tools like Vite add complexity; start simple with native dynamic imports. Add them later if needed for tree-shaking or minification.
  - **Build System**: Zig's `build.zig` handles compilation and asset copying/symlinking. This integrates everything without external scripts, keeping the template self-contained.
  - **Local Serving**: Python's `http.server` is chosen for zero dependencies (built-in to Python 3), but Node is an alternative if you're in a JS ecosystem. No auto-watching by default to avoid bloat—manual rebuilds encourage deliberate testing.

## File Structure
```
zig-wasm-to-web-template/
├── build.zig          # Zig build script: compiles WASM, adds feature flags, copies/symlinks assets to dist/
├── src/
│   ├── main.zig       # Core Zig entry point with comptime conditionals for features
│   ├── config.zig     # Optional: Build options module for feature toggles (e.g., enable_webgpu)
│   └── [feature].zig  # Feature-specific files (e.g., webgpu.zig for WebGPU interop)
├── web/
│   ├── index.html     # Entry HTML: loads main.js via <script type="module">
│   ├── main.js        # Bootstrap JS: Loads WASM, checks features via Zig export, dynamic imports glue
│   ├── src/           # Project-specific JS modules (UI logic, state management, etc.)
│   └── glue/
│       ├── webgpu.js  # Glue for WebGPU: Bridges Zig exports to navigator.gpu
│       ├── webnn.js   # Glue for WebNN: Bridges to navigator.ml
│       └── inputs.js  # Glue for inputs: Event listeners, passing data to Zig
├── dist/              # Generated: Built WASM, copied/symlinked web assets (don't commit this)
└── README.md          # This file
```

- **src/**: All Zig source. Keep freestanding (no `@import("std")` unless needed).
- **web/**: Static assets and JS. `src/` holds project-specific JS modules, `glue/` holds modular interop files.
- **dist/**: Output dir for builds. Use symlinks in dev for live edits (avoids stale copies).

## Setup
1. **Prerequisites**:
   - Zig compiler (latest stable).
   - Python 3 (for local serving; optional but recommended).
   - Browser with WASM support (e.g., Chrome).

2. **Build the Project**:
   - Basic build: `zig build` (produces `dist/my_project.wasm` with no extras).
   - With features: `zig build -Dwebgpu=true -Dinputs=true` (compiles in support via comptime).
   - The build script copies/symlinks `web/` to `dist/` for a complete deployable folder.

3. **Local Development Serving**:
   - Navigate to `dist/` and run: `python -m http.server 8000`.
   - Open `http://localhost:8000/index.html`.
   - For edits: Change files in `web/` or `src/`, rebuild with `zig build`, refresh browser.
   - Reason: No auto-watcher to keep lean—manual flow prevents accidental deploys of untested code. If needed, add a tool like `entr` for Unix: `ls dist/* | entr -r python -m http.server 8000`.

4. **Production Deploy**:
   - Run `zig build` (or with flags), then host `dist/` on a static server (e.g., GitHub Pages, Vercel).
   - Optimize WASM further: `wasm-opt -Oz dist/my_project.wasm -o dist/optimized.wasm` (install Binaryen if needed).

## Usage
- **Core Flow**:
  1. Zig compiles to WASM with selected features.
  2. `index.html` loads `main.js`.
  3. `main.js` instantiates WASM, calls a Zig-exported function (e.g., `getRequiredFeatures()`) to get a list like `['webgpu', 'inputs']`.
  4. Based on that, dynamically import glue files (e.g., `import('./glue/webgpu.js')`).
  5. Glue sets up browser APIs and calls back into Zig exports.

- **Customizing for Your Project**:
  - Add features in `build.zig` (new options) and `src/` (comptime blocks).
  - Extend `main.js` with project-specific UI/state logic—keep it baked in for speed, or modularize into `web/src/` for larger projects.
  - Test feature detection: Use browser checks (e.g., `if (navigator.gpu)`) before importing glue.

## Lazy Loading Examples
Lazy loading ensures only necessary JS is fetched at runtime, reducing initial load (e.g., from 50KB to 10KB if WebGPU isn't needed).

### Example: In `main.js` (Bootstrapper)
```javascript
async function bootstrap() {
    // Load WASM (core is always small)
    const response = await fetch('my_project.wasm');
    const buffer = await response.arrayBuffer();
    const wasmModule = await WebAssembly.instantiate(buffer, { /* imports if needed */ });

    // Ask Zig what features it needs (exported function returns an array via shared memory or simple return)
    const requiredFeatures = wasmModule.instance.exports.getRequiredFeatures();  // e.g., ['webgpu', 'inputs']

    // Lazy-load glue based on features
    if (requiredFeatures.includes('webgpu')) {
        const { setupWebGPU } = await import('./glue/webgpu.js');
        setupWebGPU(wasmModule.instance);  // Bridge to browser API
    }
    if (requiredFeatures.includes('webnn')) {
        const { setupWebNN } = await import('./glue/webnn.js');
        setupWebNN(wasmModule.instance);
    }
    // ... similarly for 'inputs'

    // Run main Zig logic
    wasmModule.instance.exports.main();
}

// Start on DOM ready or immediately
bootstrap();
```

- **Reason**: Dynamic `import()` triggers browser fetch only when needed. If a feature is disabled at Zig compile-time, it's not in the list—zero overhead. Alternatives like a monolithic file would bloat the initial download, hurting mobile users.

### Example: Feature Detection in Zig (`main.zig`)
```zig
const config = @import("config");  // From build options

// Exported function for JS to call
export fn getRequiredFeatures() [*]const u8 {
    // Return a comma-separated string or use allocator for array; simplify for example
    comptime var features: []const u8 = "";
    if (comptime config.enable_webgpu) features ++= "webgpu,";
    if (comptime config.enable_webnn) features ++= "webnn,";
    if (comptime config.enable_inputs) features ++= "inputs,";
    return features.ptr;  // JS parses it
}

// Feature-specific export
if (comptime config.enable_webgpu) {
    export fn initWebGPU() void { /* WebGPU logic */ }
}
```

- **Reason**: Comptime ensures unused features aren't compiled in (DCE magic). Exporting a feature list lets JS stay agnostic—no hardcoding, easy to reuse template.

### Example: Glue File (`glue/webgpu.js`)
```javascript
export function setupWebGPU(instance) {
    // Get Zig exports
    const initWebGPU = instance.exports.initWebGPU;
    
    // Browser API setup
    if (navigator.gpu) {
        navigator.gpu.requestAdapter().then(adapter => {
            adapter.requestDevice().then(device => {
                // Pass to Zig (e.g., via pointers or calls)
                initWebGPU(/* device handle */);
            });
        });
    } else {
        console.warn('WebGPU not supported');
    }
}
```

- **Reason**: Modular files isolate concerns—easy to debug/add features without touching core. Lazy load prevents loading heavy polyfills or checks upfront.

## Contributing
Fork, add features (e.g., more glue like WebGL), PR back. Keep it minimal—avoid dependencies.