#!/bin/bash
cd "$(dirname "$0")"

show_usage() {
    echo "Usage: ./view_logs.sh [component]"
    echo ""
    echo "Available components:"
    echo "  all             - View logs for all services"
    echo "  backend         - FastAPI backend service"
    echo "  frontend        - React frontend service"
    echo "  airflow-web     - Airflow webserver"
    echo "  airflow-sched   - Airflow scheduler"
    echo "  mlflow          - MLflow tracking server"
    echo "  evidently       - Evidently AI service"
    echo "  postgres        - PostgreSQL database"
    echo ""
    echo "Example: ./view_logs.sh backend"
}

if [ -z "$1" ]; then
    show_usage
    exit 1
fi

COMPONENT=$1

case $COMPONENT in
    "all")
        docker compose logs -f
        ;;
    "backend")
        docker compose logs -f backend
        ;;
    "frontend")
        docker compose logs -f frontend
        ;;
    "airflow-web")
        docker compose logs -f airflow-webserver
        ;;
    "airflow-sched")
        docker compose logs -f airflow-scheduler
        ;;
    "mlflow")
        docker compose logs -f mlflow
        ;;
    "evidently")
        docker compose logs -f evidently
        ;;
    "postgres")
        docker compose logs -f postgres
        ;;
    *)
        echo "Error: Unknown component '$COMPONENT'"
        echo ""
        show_usage
        exit 1
        ;;
esac
