# Anue Backend Web App

A specialized backend CMS interface designed to ingest, visualize, and autonomously enrich university course data using AI.

## Core Workflow & Features

1. **Data Ingestion & Management**: Upload `.xlsx` files to populate a high-performance, real-time DataGrid with built-in filtering, global search, and state persistence.
2. **Smart ID Generation**: Automatically assigns standardized, unique identifiers to incoming course records based on location, level, and subject.
3. **AI Extraction Pipeline (Gemini 2.5 Flash)**:
   - Select pending rows to trigger an asynchronous background Cloud Function.
   - The AI fetches the university URL, uses Google Search tool fallbacks for missing/404 pages, and extracts structured JSON data (fees, deadlines, requirements).
4. **Live Firestore Sync**: The frontend UI listens to database changes via `onSnapshot`, updating the DataGrid in real-time as background scraping jobs complete.

## Tech Stack

- **Frontend**: Next.js (App Router), MUI DataGrid
- **Backend**: Firebase Cloud Functions (Gen 2), Firestore
- **AI Integration**: Google Generative AI SDK (Gemini 2.5 Flash)

## Setup & Deployment

**1. Environment Variables & Secrets**
Ensure the Google Cloud Secret Manager API is enabled. Set the following secrets via the Firebase CLI:

```bash
firebase functions:secrets:set GEMINI_API_KEY
firebase functions:secrets:set FIREBASE_CREDS
2. Deployment Install Firebase tools, authenticate, and deploy:

Bash
npm install -g firebase-tools
firebase login
firebase use --add  # Select your project
firebase deploy
Roadmap
Human-in-the-Loop (HITL) & Validation UI

[ ] Create a Data Review workflow to prevent AI hallucinations in production.

[ ] Build a Split-Screen / Diff Viewer modal for records pending review.

[ ] Highlight changed, new, or missing values between old DB data and newly scraped AI data.

[ ] Implement a manual "Approve & Save to DB" action for the admin.
```
