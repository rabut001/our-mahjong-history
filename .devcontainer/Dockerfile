FROM node:24-bookworm-slim

WORKDIR /workspace

# git: 以降の commit / clone など（node:-slim には含まれない）
# docker.io: ホストの docker.sock 経由で Docker を操作する CLI
# safe.directory: ボリュームマウントで所有者がずれると Git が dubious ownership で拒否するのを防ぐ
RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        docker.io \
        git \
    && git config --global --add safe.directory /workspace \
    && rm -rf /var/lib/apt/lists/*

# WSL + bind mount でも Next.js のホットリロードが効くようにする
ENV WATCHPACK_POLLING=true \
    CHOKIDAR_USEPOLLING=true

RUN ARCH="$(dpkg --print-architecture)" \
    && curl -fsSL "https://github.com/supabase/cli/releases/latest/download/supabase_linux_${ARCH}.tar.gz" \
        | tar -xz -C /usr/local/bin supabase \
    && chmod +x /usr/local/bin/supabase

# デフォルトは sleep 無限などではなく、compose の command で上書きする想定
CMD ["bash"]
