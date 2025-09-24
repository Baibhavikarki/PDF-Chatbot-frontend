# Document AI - Frontend

A modern React + TypeScript web application for document-based AI chat functionality with drag-and-drop PDF upload.

## Features

- 📄 **PDF Upload**: Drag-and-drop or click to upload PDF documents
- 💬 **AI Chat**: Ask questions about uploaded documents using RAG (Retrieval-Augmented Generation)
- 🎨 **Modern UI**: Clean, responsive design with Tailwind CSS
- ⚡ **Fast**: Built with Vite for optimal development experience
- 🔧 **Type Safe**: Full TypeScript support with strict linting

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
# Build the application
npm run build

# Preview the build
npm run preview
```

## Development Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run lint` - Run ESLint with error reporting
- `npm run lint:fix` - Fix auto-fixable ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check if code is formatted correctly

## Project Structure

```
src/
├── App.tsx          # Main application component
├── main.tsx         # Application entry point
└── index.css        # Global styles (Tailwind imports)
```

## Customization

### Homepage Content
Edit `src/App.tsx` to modify:
- Upload section styling and behavior
- Chat interface and message display
- Server status indicators
- Quick start guide content

### Styling
- Uses Tailwind CSS for styling
- Global styles in `src/index.css`
- Component styles are inline with Tailwind classes

### Backend Integration
The frontend connects to a backend server at `http://127.0.0.1:3001`. Make sure the backend server is running for full functionality.

## Technologies

- **React 19** - Modern React with latest features
- **TypeScript** - Type safety and better developer experience
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **ESLint + Prettier** - Code quality and formatting