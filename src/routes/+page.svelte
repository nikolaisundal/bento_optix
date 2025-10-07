<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';

  let message = 'Loading...';

  onMount(async () => {
    const { data, error } = await supabase
      .from('test_messages')
      .select('message')
      .single();

    if (error) {
      message = 'Error: ' + error.message;
    } else {
      message = data.message;
    }
  });
</script>

<h1>Supabase Connection Test</h1>
<p>{message}</p>