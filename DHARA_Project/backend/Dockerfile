FROM golang:1.22-alpine AS build
WORKDIR /app
COPY go.mod ./
RUN go mod download || true
COPY . .
RUN go mod tidy && CGO_ENABLED=0 go build -o /dhara-server ./cmd/server

FROM alpine:3.19
RUN apk add --no-cache ca-certificates
COPY --from=build /dhara-server /usr/local/bin/dhara-server
EXPOSE 8080
ENTRYPOINT ["dhara-server"]
