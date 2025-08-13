FROM node:20-alpine
WORKDIR /app
COPY package.json ./package.json
RUN npm i --production
COPY . .
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s CMD node src/healthcheck.js || exit 1
CMD ["npm","start"]
