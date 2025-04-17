"use server"

interface GenerateNegativePromptParams {
  prompt: string
}

interface GenerateNegativePromptResponse {
  success: boolean
  negativePrompt?: string
  error?: string
}

export async function generateNegativePrompt({
  prompt,
}: GenerateNegativePromptParams): Promise<GenerateNegativePromptResponse> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    console.log(`Sending request to: ${apiUrl}/generate-negative-prompt`)

    const response = await fetch(`${apiUrl}/generate-negative-prompt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
      }),
    })

    // Check if response is OK
    if (!response.ok) {
      // Try to parse as JSON first
      let errorMessage = "Failed to generate negative prompt"
      try {
        const errorData = await response.json()
        errorMessage = errorData.detail || errorMessage
      } catch (parseError) {
        // If parsing fails, use the status text
        errorMessage = `Server error: ${response.status} ${response.statusText}`
      }

      return {
        success: false,
        error: errorMessage,
      }
    }

    // Check content type to ensure it's JSON
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      return {
        success: false,
        error: "Server returned non-JSON response. Please check if the backend is running correctly.",
      }
    }

    // Parse the JSON response
    const data = await response.json()

    return {
      success: true,
      negativePrompt: data.negative_prompt,
    }
  } catch (error) {
    console.error("Error generating negative prompt:", error)

    // Provide more specific error messages
    let errorMessage = "An unexpected error occurred"
    if (error instanceof TypeError && error.message.includes("fetch")) {
      errorMessage = "Could not connect to the backend server. Please make sure it's running."
    } else if (error instanceof SyntaxError) {
      errorMessage = "Received invalid response from server. Please check backend logs."
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}
