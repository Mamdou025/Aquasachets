FROM python:3.12-slim-bookworm

ENV DEBIAN_FRONTEND=noninteractive

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl wget ca-certificates \
    git \
    libldap2-dev libsasl2-dev \
    libpq-dev \
    libxml2-dev libxslt1-dev \
    libjpeg-dev zlib1g-dev libfreetype6-dev liblcms2-dev \
    libopenjp2-7-dev libtiff6 libwebp-dev \
    libssl-dev libffi-dev libzip-dev \
    npm node-less \
    && rm -rf /var/lib/apt/lists/*

# rtlcss for RTL language support
RUN npm install -g rtlcss && npm cache clean --force

# wkhtmltopdf for PDF reports (non-fatal if download fails)
RUN wget -qO /tmp/wk.deb \
    https://github.com/wkhtmltopdf/packaging/releases/download/0.12.6.1-3/wkhtmltox_0.12.6.1-3.bookworm_amd64.deb \
    && apt-get update \
    && apt-get install -y --no-install-recommends /tmp/wk.deb \
    && rm /tmp/wk.deb \
    && rm -rf /var/lib/apt/lists/* \
    || echo "wkhtmltopdf skipped — PDF reports unavailable"

# odoo system user + data directory
RUN useradd --system --home-dir /var/lib/odoo --create-home --shell /bin/bash odoo \
    && mkdir -p /etc/odoo \
    && chown odoo:odoo /var/lib/odoo

# Install Python dependencies from Odoo's requirements
# (source itself is mounted at /odoo at runtime via docker-compose volume)
COPY odoo-19.0/requirements.txt /tmp/odoo-requirements.txt
RUN pip install --no-cache-dir -r /tmp/odoo-requirements.txt \
    && rm /tmp/odoo-requirements.txt

USER odoo
EXPOSE 8069 8072

CMD ["python", "/odoo/odoo-bin", "--config=/etc/odoo/odoo.conf"]
