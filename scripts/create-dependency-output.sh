#!/bin/bash
set -e

mkdir -p dist/dependency/nodejs
cp package.json dist/dependency/nodejs/
cp pnpm-lock.yaml dist/dependency/nodejs/
cd dist/dependency/nodejs
pnpm install --node-linker=hoisted --production
rm -rf node_modules/.bin node_modules/.prisma
