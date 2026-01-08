.PHONY: install build dev preview clean ios android sync setup

# Default target
all: install build

# Install all dependencies
install:
	npm install

# Build for production
build:
	npm run build

# Start development server
dev:
	npm run dev

# Preview production build
preview:
	npm run preview

# Full setup: install dependencies and build
setup: install build
	@echo "Setup complete! Run 'make dev' to start development server"

# Clean build artifacts and dependencies
clean:
	rm -rf node_modules dist ios android

# Clean and reinstall
reinstall: clean install

# iOS build (macOS only)
ios:
	npm run ios

# Android build
android:
	npm run android

# Sync web build to native platforms
sync:
	npm run sync

# Add iOS platform
ios-init:
	npx cap add ios

# Add Android platform
android-init:
	npx cap add android

# Initialize both mobile platforms
mobile-init: ios-init android-init

# Help
help:
	@echo "Tap N Track - Available commands:"
	@echo ""
	@echo "  make install      - Install npm dependencies"
	@echo "  make build        - Build for production"
	@echo "  make dev          - Start development server"
	@echo "  make preview      - Preview production build"
	@echo "  make setup        - Full setup (install + build)"
	@echo "  make clean        - Remove node_modules, dist, and native folders"
	@echo "  make reinstall    - Clean and reinstall dependencies"
	@echo ""
	@echo "Mobile:"
	@echo "  make ios-init     - Add iOS platform"
	@echo "  make android-init - Add Android platform"
	@echo "  make mobile-init  - Add both platforms"
	@echo "  make ios          - Build and open in Xcode"
	@echo "  make android      - Build and open in Android Studio"
	@echo "  make sync         - Sync web build to native projects"
