#!/bin/bash

# start.sh - Script to start the Green-Tech Inventory Assistant
# Usage:
#   ./start.sh              - Start all Docker services
#   ./start.sh start_dags   - Start services AND unpause all Airflow DAGs
#   ./start.sh init         - Start services AND run first-time setup (seed + train + start_dags)

cd "$(dirname "$0")"

COMMAND=${1:-""}

start_services() {
    echo "Starting Green-Tech Inventory Assistant..."
    docker compose up -d
    echo ""
    echo "Web Interfaces:"
    echo "  - Frontend:  http://localhost:5173"
    echo "  - Backend:   http://localhost:8000/docs"
    echo "  - Airflow:   http://localhost:8080 (admin/admin)"
    echo "  - MLflow:    http://localhost:5001"
}

start_dags() {
    echo ""
    echo "Waiting for Airflow webserver to be ready..."
    for i in $(seq 1 30); do
        if curl -s -f -m 2 http://localhost:8080/health > /dev/null 2>&1; then
            echo "Airflow is ready."
            break
        fi
        echo "  Attempt $i/30 — not ready yet, retrying in 5s..."
        sleep 5
    done

    DAGS=("inference_dag" "drift_detection_dag" "retraining_dag")
    for dag in "${DAGS[@]}"; do
        echo "Unpausing DAG: $dag..."
        curl -s -X PATCH "http://localhost:8080/api/v1/dags/$dag" \
            -H "Content-Type: application/json" \
            -u admin:admin \
            -d '{"is_paused": false}' > /dev/null
        echo "  ✅ $dag unpaused"
    done
    echo ""
    echo "All DAGs are now active!"
}

init_system() {
    echo ""
    echo "Running first-time initialization..."

    echo "  [1/4] Seeding inventory..."
    curl -s -X POST http://localhost:8000/seed > /dev/null
    echo "  ✅ Inventory seeded"

    echo "  [2/4] Generating usage history..."
    docker compose exec -T backend python ml/data_generator.py > /dev/null 2>&1
    echo "  ✅ Usage history generated"

    echo "  [3/4] Training ML model..."
    docker compose exec -T backend python ml/train.py > /dev/null 2>&1
    echo "  ✅ Model trained and registered in MLflow"

    echo "  [4/4] Promoting model to Production..."
    docker compose exec -T backend python -c "
from mlflow.tracking import MlflowClient
import os
os.environ['MLFLOW_TRACKING_URI'] = 'http://mlflow:5000'
client = MlflowClient()
versions = client.get_latest_versions('inventory-forecaster', stages=['None'])
if versions:
    client.transition_model_version_stage('inventory-forecaster', versions[-1].version, 'Production', archive_existing_versions=True)
    print('Promoted version', versions[-1].version)
" 2>/dev/null
    echo "  ✅ Model promoted to Production"
}

# Main execution
start_services

case $COMMAND in
    "start_dags")
        start_dags
        ;;
    "init")
        sleep 8
        init_system
        start_dags
        ;;
    "")
        echo ""
        echo "Tip: Run './start.sh init' for first-time setup (seeds data, trains model, starts DAGs)"
        echo "     Run './start.sh start_dags' to just toggle on the Airflow DAGs"
        ;;
    *)
        echo "Unknown command: $COMMAND"
        echo "Usage: ./start.sh [start_dags|init]"
        exit 1
        ;;
esac
