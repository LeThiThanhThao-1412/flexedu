# services/course-service/Dockerfile
FROM node:18-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy package files trước để cache layer
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ code
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3003

CMD ["npm", "run", "start"]