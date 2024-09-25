#
# Base environment
#
FROM node:18.19-alpine AS base
#
# Builder
#
FROM base AS builder
WORKDIR /usr/src/gateway
# COPY example.env ./.env
COPY src ./src
COPY *.json *.lock *.js ./
COPY proto ./proto
# yarn depends on bash and git
# RUN apk add --no-cache bash git yarn python3 make g++

# nest build
RUN yarn install
RUN yarn build
#
# Runtime
#
FROM base
ENV NODE_ENV=production
WORKDIR /app

# COPY --from=builder /build/.env .env
COPY --from=builder /usr/src/gateway/dist dist
# COPY --from=builder /build/api api
COPY --from=builder /usr/src/gateway/node_modules node_modules
COPY --from=builder /usr/src/gateway/package.json package.json
COPY --from=builder /usr/src/gateway/yarn.lock yarn.lock
COPY --from=builder /usr/src/gateway/tsconfig.build.json tsconfig.build.json
COPY --from=builder /usr/src/gateway/tsconfig.json tsconfig.json
COPY --from=builder /usr/src/gateway/proto proto    
CMD [ "yarn", "start:prod" ]