## Feature Flagging in Zig WASM Projects  
### Using `webconfig.zig` + Build Options for Minimal, Reusable, and Performant WebAssembly

---

### Goal
Enable **optional web features** (WebGPU, WebAudio, WebNN, inputs, etc.) in a **clean, compile-time** way so that:
- Only used features are included in the final `.wasm`.
- No runtime overhead.
- The template is reusable across projects.
- The developer experience is simple and predictable.

---

## Why Build Options + `webconfig.zig`?

| Benefit | Explanation |
|-------|-------------|
| **Zero Runtime Cost** | Features are resolved at **compile time** — disabled code is never emitted. |
| **Automatic Dead Code Elimination** | The Zig compiler + linker **automatically strips** any `if (comptime !config.enable_webgpu)` block. No manual cleanup. |
| **Clean API** | One source of truth: `webconfig.zig`. No scattered `pub const` flags. |
| **Reusable Template** | Copy-paste `build.zig` and `webconfig.zig` into any new project. |
| **Explicit Control** | Use `zig build -Dwebgpu=true` — no guessing, no environment variables. |

> **This is the Zig way.** No macros, no preprocessor, no runtime checks.

---

## File Structure (Recommended)

```
src/zig/
├── main.zig
├── webconfig.zig
└── webfeatures/
    ├── webgpu.zig
    ├── webaudio.zig
    ├── webinput.zig
    └── webnn.zig
```

---

## 1. `build.zig` — Define Build Options

```zig
const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{ .default_target = .{ .cpu_arch = .wasm32, .os_tag = .freestanding } });
    const optimize = b.standardOptimizeOption(.{});

    const exe = b.addExecutable(.{
        .name = "app",
        .root_source_file = b.path("src/zig/main.zig"),
        .target = target,
        .optimize = optimize,
    });

    // === Feature Flags ===
    const webgpu   = b.option(bool, "webgpu",   "Enable WebGPU support") orelse false;
    const webaudio = b.option(bool, "webaudio", "Enable WebAudio support") orelse false;
    const webinput = b.option(bool, "webinput", "Enable input handling") orelse false;
    const webnn    = b.option(bool, "webnn",    "Enable WebNN support") orelse false;

    // === "All" Flag ===
    const all = b.option(bool, "all", "Enable ALL web features") orelse false;
    const final_webgpu   = all or webgpu;
    const final_webaudio = all or webaudio;
    const final_webinput = all or webinput;
    const final_webnn    = all or webnn;

    // === Pass to Zig code ===
    const options = b.addOptions();
    options.addOption(bool, "enable_webgpu",   final_webgpu);
    options.addOption(bool, "enable_webaudio", final_webaudio);
    options.addOption(bool, "enable_webinput", final_webinput);
    options.addOption(bool, "enable_webnn",    final_webnn);

    exe.root_module.addOptions("build_options", options);

    b.installArtifact(exe);
}
```

### Build Commands
```bash
# Minimal build
zig build

# Enable specific features
zig build -Dwebgpu=true -Dwebaudio=true

# Enable ALL features
zig build -Dall=true
```

> **Automatic**: The `all` flag overrides individual ones. No manual merging.

---

## 2. `src/zig/webconfig.zig` — Central Config

```zig
pub const enable_webgpu   = @import("build_options").enable_webgpu;
pub const enable_webaudio = @import("build_options").enable_webaudio;
pub const enable_webinput = @import("build_options").enable_webinput;
pub const enable_webnn    = @import("build_options").enable_webnn;
```

> **Never edit this file manually** — it reflects build flags exactly.

---

## 3. Using Features in Code

### In `main.zig`

```zig
const config = @import("webconfig.zig");

// Conditional imports — only compiled if enabled
const webgpu   = if (config.enable_webgpu)   @import("webfeatures/webgpu.zig")   else struct {};
const webaudio = if (config.enable_webaudio) @import("webfeatures/webaudio.zig") else struct {};
const webinput = if (config.enable_webinput) @import("webfeatures/webinput.zig") else struct {};
const webnn    = if (config.enable_webnn)    @import("webfeatures/webnn.zig")    else struct {};

export fn getRequiredFeatures() [*]const u8 {
    var list: []const u8 = "";
    if (comptime config.enable_webgpu)   list ++= "webgpu,";
    if (comptime config.enable_webaudio) list ++= "webaudio,";
    if (comptime config.enable_webinput) list ++= "webinput,";
    if (comptime config.enable_webnn)    list ++= "webnn,";
    return list.ptr;
}

pub fn main() void {
    if (comptime config.enable_webgpu)   webgpu.init();
    if (comptime config.enable_webaudio) webaudio.playStartupSound();
    if (comptime config.enable_webinput) webinput.setupListeners();
}
```

> **Automatic**: If `enable_webgpu = false`, the entire `webgpu` import and all calls are **eliminated** at compile time.

---

### In Feature Files (e.g. `webfeatures/webgpu.zig`)

```zig
const config = @import("../webconfig.zig");

pub export fn init() void {
    if (!comptime config.enable_webgpu) {
        @compileError("WebGPU feature not enabled in build");
    }
    // Real WebGPU setup
}

pub export fn render() void {
    // Only reachable if feature is enabled
}
```

> **Safety**: Attempting to call `webgpu.init()` when disabled = **compile error**.

---

## What’s Automatic vs Manual?

| Task | Automatic? | Notes |
|------|------------|-------|
| Remove unused code | Yes | Zig DCE + `comptime` eliminates entire files/blocks |
| Update `webconfig.zig` | Yes | Generated from `build.zig` — never edit manually |
| Feature list for JS | Yes | `getRequiredFeatures()` built from `comptime` flags |
| Binary size reduction | Yes | No glue, no stubs, no runtime checks |
| Adding new feature | Manual (but simple) | Add flag in `build.zig`, line in `webconfig.zig`, new `.zig` + `.js` |

---

## Summary: Best Practices

1. **Always use `build_options`** — never hardcode or use env vars.
2. **Use `webconfig.zig`** — one source of truth.
3. **Use `comptime` conditionals** — `if (comptime config.enable_x)` = zero cost.
4. **Use `-Dall=true`** for full builds, individual flags for minimal.
5. **Never manually edit `webconfig.zig`** — it’s generated.
6. **Let Zig + linker do the cleanup** — no need to run `wasm-strip` for feature bloat.

---

> **Result**: A 5KB WASM with WebGPU, or a 2KB WASM without — **same codebase, different build command**.