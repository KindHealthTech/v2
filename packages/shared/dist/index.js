"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuth = exports.AuthProvider = exports.supabase = void 0;
// Export shared components and utilities
__exportStar(require("./components"), exports);
__exportStar(require("./hooks"), exports);
__exportStar(require("./constants"), exports);
// Export Supabase client
var supabase_1 = require("./lib/supabase");
Object.defineProperty(exports, "supabase", { enumerable: true, get: function () { return supabase_1.supabase; } });
// Export Supabase types
__exportStar(require("./types/supabase"), exports);
// Export Auth module
var auth_1 = require("./context/auth");
Object.defineProperty(exports, "AuthProvider", { enumerable: true, get: function () { return auth_1.AuthProvider; } });
Object.defineProperty(exports, "useAuth", { enumerable: true, get: function () { return auth_1.useAuth; } });
