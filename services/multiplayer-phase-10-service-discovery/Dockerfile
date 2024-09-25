#
# Base environment
#
FROM node:18.19-alpine AS base
RUN apk --no-cache add curl
#
# Builder
#
FROM base AS builder
WORKDIR /usr/src/service-discovery
# COPY example.env ./.env
COPY proto ./proto
COPY src ./src
COPY *.json *.lock *.js ./
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
COPY --from=builder /usr/src/service-discovery/dist dist
# COPY --from=builder /build/api api
COPY --from=builder /usr/src/service-discovery/node_modules node_modules
COPY --from=builder /usr/src/service-discovery/package.json package.json
COPY --from=builder /usr/src/service-discovery/yarn.lock yarn.lock
COPY --from=builder /usr/src/service-discovery/tsconfig.build.json tsconfig.build.json
COPY --from=builder /usr/src/service-discovery/tsconfig.json tsconfig.json
COPY --from=builder /usr/src/service-discovery/proto proto
CMD [ "yarn", "start:prod" ]