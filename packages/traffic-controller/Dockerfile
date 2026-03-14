FROM rust:1.75-slim-bookworm as builder

WORKDIR /app
COPY . .

# Install dependencies for SQLite
RUN apt-get update && apt-get install -y libsqlite3-dev pkg-config && rm -rf /var/lib/apt/lists/*

RUN cargo build --release

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y libsqlite3-0 ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/target/release/traffic-controller /app/traffic-controller

EXPOSE 3000

CMD ["./traffic-controller"]
