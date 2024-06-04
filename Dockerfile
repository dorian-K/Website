FROM node:latest

WORKDIR /app

COPY package* /app/
RUN npm install

RUN curl --proto '=https' --tlsv1.3 https://sh.rustup.rs -sSf | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"
RUN curl --proto '=https' --tlsv1.3 https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf -sSf | sh -s -- -y
RUN rustup toolchain install nightly-2023-09-23
RUN rustup component add rust-src --toolchain nightly-2023-09-23-x86_64-unknown-linux-gnu

COPY . /app
RUN wasm-pack build --target web /app/src/experiments/genetics_rust/wasm
RUN npm run build


FROM alpine:latest
COPY --from=0 /app/dist/ /build

# copy the build artifacts to /out at runtime and set permissions
CMD cp -r /build /out && chmod -R 755 /out