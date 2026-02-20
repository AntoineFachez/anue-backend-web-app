# anue-backend-web-app

## Overview

A specialized backend interface for:

1.  **Ingesting** Excel files (`.xlsx`) containing university course data.
2.  **Visualizing** data in a high-performance DataGrid.
3.  **Enhancing** data by scraping detailed course information (fees, deadlines, requirements) from university websites using **AI (Gemini)**.
4.  **Managing** the data cleaning process before persistence.

## Project Structure

- `src/app`: Next.js App Router pages and layouts.
- `src/components/dataGrid`: Reusable `CustomDataGrid` component, with decoupled subcomponents (`CustomHeader`, `CustomFooter`), sticky columns, density settings, and custom styling.
- `src/components/processFile`: File process UI, including `FileUpload` and the control `Menu`.
- `src/hooks`: Custom hooks like `useDataStore` for centralized state management, filtering, and DB synchronization.
- `src/utils`: Utility functions (e.g., `smartIdGenerator`).
- `functions`: Firebase Cloud Functions (Gen 2).
  - `triggers`: Event-driven and callable functions (e.g., `callableScraper`).
  - `services`: Business logic and external service integrations (e.g., `scraperService`).
  - `api`: Express app defining direct API endpoints.

## Key Features

- **Advanced DataGrid**:
  - **Global Search**: Instantly filter across all columns using the dedicated search bar.
  - **Enhanced Pagination**: Support for large datasets with configurable page sizes (up to 100 rows).
  - **Sorting & Filtering**: Built-in column sorting and complex filtering capabilities.
  - **Sticky Columns**: Key columns (like selection checkboxes) remain visible while scrolling horizontally.
  - **Density & View Settings**: Adjustable row height (density) and togglable column visibility (e.g., description column).
- **Bulk Processing Pipeline**:
  - **Ingest**: Upload and parse `.xlsx` files via the `/processFile` route.
  - **Smart ID Generation**: Automatically generates a unique "Smart ID" (`CITY-LEVEL-SUBJECT-INDEX`) for each record during parsing.
  - **Background Async Scraping**: Scraping runs completely in the background via Firebase Triggers, preventing client-side timeouts and allowing bulk queues.
  - **Duplication & Re-scrape Guards**: The system alerts users if selected rows have already been enriched, giving the choice to skip or force a re-scrape.
- **Robust Selection**: Custom "Select All" implementation for handling large datasets with inclusion/exclusion logic.
- **State Persistence**: Column visibility, width, and other view settings are persisted in `localStorage`.
- **File Management**: Integrated **Control Menu** for file operations (clear, download, scrape).
- **Live Database Sync**: Complete integration with Firestore using `onSnapshot` listeners. The DataGrid auto-updates in real time as the backend processes background scraped jobs, complete with pulsing row animations and loading spinners.

## AI Data Extraction Pipeline

The core of the application is its intelligent, asynchronous scraping and extraction engine:

1.  **Trigger**: Users select rows in the DataGrid and click "Scrape HTML Content". The frontend marks these documents in Firestore as `PENDING_SCRAPE`.
2.  **Async Orchestration**: A Firebase **Gen 2 Cloud Function** (`asyncScrapeContent`) listens for this status change. It runs heavily concurrent background processes without tying up the user's browser.
3.  **Fetch & Fallback**: The system attempts to fetch the raw HTML content. If a 404 occurs, it flags this for the AI.
4.  **AI Processing (Gemini 2.5 Flash)**:
    - The raw HTML (or error context) is sent to Google's Gemini model.
    - **Search Tooling**: If the URL is invalid or info is missing, Gemini uses Google Search to find the correct, up-to-date program page.
    - **Extraction**: Gemini extracts structured data (JSON) including Dates, Tuitions, and Requirements.
5.  **Live Real-time Update**: The backend updates the Firestore document with `COMPLETED` and the exact data. The DataGrid on the frontend automatically merges this update live for the user seamlessly.

## Smart ID Logic

The `generateSmartID` utility creates readable identifiers using the logic:
`CITY_CODE` - `LEVEL` - `SUBJECT` - `ORIGINAL_ID`

- **CITY_CODE**: UN/LOCODE or 3-letter prefix (e.g., 'FRA' for Frankfurt).
- **LEVEL**: 'B' (Bachelor) or 'M' (Master).
- **SUBJECT**: derived from title keywords:
  - 'CS': Computer/Data
  - 'BM': Business/Management
  - 'SW': Social Work
  - 'HE': Health
  - 'GN': General (default)
- **INDEX**: The original row index from the source file.

## Configuration

### Environment Variables & Secrets

The application uses Firebase Cloud Functions which require specific secrets to be set in the Google Cloud environment.

1.  **Enable Secret Manager API**:
    Ensure the [Secret Manager API](https://console.cloud.google.com/marketplace/product/google/secretmanager.googleapis.com) is enabled for your project.

2.  **Set Secrets**:
    Use the Firebase CLI to set the required secrets:

    ```bash
    firebase functions:secrets:set GEMINI_API_KEY
    # Paste your Google Gemini API Key
    ```

    ```bash
    firebase functions:secrets:set FIREBASE_CREDS
    # Paste your Firebase Service Account Credentials (JSON minified or path)
    ```

## Deployment

To deploy the application to Firebase, follow these steps:

1.  **Install Firebase Tools**:

    ```bash
    npm install -g firebase-tools
    ```

2.  **Login to Firebase**:

    ```bash
    firebase login
    ```

3.  **Initialize/Select Project**:

    ```bash
    firebase use --add
    ```

4.  **Deploy**:
    ```bash
    firebase deploy
    ```

## Future Improvements

**Data Scraping & Extraction (Core Engine)**

- [x] write data schema for scraped data
- write logic to:
  - [x] loop rows
  - [x] foreach row: scrape html content
  - [x] save scraped data to firebase
  - [x] trigger cloud function to extract data from html content using Gemini
  - [x] save extracted data to firebase
  - [x] display extracted data in DataGrid

**Live Database Management (CMS Features)**

- [x] Implement a "Live Database" tab
  - [x] Connect AG Grid directly to Firestore (using `onSnapshot` or pagination) instead of relying solely on local CSV state
  - [x] Introduce a `status` column (e.g., "Needs Scraping", "Up to Date", "Error", "Review Pending")
  - [x] Add visual indicators (loading spinners, pulsating highlight) for active database records

**Batch-Job Manager & Background Processing**

- [x] Refactor scraping process to be fully asynchronous
  - [x] Move the scraping loop from the client-side to a backend Cloud Function Trigger
  - [x] Handle rate-limiting (e.g. `maxInstances: 5`)
  - [x] Display real-time progress via Firestore syncing

**Human-in-the-Loop (HITL) & Validation UI**

- [ ] Create a Data Review workflow to prevent AI hallucinations in production
  - [ ] Build a Split-Screen / Diff Viewer modal for records pending review
  - [ ] Highlight changed, new, or missing values between old DB data and newly scraped AI data
  - [ ] Implement a manual "Approve & Save to DB" action for the admin
