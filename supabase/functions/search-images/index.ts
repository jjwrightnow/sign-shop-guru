import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, count = 3 } = await req.json()
    
    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const API_KEY = Deno.env.get('GOOGLE_CSE_API_KEY')
    const CSE_ID = Deno.env.get('GOOGLE_CSE_ID')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!API_KEY || !CSE_ID) {
      console.error('Missing Google CSE credentials')
      return new Response(
        JSON.stringify({ images: [], message: 'Image search not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const normalizedQuery = query.toLowerCase().trim()

    // Check cache first
    const { data: cached } = await supabase
      .from('image_search_cache')
      .select('results')
      .eq('query', normalizedQuery)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (cached?.results) {
      console.log('Cache hit for query:', normalizedQuery)
      return new Response(
        JSON.stringify({ images: cached.results, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Search with Creative Commons / free-to-use filter
    const searchUrl = new URL('https://www.googleapis.com/customsearch/v1')
    searchUrl.searchParams.set('key', API_KEY)
    searchUrl.searchParams.set('cx', CSE_ID)
    searchUrl.searchParams.set('q', `${query} sign signage`)
    searchUrl.searchParams.set('searchType', 'image')
    searchUrl.searchParams.set('num', Math.min(count, 10).toString())
    searchUrl.searchParams.set('safe', 'active')
    // Filter for reusable images (Creative Commons)
    searchUrl.searchParams.set('rights', 'cc_publicdomain,cc_attribute,cc_sharealike')
    
    console.log('Searching Google Images for:', query)
    const response = await fetch(searchUrl.toString())
    const data = await response.json()

    if (data.error) {
      console.error('Google API error:', data.error)
      return new Response(
        JSON.stringify({ images: [], message: 'Search temporarily unavailable' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!data.items || data.items.length === 0) {
      return new Response(
        JSON.stringify({ images: [], message: 'No free-to-use images found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Format results
    const images = data.items.map((item: any) => ({
      url: item.link,
      thumbnail: item.image?.thumbnailLink || item.link,
      title: item.title,
      source: item.displayLink,
      context: item.image?.contextLink
    }))

    // Cache results for 7 days
    await supabase
      .from('image_search_cache')
      .upsert({
        query: normalizedQuery,
        results: images,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }, { onConflict: 'query' })

    // Log search for tracking
    console.log('Image search completed for query:', normalizedQuery, 'results:', images.length)

    return new Response(
      JSON.stringify({ images }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Search error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
