# AI Certificate Verifier

An intelligent web application that uses Google's Gemini AI to analyze and verify the authenticity of certificate documents.

## Overview

This tool provides a robust solution for quickly assessing the legitimacy of certificates, diplomas, awards, and other official documents. Users can upload an image or a PDF of a certificate, and the AI will perform a detailed forensic analysis. It extracts key information, scrutinizes the document for signs of tampering, and provides a comprehensive report, including an authenticity score and a list of potential red flags.

## How It Works

The application operates through a seamless, three-step process powered by modern web technologies and the Gemini API:

1.  **File Upload (Client-Side):** The user uploads a certificate file (PNG, JPG, PDF, etc.) through the web interface. The frontend, built with HTML, CSS, and TypeScript, handles the file selection.

2.  **AI Analysis (Gemini API):**
    *   The selected file is converted into a base64-encoded string.
    *   This data is sent to the Google Gemini API (`gemini-2.5-flash` model) as part of a multimodal prompt.
    *   The prompt instructs the AI to act as a document verification specialist. It is also given a strict JSON schema to structure its response.
    *   Gemini analyzes the document's visual and textual elements for inconsistencies, pixelation, font mismatches, and other signs of forgery.

3.  **Display Results (Client-Side):**
    *   The Gemini API returns a structured JSON object containing the analysis.
    *   The frontend parses this JSON data and dynamically populates the UI with the findings, including the recipient's name, issuer, authenticity score, a summary, and a list of specific red flags.

## Key Features

*   **Multi-Format Support:** Accepts common image formats (JPEG, PNG) and PDF documents.
*   **Deep AI Analysis:** Leverages the Gemini model's advanced multimodal capabilities for in-depth document scrutiny.
*   **Structured Output:** Extracts key information like recipient name, certificate title, issuer, and issue date.
*   **Authenticity Score:** Provides a confidence score (0-100) on the document's authenticity, with a clear visual representation.
*   **Red Flag Detection:** Identifies and lists specific potential signs of forgery (e.g., "Inconsistent font usage," "Pixelation around the signature").
*   **Responsive UI:** A clean, modern, and fully responsive user interface that works seamlessly on desktop and mobile devices.
*   **User-Friendly:** Simple drag-and-drop functionality and a clear, step-by-step process.

## How to Use

1.  **Open the Webpage:** Launch the `index.html` file in your web browser.
2.  **Upload Document:** Drag and drop your certificate image or PDF into the designated area, or click to select a file from your device.
3.  **Analyze:** Once the file is selected, click the "Analyze Document" button.
4.  **Review Results:** Wait for the AI analysis to complete. The results will be displayed on the screen, detailing the extracted information and the authenticity assessment.
5.  **Verify Another:** Click the "Verify Another Document" button to reset the interface and start a new analysis.