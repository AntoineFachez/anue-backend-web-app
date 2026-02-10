# Anue Backend Web App

A Next.js 16 application for processing Excel/CSV files with advanced DataGrid capabilities.

## Features

- **Framework**: Next.js 16 (App Router)
- **UI Component Library**: Material UI (MUI) v7
- **DataGrid**: @mui/x-data-grid v8
- **File Processing**: `/processFile` route allows uploading `.xlsx` files and displaying them in a DataGrid.
- **Selection**:
  - Supports individual row selection.
  - **"Select All"**: Includes a custom implementation to handle "Select All" correctly for large datasets or paginated views, utilizing an "exclude" logic pattern.
- **Backend**: Firebase Functions (in `/functions` directory).

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
- `src/components/dataGrid`: Reusable `CustomDataGrid` component.
- `src/components/processFile`: File upload and processing logic.
- `functions`: Firebase Cloud Functions.

## Future Improvements

- write data schema for scraped data
- write logic to:
  - loop rows
  - foreach row: scrape html content
  - save scraped data to firebase
  - trigger cloud function to extract data from html content using Gemini
  - save extracted data to firebase
  - display extracted data in DataGrid
