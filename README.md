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
  - **Scrape & Extract**: Automated mechanisms to scrape HTML content from URLs and extract structured data using **Gemini**.
  - **Visualize**: View and refine extracted data directly within the DataGrid.
- **Robust Selection**: Custom "Select All" implementation for handling large datasets with inclusion/exclusion logic.
- **State Persistence**: Column visibility, width, and other view settings are persisted in `localStorage`.
- **File Management**: Integrated **Control Menu** for file operations (clear, download, scrape).
- **Cloud Integration**: Powered by Firebase Functions for scalable backend processing and storage.
- **Database Sync**: Seamless integration with Firestore to automatically load and save records via centralized hooks.

## AI Data Extraction Pipeline

The core of the application is its intelligent scraping and extraction engine:

1.  **Trigger**: Users select rows in the DataGrid and click "Scrape HTML Content".
2.  **Fetch**: The system attempts to fetch the raw HTML content of the target URL.
    - _Resilience_: If a 404 error occurs, the system flags this for the AI.
3.  **AI Processing (Gemini 1.5 Flash)**:
    - The raw HTML (or error context) is sent to Google's Gemini model.
    - **Fallback Search**: If the URL is invalid (404), Gemini uses its Google Search tool to find the correct, up-to-date program page.
    - **Extraction**: Gemini extracts structured data (JSON) including:
      - Start Dates & Deadlines (normalized to YYYY-MM-DD)
      - Tuple/Fees information
      - Program features (Language, Flags for Dual/Part-time)
4.  **Update**: The extracted data is automatically merged back into the DataGrid, updating columns and rows in real-time.

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

- [ ] Implement a "Live Database" tab
  - [ ] Connect AG Grid directly to Firestore (using `onSnapshot` or pagination) instead of relying solely on local CSV state
  - [ ] Introduce a `status` column (e.g., "Needs Scraping", "Up to Date", "Error", "Review Pending")
  - [ ] Add quick-filters to identify outdated records (e.g., `scraped_at` older than 6 months)

**Batch-Job Manager & Background Processing**

- [ ] Refactor scraping process to be fully asynchronous
  - [ ] Move the scraping loop from the client-side to a backend Task Queue / Cloud Task
  - [ ] Build a "Job Monitor" dashboard in the frontend
  - [ ] Display real-time progress bars (e.g., "150/5000 URLs processed") and error logs for batch jobs

**Human-in-the-Loop (HITL) & Validation UI**

- [ ] Create a Data Review workflow to prevent AI hallucinations in production
  - [ ] Build a Split-Screen / Diff Viewer modal for records pending review
  - [ ] Highlight changed, new, or missing values between old DB data and newly scraped AI data
  - [ ] Implement a manual "Approve & Save to DB" action for the admin
