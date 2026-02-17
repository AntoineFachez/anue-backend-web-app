# Anue Backend Web App

A powerful Next.js 16 application designed for intelligent data processing, combining bulk file uploads, web scraping, and AI-driven data extraction using Google's Gemini.

## Overview

The primary goal of this application is to streamline the workflow of extracting structured data from web sources. It provides a robust interface for uploading datasets (Excel/CSV), visualizing them in an advanced DataGrid, and processing rows through an automated pipeline that scrapes HTML content and leverages LLMs for precise data extraction.

## Key Features

- **Modern Architecture**: Built with Next.js 16 (App Router) for performance and scalability.
- **Advanced Data Management**: Utilize `@mui/x-data-grid` v8 for a spreadsheet-like experience with sorting, filtering, and pagination.
- **Bulk Processing Pipeline**:
  - **Ingest**: Upload and parse `.xlsx` files via the `/processFile` route.
  - **Scrape & Extract**: Automated mechanisms to scrape HTML content from URLs and extract structured data using **Gemini**.
  - **Visualize**: View and refine extracted data directly within the DataGrid.
- **Robust Selection**: Custom "Select All" implementation for handling large datasets with inclusion/exclusion logic.
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
- `functions`: Firebase Cloud Functions for backend logic (scraping, AI extraction).

## Future Improvements

- write data schema for scraped data
- write logic to:
  - loop rows
  - foreach row: scrape html content
  - save scraped data to firebase
  - trigger cloud function to extract data from html content using Gemini
  - save extracted data to firebase
  - display extracted data in DataGrid
