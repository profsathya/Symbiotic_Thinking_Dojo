FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund
COPY . .
ARG NEXT_PUBLIC_API_URL=https://dojo-backend-dgn5kavnea-uc.a.run.app
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build
ENV PORT=8080
EXPOSE 8080
CMD ["sh", "-c", "npm start -- -p ${PORT:-8080}"]
