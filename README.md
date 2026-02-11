## Paysecure APM gateway connect integration

### Development
```
npm install
npm run dev
```

Docker volume / container config example:
```

  volumes:
    paysecureapm-data:
  paysecureapm-gateway:
    build:
      context: path/to/integration/Dockerfiledirectory
    image: paysecure_apm-gateway:latest
    volumes:
      - paysecureapm-data:/app/data
    stdin_open: true
    tty: true
    environment:
      PORT: 4311
      DATABASE_URL: "file:/app/data/db.sqlite"
      SIGN_KEY: "7c9de985451bd9514b7b06938d20d901"
      API_BASE_URL: "https://api.paysecure.net"
      APP_BASE_URL: "https://app.paysecure.net"
      BUSINESS_URL: "http://business.reactivepay.com"
      CALLBACK_URL: "https://paysecureapm.paysure.global/gateway/callback"
    ports:
      - "4311:4311"
```
