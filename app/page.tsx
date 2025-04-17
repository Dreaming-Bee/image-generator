import ImageGenerator from "@/components/image-generator"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="bg-black text-white p-6">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">AI Image Generator</h1>
          <p className="text-gray-300 mt-1">Create stunning images with AI</p>
        </div>
      </header>

      <div className="flex-1 container mx-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">How It Works</h2>
            <p className="text-gray-600">
              Enter a detailed prompt describing the image you want to create. Our AI will enhance your prompt and
              generate a high-quality image based on your description. You can also add a negative prompt to specify
              elements you want to exclude from the image.
            </p>
          </div>

          <ImageGenerator />
        </div>
      </div>

      <footer className="bg-gray-100 p-4 text-center text-gray-600">
        <p>Powered by Groq AI</p>
      </footer>
    </main>
  )
}
