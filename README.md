# Campaign Performance API

A TypeScript API for UA Managers to query, aggregate, and export campaign performance data. Built with Express.js and designed for deployment on Railway.com.

## Features

- **Campaign Listing**: Paginated campaign data with comprehensive filtering
- **Individual Campaign Details**: Get specific campaign information by ID
- **Metrics Aggregation**: Group and aggregate campaign metrics by various dimensions
- **Data Export**: Export filtered campaign data as CSV or JSON
- **Authentication**: API key-based authentication
- **Type Safety**: Full TypeScript implementation with comprehensive type definitions

## API Endpoints

Based on the OpenAPI specification in `Documentation/ua_openapi.yml`:

- `GET /api/v1/campaigns` - List campaigns with filters and pagination
- `GET /api/v1/campaigns/:id` - Get single campaign by ID
- `GET /api/v1/metrics/aggregate` - Get aggregated metrics
- `GET /api/v1/exports` - Export campaigns as CSV or JSON
- `GET /api/v1/health` - Health check endpoint

## Quick Start

### Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Add your campaign data:**
   ```bash
   mkdir -p data
   # Place your campaigns.json file in the data directory
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

## Data Format

Place your campaign data in `data/campaigns.json`. The expected format is an array of campaign objects:

```json
[
  {
    "id": "unique-campaign-id",
    "game": "Game Name",
    "campaign_name": "Campaign Name",
    "network": "Network Name",
    "store": "ios",
    "month": "2024-01",
    "acquired_users": 1000,
    "cpi": 2.50,
    "roas": {
      "ROAS d0": "0.15",
      "ROAS d7": "0.45",
      "ROAS d30": "1.20",
      "ROAS d365": "3.50"
    },
    "retention": {
      "Retention d0": "100%",
      "Retention d7": "25%",
      "Retention d30": "12%",
      "Retention d365": "5%"
    }
  }
]
```

## Railway.com Deployment

### Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Push your code to GitHub
3. **Environment Variables**: Prepare your production environment variables

### Deployment Steps

1. **Connect Repository:**
   - Go to Railway dashboard
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

2. **Configure Environment Variables:**
   ```
   NODE_ENV=production
   API_KEY=your-production-api-key
   CORS_ORIGIN=https://your-domain.railway.app
   DATA_FILE_PATH=./data/campaigns.json
   BASE_URL=https://your-domain.railway.app
   ```

3. **Upload Data File:**
   - Use Railway's file upload feature or
   - Include the data file in your repository (not recommended for sensitive data)

4. **Deploy:**
   - Railway will automatically build and deploy your application
   - The build process uses the `railway.json` configuration

### Railway Configuration

The project includes:
- `railway.json` - Railway-specific deployment configuration
- `Dockerfile` - Container configuration (optional)
- Health check endpoint at `/api/v1/health`

### Custom Domain (Optional)

1. Go to your Railway project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Update the `BASE_URL` environment variable

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `3000` | No |
| `NODE_ENV` | Environment | `development` | No |
| `API_KEY` | API authentication key | - | Yes (production) |
| `CORS_ORIGIN` | CORS allowed origins | `*` | No |
| `DATA_FILE_PATH` | Path to campaigns JSON file | `./data/campaigns.json` | No |
| `BASE_URL` | Base URL for export links | `http://localhost:3000` | No |

## API Usage Examples

### List Campaigns with Filters

```bash
curl "https://your-api.railway.app/api/v1/campaigns?game=MyGame&store=ios&page=1&page_size=10" \
  -H "X-API-Key: your-api-key"
```

### Get Aggregated Metrics

```bash
curl "https://your-api.railway.app/api/v1/metrics/aggregate?group_by=network&metric=cpi&aggregation=avg" \
  -H "X-API-Key: your-api-key"
```

### Export Data

```bash
curl "https://your-api.railway.app/api/v1/exports?format=csv" \
  -H "X-API-Key: your-api-key"
```

## Development

### Project Structure

```
src/
├── types/           # TypeScript type definitions
├── routes/          # Express route handlers
├── services/        # Business logic services
├── middleware/      # Express middleware
├── utils/           # Utility functions
└── index.ts         # Application entry point
```

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests (placeholder)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC
