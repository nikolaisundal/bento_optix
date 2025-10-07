<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { goto } from '$app/navigation';
  import { Button } from '@/components/ui/button';
  import { Input } from '@/components/ui/input';
  import { Label } from '@/components/ui/label';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let loading = $state(false);
  let error = $state('');
  let success = $state('');

  async function handleSignup() {
    try {
      loading = true;
      error = '';
      success = '';

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      success = 'Account created! Check your email to confirm your account.';
      
      setTimeout(() => goto('/login'), 3000);
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="flex min-h-screen items-center justify-center p-4">
  <Card class="w-full max-w-md">
    <CardHeader>
      <CardTitle>Sign Up for Bento Optix</CardTitle>
      <CardDescription>Create an account to get started</CardDescription>
    </CardHeader>
    <CardContent>
      {#if error}
        <div class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      {/if}

      {#if success}
        <div class="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800">
          {success}
        </div>
      {/if}

      <form onsubmit={handleSignup} class="space-y-4">
        <div class="space-y-2">
          <Label for="email">Email</Label>
          <Input
            id="email"
            type="email"
            bind:value={email}
            placeholder="your@email.com"
            required
          />
        </div>

        <div class="space-y-2">
          <Label for="password">Password</Label>
          <Input
            id="password"
            type="password"
            bind:value={password}
            placeholder="••••••••"
            required
          />
        </div>

        <div class="space-y-2">
          <Label for="confirm-password">Confirm Password</Label>
          <Input
            id="confirm-password"
            type="password"
            bind:value={confirmPassword}
            placeholder="••••••••"
            required
          />
        </div>

        <Button type="submit" class="w-full" disabled={loading}>
          {loading ? 'Creating account...' : 'Sign Up'}
        </Button>
      </form>

      <p class="mt-4 text-center text-sm text-muted-foreground">
        Already have an account? <a href="/login" class="text-primary hover:underline">Login</a>
      </p>
    </CardContent>
  </Card>
</div>