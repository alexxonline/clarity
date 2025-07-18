---

### 🧠 **Prompt for a Coding Agent: Preact File Upload & Transcript Viewer SPA (Frontend Only with Mocks)**

You're tasked with building a **frontend-only** Single Page Application (SPA) using **Preact** and **Vite**. The goal is to simulate a simple application for uploading audio/video files and viewing a transcript for each file. The app should use **mocked data**, with client-side routing and clean, modifiable code structure.

---

### ✅ **Requirements**

#### 1. **Tech Stack**

* Use **Preact** with **Vite**
* Implement **client-side routing** (e.g., using `preact-router`)
* Custom CSS (no external CSS frameworks)
* Blue color scheme, white background
* Use the "front" folder for all frontend code

#### 2. **File Upload Page**

* Provide a **drag-and-drop area** for uploading a **single file**
* Accept **only audio/video files** with extensions: `.mp3`, `.mp4`, `.aac`, `.wav`
* Include a **fallback "Browse" button**
* Show **upload progress bar** and **file name** during upload
* Once upload is complete, **navigate to a transcript screen** for the uploaded file

#### 3. **Transcript Page**

* Show **speaker-labeled** paragraph blocks (mocked content)

  * If no speaker labels are present, default to **single speaker format**
* Simulate a **simple loading state** (e.g., "Loading transcript…") before displaying transcript (no delay required)
* Each uploaded file should have its own **dedicated transcript screen** accessible via client-side routing
* Mock the transcript with **randomly generated text** (no need to fetch from a file or API)

#### 4. **Routing Behavior**

* Use clean URL paths (e.g., `/upload`, `/transcript/:fileId`)
* Ensure navigation works with browser back/forward buttons

#### 5. **Project Structure & Packaging**

* Use **Vite + Preact** setup
* Include:

  * `npm run dev` for local development
  * `npm run build` for production build
  * `npm run preview` for previewing the build output
* Organize code in a **well-structured and modular way**, separating components, views, and styles
* Add a **README.md** with clear instructions to:

  * Install dependencies
  * Run the app locally
  * Build and preview the production version

---

### 📦 **Deliverables**

* Full source code in a Git-compatible folder structure
* `README.md` with usage instructions
* Mock data generator for transcripts
* Clean, modern UI styled with **custom CSS**

---
