help: ## Shows help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

build: ## Builds and packages the extension to be submitted
	rm -rf device-power-indicator@ranger-ross.github.io.zip
	zip  -r device-power-indicator@ranger-ross.github.io.zip . -x ".git/*" -x Makefile -x .gitignore -x src/types.js -x readme-images/*