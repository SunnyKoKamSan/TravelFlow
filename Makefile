.PHONY: help setup dev dev-frontend dev-backend build docker-up docker-down docker-logs

help:
	@echo "TravelFlow Pro - Development Commands"
	@echo "======================================"
	@echo "setup          - Install dependencies and setup environment"
	@echo "dev            - Run both frontend and backend (requires two terminals)"
	@echo "dev-frontend   - Run only frontend"
	@echo "dev-backend    - Run only backend (local, no Docker)"
	@echo "docker-up      - Start backend with Docker Compose"
	@echo "docker-down    - Stop Docker services"
	@echo "docker-logs    - View Docker logs"
	@echo "build          - Build both frontend and backend for production"
	@echo "build-frontend - Build only frontend"
	@echo "build-backend  - Build only backend"
	@echo "lint           - Run linting on all projects"
	@echo "clean          - Remove all build artifacts and node_modules"

setup:
	@echo "Setting up TravelFlow Pro..."
	@echo "Frontend setup..."
	cd frontend && npm install
	@echo "✅ Frontend dependencies installed"
	@echo "Backend setup..."
	cd backend && npm install
	@echo "✅ Backend dependencies installed"
	@echo ""
	@echo "Next steps:"
	@echo "1. Copy .env.example files to .env.local (frontend) and .env (backend)"
	@echo "2. Fill in your API keys (Firebase, Gemini)"
	@echo "3. Run 'make dev' or 'make docker-up' to start"

dev: dev-frontend dev-backend

dev-frontend:
	@cd frontend && npm run dev

dev-backend:
	@cd backend && npm run dev

docker-up:
	docker-compose up --build
	@echo "✅ Backend started"
	@echo "Backend: http://localhost:5000"

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f backend

build: build-frontend build-backend

build-frontend:
	cd frontend && npm run build

build-backend:
	cd backend && npm run build

lint:
	cd frontend && npm run lint
	cd backend && npm run lint

clean:
	rm -rf frontend/dist backend/dist
	rm -rf node_modules frontend/node_modules backend/node_modules

.DEFAULT_GOAL := help
