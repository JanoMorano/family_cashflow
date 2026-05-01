FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY scripts ./scripts
COPY public ./public
COPY src ./src
COPY tsconfig.json ./
RUN npm run build

EXPOSE 3000

ENV DATA_DIR="/data"
ENV NODE_ENV="production"
ENV PORT="3000"
ENV HOST="0.0.0.0"
ENV APP_USERS="admin:admin:Admin,demo:demo:Demo"

CMD ["node", "dist/index.js"]
