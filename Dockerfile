FROM node:20-alpine

WORKDIR /app

# Install libc compatibility layer for alpine
RUN apk add --no-cache libc6-compat

# Install dependencies based on package.json
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

CMD ["npm", "run", "dev"]
