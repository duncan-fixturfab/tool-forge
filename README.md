# Tool Forge

Web application for generating Fusion360 CNC tool libraries with AI-powered tool extraction and optimized feeds and speeds.

**Domain**: tools.fixturfab.com

## Features

- **AI-Powered Tool Extraction**: Extract tool geometry from vendor URLs, PDFs, or text using Claude AI
- **Machine-Specific Presets**: Get optimized feeds and speeds for your CNC machine
- **Fusion360 Export**: Download `.tools` files ready for direct import
- **Material Library**: Pre-configured cutting parameters for common materials

## Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Next.js API Routes + Supabase PostgreSQL
- **AI**: Anthropic Claude SDK for tool data extraction
- **Auth**: Supabase Auth

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Supabase account
- Anthropic API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/tool-forge.git
cd tool-forge
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.local.example .env.local
```

4. Configure environment variables in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

5. Set up Supabase database:
   - Create a new Supabase project
   - Run the migrations in `supabase/migrations/` in order
   - The seed data includes common CNC machines and materials

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                   # Auth pages (login, signup)
│   ├── (dashboard)/              # Protected dashboard pages
│   ├── api/                      # API routes
│   │   ├── tools/parse/          # Tool extraction endpoints
│   │   └── libraries/            # Library export endpoints
│   └── auth/callback/            # Supabase auth callback
├── components/
│   ├── auth/                     # Auth components
│   ├── machines/                 # Machine selector components
│   ├── materials/                # Material selector components
│   ├── tools/                    # Tool input/preview components
│   ├── library/                  # Library builder wizard
│   └── ui/                       # shadcn/ui components
├── lib/
│   ├── agents/                   # Claude AI tool parser
│   ├── calculators/              # Feed/speed calculations
│   ├── fusion360/                # Fusion360 export generator
│   └── supabase/                 # Supabase client utilities
├── types/                        # TypeScript type definitions
└── __tests__/                    # Jest tests
```

## Database Schema

The application uses the following main tables:

- `machines`: CNC machine specifications (spindle RPM, power, work envelope)
- `materials`: Material types with cutting properties
- `machine_material_presets`: Speed/feed presets per machine-material combination
- `tools`: User's extracted tools with geometry
- `tool_libraries`: Named collections of tools
- `library_tools`: Junction table with cutting data per material

## API Endpoints

### Tool Parsing

- `POST /api/tools/parse/url` - Extract tool from vendor URL
- `POST /api/tools/parse/text` - Extract tool from text description
- `POST /api/tools/parse/pdf` - Extract tool from PDF datasheet

### Library Export

- `GET /api/libraries/[id]/download` - Download `.tools` file

## Fusion360 Import

1. Open Fusion360
2. Go to **Manufacture** workspace
3. Click **Manage** → **Tool Library**
4. Click the **Import** button (folder icon)
5. Select the downloaded `.tools` file

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Deployment

The application is designed to be deployed on Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## License

MIT
