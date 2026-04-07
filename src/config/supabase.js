/**
 * Supabase Configuration & Client
 */
import { createClient } from '@supabase/supabase-js';

export const CONFIG = {
    SUPABASE_URL: 'https://bwcrdcudpnxkmcyyhzhe.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3Y3JkY3VkcG54a21jeXloemhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNDQxNDEsImV4cCI6MjA5MDcyMDE0MX0.Yz19f5HAHfPt2MH-ky56Ccfwb5BAV1eN8PAdmuE1BTY',
    SESSION_DURATION: 24 * 60 * 60 * 1000,
    AUTO_REFRESH_INTERVAL: 300000
};

let supabaseClient = null;

export function initSupabase() {
    try {
        supabaseClient = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
        console.log('✅ Supabase client initialized');
        return true;
    } catch (error) {
        console.error('❌ Supabase init error:', error);
        return false;
    }
}

export function getSupabase() {
    if (!supabaseClient) {
        throw new Error('Supabase client not initialized. Call initSupabase() first.');
    }
    return supabaseClient;
}
