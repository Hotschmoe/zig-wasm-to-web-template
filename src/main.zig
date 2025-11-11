const std = @import("std");
const config = @import("webconfig.zig");

// Conditional imports — only compiled if enabled
const webgpu = if (config.enable_webgpu) @import("webfeatures/webgpu.zig") else struct {};
const webaudio = if (config.enable_webaudio) @import("webfeatures/webaudio.zig") else struct {};
const webinput = if (config.enable_webinput) @import("webfeatures/webinput.zig") else struct {};
const webnn = if (config.enable_webnn) @import("webfeatures/webnn.zig") else struct {};

// Build feature string at compile time
const feature_string = blk: {
    var str: []const u8 = "";
    if (config.enable_webgpu) str = str ++ "webgpu,";
    if (config.enable_webaudio) str = str ++ "webaudio,";
    if (config.enable_webinput) str = str ++ "webinput,";
    if (config.enable_webnn) str = str ++ "webnn,";
    // Remove trailing comma if present
    if (str.len > 0) str = str[0 .. str.len - 1];
    break :blk str;
};

// Export pointer to feature string
export fn getRequiredFeatures() [*]const u8 {
    return feature_string.ptr;
}

// Export length of feature string
export fn getRequiredFeaturesLength() usize {
    return feature_string.len;
}

// Main initialization function called from JS
export fn init() void {
    if (comptime config.enable_webgpu) webgpu.init();
    if (comptime config.enable_webaudio) webaudio.init();
    if (comptime config.enable_webinput) webinput.init();
    if (comptime config.enable_webnn) webnn.init();
}

pub fn main() void {
    // Not used in WASM context
}
