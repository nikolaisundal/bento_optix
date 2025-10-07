<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';

  onMount(async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth error:', error);
      goto('/login');
    } else if (session) {
      console.log('Auth successful!', session);
      goto('/');
    } else {
      console.error('No session found');
      goto('/login');
    }
  });
</script>

<div class="flex min-h-screen items-center justify-center">
  <p class="text-muted-foreground">Completing sign in...</p>
</div>