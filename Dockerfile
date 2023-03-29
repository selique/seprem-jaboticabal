FROM node:lts as dependencies
WORKDIR /seprem-jaboticabal 
COPY package.json package-lock.json ./
RUN npm ci

FROM node:lts as builder
WORKDIR /seprem-jaboticabal
COPY . .
COPY --from=dependencies /seprem-jaboticabal/node_modules ./node_modules
RUN npm run build

FROM node:lts as runner
WORKDIR /seprem-jaboticabal
ENV NODE_ENV production
# If you are using a custom next.config.js file, uncomment this line.
COPY --from=builder /seprem-jaboticabal/next.config.js ./
COPY --from=builder /seprem-jaboticabal/public ./public
COPY --from=builder /seprem-jaboticabal/.next ./.next
COPY --from=builder /seprem-jaboticabal/node_modules ./node_modules
COPY --from=builder /seprem-jaboticabal/package.json ./package.json

EXPOSE 3000
CMD ["npm", "run", "start"]