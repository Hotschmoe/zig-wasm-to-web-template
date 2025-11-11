# zig-wasm-to-web-template

A reusable template for building freestanding WebAssembly (WASM) projects in Zig, integrated with web technologies. This setup focuses on minimalism, performance, and modularity: compile Zig code to tiny WASM binaries, use JavaScript for browser interop (e.g., WebGPU, WebNN, inputs), and lazy-load feature-specific "glue" files to keep initial downloads small. Ideal for web apps, games, or compute-heavy demos where size and load times matter.

## Quick Start

```bash
# 1. Build with all features enabled
zig build -Dall=true

# 2. Copy WASM to web directory
cp zig-out/bin/zig_wasm_to_web_template.wasm web/   # Linux/Mac
# or
Copy-Item zig-out\bin\zig_wasm_to_web_template.wasm web\   # Windows

# 3. Serve and test
cd web
python -m http.server 8000

# 4. Open http://localhost:8000 and check the console (F12)
```

You should see console messages showing which features were loaded!

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
├── build.zig              # Zig build script with feature flags
├── build.zig.zon          # Zig package manifest
├── src/
│   ├── main.zig           # Core entry point with comptime feature conditionals
│   ├── root.zig           # Module root for library use
│   ├── webconfig.zig      # Central config - auto-generated from build options
│   └── webfeatures/
│       ├── webgpu.zig     # WebGPU feature implementation
│       ├── webaudio.zig   # WebAudio feature implementation
│       ├── webinput.zig   # Input handling feature implementation
│       └── webnn.zig      # WebNN feature implementation
├── web/
│   ├── index.html         # Entry HTML: loads main.js via <script type="module">
│   ├── main.js            # Bootstrap JS: Loads WASM, reads features, dynamic imports
│   └── glue/
│       ├── webgpu.js      # WebGPU JavaScript glue (lazy loaded)
│       ├── webaudio.js    # WebAudio JavaScript glue (lazy loaded)
│       ├── webinput.js    # Input handling JavaScript glue (lazy loaded)
│       └── webnn.js       # WebNN JavaScript glue (lazy loaded)
├── docs/
│   ├── flagging_features.md  # Detailed guide on feature flagging system
│   └── some_info.md           # Additional implementation notes
├── zig-out/               # Build output (gitignored)
│   └── bin/
│       └── zig_wasm_to_web_template.wasm
└── README.md              # This file
```

**Key Directories:**
- **src/**: All Zig source code. Features are in `webfeatures/` subdirectory.
- **web/**: Static assets and JS. `glue/` holds feature-specific interop modules.
- **zig-out/**: Build output directory (not committed to git).

## Setup
1. **Prerequisites**:
   - Zig v0.15.1 (or compatible version).
   - Python 3 (for local serving; optional but recommended).
   - Browser with WASM support (Chrome, Firefox, Safari, Edge).

2. **Build the Project**:
   
   **Minimal build (no features):**
   ```bash
   zig build
   ```
   
   **Enable specific features:**
   ```bash
   zig build -Dwebgpu=true -Dwebaudio=true
   zig build -Dwebinput=true -Dwebnn=true
   ```
   
   **Enable ALL features:**
   ```bash
   zig build -Dall=true
   ```
   
   The compiled WASM will be in `zig-out/bin/zig_wasm_to_web_template.wasm`.

3. **Copy WASM to Web Directory**:
   ```bash
   # Windows (PowerShell)
   Copy-Item zig-out\bin\zig_wasm_to_web_template.wasm web\
   
   # Linux/Mac
   cp zig-out/bin/zig_wasm_to_web_template.wasm web/
   ```

4. **Local Development Serving**:
   ```bash
   cd web
   python -m http.server 8000
   ```
   Open `http://localhost:8000/` in your browser.
   
   Check the browser console (F12) to see which features were loaded!

5. **Development Workflow**:
   - Edit Zig files in `src/`
   - Run `zig build -Dwebgpu=true` (or your desired features)
   - Copy WASM to `web/`
   - Refresh browser
   - Check console logs to verify feature loading

6. **Production Deploy**:
   - Build with desired features and optimization: `zig build -Dall=true -Doptimize=ReleaseSmall`
   - Copy `web/` folder contents to your static host
   - For extra optimization: `wasm-opt -Oz zig_wasm_to_web_template.wasm -o optimized.wasm`

## Usage

### Core Flow
1. **Build with feature flags**: `zig build -Dwebgpu=true -Dwebaudio=true`
2. **Zig compiles** only the enabled features into WASM using `comptime` conditionals
3. **WASM exports** `getRequiredFeatures()` and `getRequiredFeaturesLength()` functions
4. **main.js loads** the WASM and calls these exports to read the feature list
5. **Dynamic imports**: `main.js` dynamically imports only the required glue modules
6. **Glue setup**: Each glue module sets up its browser API bindings
7. **Initialization**: `main.js` calls the WASM `init()` function to initialize all features

### Example Console Output

**With all features enabled** (`zig build -Dall=true`):
```
[Main] Loading WASM module...
[Main] WASM loaded successfully
[Main] Required features: webgpu, webaudio, webinput, webnn
[Main] Loading webgpu glue...
[JS] WebGPU glue loaded successfully
[Main] Loading webaudio glue...
[JS] WebAudio glue loaded successfully
[Main] Loading webinput glue...
[JS] WebInput glue loaded successfully
[Main] Loading webnn glue...
[JS] WebNN glue loaded successfully
[Main] Initializing WASM features...
[WASM] WebGPU initialized
[WASM] WebAudio initialized
[WASM] WebInput initialized
[WASM] WebNN initialized
[Main] Initialization complete!
```

**With minimal build** (`zig build`):
```
[Main] Loading WASM module...
[Main] WASM loaded successfully
[Main] No features enabled (minimal build)
[Main] Initializing WASM features...
[Main] Initialization complete!
```

### Customizing for Your Project
- **Add new features**: 
  1. Add option in `build.zig` (e.g., `const webxr = b.option(bool, "webxr", "Enable WebXR")`)
  2. Update `webconfig.zig` to include the new flag
  3. Create `src/webfeatures/webxr.zig` with your feature implementation
  4. Create `web/glue/webxr.js` with JavaScript bindings
  5. Update `main.zig` to conditionally import and initialize
  
- **Extend existing features**: Edit the respective `.zig` and `.js` files in `webfeatures/` and `glue/`

- **Test feature detection**: Add browser capability checks in glue files (e.g., `if (navigator.gpu)` before WebGPU setup)

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