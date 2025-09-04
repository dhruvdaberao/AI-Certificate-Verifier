import { GoogleGenAI, Type } from "@google/genai";
import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker to render PDFs
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.worker.min.mjs';


const App = () => {
    // --- DOM Elements ---
    const dropZone = document.getElementById('drop-zone') as HTMLDivElement;
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    const imagePreview = document.getElementById('image-preview') as HTMLImageElement;
    const pdfCanvas = document.getElementById('pdf-canvas') as HTMLCanvasElement;
    const verifyButton = document.getElementById('verify-button') as HTMLButtonElement;
    const resultSection = document.getElementById('result-section') as HTMLElement;
    const loader = document.getElementById('loader') as HTMLDivElement;
    const loaderText = document.getElementById('loader-text') as HTMLParagraphElement;
    const resultContent = document.getElementById('result-content') as HTMLDivElement;
    const errorMessage = document.getElementById('error-message') as HTMLDivElement;
    const fileInfoDiv = document.getElementById('file-info') as HTMLDivElement;
    const fileNameSpan = document.getElementById('file-name') as HTMLSpanElement;
    const resetButton = document.getElementById('reset-button') as HTMLButtonElement;
    const verifyAnotherButton = document.getElementById('verify-another-button') as HTMLButtonElement;

    // --- Result fields ---
    const resultName = document.getElementById('result-name') as HTMLSpanElement;
    const resultCertName = document.getElementById('result-cert-name') as HTMLSpanElement;
    const resultIssuer = document.getElementById('result-issuer') as HTMLSpanElement;
    const resultDate = document.getElementById('result-date') as HTMLSpanElement;
    const resultScore = document.getElementById('result-score') as HTMLSpanElement;
    const scoreBar = document.getElementById('score-bar') as HTMLDivElement;
    const scoreText = document.getElementById('score-text') as HTMLSpanElement;
    const resultAnalysis = document.getElementById('result-analysis') as HTMLParagraphElement;
    const redFlagsContainer = document.getElementById('red-flags-container') as HTMLDivElement;
    const redFlagsList = document.getElementById('red-flags-list') as HTMLUListElement;

    // --- State and Config ---
    let currentFile: File | null = null;
    let loaderInterval: number | null = null;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const loadingMessages = [
        "Initializing analysis...",
        "Scanning document layout...",
        "Checking for font inconsistencies...",
        "Verifying signatures and logos...",
        "Assessing text alignment...",
        "Finalizing authenticity score...",
    ];

    // --- File Handling ---
    const renderPdfPreview = async (file: File) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const pdf = await pdfjsLib.getDocument({ data }).promise;
                const page = await pdf.getPage(1); // Get the first page

                const viewport = page.getViewport({ scale: 1 });
                const scaleX = dropZone.clientWidth / viewport.width;
                const scaleY = dropZone.clientHeight / viewport.height;
                const scale = Math.min(scaleX, scaleY, 1.5); // Cap scale to 1.5
                
                const scaledViewport = page.getViewport({ scale });

                const context = pdfCanvas.getContext('2d')!;
                pdfCanvas.height = scaledViewport.height;
                pdfCanvas.width = scaledViewport.width;

                const renderContext = {
                    canvasContext: context,
                    viewport: scaledViewport
                };
                await page.render(renderContext).promise;
                pdfCanvas.style.display = 'block';

            } catch (error) {
                 console.error('Error rendering PDF preview:', error);
                 displayError('Could not display the PDF preview.');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleFileSelect = (file: File | null) => {
        if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
            currentFile = file;
            
            dropZone.classList.add('has-file');
            fileNameSpan.textContent = file.name;
            fileInfoDiv.style.display = 'flex';
            verifyButton.disabled = false;
            imagePreview.style.display = 'none';
            pdfCanvas.style.display = 'none';

            if (file.type.startsWith('image/')) {
                 const reader = new FileReader();
                 reader.onload = (e) => {
                     imagePreview.src = e.target?.result as string;
                     imagePreview.style.display = 'block';
                 };
                 reader.readAsDataURL(file);
            } else { // It's a PDF
                renderPdfPreview(file);
            }
        } else {
            displayError('Please select a valid image or PDF file.');
            resetState();
        }
    };

    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => handleFileSelect(fileInput.files?.[0] || null));
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'), false);
    });

    dropZone.addEventListener('drop', (e) => {
        handleFileSelect(e.dataTransfer?.files[0] || null);
    }, false);

    // --- API and UI Logic ---

    const fileToGenerativePart = async (file: File) => {
      const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });
      return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
      };
    };
    
    const displayError = (message: string) => {
        errorMessage.textContent = message;
        errorMessage.hidden = false;
        loader.style.display = 'none';
        resultContent.hidden = true;
    };

    const startLoaderAnimation = () => {
        let messageIndex = 0;
        loaderText.textContent = loadingMessages[messageIndex];
        loaderInterval = window.setInterval(() => {
            messageIndex = (messageIndex + 1) % loadingMessages.length;
            loaderText.textContent = loadingMessages[messageIndex];
        }, 2000);
    };

    const stopLoaderAnimation = () => {
        if (loaderInterval) {
            clearInterval(loaderInterval);
            loaderInterval = null;
        }
    };
    
    const resetState = () => {
        currentFile = null;
        fileInput.value = '';
        imagePreview.src = '';
        imagePreview.style.display = 'none';
        // Clear and hide canvas
        const context = pdfCanvas.getContext('2d');
        if (context) {
            context.clearRect(0, 0, pdfCanvas.width, pdfCanvas.height);
        }
        pdfCanvas.style.display = 'none';

        dropZone.classList.remove('has-file');
        verifyButton.disabled = true;
        resultSection.hidden = true;
        errorMessage.hidden = true;
        resultContent.hidden = true;
        fileInfoDiv.style.display = 'none';
        redFlagsList.innerHTML = '';
        redFlagsContainer.hidden = true;
    };

    const updateScoreUI = (score: number) => {
        resultScore.textContent = `${score}%`;
        scoreBar.style.width = `${score}%`;
        scoreText.className = 'score-text'; // Reset classes

        if (score >= 85) {
            scoreBar.style.backgroundColor = 'var(--success-color)';
            scoreText.textContent = 'High Confidence';
            scoreText.classList.add('high');
        } else if (score >= 60) {
            scoreBar.style.backgroundColor = 'var(--warning-color)';
            scoreText.textContent = 'Medium Confidence';
            scoreText.classList.add('medium');
        } else {
            scoreBar.style.backgroundColor = 'var(--danger-color)';
            scoreText.textContent = 'Low Confidence';
            scoreText.classList.add('low');
        }
    };

    const handleVerify = async () => {
        if (!currentFile) return;

        resultSection.hidden = false;
        loader.style.display = 'block';
        resultContent.hidden = true;
        errorMessage.hidden = true;
        verifyButton.disabled = true;
        startLoaderAnimation();

        try {
            const documentPart = await fileToGenerativePart(currentFile);
            const prompt = `You are a world-class digital forensics expert specializing in document verification. Your analysis should be meticulous and reflect the latest techniques in forgery detection as of August 2025. Analyze this certificate document in detail.
1.  **Extract Key Information**: Identify the recipient's full name, the exact name of the certificate/award, the full name of the issuing authority, and the date of issue. If any information is missing, state "Not Found".
2.  **Forensic Forgery Analysis**: Scrutinize the document for common and advanced signs of digital tampering or forgery. This includes, but is not limited to: inconsistent fonts or font weights, pixelation around text or logos, unnatural compression artifacts, misaligned elements, spelling or grammatical errors, unusual signatures, and inconsistencies in metadata (if discernible).
3.  **Report Findings**: List any specific red flags found. Provide a concise summary of your assessment and reasoning for the final score. Assign a confidence score from 0 (definitely fake) to 100 (highly likely authentic).
Respond ONLY in the specified JSON format.`;

            const schema = {
                type: Type.OBJECT,
                properties: {
                    personName: { type: Type.STRING, description: "Full name of the certificate recipient." },
                    certificateName: { type: Type.STRING, description: "The official name of the certificate or award." },
                    issuingAuthority: { type: Type.STRING, description: "The organization that issued the certificate." },
                    dateOfIssue: { type: Type.STRING, description: "The date the certificate was issued." },
                    confidenceScore: { type: Type.INTEGER, description: "A score from 0 to 100 on authenticity." },
                    redFlags: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "List of specific signs of forgery found."
                    },
                    authenticityAnalysis: { type: Type.STRING, description: "Summary of the analysis and reasoning for the score." },
                },
            };

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: { parts: [documentPart, { text: prompt }] },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                },
            });
            
            const result = JSON.parse(response.text);

            resultName.textContent = result.personName || 'N/A';
            resultCertName.textContent = result.certificateName || 'N/A';
            resultIssuer.textContent = result.issuingAuthority || 'N/A';
            resultDate.textContent = result.dateOfIssue || 'N/A';
            resultAnalysis.textContent = result.authenticityAnalysis || 'No analysis provided.';
            updateScoreUI(result.confidenceScore || 0);

            redFlagsList.innerHTML = '';
            if (result.redFlags && result.redFlags.length > 0) {
                result.redFlags.forEach((flag: string) => {
                    const li = document.createElement('li');
                    li.textContent = flag;
                    redFlagsList.appendChild(li);
                });
                redFlagsContainer.hidden = false;
            } else {
                 redFlagsContainer.hidden = true;
            }

            loader.style.display = 'none';
            resultContent.hidden = false;

        } catch (error) {
            console.error("Error verifying certificate:", error);
            displayError('Failed to analyze the document. The file may be unclear or an API error occurred. Please try again.');
        } finally {
            verifyButton.disabled = false;
            stopLoaderAnimation();
        }
    };
    
    resetButton.addEventListener('click', resetState);
    verifyAnotherButton.addEventListener('click', resetState);
    verifyButton.addEventListener('click', handleVerify);
};

App();