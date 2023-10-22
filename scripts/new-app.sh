#!/bin/bash
set -e

export APPLICATION="$npm_config_application"
export DIRECTORY="apps/$APPLICATION"

npx nx g @nx/node:application --name="$APPLICATION" --directory="$DIRECTORY" --bundler=esbuild --e2eTestRunner=none --unitTestRunner=none --framework=none
rm "$DIRECTORY"/src/main.ts
cp -r apps/app-template/src/ "$DIRECTORY"/src
