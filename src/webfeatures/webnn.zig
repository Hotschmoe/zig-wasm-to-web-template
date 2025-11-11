const config = @import("../webconfig.zig");

pub fn init() void {
    if (!comptime config.enable_webnn) {
        @compileError("WebNN feature not enabled in build");
    }
    logMessage("WebNN initialized");
}

extern fn consoleLog(ptr: [*]const u8, len: usize) void;

fn logMessage(msg: []const u8) void {
    consoleLog(msg.ptr, msg.len);
}
