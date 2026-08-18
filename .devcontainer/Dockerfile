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

# 手元と CI を揃える。バージョンを上げるときは Dockerfile と .github/workflows/ci.yml を同時に直す。
ARG SUPABASE_CLI_VERSION=2.114.0
RUN ARCH="$(dpkg --print-architecture)" \
    && curl -fsSL "https://github.com/supabase/cli/releases/download/v${SUPABASE_CLI_VERSION}/supabase_linux_${ARCH}.tar.gz" \
        | tar -xz -C /usr/local/bin supabase \
    && chmod +x /usr/local/bin/supabase

# Docker-from-Docker: 公式 CLI は /usr/local/bin/supabase のまま。
# alias で .devcontainer/supabase-workdir.sh へ向ける。
RUN mkdir -p /usr/local/libexec
COPY .devcontainer/supabase-workdir.sh /usr/local/libexec/omh-supabase.sh
COPY .devcontainer/supabase-alias.sh /etc/profile.d/omh-supabase.sh
RUN chmod +x /usr/local/libexec/omh-supabase.sh \
    && printf '\n. /etc/profile.d/omh-supabase.sh\n' >> /etc/bash.bashrc \
    && printf '\n. /etc/profile.d/omh-supabase.sh\n' >> /root/.bashrc
ENV BASH_ENV=/etc/profile.d/omh-supabase.sh

# デフォルトは sleep 無限などではなく、compose の command で上書きする想定
CMD ["bash"]
