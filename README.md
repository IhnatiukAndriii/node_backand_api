# Habit & Routine Management Backend

A production-ready Node.js + TypeScript backend that processes natural language to manage user habits. Built with OpenAI integration for intelligent intent recognition and SQLite for persistent storage.

## Features

- Natural language processing for habit management (create, update, delete, list)
- Conversation history with automatic token management
- RESTful API with comprehensive error handling
- SQLite database with migration support
- Full test coverage (unit + integration tests)
- Rate limiting and security middlewares

## Tech Stack

- **Runtime**: Node.js 18+ (LTS)
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: SQLite with better-sqlite3
- **ORM**: Knex.js
- **AI**: OpenAI API (GPT-4)
- **Testing**: Vitest + Supertest
- **Dev Tools**: ESLint, Prettier, Nodemon

## Project Structure

```
├── src/
│   ├── config/          # Configuration (database, OpenAI, env)
│   ├── controllers/     # Request handlers
│   ├── middlewares/     # Auth, validation, error handling
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic (habits, conversations, tokens)
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Helpers (logger, response, validation)
├── migrations/          # Database migrations
├── tests/
│   ├── unit/            # Unit tests with mocks
│   └── integration/     # Integration tests with real DB
├── scripts/             # Utility scripts
└── docs/                # Additional documentation
```

## Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- OpenAI API key (get one at https://platform.openai.com/api-keys)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/IhnatiukAndriii/node_backand_api.git
cd node_backand_api
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and set your OpenAI API key:
```env
OPENAI_API_KEY=sk-proj-your-actual-key-here
```

4. Run database migrations:
```bash
npm run migrate
```

## Configuration

Environment variables (see `.env.example` for details):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | - | Your OpenAI API key |
| `PORT` | No | 3000 | Server port |
| `NODE_ENV` | No | development | Environment (development/production/test) |
| `OPENAI_MODEL` | No | gpt-4.1-mini | OpenAI model to use |
| `MAX_TOKENS_PER_REQUEST` | No | 4000 | Token limit per request |
| `TEST_DB_PATH` | No | ./db/test_integration.db | Test database path |

## Running the Application

### Development

Start the server with hot-reload:
```bash
npm run dev
```

Server runs at `http://localhost:3000`

### Production

Build and start:
```bash
npm run build
npm start
```

### Verify Installation

Check health endpoint:
```bash
curl http://localhost:3000/api/health
```

Response: `{"status":"ok"}`

## API Endpoints

### POST /api/prompt

Process natural language input to manage habits.

**Request:**
```json
{
  "text": "I want to drink water 3 times a day",
  "phone_number": "+1234567890"
}
```

**Response:**
```json
{
  "phone_number": "+1234567890",
  "textReceived": "I want to drink water 3 times a day",
  "intent": {
    "action": "create",
    "habit_name": "drink water",
    "frequency_type": "times_per_day",
    "frequency_times": 3
  },
  "result": {
    "id": 1,
    "user_id": 1,
    "habit_name": "drink water",
    "frequency_type": "times_per_day",
    "frequency_times": "3",
    "status": "active",
    "created_at": "2025-12-02T10:00:00.000Z",
    "updated_at": "2025-12-02T10:00:00.000Z"
  }
}
```

**Example prompts:**
- Create: "I want to exercise every morning at 7am"
- Update: "Change my water habit to 5 times a day"
- Delete: "Remove my exercise habit"
- List: "Show me all my habits"

### GET /api/habits

List all habits for a user.

**Query params:**
- `phoneNumber` (required): User's phone number

**Request:**
```bash
curl "http://localhost:3000/api/habits?phoneNumber=%2B1234567890"
```

**Response:**
```json
{
  "phone_number": "+1234567890",
  "habits": [
    {
      "id": 1,
      "habit_name": "drink water",
      "frequency_type": "times_per_day",
      "frequency_times": "3",
      "status": "active",
      "created_at": "2025-12-02T10:00:00.000Z"
    }
  ]
}
```

### GET /api/health

Health check endpoint.

**Response:**
```json
{"status":"ok"}
```

## Testing

### Run All Tests

```bash
npm test
```

### Unit Tests

Tests with mocked dependencies (fast, no API calls):
```bash
npm run test:unit
```

### Integration Tests

Tests with real database and optional OpenAI calls:
```bash
npm run test:integration
```

Note: Integration tests requiring OpenAI will skip if `OPENAI_API_KEY` is not set.

### Watch Mode

Run tests on file changes:
```bash
npm run test:watch
```

### Test Coverage

- Unit tests: Service layer logic, parsers, validators
- Integration tests: Full API flows, database operations
- Production tests: Real OpenAI integration (optional)

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot-reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm test` | Run all tests |
| `npm run test:unit` | Run unit tests only |
| `npm run test:integration` | Run integration tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run migrate` | Run database migrations |
| `npm run migrate:rollback` | Rollback last migration |
| `npm run lint` | Lint code with ESLint |
| `npm run format` | Format code with Prettier |
| `npm run reset-user` | Reset user data (utility) |

### Code Style

The project uses ESLint and Prettier for consistent code formatting. Run linting before committing:
```bash
npm run lint
npm run format
```

### Database Migrations

Create a new migration:
```bash
npx knex migrate:make migration_name
```

Run pending migrations:
```bash
npm run migrate
```

Rollback last migration:
```bash
npm run migrate:rollback
```

## Deployment

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed deployment instructions.

### Recommended Platforms

- Railway (easiest setup)
- Render
- Heroku
- DigitalOcean App Platform
- AWS Elastic Beanstalk

### Production Checklist

1. Set `NODE_ENV=production`
2. Configure `OPENAI_API_KEY` in platform environment variables
3. Run migrations on first deploy
4. Configure custom domain (optional)
5. Set up monitoring and logging

## Troubleshooting

### Database Issues

Reset database:
```bash
rm database.sqlite
npm run migrate
```

### OpenAI API Errors

- Verify `OPENAI_API_KEY` is set correctly
- Check OpenAI account has sufficient credits
- Confirm model name is valid (default: gpt-4.1-mini)

### Port Already in Use

Change port in `.env`:
```env
PORT=3001
```

### Token Limit Errors

Adjust token limit in `.env`:
```env
MAX_TOKENS_PER_REQUEST=8000
```

## Security

- Never commit `.env` or API keys to version control
- Rate limiting is enabled by default
- Input validation on all endpoints
- SQL injection protection via Knex.js parameterized queries
- CORS configured for production use

## Documentation

- [API Documentation](./docs/API.md) - Detailed API reference
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment steps

## License

MIT

## Author

Andrii Ihnatiuk
- GitHub: [@IhnatiukAndriii](https://github.com/IhnatiukAndriii)

## Contributing

Contributions welcome! Please open an issue or submit a pull request.