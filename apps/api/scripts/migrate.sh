#!/bin/bash
echo "Running database migrations..."
npx prisma migrate deploy \
  --schema=src/prisma/schema.prisma
echo "Migrations complete."
