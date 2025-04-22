Okay, this is a great project proposal! It clearly outlines the problem, the proposed solution, and the benefits. Let's create a detailed set of instructions for an AI agent to build the "MDM – Vattenflow" platform based on your brother's requirements.

The agent should assume the Next.js (App Router) project is already initialized, `pnpm` is the package manager, and Shadcn/ui is configured to install components into `components/ui/`. The `project_req.md` file (containing the text you provided) is in the project root.

---

**AI Agent Instructions: Building MDM – Vattenflow**

**Objective:** Develop a web application named "MDM – Vattenflow" to replace the current manual, email/Excel-based Master Data Management request process at Vattenfall Wind BU. The platform will allow Controllers to submit validated requests and track their status, while providing the MDM Team with an admin interface for management and processing.

**Core Technologies:**

1.  **Frontend:** Next.js 14+ (App Router), React, TypeScript
2.  **UI:** Shadcn/ui, Tailwind CSS
3.  **Backend/DB:** Firebase (Firestore for database, Firebase Authentication for user management)
4.  **State Management:** React Context API or Zustand (choose one, prefer Zustand for scalability if complexity grows)
5.  **Form Management:** `react-hook-form` with `zod` for validation (integrates well with Shadcn/ui)
6.  **Deployment:** (Assume Vercel for now, as mentioned in the proposal)
7.  **Future Potential (Keep in mind but don't implement initially unless specified):** GenAI/Vertex AI/Gemini 2.5 (e.g., for intelligent validation suggestions, data analysis, automated summaries - Phase 3+).

**Initial Setup Assumptions (Already Done):**

1.  Next.js project created using `create-next-app` with TypeScript and App Router.
2.  `pnpm` is used as the package manager.
3.  Shadcn/ui has been initialized (`pnpm dlx shadcn@latest init`). Components will be installed into `components/ui/`.
4.  A `project_req.md` file exists in the project root containing the project description.

**Development Environment Commands:**

- Always use `pnpm` for installing dependencies (e.g., `pnpm install`, `pnpm add package-name`).
- Install Shadcn components using `pnpm dlx shadcn@latest add component-name1 component-name2 ...`. Ensure they are installed in `components/ui/`.

**Phase 1: Prototype Build (Focus: Login + WBS Form + Tracker Dashboard)**

**Step 1: Firebase Setup**

1.  Create a new Firebase project in the Firebase console.
2.  Enable **Firestore Database**. Start in **Test mode** for initial development (REMEMBER to secure later).
3.  Enable **Firebase Authentication**. Add **Email/Password** as a sign-in method for now. _Note: Vattenfall SSO (likely SAML/OAuth) is the ultimate goal but requires specific Vattenfall integration. We'll simulate roles initially._
4.  Copy the Firebase configuration keys. Store them securely in environment variables (`.env.local`). Create corresponding public environment variables prefixed with `NEXT_PUBLIC_` for client-side access if needed.
5.  Initialize Firebase in the Next.js app. Create `lib/firebase/config.ts` (or similar) to initialize the Firebase app and export necessary instances (e.g., `auth`, `db`).

**Step 2: Data Modeling (Firestore)**

1.  Define Firestore collections:

    - `users`: (Optional, Firebase Auth handles users, but you might store app-specific roles or preferences here). Fields: `uid` (matches Auth UID), `email`, `displayName`, `role` (`'Controller'` | `'MDM'`).
    - `requests`: Main collection for MDM requests.
      - `id`: (string) Auto-generated Firestore ID.
      - `requesterId`: (string) Firebase Auth UID of the Controller who submitted.
      - `requesterEmail`: (string) Email of the Controller.
      - `requestType`: (string) Enum: `'WBS'`, `'PC'`, `'CC'`, `'Modify'`, `'Lock'`, `'Unlock'`.
      - `region`: (string) Enum: `'DE'`, `'NL'`, `'SE'`, `'DK'`, `'UK'`.
      - `status`: (string) Enum: `'Submitted'`, `'InProgress'`, `'PendingInfo'`, `'ForwardedToSD'`, `'Completed'`, `'Rejected'`.
      - `createdAt`: (Timestamp) Firestore timestamp.
      - `updatedAt`: (Timestamp) Firestore timestamp.
      - `submittedData`: (Map/Object) Contains the actual form data. Structure varies based on `requestType` and `region`. For WBS, it might include fields like `projectDefinition`, `responsibleCostCenter`, `applicant`, etc. For bulk WBS, this might be an array of objects.
      - `comments`: (Array of Maps) User-visible comments. Each map: `{ userId: string, userName: string, timestamp: Timestamp, text: string }`.
      - `internalComments`: (Array of Maps) MDM-visible comments. Same structure as `comments`.
      - `history`: (Array of Maps) Audit trail of status changes. Each map: `{ timestamp: Timestamp, status: string, changedByUserId: string, changedByUserName: string }`.

2.  Define TypeScript types/interfaces for these models in `types/`.

**Step 3: Authentication**

1.  Install necessary Shadcn components: `button`, `input`, `label`, `card`.
    ```bash
    pnpm dlx shadcn@latest add button input label card form
    ```
2.  Implement a simple login page (`app/(auth)/login/page.tsx`) using Firebase Email/Password authentication. Use `react-hook-form` for the login form.
3.  Use Firebase Auth SDK (`firebase/auth`) for sign-in (`signInWithEmailAndPassword`).
4.  Implement logic to redirect users upon successful login/logout.
5.  Create a mechanism to simulate roles (Controller/MDM). For now, this could be:
    - Manually adding a `role` field to the `users` collection in Firestore after a user signs up (or create a simple admin UI later to manage this).
    - OR using Firebase Auth Custom Claims (more robust, requires backend function or manual setup via Admin SDK). Start with the Firestore `role` field for simplicity.
6.  Protect routes using Layouts:
    - `app/(app)/layout.tsx`: Checks if a user is authenticated. If not, redirect to `/login`. Fetches user data (including role) and potentially makes it available via context or props.
    - `app/admin/layout.tsx`: Checks if the user is authenticated AND has the `'MDM'` role. If not, redirect or show an unauthorized message.

**Step 4: WBS Request Form (Controller)**

1.  Target Route: `/requests/new`
2.  Install Shadcn components: `select`, `input`, `textarea`, `button`, `form`, `label`, `radio-group`, `table`, `checkbox`.
    ```bash
    pnpm dlx shadcn@latest add select input textarea button form label radio-group table checkbox date-picker # Add others as needed based on specific WBS fields
    ```
3.  Create the form component (`components/forms/RequestForm.tsx` or similar).
4.  Use `react-hook-form` and `zod` for structure and validation.
5.  **Initial Fields:**
    - `Select` component for `requestType`. Initially, maybe only enable 'WBS'.
    - `Select` component for `region`.
6.  **Dynamic Fields:** Based on `requestType === 'WBS'` and the selected `region`, conditionally render the required input fields.
    - _Crucial:_ Analyze the provided Excel (`MDM WBS 20250317 DK - St. Georgen TG1.xlsm` structure - or ask for details if not available) to determine the exact fields needed for WBS per region (e.g., Project Definition, Cost Center, Dates, Descriptions). Mark fields as required/optional using `zod` schema based on region logic.
    - Use Shadcn `Input`, `Textarea`, `DatePicker`, `Checkbox`, etc., for these fields.
7.  **Submission Logic:**
    - On submit, validate the form using `react-hook-form`.
    - If valid, construct the `request` object (including `requesterId`, `requesterEmail`, `createdAt`, `status: 'Submitted'`, etc.).
    - Save the request object to the `requests` collection in Firestore using the Firebase SDK (`addDoc` or `setDoc`).
    - Provide user feedback (e.g., success message, redirect to dashboard). Handle errors gracefully.

**Step 5: Basic Controller Dashboard (View Own Requests)**

1.  Target Route: `/dashboard`
2.  Install Shadcn components: `table`, `badge`.
    ```bash
    pnpm dlx shadcn@latest add table badge card
    ```
3.  Fetch requests from Firestore where `requesterId` matches the currently logged-in user's UID. Use `onSnapshot` for real-time updates or a simple `getDocs` on page load.
4.  Display requests in a `Table` (`Shadcn Table` component). Columns: Request ID (partial), Type, Region, Status, Created Date.
5.  Use `Badge` component to display the `status` visually.
6.  Implement basic client-side sorting/filtering if needed initially.
7.  Link each row to a detail page (e.g., `/requests/[id]`) - _Implement detail page in next phase_.

**Step 6: Basic MDM Admin Dashboard (View All Requests)**

1.  Target Route: `/admin/dashboard` (Ensure protected by MDM role).
2.  Install Shadcn components: `table`, `badge`, `input`, `dropdown-menu`.
    ```bash
    pnpm dlx shadcn@latest add table badge input dropdown-menu button card # Potentially same as controller + filter/search elements
    ```
3.  Fetch _all_ requests from Firestore. Use `onSnapshot` or `getDocs`. Order by `createdAt` descending.
4.  Display requests in a `Table` similar to the Controller dashboard, but potentially with more columns (e.g., Requester Email).
5.  Implement basic filtering controls (e.g., `Input` for search by ID/email, `DropdownMenu` or `Select` to filter by Status, Type, Region).
6.  Link each row to an admin detail/edit page (e.g., `/admin/requests/[id]`) - _Implement detail page in next phase_.

**Phase 2: Build Out Features (Request Types, Bulk Entry, Export, Details)**

**Step 7: Request Detail View (Controller & MDM)**

1.  Create dynamic route pages: `app/(app)/requests/[id]/page.tsx` and `app/admin/requests/[id]/page.tsx`.
2.  Fetch the specific request data from Firestore using the `id` from the route parameters.
3.  Display all request details (including the full `submittedData` object, formatted nicely).
4.  Display `comments` and `history`.
5.  **Controller View:** Allow adding new comments (save to `comments` array in Firestore).
6.  **MDM View:**
    - Allow adding `internalComments`.
    - Allow changing the `status` (use Shadcn `Select`). When status changes, add an entry to the `history` array and update the `updatedAt` timestamp.
    - Use Firebase transactions or batched writes if multiple updates occur simultaneously (e.g., updating status and adding a history entry).

**Step 8: Expand Request Form (Other Types & Bulk WBS)**

1.  Update the `RequestForm` component and `zod` schema to handle all `requestType` values (`PC`, `CC`, `Modify`, `Lock`, `Unlock`).
2.  Implement the specific field logic and validation rules for each type and region combination. This requires detailed definitions for each form type (refer back to original Excel templates or ask for clarification).
3.  **Bulk WBS Input:**
    - When `requestType === 'WBS'`, provide an option or separate section for bulk input.
    - Use a `Table`-like structure where users can add/remove rows. Each row represents a WBS element with its relevant fields (use Shadcn `Input` within table cells).
    - Implement client-side state management to handle the array of WBS lines.
    - On submit, validate all rows. Store the bulk data appropriately within the `submittedData` field (e.g., as an array of objects).

**Step 9: Export Functionality**

1.  Install a CSV/Excel library: `pnpm add papaparse` (for CSV) or `pnpm add xlsx` (for Excel).
2.  **Controller Dashboard:** Add an "Export My History" button (Shadcn `Button`). On click, fetch the user's requests and generate a CSV file using the chosen library. Trigger a browser download.
3.  **MDM Admin Dashboard:**
    - Add an "Export Selected" / "Export All" button.
    - Allow filtering requests first.
    - On export, fetch the relevant request data.
    - Format the data into CSV/Excel, potentially matching the structure required by the Service Desks (SDs). This might require specific column ordering or naming.
    - Trigger the file download.

**Step 10: Admin Stats & Refinements**

1.  **Basic Stats:** On the MDM Admin Dashboard, display simple counts (e.g., Requests by Status, Requests by Type, Requests Today/Week). Calculate these client-side after fetching data, or use Firestore aggregation queries if performance becomes an issue.
2.  **UI Polish:** Improve loading states (use Shadcn `Skeleton`), error messages (use Shadcn `Alert` or `Toast`), and overall UX. Ensure responsiveness.
3.  **Code Quality:** Refactor reusable logic into custom hooks (`hooks/`). Ensure TypeScript types are used consistently. Add comments where necessary.

**Phase 3 and Beyond (Long-Term Vision Items - Not for initial build)**

- **Vattenfall SSO Integration:** Replace Firebase Email/Password with actual Vattenfall SSO (likely requires NextAuth.js or Clerk with a custom SAML/OAuth provider configuration, coordinating with Vattenfall IT).
- **Automated SAP Pulls:** Requires APIs or integration points with Vattenfall's SAP system (likely complex).
- **Prioritization/SLA:** Add fields to the `requests` model and logic in the UI/backend.
- **Full Audit Trail:** Enhance the `history` array or use dedicated Firestore logging.
- **BI Dashboards:** Integrate with tools like Looker Studio or Power BI, possibly using Firebase Functions to aggregate data or exporting data periodically.
- **GenAI/Vertex AI/Gemini:**
  - **Smart Suggestions:** Analyze `submittedData` for common errors or suggest corrections.
  - **Automated Summaries:** Generate weekly summaries for MDM team based on request data.
  - **Natural Language Queries:** Allow MDM users to search requests using natural language.

**Security Rules (Firestore - `firestore.rules`)**

- **Default Deny:** `allow read, write: if false;`
- **Users Collection:** Allow authenticated users to read/write their own user document (if used). Allow MDM users to read all user documents (for role lookup).
  ```firestore
  match /users/{userId} {
    allow read, update: if request.auth != null && request.auth.uid == userId;
    // Allow MDM users to read any user profile (for role checks)
    allow get: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'MDM';
  }
  ```
- **Requests Collection:**
  - Controllers can create requests.
  - Controllers can read/update (e.g., add comments) _their own_ requests.
  - MDM users can read _all_ requests.
  - MDM users can update _any_ request (status, internal comments).
  ```firestore
  match /requests/{requestId} {
    // Allow create if user is authenticated (assume Controller role for now, refine with role check)
    allow create: if request.auth != null;
    // Allow read if user is the requester OR user has MDM role
    allow get: if request.auth != null && (resource.data.requesterId == request.auth.uid || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'MDM');
    // Allow Controller to update (only add comments?) - Be specific!
    allow update: if request.auth != null && resource.data.requesterId == request.auth.uid // && only specific fields like comments can be changed by controller;
    // Allow MDM users to update status, internalComments etc.
    allow update: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'MDM';
    // Generally deny delete unless specifically required
    allow delete: if false;
  }
  ```
  - **Important:** Refine these rules carefully, especially the `update` rules, to prevent unauthorized modifications. Test thoroughly using the Firebase Rules Playground.

**Final Instructions for AI Agent:**

- Follow the phased approach outlined above.
- Prioritize the features listed in Phase 1 first.
- Use `pnpm` for all package operations.
- Install Shadcn components as needed using `pnpm dlx shadcn@latest add ...`.
- Implement robust error handling and loading states.
- Write clean, well-typed TypeScript code.
- Refer to `project_req.md` for context and business logic details.
- Start with basic Firebase Email/Password auth and simulate roles via Firestore document field initially. Plan for SSO integration later.
- Pay close attention to the dynamic form requirements based on `requestType` and `region`. Define the specific fields needed for WBS first, based on Excel analysis or further clarification.
- Implement Firestore security rules early and refine them as features are added.

---

This detailed plan should provide the AI agent with a clear roadmap to build the MDM – Vattenflow platform. Good luck with the project!
