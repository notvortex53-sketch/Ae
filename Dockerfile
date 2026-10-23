FROM node:20-alpine

# ffmpeg needed for audio transcoding
RUN apk add --no-cache ffmpeg python3

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Ensure data directories exist (mounted as volume on Fly.io)
RUN mkdir -p /app/data /app/config

CMD ["node", "index.js"]
