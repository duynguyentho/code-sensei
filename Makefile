# Makefile

.PHONY: help dev-up dev-down dev-build dev-restart prod-up prod-down prod-build prod-restart

help: ## Show this help
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Development environment
dev-up: ## Start the development environment
	docker compose -f docker-compose.yml up -d

dev-down: ## Stop the development environment
	docker compose -f docker-compose.yml down

dev-build: ## Build the development environment
	docker compose -f docker-compose.yml build
dev-logs: ## Tail the logs of the development environment
	docker compose logs sensei --follow

dev-restart: dev-down dev-up ## Restart the development environment

# Production environment
prod-up: ## Start the production environment
	docker compose up -d

prod-down: ## Stop the production environment
	docker compose down

prod-build: ## Build the production environment
	docker compose build

prod-restart: prod-down prod-up ## Restart the production environment
