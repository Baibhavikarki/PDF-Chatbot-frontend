import { useState, useEffect, useRef, useCallback } from 'react'
import { Upload, Send, MessageCircle, Bot, User, FileText, Loader2, Settings, Zap, Database, ChevronDown } from 'lucide-react'

interface Message {
  id: string
  content: string
  sender: 'user' | 'bot'
  timestamp: Date
}

interface ServerStatus {
  status: string
  vectorStoreLoaded: boolean
  apiKeys: {
    openai: boolean
    embeddingProvider: string
  }
}

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const API_BASE = 'http://127.0.0.1:3001'

  useEffect(() => {
    checkServerStatus()
  }, [])

  // Auto-scroll to bottom for new messages
  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100

      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [messages])

  // Handle scroll to show/hide scroll-to-bottom button
  const handleScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100
      setShowScrollButton(!isNearBottom && messages.length > 0)
    }
  }, [messages.length])

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const checkServerStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/status`)
      const data = await response.json()
      setServerStatus(data)
    } catch (error) {
      console.error('Failed to check server status:', error)
    }
  }

  const handleFileUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('pdf', selectedFile)

    try {
      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        addMessage(`Successfully uploaded and processed: ${result.filename}`, 'bot')
        setSelectedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        checkServerStatus()
      } else {
        const error = await response.json()
        addMessage(`Upload failed: ${error.error}`, 'bot')
      }
    } catch (error) {
      addMessage('Failed to upload file. Please check your connection.', 'bot')
    } finally {
      setIsUploading(false)
    }
  }

  const addMessage = (content: string, sender: 'user' | 'bot') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      sender,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage = inputValue.trim()
    setInputValue('')
    addMessage(userMessage, 'user')
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question: userMessage })
      })

      const data = await response.json()

      if (response.ok) {
        addMessage(data.answer, 'bot')
      } else {
        addMessage(`Error: ${data.error}`, 'bot')
      }
    } catch (error) {
      addMessage('Failed to get response. Please check your connection.', 'bot')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Document AI</h1>
                <p className="text-sm text-gray-500">Intelligent Document Assistant</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {serverStatus && (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${serverStatus.apiKeys.openai ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm font-medium text-gray-700">OpenAI</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${serverStatus.vectorStoreLoaded ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                    <span className="text-sm font-medium text-gray-700">
                      {serverStatus.vectorStoreLoaded ? 'Ready' : 'No Docs'}
                    </span>
                  </div>
                </div>
              )}
              <button
                onClick={checkServerStatus}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-[calc(100vh-160px)]">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Upload className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Upload Document</h2>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                </div>
                <button
                  onClick={handleFileUpload}
                  disabled={!selectedFile || isUploading}
                  className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Status Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Database className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
              </div>
              {serverStatus ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Server</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Online
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">OpenAI API</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      serverStatus.apiKeys.openai
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {serverStatus.apiKeys.openai ? 'Connected' : 'Error'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Documents</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      serverStatus.vectorStoreLoaded
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {serverStatus.vectorStoreLoaded ? 'Ready' : 'Empty'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Provider</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {serverStatus.apiKeys.embeddingProvider}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  <span className="text-sm text-gray-500">Checking status...</span>
                </div>
              )}
            </div>

            {/* Quick Start Section */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Zap className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Quick Start</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white text-xs font-semibold rounded-full flex items-center justify-center">1</div>
                  <p className="text-sm text-gray-700">Upload a PDF document</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white text-xs font-semibold rounded-full flex items-center justify-center">2</div>
                  <p className="text-sm text-gray-700">Wait for processing to complete</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white text-xs font-semibold rounded-full flex items-center justify-center">3</div>
                  <p className="text-sm text-gray-700">Ask questions about the content</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white text-xs font-semibold rounded-full flex items-center justify-center">4</div>
                  <p className="text-sm text-gray-700">Get AI-powered answers!</p>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Section */}
          <div className="lg:col-span-3 flex flex-col">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Chat with your documents</h2>
                </div>
                {messages.length > 0 && (
                  <button
                    onClick={() => setMessages([])}
                    className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Clear Chat
                  </button>
                )}
              </div>

              {/* Messages */}
              <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-6 relative"
                style={{
                  scrollBehavior: 'smooth',
                  overscrollBehavior: 'contain'
                }}
              >
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Bot className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Document AI!</h3>
                    <p className="text-gray-500 max-w-md">Upload a PDF document and start asking questions about its content. I'll help you understand and analyze your documents.</p>
                  </div>
                ) : (
                  <div className="space-y-6 min-h-full">
                    {messages.map((message, index) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 fade-in duration-300`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className={`flex space-x-3 max-w-3xl ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                            message.sender === 'user'
                              ? 'bg-blue-600 shadow-md'
                              : 'bg-gray-100 shadow-sm'
                          }`}>
                            {message.sender === 'user' ? (
                              <User className="w-4 h-4 text-white" />
                            ) : (
                              <Bot className="w-4 h-4 text-gray-600" />
                            )}
                          </div>
                          <div className={`flex flex-col ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                {message.sender === 'user' ? 'You' : 'AI Assistant'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {message.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                            <div className={`px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${
                              message.sender === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200'
                            }`}>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start animate-in slide-in-from-bottom-4 fade-in duration-300">
                        <div className="flex space-x-3 max-w-3xl">
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-200">
                            <Bot className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="flex flex-col items-start">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium text-gray-900">AI Assistant</span>
                            </div>
                            <div className="px-4 py-3 rounded-2xl bg-white shadow-sm border border-gray-200">
                              <div className="flex items-center space-x-2">
                                <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                                <span className="text-sm text-gray-600">Thinking...</span>
                                <div className="flex space-x-1">
                                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div ref={messagesEndRef} />

                {/* Scroll to bottom button */}
                {showScrollButton && (
                  <button
                    onClick={scrollToBottom}
                    className="absolute bottom-4 right-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label="Scroll to bottom"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Input Section */}
              <div className="border-t border-gray-200 p-6">
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <textarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Ask a question about your document..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm placeholder-gray-500"
                      rows={2}
                      disabled={!serverStatus?.vectorStoreLoaded}
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading || !serverStatus?.vectorStoreLoaded}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </div>

                {!serverStatus?.vectorStoreLoaded && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-amber-600" />
                    <span className="text-sm text-amber-800">Please upload a PDF document to start chatting!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
