# Stage 1: Base - Cài đặt dependencies
FROM node:20-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

# Stage 2: Development - Dùng cho docker-compose của bạn
FROM base AS development
# Copy toàn bộ code vào để khởi tạo (sau đó volume sẽ ghi đè lên để hot-reload)
COPY . .
# NestJS thường chạy cổng 3000
EXPOSE 3000
# Port để debug
EXPOSE 9229
CMD ["npm", "run", "start:dev"]

# Stage 3: Build - Biên dịch code sang JS
FROM base AS build
COPY . .
RUN npm run build
# Loại bỏ devDependencies để giảm dung lượng
RUN npm prune --production

# Stage 4: Production - Chạy app thực tế
FROM node:20-alpine AS production
WORKDIR /usr/src/app
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/package*.json ./
EXPOSE 3000
CMD ["node", "dist/main"]