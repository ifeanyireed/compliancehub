#!/bin/bash

# Vercel provides the current Git branch via VERCEL_GIT_COMMIT_REF
if [ "$VERCEL_GIT_COMMIT_REF" == "dev" ]; then
  # Exit 0 means "Cancel Build"
  echo "Build canceled: pushes to the dev branch are not auto-redeployed."
  exit 0
else
  # Exit 1 means "Proceed with Build"
  echo "Build proceeding for branch $VERCEL_GIT_COMMIT_REF."
  exit 1
fi
