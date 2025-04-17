from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import os
import requests
import uuid
from fastapi.staticfiles import StaticFiles
import logging
import json
from fastapi.exceptions import RequestValidationError

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create directory for storing images
os.makedirs("static/images", exist_ok=True)

# Mount static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

class ImageRequest(BaseModel):
    prompt: str
    negative_prompt: str = ""

class NegativePromptRequest(BaseModel):
    prompt: str

# Custom exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": str(exc)},
    )

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
    )

@app.post("/generate-negative-prompt")
async def generate_negative_prompt(request: NegativePromptRequest):
    try:
        # Get the Groq API key from environment variables
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            logger.error("GROQ_API_KEY not found in environment variables")
            return JSONResponse(
                status_code=500,
                content={"detail": "GROQ_API_KEY not found in environment variables"}
            )

        logger.info(f"Generating negative prompt for: {request.prompt}")
        
        # Use Groq API to generate a negative prompt
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        negative_prompt_payload = {
            "model": "llama3-70b-8192",
            "messages": [
                {
                    "role": "system", 
                    "content": "You are an expert at creating negative prompts for text-to-image AI models. A negative prompt specifies what should NOT be in the generated image. Based on the user's positive prompt, create a concise negative prompt that will help avoid common issues like 'bad anatomy', 'extra limbs', 'blurry', etc. and any issues that might arise specifically from the positive prompt. Keep it under 100 words."
                },
                {
                    "role": "user", 
                    "content": f"Create a negative prompt for this positive prompt: '{request.prompt}'"
                }
            ],
            "temperature": 0.7,
            "max_tokens": 200
        }
        
        try:
            negative_prompt_response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=negative_prompt_payload,
                timeout=30
            )
            
            if negative_prompt_response.status_code != 200:
                logger.error(f"Error from Groq API: {negative_prompt_response.text}")
                return JSONResponse(
                    status_code=500,
                    content={"detail": f"Error from Groq API: {negative_prompt_response.status_code}"}
                )
            
            negative_prompt_data = negative_prompt_response.json()
            negative_prompt = negative_prompt_data["choices"][0]["message"]["content"]
            logger.info(f"Generated negative prompt: {negative_prompt}")
            
            return {"negative_prompt": negative_prompt}
        
        except Exception as e:
            logger.error(f"Error generating negative prompt: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"detail": f"Error generating negative prompt: {str(e)}"}
            )
    
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Unexpected error: {str(e)}"}
        )

@app.post("/generate-image")
async def generate_image(request: ImageRequest):
    try:
        # Get the Groq API key from environment variables
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            logger.error("GROQ_API_KEY not found in environment variables")
            return JSONResponse(
                status_code=500,
                content={"detail": "GROQ_API_KEY not found in environment variables"}
            )

        logger.info(f"Generating image with prompt: {request.prompt}")
        logger.info(f"Negative prompt: {request.negative_prompt}")
        
        # Use Groq API to enhance the prompt
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # Use Groq to enhance the prompt
        try:
            enhanced_prompt_payload = {
                "model": "llama3-70b-8192",
                "messages": [
                    {
                        "role": "system", 
                        "content": "You are an expert at creating detailed image descriptions for text-to-image AI models. Take the user's prompt and expand it into a highly detailed description that will result in a high-quality image."
                    },
                    {
                        "role": "user", 
                        "content": request.prompt
                    }
                ],
                "temperature": 0.7,
                "max_tokens": 500
            }
            
            enhanced_prompt_response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=enhanced_prompt_payload,
                timeout=30
            )
            
            if enhanced_prompt_response.status_code != 200:
                logger.error(f"Error from Groq API: {enhanced_prompt_response.text}")
                # Fall back to original prompt if enhancement fails
                enhanced_prompt = request.prompt
            else:
                enhanced_prompt_data = enhanced_prompt_response.json()
                enhanced_prompt = enhanced_prompt_data["choices"][0]["message"]["content"]
                logger.info(f"Enhanced prompt: {enhanced_prompt}")
        except Exception as e:
            logger.error(f"Error enhancing prompt: {str(e)}")
            # Fall back to original prompt if enhancement fails
            enhanced_prompt = request.prompt
        
        # For demonstration, use a placeholder image
        try:
            # Use a placeholder image service
            image_width = 1024
            image_height = 1024
            placeholder_url = f"https://picsum.photos/{image_width}/{image_height}"
            
            image_response = requests.get(placeholder_url, timeout=10)
            
            if image_response.status_code != 200:
                logger.error(f"Error getting placeholder image: {image_response.status_code}")
                return JSONResponse(
                    status_code=500,
                    content={"detail": "Failed to generate placeholder image"}
                )
            
            image_content = image_response.content
            
            # Save the image
            image_id = str(uuid.uuid4())
            image_path = f"static/images/{image_id}.png"
            
            with open(image_path, "wb") as f:
                f.write(image_content)
            
            # Return the URL to the saved image
            image_url = f"/static/images/{image_id}.png"
            
            return {
                "success": True, 
                "image_url": image_url,
                "enhanced_prompt": enhanced_prompt
            }
        except Exception as e:
            logger.error(f"Error generating image: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"detail": f"Error generating image: {str(e)}"}
            )
    
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Unexpected error: {str(e)}"}
        )

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
