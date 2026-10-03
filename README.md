# Fourmen Events website (v2)

Your existing Timberbooth site, extended into a multi-service site with a graduation photography booking system, a student account area, a photographer dashboard and an admin panel.

## What is in it

| Area | Route | Who |
|---|---|---|
| Home with "what we do" grid | `/` | everyone |
| Photo Booth (your original page, unchanged content) | `/photobooth` | everyone |
| Graduation: events, photographers, portfolio, packages, booking | `/graduation/...` | everyone to browse, sign-in to book |
| Event / Wedding / Guestbook / Receipt Photo Booth (coming soon) | `/event-photography` etc. | everyone |
| My bookings, balance payment, album link | `/account` | signed-in clients |
| Slots, bookings, deliveries, packages, portfolio | `/photographer` | photographers |
| Payment review, events, photographers, admin team | `/admin` | admins |
| Sign in, create account, forgot password | `/login`, `/signup`, `/reset-password` | everyone |

Edit `lib/services.ts` to change the home grid, the nav dropdown and the coming-soon pages in one place.

## Setup (about 15 minutes)

1. **Create a Supabase project** (supabase.com). It provides the database, login and file storage.
2. **Run the schema.** SQL Editor, paste `supabase/schema.sql`, run.
3. **Choose the admin email(s).** Add them to `.env.local` (comma separated):
   ```
   ADMIN_EMAILS=owner@example.com,manager@example.com
   ```
   More admins can be added later from `/admin/team` without touching config. Roles are checked on every page load, so this works even if the person already has an account.
4. **Sign-in settings** (Authentication → Providers / URL Configuration):
   - **Email** provider: enabled, with **Confirm email** on (recommended).
   - Enable **Google** (optional: create OAuth credentials in Google Cloud and paste the client ID and secret).
   - Set **Site URL** to your live domain, and add `http://localhost:3000/auth/callback` and your live domain's `/auth/callback` to the redirect URLs.
   - The default email templates work as-is. Supabase's built-in email sender is heavily rate limited, so set up custom SMTP (Authentication → Emails) before going live.
5. **Environment:** copy `.env.example` to `.env.local` and fill in the three Supabase values (Project Settings → API) and `ADMIN_EMAILS`. Keep the service-role key secret.
6. `npm install`, then `npm run dev`.

## First run

1. Create an account at `/login?mode=signup` with your admin email, then open `/admin/photographers` and add each photographer with the email they will use. This is the photographer whitelist: only these emails get the photographer dashboard.
2. `/admin/events`: create the graduation (slug, university, dates, advance, bank details), tick its photographers, set status to **Open for booking**.
3. Each photographer creates an account (or uses Google) with their whitelisted email, then adds packages, portfolio photos and availability in `/photographer`. They can join any event that is not closed themselves, or you can assign them in step 2.
4. Students create an account (name, phone, email, password) before booking. You approve payments in `/admin`. After the shoot the photographer marks it done and pastes a share link to the edited album (Google Drive, Dropbox…), the student pays the balance, you approve it (or click "Mark as paid in full"), and the album link appears on their booking page with an email.

A new university later is just a new event in `/admin/events`. No code changes.

## How the rules are enforced

- All database access happens in server code with the service-role key. The browser never talks to the tables, and row-level security is on with no public policies.
- Every server action checks the signed-in role and that the record belongs to that person.
- Slots are claimed with a single guarded update, so two students cannot take the same time. A database unique constraint backs this up.
- Payment proofs live in private storage and are only opened through short-lived signed links. Edited albums are not stored here: the photographer's share link is shown only to that booking's client, and only once they have paid in full.
- Photographers' real phone numbers are stored but never sent to the browser. Clients see the photographer's first name and a WhatsApp link to Fourmen with their booking reference.
- Uploads go straight from the browser to storage via one-time signed links, so large videos don't pass through the server.

## What changed from your original project

- `app/page.tsx` is now the new home page. Your original page moved to `app/photobooth/page.tsx` with the packages, event types and EmailJS booking form intact. Only the hero and nav were pulled out (the hero is now `components/HeroCarousel.tsx`).
- Added the shared nav (Services dropdown with "Soon" badges, mobile menu, sign in) and footer.
- Removed the Geist Google font import. Your CSS already used Arial/Helvetica, so the look is unchanged.
- Removed the dark-mode colour override in `globals.css`. The site is a light design.
- `middleware` is `proxy.ts` in this Next.js version.

## Not built yet

- Email notifications (for example "your booking was approved"). Resend is a good fit.
- A 30-minute hold timer. A time is claimed when the booking with payment proof is sent; if you reject the advance, the time is released automatically.
- Chat or masked calling between students and photographers. For now Fourmen coordinates over WhatsApp.
- Rules to delete old photos after a set period, and a Gallery page.
