# Anue Backend Web App

A powerful Next.js 16 application designed for intelligent data processing, combining bulk file uploads, web scraping, and AI-driven data extraction using Google's Gemini.

## Overview

The primary goal of this application is to streamline the workflow of extracting structured data from web sources. It provides a robust interface for uploading datasets (Excel/CSV), visualizing them in an advanced DataGrid, and processing rows through an automated pipeline that scrapes HTML content and leverages LLMs for precise data extraction.

## Key Features

- **Modern Architecture**: Built with Next.js 16 (App Router) for performance and scalability.
- **Advanced Data Management**: Utilize `@mui/x-data-grid` v8 for a spreadsheet-like experience.
  - **Global Search**: Instantly filter across all columns using the dedicated search bar.
  - **Enhanced Pagination**: Support for large datasets with configurable page sizes (up to 100 rows).
  - **Sorting & Filtering**: Built-in column sorting and complex filtering capabilities.
- **Bulk Processing Pipeline**:
  - **Ingest**: Upload and parse `.xlsx` files via the `/processFile` route.
  - **Smart ID Generation**: Automatically generates a unique "Smart ID" (`CITY-LEVEL-SUBJECT-INDEX`) for each record during parsing.
  - **Scrape & Extract**: Automated mechanisms to scrape HTML content from URLs and extract structured data using **Gemini**.
  - **Visualize**: View and refine extracted data directly within the DataGrid.
- **Robust Selection**: Custom "Select All" implementation for handling large datasets with inclusion/exclusion logic.
- **State Persistence**: Column visibility and width settings are persisted in `localStorage`.
- **File Management**: Ability to clear loaded data and reset the file input.
- **Cloud Integration**: Powered by Firebase Functions for scalable backend processing and storage.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the development server:

   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

- `src/app`: Next.js App Router pages and layouts.
- `src/components/dataGrid`: Reusable `CustomDataGrid` component with advanced features.
- `src/components/processFile`: File upload, parsing, and processing interface.
- `src/hooks`: Custom hooks for logic reuse (e.g., `useProcessFile`).
- `src/utils`: Utility functions (e.g., `smartIdGenerator`).
- `src/lib`: Shared resources and data (e.g., `geodata`).
- `functions`: Firebase Cloud Functions for backend logic (scraping, AI extraction).

## Smart ID Logic

The application generates a predictable "Smart ID" for each course record using the following format:
`CITY-LEVEL-SUBJECT-INDEX`

- **CITY**: Derived from the "Location" or "City" column. Mapped to UN/LOCODE or a 3-letter abbreviation (e.g., "Berlin" -> "BER").
- **LEVEL**: Derived from the "Degree" column. 'B' for Bachelor, 'M' for Master/Other.
- **SUBJECT**: Derived from the "Title" column.
  - 'CS': Computer Science, Data
  - 'BM': Business, Management, Finance, Communication
  - 'SW': Social Work, Pädagogik
  - 'HE': Health, Biomedical
  - 'GN': General (default)
- **INDEX**: The original row index from the source file.

## Future Improvements

- write data schema for scraped data
- write logic to:
  - loop rows
  - foreach row: scrape html content
  - save scraped data to firebase
  - trigger cloud function to extract data from html content using Gemini
  - save extracted data to firebase
  - display extracted data in DataGrid

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

    _Note: `FIREBASE_CREDS` might be needed if you are using specific server-side logic requiring admin privileges, otherwise `GEMINI_API_KEY` is the primary requirement for the AI features._

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
