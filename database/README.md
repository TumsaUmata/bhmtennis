# Supabase Integration

Files in this folder are ready to use once `@supabase/supabase-js` is installed.

## Steps to integrate

1. Install the Supabase client:
   ```bash
   npm install @supabase/supabase-js
   ```

2. Create a Supabase project at https://supabase.com

3. Run `supabase/schema.sql` in the Supabase SQL Editor

4. Copy `.env.local.example` to `.env.local` and fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_USE_SUPABASE=true
   ```

5. Move files into the app:
   ```bash
   cp setup/supabase/client.ts src/lib/supabase/client.ts
   cp setup/supabase/auth.ts src/lib/supabase/auth.ts
   cp setup/supabase/supabase-service.ts src/lib/services/supabase-service.ts
   ```

6. Update `src/lib/services/index.ts`:
   ```typescript
   import { useSupabase } from "../supabase/config";
   import { createMockService } from "./mock-service";
   import { createSupabaseService } from "./supabase-service";

   export function getService() {
     if (!_service) {
       _service = useSupabase ? createSupabaseService() : createMockService();
     }
     return _service;
   }
   ```

7. Deploy to Vercel with the same env vars

## File overview

| File | Destination | Purpose |
|---|---|---|
| `supabase/schema.sql` | Run in Supabase SQL Editor | Database tables, RLS policies, indexes |
| `supabase/client.ts` | `src/lib/supabase/client.ts` | Supabase client initialization |
| `supabase/auth.ts` | `src/lib/supabase/auth.ts` | Auth helpers (signUp, signIn, signOut, etc.) |
| `supabase/supabase-service.ts` | `src/lib/services/supabase-service.ts` | TournamentService implementation for Supabase |
