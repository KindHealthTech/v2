import 'react-native-url-polyfill/auto';
import { Database } from '../types/supabase';
declare const supabaseClient: import("@supabase/supabase-js").SupabaseClient<Database, "public", any>;
export { supabaseClient as supabase };
