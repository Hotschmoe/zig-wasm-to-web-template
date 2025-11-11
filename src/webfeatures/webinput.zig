const config = @import("../webconfig.zig");

pub fn init() void {
    if (!comptime config.enable_webinput) {
        @compileError("WebInput feature not enabled in build");
    }
    logMessage("WebInput initialized");
}

extern fn consoleLog(ptr: [*]const u8, len: usize) void;

fn logMessage(msg: []const u8) void {
    consoleLog(msg.ptr, msg.len);
}

