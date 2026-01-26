# --- Development Stage ---
FROM node:25-alpine AS development
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm install
COPY ./src ./src
# COPY ./.env.example ./.env
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine AS production
# Set the working directory for the production application
WORKDIR /app
# Set environment variables
ENV NODE_ENV=production
# Copy only necessary production artifacts from the development stage
COPY --from=development /app/dist ./dist
COPY --from=development /app/package*.json ./
COPY ./.env.example ./.env
# Install production dependencies only
RUN npm install --omit=dev
CMD ["npm", "run", "serve"]
