FROM node:20-alpine
WORKDIR /app
COPY package.json tsconfig.json next-env.d.ts ./
RUN npm install
COPY app app
COPY components components
COPY lib lib
COPY types types
RUN npm run build
CMD ["npm","start"]
