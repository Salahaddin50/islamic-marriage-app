import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { ...corsHeaders, 'Access-Control-Allow-Methods': 'POST, OPTIONS' } });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  try {
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    console.log('Content-Type:', req.headers.get('content-type'));
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Missing Supabase configuration' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Handle test endpoint
    if (req.url.includes('?test=true')) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Function is working',
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Handle table test endpoint
    if (req.url.includes('?test-table=true')) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .limit(1);
        
        return new Response(JSON.stringify({ 
          success: !error,
          message: error ? 'Table access failed' : 'Table access successful',
          error: error ? error.message : null,
          sampleData: data
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (e) {
        return new Response(JSON.stringify({ 
          success: false,
          message: 'Table test failed',
          error: e.message
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    // Try to get the request body
    let body: any = {};
    
    try {
      const rawBody = await req.text();
      console.log('Raw body received:', rawBody);
      
      if (rawBody) {
        body = JSON.parse(rawBody);
      }
    } catch (e) {
      console.error('Error parsing request body:', e);
      
      // Try alternative method
      try {
        body = await req.json();
      } catch (e2) {
        console.error('Alternative JSON parsing also failed:', e2);
        return new Response(JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: e2.message
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }
    
    console.log('Parsed body:', JSON.stringify(body));
    console.log('Body type:', typeof body);
    console.log('Body keys:', Object.keys(body || {}));
    
    // Handle different possible body structures
    let user_id, type, title, message;
    
    if (body && typeof body === 'object') {
      // Direct access
      user_id = body.user_id;
      type = body.type;
      title = body.title;
      message = body.message;
      
      // If not found, check if it's nested (some Supabase client versions do this)
      if (!user_id && body.body) {
        console.log('Checking nested body structure:', body.body);
        user_id = body.body.user_id;
        type = body.body.type;
        title = body.body.title;
        message = body.body.message;
      }
    }

    console.log('Extracted fields:', { user_id, type, title, message });

    if (!user_id || !type || !title || !message) {
      console.error('Missing fields validation failed:', { 
        user_id: !!user_id, 
        type: !!type, 
        title: !!title, 
        message: !!message 
      });
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: user_id, type, title, message',
        received: body,
        rawKeys: Object.keys(body || {}),
        validation: { 
          user_id: !!user_id, 
          type: !!type, 
          title: !!title, 
          message: !!message 
        }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Insert notification into database
    console.log('Attempting to insert notification with data:', {
      user_id,
      sender_id: 'admin',
      sender_name: 'Admin Team',
      type,
      title,
      message,
      is_read: false
    });

    try {
      // Use a system UUID for admin sender (create a consistent admin UUID)
      const adminUuid = '00000000-0000-0000-0000-000000000000';
      
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id,
          sender_id: adminUuid,
          sender_name: 'Admin Team',
          type,
          title,
          message,
          is_read: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (error) {
        console.error('Database error creating notification:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return new Response(JSON.stringify({ 
          error: 'Failed to create notification', 
          details: error.message,
          code: error.code,
          hint: error.hint
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      console.log('Notification created successfully:', data);
      return new Response(JSON.stringify({ 
        success: true, 
        notification: data 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });

    } catch (dbError) {
      console.error('Exception during database operation:', dbError);
      return new Response(JSON.stringify({ 
        error: 'Database operation failed', 
        details: dbError.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

  } catch (error) {
    console.error('Edge Function error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
