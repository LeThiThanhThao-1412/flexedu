FROM node:18-alpine

# Cài đặt các thư viện hệ thống cần thiết cho Prisma Engine
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ code
COPY . .

# Quan trọng: Chạy generate TRONG Docker để nó tự tạo Engine phù hợp
RUN npx prisma generate

EXPOSE 3001

CMD ["npm", "run", "dev"]