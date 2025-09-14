# BrewMaster AI

AI-powered brewery and restaurant management system built with microservices architecture.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Start local infrastructure:**
   ```bash
   npm run start:local
   ```

4. **Start development:**
   ```bash
   npm run dev
   ```

## 🏗️ Architecture

- **Microservices**: Independent, scalable services
- **AI Agents**: Claude-powered intelligent automation
- **React Dashboard**: Modern web interface
- **TypeScript**: Type-safe development
- **Docker**: Containerized development environment

## 🔧 Services

- **API Gateway**: http://localhost:3000
- **Web Dashboard**: http://localhost:3001
- **Production Service**: http://localhost:3003
- **Other Services**: Ports 3004-3008

## 🤖 AI Capabilities

- Production planning and optimization
- Inventory management and ordering
- Compliance monitoring and reporting
- Customer experience enhancement
- Financial operations automation

## 📖 Documentation

See the `docs/` directory for detailed documentation on:
- API endpoints
- Architecture diagrams
- Deployment guides
- Development setup

## 🛠️ Development

Each service can be developed independently. Use Claude Code for AI-assisted development:

```bash
claude-code init
claude-code generate agent --type brewing-optimizer
claude-code implement feature --service production
```

## 📄 License

MIT License - see LICENSE file for details.
