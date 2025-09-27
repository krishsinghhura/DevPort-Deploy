FROM ubuntu:focal

RUN apt-get update \
 && apt-get install -y curl git \
 && curl -sL https://deb.nodesource.com/setup_20.x | bash - \
 && apt-get install -y nodejs \
 && apt-get upgrade -y

WORKDIR /home/app

COPY package*.json ./
COPY .env .env

RUN npm install

COPY main.sh main.sh
COPY src/script.ts src/script.ts
COPY tsconfig.json tsconfig.json

RUN npx tsc -b

RUN chmod +x main.sh

ENTRYPOINT ["/home/app/main.sh"]
