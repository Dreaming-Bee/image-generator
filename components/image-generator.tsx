"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Download, ImageIcon, Film, Sparkles, AlertTriangle, RefreshCw } from "lucide-react"
import { generateImage } from "@/app/actions/generate-image"
import { generateNegativePrompt } from "@/app/actions/generate-negative-prompt"
import Image from "next/image"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("")
  const [negativePrompt, setNegativePrompt] = useState("")
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [negativePromptLoading, setNegativePromptLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [negativePromptError, setNegativePromptError] = useState<string | null>(null)
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking")
  const [promptDebounceTimeout, setPromptDebounceTimeout] = useState<NodeJS.Timeout | null>(null)

  // Check if backend is available on component mount
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        const response = await fetch(`${apiUrl}/health`, {
          method: "GET",
          // Add a timeout to prevent long waits
          signal: AbortSignal.timeout(5000),
        })

        if (response.ok) {
          setBackendStatus("online")
        } else {
          setBackendStatus("offline")
        }
      } catch (error) {
        console.error("Backend health check failed:", error)
        setBackendStatus("offline")
      }
    }

    checkBackendStatus()
  }, [])

  // Auto-generate negative prompt when the prompt changes
  useEffect(() => {
    // Clear any existing timeout
    if (promptDebounceTimeout) {
      clearTimeout(promptDebounceTimeout)
    }

    // Don't generate for empty prompts
    if (!prompt.trim()) {
      return
    }

    // Set a new timeout to debounce the API call
    const timeout = setTimeout(() => {
      handleGenerateNegativePrompt()
    }, 1000) // Wait 1 second after typing stops

    setPromptDebounceTimeout(timeout)

    // Cleanup on unmount
    return () => {
      if (promptDebounceTimeout) {
        clearTimeout(promptDebounceTimeout)
      }
    }
  }, [prompt])

  const handleGenerateNegativePrompt = async () => {
    if (!prompt.trim() || backendStatus === "offline") {
      return
    }

    setNegativePromptLoading(true)
    setNegativePromptError(null)

    try {
      const result = await generateNegativePrompt({
        prompt: prompt,
      })

      if (result.success && result.negativePrompt) {
        setNegativePrompt(result.negativePrompt)
      } else {
        setNegativePromptError(result.error || "Failed to generate negative prompt")
      }
    } catch (err) {
      setNegativePromptError("An unexpected error occurred")
      console.error(err)
    } finally {
      setNegativePromptLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (backendStatus === "offline") {
      setError("Backend server is not available. Please make sure it's running.")
      return
    }

    if (!prompt.trim()) {
      setError("Please enter a prompt")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await generateImage({
        prompt: prompt,
        negative_prompt: negativePrompt,
      })

      if (result.success) {
        setGeneratedImage(result.imageUrl)
        setEnhancedPrompt(result.enhancedPrompt || null)
      } else {
        setError(result.error || "Failed to generate image")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!generatedImage) return

    const link = document.createElement("a")
    link.href = generatedImage
    link.download = `generated-image-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Show backend status warning if offline
  const renderBackendWarning = () => {
    if (backendStatus === "offline") {
      return (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Backend Not Available</AlertTitle>
          <AlertDescription>
            The backend server is not responding. Please make sure it's running at{" "}
            <code className="bg-gray-100 px-1 py-0.5 rounded">
              {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}
            </code>
          </AlertDescription>
        </Alert>
      )
    }
    return null
  }

  return (
    <div className="space-y-8">
      {renderBackendWarning()}

      <Tabs defaultValue="image" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="image">
            <div className="flex items-center gap-2">
              <ImageIcon size={16} />
              <span>Image Generation</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="video" disabled>
            <div className="flex items-center gap-2">
              <Film size={16} />
              <span>Video Generation (Coming Soon)</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="image" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="prompt" className="block text-sm font-medium mb-1">
                    Prompt
                  </label>
                  <Textarea
                    id="prompt"
                    placeholder="Describe the image you want to generate..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="negative-prompt" className="block text-sm font-medium">
                      Negative Prompt (Auto-Generated)
                    </label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateNegativePrompt}
                            disabled={!prompt.trim() || negativePromptLoading || backendStatus === "offline"}
                            className="h-8 px-2"
                          >
                            {negativePromptLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                            <span className="ml-1">Regenerate</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Regenerate negative prompt</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Textarea
                    id="negative-prompt"
                    placeholder={
                      negativePromptLoading
                        ? "Generating negative prompt..."
                        : "Elements you want to exclude from the image..."
                    }
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    className={negativePromptLoading ? "min-h-[80px] opacity-70" : "min-h-[80px]"}
                  />
                  {negativePromptError && <p className="text-red-500 text-xs mt-1">{negativePromptError}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={loading || backendStatus === "offline"}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Image"
                  )}
                </Button>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {generatedImage && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Generated Image</h2>
          <div className="relative border rounded-lg overflow-hidden">
            <Image
              src={generatedImage || "/placeholder.svg"}
              alt="Generated image"
              width={1024}
              height={1024}
              className="w-full h-auto"
            />
            <Button onClick={handleDownload} className="absolute bottom-4 right-4" variant="secondary">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>

          {enhancedPrompt && (
            <Card className="mt-4">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={16} className="text-yellow-500" />
                  <h3 className="text-sm font-medium">Enhanced Prompt</h3>
                </div>
                <p className="text-sm text-gray-600">{enhancedPrompt}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
