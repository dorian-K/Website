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

# RUN curl -s https://api.github.com/repos/dorian-K/gamejam-2026/releases/latest | grep "browser_download_url" | grep "upload.zip" | cut -d '"' -f 4 | xargs curl -L -o upload.zip
RUN curl -s https://api.github.com/repos/dorian-K/gamejam-2026/releases/latest | jq -r '.assets[] | select(.name | contains("upload.zip")) | .browser_download_url' \
	| xargs curl -L -o upload.zip
RUN unzip upload.zip -d /app/dist/gamejam-2026

FROM alpine:latest
COPY --from=0 /app/dist/ /build

# copy the build artifacts to /out at runtime and set permissions
CMD cp -r /build/* /out && chmod -R 755 /out