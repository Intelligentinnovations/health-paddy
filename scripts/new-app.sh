#!/bin/bash
set -e

export APPLICATION="$npm_config_application"
export DIRECTORY="apps/$APPLICATION"

npx nx g @nx/nest:application --name="$APPLICATION" --directory="$DIRECTORY" --e2eTestRunner=none --unitTestRunner=none
rm -r "$DIRECTORY"/src
cp -r apps/nest-template/src/ "$DIRECTORY"/src
nx g @nx-tools/nx-prisma:init "$APPLICATION"
