# AI Image Generator

This project uses Next.js for the frontend and Python (FastAPI) for the backend to generate images using AI. It leverages the Groq API to enhance prompts and generate high-quality images.

## Project Structure

- `app/`: Next.js frontend
- `backend/`: Python FastAPI backend

## Features

- **AI-Powered Image Generation**: Create images from text descriptions
- **Prompt Enhancement**: Uses Groq's LLM to enhance your prompts for better results
- **Auto-Generated Negative Prompts**: Automatically creates negative prompts based on your input
- **Editable Negative Prompts**: You can edit or regenerate the negative prompts
- **Image Download**: Save your generated images locally
- **Responsive Design**: Works on desktop and mobile devices

## Setup Instructions

### Important: Both Frontend and Backend Must Be Running

This application requires both the frontend and backend to be running simultaneously:

1. The frontend (Next.js) serves the user interface
2. The backend (Python/FastAPI) handles image generation

### Backend (Python) - Start This First

1. Navigate to the backend directory:
   \`\`\`bash
   cd backend
   \`\`\`

2. Create a virtual environment:
   \`\`\`bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   \`\`\`

3. Install dependencies:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

4. Set the GROQ_API_KEY environment variable:
   \`\`\`bash
   # On Linux/Mac:
   export GROQ_API_KEY=your_groq_api_key
   
   # On Windows:
   set GROQ_API_KEY=your_groq_api_key
   \`\`\`

5. Run the server:
   \`\`\`bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   \`\`\`

6. Verify the backend is running by visiting http://localhost:8000/health in your browser. You should see: \`{"status":"healthy"}\`

### Frontend (Next.js) - Start This After Backend

1. Open a new terminal window (keep the backend running)

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Create a `.env.local` file with:
   \`\`\`
   NEXT_PUBLIC_API_URL=http://localhost:8000
   \`\`\`

4. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

5. Open your browser to http://localhost:3000

## Troubleshooting

### "Backend Not Available" Error

If you see this error, check:

1. Is the backend server running? (Check the terminal where you started it)
2. Is it running on the correct port? (Should be 8000)
3. Is the NEXT_PUBLIC_API_URL set correctly in .env.local?
4. Try visiting http://localhost:8000/health in your browser to verify the backend is responding

### "Server returned non-JSON response" Error

This error typically occurs when:

1. The backend server is not running correctly
2. There's a network issue between the frontend and backend
3. The backend is returning HTML instead of JSON (often an error page)

To fix this:

1. Check the backend terminal for error messages
2. Restart the backend server
3. Make sure you're using the correct URL in NEXT_PUBLIC_API_URL
4. Check if there are any CORS issues (the backend should allow requests from your frontend)
5. Try accessing the backend directly in your browser to see if it responds

### Image Generation Fails

If image generation fails:

1. Check the backend terminal for error messages
2. Verify your GROQ_API_KEY is set correctly
3. Try a simpler prompt
4. Check if the Groq API is working by testing it directly

## Docker Setup (Backend)

You can also run the backend using Docker:

\`\`\`bash
cd backend
docker build -t image-generator-backend .
docker run -p 8000:8000 -e GROQ_API_KEY=your_groq_api_key image-generator-backend
\`\`\`

## Usage

1. Open your browser and go to http://localhost:3000
2. Enter a prompt describing the image you want to generate
3. A negative prompt will be automatically generated based on your input
4. Edit the negative prompt if needed, or click "Regenerate" to create a new one
5. Click "Generate Image"
6. View the enhanced prompt used for generation
7. Download the generated image

## License

MIT
