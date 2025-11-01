
# Claude Coding Prompt — High-Level Spec (Flows & Features Only)
**Project:** Telegram Gold Set Bot (Telegraf + TypeScript) — _high-level requirements; keep it framework-ready but avoid low-level DB/app design._

## Objective
Build a Telegram bot that lets **admins** prepare gold-set posts (one or more photos as an album) with **weight (grams)** and a **caption**, preview them with control buttons, and then publish to a configured **channel**. Public viewers can tap **Price Now** to see a popup showing calculated price based on **spot gold price per gram** fetched from an external API with **simple caching**. A subset of users labeled as **collaborators** see an additional **collaborator price** in the popup. The bot also supports a `/hamkar` command to create deep links that register collaborators when they press Start.

> Focus on user-facing behavior, command surface, button callbacks, and flow logic. Keep it high-level, production-leaning, and unambiguous. Do not include DB schema or internal architecture details.

---

## Roles
- **Admin**
  - Interacts with the bot in **private**.
  - Can assemble a **photo album** (media group) for a gold set.
  - Provides **weight (g)** and **caption**.
  - Receives a **preview** with control buttons.
  - Finalizes to publish the album to the target **channel**.
  - Can generate collaborator invite links via `/hamkar`.
  - Can configure target channel, discount %, and basic price cache TTL via commands.
- **Public Viewer (Channel)**
  - Sees published album posts with caption.
  - Taps **Price Now** to get a popup with current pricing.
- **Collaborator**
  - Registers by using a deep link produced by `/hamkar` and pressing **Start**.
  - Sees an extra **Collaborator Price** line in the price popup.

---

## Core Features (High-Level)
1) **Album Handling**
   - Admin can send **one or more photos** of the same set in private chat.
   - Treat consecutive photos as an **album**. If Telegram provides `media_group_id`, group by that; otherwise buffer images briefly to form an album.
   - **Caption applies to the first photo** only. Emojis allowed.
   - Bot **appends a 👍 emoji** to the end of the provided caption automatically.

2) **Weight & Caption Capture**
   - If weight is missing, bot asks: “Please send the weight (in grams).”
   - Validate weight as a positive decimal.
   - After receiving the caption, append 👍 and proceed to preview.

3) **Admin Preview (Private)**
   - Show the **exact album + caption** as it will appear.
   - Attach **three inline buttons** under the first media message in preview:
     - **Price Now** — compute using cached spot price; show popup.
     - **Finalize** — publish to channel.
     - **Cancel** — delete preview and discard draft.

4) **Publishing to Channel**
   - On **Finalize**, post the album to the configured channel.
   - Ensure caption is only on the first photo; keep it identical to preview (including 👍).
   - Under the **first** message of the album in the channel, attach a single inline button: **Price Now**.

5) **Price Now Popup (Channel)**
   - Compute total price using custom formula (see TODOs below for normal and collaborator formulas).
   - Price source: **external API** with **simple TTL caching** (e.g., ~2 minutes). If cache is fresh, use it; if stale, refresh; on API failure, gracefully fall back to last usable value or show a friendly error.
   - **Log every price check**: Store user ID, post ID, and timestamp in database table for analytics.
   - Display a popup (**show_alert**) with:
     - Localized date/time (Europe/Zurich)
     - Weight (g), Spot price (/g), **Total**
     - If user is a **collaborator**, also show **Collaborator Price** computed using collaborator formula.

6) **Collaborator Registration via Deep Link**
   - Admin runs `/hamkar` in private → bot returns a deep link `https://t.me/<bot>?start=collab-<token>`.
   - Invitee opens link, presses **Start** → bot recognizes `collab-<token>` and registers them as a collaborator (one-time token; may expire).
   - From then on, that user sees **Collaborator Price** in popups.

6b) **Admin Registration via Deep Link**
   - Admin runs `/addadmin` in private → bot returns a one-time deep link `https://t.me/<bot>?start=admin-<token>`.
   - Invitee opens link, presses **Start** → bot recognizes `admin-<token>` and registers them as an admin for the channel.
   - The token is valid for **one use only** and expires after first use.
   - New admin can now create and publish gold set albums to the channel.

7) **Commands (Surface)**
   - `/start` — standard; also parse deep links like `collab-<token>` and `admin-<token>`.
   - `/hamkar` — admin-only; creates a collaborator invite link.
   - `/setchannel` — admin-only; instructs user to "Add me to the channel as admin and forward me a message from the channel". Upon receiving the first forwarded message, the bot stores the channel ID and registers the user as an admin for that channel.
   - `/addadmin` — admin-only; creates a one-time deep link `https://t.me/<bot>?start=admin-<token>` that registers a new admin when clicked and Start is pressed. The token works only once.
   - (Optional) `/help` — show concise usage guide for admins.

8) **Validation & UX Notes**
   - Limit album size to Telegram’s standard (10 images). If exceeded, provide a clear error.
   - Guard admin-only actions; deny non-admins.
   - On **Cancel**, remove the preview and confirm cancellation.
   - Prevent double-finalize (ignore subsequent taps once published).
   - Respect Telegram limitations (e.g., inline keyboard cannot be attached directly with `sendMediaGroup` — ensure the button is attached to the **first** media message after posting).

9) **Internationalization/Formatting**
   - English text is fine; keep strings centralized for easy future i18n.
   - Format currency with thousands separators and 2 decimals.
   - Show timestamps localized to **Europe/Zurich**.

10) **Operational Notes**
   - Ensure the bot is an **admin** in the target channel with rights to post and edit messages.
   - Handle API outages gracefully (friendly messages; fall back to last good price if recent, else inform temporarily unavailable).
   - Minimal logging; no secrets in logs.

---

## Non-Goals (Out of Scope for Now)
- Database schema, repository layer details, or migration files.
- Low-level architecture diagrams or class structures.
- Advanced analytics, dashboards, or multi-currency support.
- Complex rate limiting or anti-flood beyond basic debouncing.

---

## Acceptance Criteria (Behavioral)
- Admin can create an album (1–10 photos), set valid **weight** and **caption** (with 👍 auto-appended), and see an accurate **private preview** with **Price Now / Finalize / Cancel**.
- On **Finalize**, the **exact album & caption** is published to the target channel; the **first message** carries a **Price Now** button.
- Pressing **Price Now** in channel shows a **popup** with localized time, weight, spot price per gram, and **Total**; collaborators also see **Collaborator Price**.
- `/hamkar` deep link correctly registers collaborators on **Start**; their popups persistently include collaborator pricing.
- Admin-only commands reject non-admins; **Cancel** reliably removes preview and abandons the draft; double-finalize is ignored.
- Price fetching uses **TTL caching** and handles API failure with a clear message or last-known value when appropriate.

---

## Implementation Guidance (Keep High-Level)
- Use **Telegraf** for bot interactions and inline keyboards.
- Use **sendMediaGroup** for both preview (private) and publish (channel) flows; attach/edit inline keyboard on the **first** message after sending.
- Keep TTL values configurable via environment variables.
- Abstract the **price provider** behind a simple interface that supports TTL caching and a graceful fallback path.

---

## Daily Analytics Report (Cron Job)
- **Schedule**: Every day at 00:00 (midnight, Europe/Zurich timezone)
- **Action**: Query the database for price check logs from the previous 24 hours
- **Report Content**: Generate a list of **top most-viewed gold sets** with:
  - Gold set title/caption
  - Number of views (price checks)
  - Link to the channel post
- **Delivery**: Send the report to all admins via private message

---

## TODOs (In Progress - To Be Updated)

### TODO: Normal User Price Formula
**Status**: 🚧 In Progress
**Description**: Define the exact formula for calculating the price shown to normal (non-collaborator) users.
**Placeholder**: `[FORMULA TO BE DEFINED]`

### TODO: Collaborator (Hamkar) Price Formula
**Status**: 🚧 In Progress
**Description**: Define the exact formula for calculating the discounted price shown to collaborators.
**Placeholder**: `[FORMULA TO BE DEFINED]`

### TODO: Future Enhancements
**Status**: 📋 Planned
**Description**: Additional features and improvements to be added in future iterations.
**Items**:
- Multi-currency support
- Advanced analytics dashboard
- Customizable report templates
- Rate limiting and anti-spam measures
