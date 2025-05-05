FROM node:20-alpine AS base
WORKDIR /app
COPY package.json .

FROM base AS builder
WORKDIR /app
RUN npm install
COPY . .
RUN npm run build

FROM base AS test
WORKDIR /app
COPY --from=builder /app/node_modules  ./node_modules
COPY . .
CMD ["npm", "run", "test"]

FROM base AS development
WORKDIR /app
COPY --from=builder /app/node_modules  ./node_modules
COPY . .
EXPOSE ${BACKEND_PORT}
CMD ["npm", "run", "start:dev"]

FROM base AS staging
WORKDIR /app
COPY --from=builder /app/node_modules  ./node_modules
COPY --from=builder /app/dist  ./dist
EXPOSE ${BACKEND_PORT}
CMD ["npm", "run", "start:staging"]

FROM base AS production
WORKDIR /app
COPY --from=builder /app/node_modules  ./node_modules
COPY --from=builder /app/dist  ./dist
EXPOSE ${BACKEND_PORT}
CMD ["npm", "run", "start:prod"]