FROM node:20-slim

WORKDIR /app

RUN npm install -g pnpm@9

COPY package.json pnpm-lock.yaml ./
# Copy .npmrc only if it exists (ignore error)
COPY .npmrc* ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN mkdir -p /app/data

EXPOSE 4000

CMD ["pnpm", "dev:server"]
