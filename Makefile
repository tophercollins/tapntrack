.PHONY: all install build dev preview clean reinstall ios android android-init sync setup icons help

# Targets like `reinstall: clean install sync` rely on prerequisite ORDER, which make does not
# guarantee under -j; without this, `rm -rf node_modules` can race `npm install`.
.NOTPARALLEL:

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

# Clean build artifacts and dependencies.
# NOTE: ios/ is TRACKED in git (Phase 2 builds native code on it) — `rm -rf ios` here would wipe
# committed source, so only regenerable paths are cleared. Versus ios/.gitignore this skips
# App/Pods (SPM — never exists), App/output (cap build IPAs), and xcuserdata (Xcode user state:
# breakpoints and schemes, deliberately kept).
clean:
	rm -rf node_modules dist android \
	  ios/App/build ios/DerivedData ios/capacitor-cordova-ios-plugins \
	  ios/App/App/public ios/App/App/capacitor.config.json ios/App/App/config.xml

# Clean and reinstall. `sync` is required, not optional: clean removes config.xml and
# capacitor.config.json, which the TRACKED project.pbxproj still lists as build inputs — without
# regenerating them Xcode fails with "Build input file cannot be found". .NOTPARALLEL: guarantees
# this runs in order. Caveat: sync includes `tsc && vite build`, so a type error aborts it AFTER
# clean has run — leaving those inputs missing until you fix the build and re-run `make sync`.
reinstall: clean install sync
	@echo "Done. If sync failed (e.g. a type error), fix it and run 'make sync' before opening"
	@echo "Xcode — clean removed config.xml/capacitor.config.json and only sync regenerates them."

# iOS build (macOS only)
ios:
	npm run ios

# Android build
android:
	npm run android

# Sync web build to native platforms
sync:
	npm run sync

# Regenerate every app icon + splash from public/icon.svg (needs: cd probe && npm install)
icons:
	npm run icons

# NOTE: there is deliberately no `ios-init`. ios/ is committed, and `npx cap add ios` does not
# no-op against an existing platform — it exits 1 telling you to delete ios/App first ("your
# native project will be completely removed"), which would destroy tracked source. Use `make sync`.

# Add Android platform
android-init:
	npx cap add android

# Help
help:
	@echo "Tap N Track - Available commands:"
	@echo ""
	@echo "  make install      - Install npm dependencies"
	@echo "  make build        - Build for production"
	@echo "  make dev          - Start development server"
	@echo "  make preview      - Preview production build"
	@echo "  make setup        - Full setup (install + build)"
	@echo "  make clean        - Remove node_modules, dist, android, and generated iOS artefacts"
	@echo "  make reinstall    - Clean and reinstall dependencies"
	@echo ""
	@echo "Mobile:"
	@echo "  make android-init - Add Android platform (iOS is committed; never 'cap add ios')"
	@echo "  make ios          - Build and open in Xcode"
	@echo "  make android      - Build and open in Android Studio"
	@echo "  make sync         - Sync web build to native projects"
	@echo "  make icons        - Regenerate app icons + splash from public/icon.svg"
