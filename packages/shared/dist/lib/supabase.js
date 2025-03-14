"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
const supabase_js_1 = require("@supabase/supabase-js");
require("react-native-url-polyfill/auto");
const react_native_1 = require("react-native");
// Replace these with your Supabase project credentials
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabaseClient = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: async_storage_1.default,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
    }
});
exports.supabase = supabaseClient;
react_native_1.AppState.addEventListener('change', (state) => {
    if (state === 'active') {
        supabaseClient.auth.startAutoRefresh();
    }
    else {
        supabaseClient.auth.stopAutoRefresh();
    }
});
// Initialize the auth state
supabaseClient.auth.initialize();
