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