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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuth = void 0;
exports.AuthProvider = AuthProvider;
const react_1 = __importStar(require("react"));
const supabase_1 = require("../lib/supabase");
// Create the auth context with default values
const AuthContext = (0, react_1.createContext)({
    session: null,
    user: null,
    loading: true,
    isNewUser: false,
    userRole: null,
    dbUser: null,
    signIn: async () => ({ error: null }),
    signOut: async () => ({ error: null }),
    verifyOTP: async () => ({ error: null, session: null }),
});
// Create the auth provider component
function AuthProvider({ children, onAuthStateChange }) {
    const [state, setState] = (0, react_1.useState)({
        session: null,
        user: null,
        loading: true,
        isNewUser: false,
        userRole: null,
        dbUser: null,
    });
    // Helper function to get database user record
    const getDatabaseUser = async (userId) => {
        const { data, error } = await supabase_1.supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        return { data, error };
    };
    // Helper function to check if user exists in database
    const checkNewUser = async (userId) => {
        const { data, error } = await getDatabaseUser(userId);
        if (error?.code === 'PGRST116') { // No rows found
            return { isNewUser: true, data: null };
        }
        return { isNewUser: false, data, error };
    };
    // Helper function to create new user record
    const createNewUser = async (userId, phoneNumber, role) => {
        const { data, error } = await supabase_1.supabase
            .from('users')
            .insert({ id: userId, phone_number: phoneNumber, role })
            .select()
            .single();
        return { data, error };
    };
    // Function to load user data
    const loadUserData = async (session) => {
        if (!session?.user) {
            setState(s => ({
                ...s,
                session,
                user: null,
                loading: false,
                isNewUser: false,
                userRole: null,
                dbUser: null,
            }));
            return;
        }
        try {
            // Check if user exists in database
            const { isNewUser, data } = await checkNewUser(session.user.id);
            setState(s => ({
                ...s,
                session,
                user: session.user,
                loading: false,
                isNewUser,
                userRole: data?.role,
                dbUser: data,
            }));
            // Notify parent components of auth state change if callback provided
            if (onAuthStateChange) {
                onAuthStateChange({
                    session,
                    user: session.user,
                    loading: false,
                    isNewUser,
                    userRole: data?.role,
                    dbUser: data,
                });
            }
        }
        catch (error) {
            console.error('Error loading user data:', error);
            setState(s => ({
                ...s,
                session,
                user: session.user,
                loading: false,
                isNewUser: false,
                userRole: null,
                dbUser: null,
            }));
        }
    };
    // Initialize auth on component mount
    (0, react_1.useEffect)(() => {
        // Get the initial session
        const initializeAuth = async () => {
            const { data: { session } } = await supabase_1.supabase.auth.getSession();
            await loadUserData(session);
        };
        initializeAuth();
        // Subscribe to auth changes
        const { data: { subscription } } = supabase_1.supabase.auth.onAuthStateChange(async (_event, session) => {
            await loadUserData(session);
        });
        // Clean up subscription on unmount
        return () => {
            subscription.unsubscribe();
        };
    }, []);
    // Sign in with phone number (OTP)
    const signIn = async (phone) => {
        try {
            const { error } = await supabase_1.supabase.auth.signInWithOtp({
                phone,
            });
            return { error };
        }
        catch (error) {
            console.error('Error signing in:', error);
            return { error: error };
        }
    };
    // Verify OTP token
    const verifyOTP = async (phone, token) => {
        try {
            const { data, error } = await supabase_1.supabase.auth.verifyOtp({
                phone,
                token,
                type: 'sms',
            });
            return {
                session: data.session,
                error,
            };
        }
        catch (error) {
            console.error('Error verifying OTP:', error);
            return {
                session: null,
                error: error,
            };
        }
    };
    // Sign out
    const signOut = async () => {
        try {
            const { error } = await supabase_1.supabase.auth.signOut();
            return { error };
        }
        catch (error) {
            console.error('Error signing out:', error);
            return { error: error };
        }
    };
    // Create the context value
    const contextValue = {
        ...state,
        signIn,
        signOut,
        verifyOTP,
    };
    return (<AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>);
}
// Custom hook to access the auth context
const useAuth = () => (0, react_1.useContext)(AuthContext);
exports.useAuth = useAuth;
