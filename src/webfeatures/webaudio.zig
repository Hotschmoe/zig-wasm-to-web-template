const config = @import("../webconfig.zig");

pub fn init() void {
    if (!comptime config.enable_webaudio) {
        @compileError("WebAudio feature not enabled in build");
    }
    logMessage("WebAudio initialized");
}

extern fn consoleLog(ptr: [*]const u8, len: usize) void;

fn logMessage(msg: []const u8) void {
    consoleLog(msg.ptr, msg.len);
}
