# Testing the Feature Flagging System

This guide will help you validate that the build system and feature flagging are working correctly.

## Quick Test

1. **Build with all features:**
   ```bash
   zig build -Dall=true
   ```

2. **Copy WASM to web directory:**
   ```bash
   # Windows (PowerShell)
   Copy-Item zig-out\bin\zig_wasm_to_web_template.wasm web\
   
   # Linux/Mac
   cp zig-out/bin/zig_wasm_to_web_template.wasm web/
   ```

3. **Serve the web directory:**
   ```bash
   cd web
   python -m http.server 8000
   ```

4. **Open your browser:**
   - Navigate to `http://localhost:8000`
   - Open the browser console (F12)

## Expected Output

### In the Browser Console

You should see:
```
[Main] Loading WASM module...
[Main] WASM loaded successfully
[Main] Required features: webgpu, webaudio, webinput, webnn
[Main] Loading webgpu glue...
[JS] WebGPU glue loaded successfully
[JS] WebGPU ready to initialize
[Main] Loading webaudio glue...
[JS] WebAudio glue loaded successfully
[JS] WebAudio ready to initialize
[Main] Loading webinput glue...
[JS] WebInput glue loaded successfully
[JS] WebInput ready to initialize
[Main] Loading webnn glue...
[JS] WebNN glue loaded successfully
[JS] WebNN ready to initialize
[Main] Initializing WASM features...
[WASM] WebGPU initialized
[WASM] WebAudio initialized
[WASM] WebInput initialized
[WASM] WebNN initialized
[Main] Initialization complete!
```

### On the Web Page

You should see a green status box showing:
```
✅ Initialized with features: webgpu, webaudio, webinput, webnn
```

## Testing Different Configurations

### Minimal Build (No Features)
```bash
zig build
Copy-Item zig-out\bin\zig_wasm_to_web_template.wasm web\
```

Expected console output:
```
[Main] Loading WASM module...
[Main] WASM loaded successfully
[Main] No features enabled (minimal build)
[Main] Initializing WASM features...
[Main] Initialization complete!
```

Expected page status:
```
✅ Initialized (minimal build - no features)
```

### Specific Features Only
```bash
zig build -Dwebgpu=true -Dwebaudio=true
Copy-Item zig-out\bin\zig_wasm_to_web_template.wasm web\
```

Expected console output will show only WebGPU and WebAudio being loaded.

## Verifying Dead Code Elimination

Compare WASM file sizes:

```powershell
# PowerShell (Windows)
zig build -Dall=true 2>&1 >$null
$allSize = (Get-Item zig-out\bin\zig_wasm_to_web_template.wasm).Length

zig build 2>&1 >$null
$minSize = (Get-Item zig-out\bin\zig_wasm_to_web_template.wasm).Length

Write-Host "All features: $allSize bytes"
Write-Host "No features:  $minSize bytes"
Write-Host "Difference:   $($allSize - $minSize) bytes"
```

```bash
# Bash (Linux/Mac)
zig build -Dall=true
all_size=$(wc -c < zig-out/bin/zig_wasm_to_web_template.wasm)

zig build
min_size=$(wc -c < zig-out/bin/zig_wasm_to_web_template.wasm)

echo "All features: $all_size bytes"
echo "No features:  $min_size bytes"
echo "Difference:   $((all_size - min_size)) bytes"
```

The minimal build should be smaller, proving that unused features are eliminated at compile time.

## Network Tab Verification

To verify that JavaScript glue files are only loaded when needed:

1. Open browser DevTools (F12)
2. Go to the **Network** tab
3. Clear existing requests
4. Reload the page

### With All Features
You should see requests for:
- `zig_wasm_to_web_template.wasm`
- `main.js`
- `webgpu.js`
- `webaudio.js`
- `webinput.js`
- `webnn.js`

### With Minimal Build
You should only see:
- `zig_wasm_to_web_template.wasm`
- `main.js`

**No glue files should be loaded!** This demonstrates lazy loading.

## Debugging

If you see errors:

1. **"Failed to fetch WASM"**: Make sure you copied the .wasm file to the `web/` directory
2. **"getRequiredFeatures is not a function"**: The WASM file might be from a different build - rebuild and recopy
3. **CORS errors**: Make sure you're using a local server (not opening index.html directly)
4. **Feature not found**: Check your build flags match what you expect

## Success Criteria

✅ Build succeeds with and without features  
✅ Console shows correct features being loaded  
✅ Page status updates correctly  
✅ Network tab shows only required JS files  
✅ Minimal build has smaller WASM file  
✅ No console errors  

If all these pass, your feature flagging system is working correctly!

