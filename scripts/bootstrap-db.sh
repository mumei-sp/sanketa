#!/bin/bash

# ============================================================================
# Database Bootstrap Script for Sanketa Fabric
# ============================================================================
# 
# This script initializes the global database for local development.
# Tenant databases are created automatically during user signup.
# It can be used as an alternative to the Maven SQL plugin.
#
# Usage:
#   ./scripts/bootstrap-db.sh [options]
#
# Options:
#   -h, --host HOST          MySQL host (default: localhost)
#   -P, --port PORT          MySQL port (default: 3303)
#   -u, --user USER          MySQL username (default: root)
#   -p, --password PASSWORD  MySQL password (default: empty)
#   -g, --global-db NAME     Global database name (default: sanketa_global)
#   --help                   Show this help message
#
# Examples:
#   ./scripts/bootstrap-db.sh
#   ./scripts/bootstrap-db.sh -u myuser -p mypass
# ============================================================================

set -e  # Exit on error

# Default values
DB_HOST="localhost"
DB_PORT="3303"
DB_USER="root"
DB_PASSWORD=""
GLOBAL_DB_NAME="sanketa_global"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Help function
show_help() {
    cat << EOF
Database Bootstrap Script for Sanketa Fabric

Usage: $0 [OPTIONS]

Options:
    -h, --host HOST          MySQL host (default: localhost)
    -P, --port PORT          MySQL port (default: 3303)
    -u, --user USER          MySQL username (default: root)
    -p, --password PASSWORD  MySQL password (default: empty)
    -g, --global-db NAME     Global database name (default: sanketa_global)
    --help                   Show this help message

Examples:
    $0
    $0 -u myuser -p mypass
    $0 -h db.example.com -P 3307 -u admin -p secret

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--host)
            DB_HOST="$2"
            shift 2
            ;;
        -P|--port)
            DB_PORT="$2"
            shift 2
            ;;
        -u|--user)
            DB_USER="$2"
            shift 2
            ;;
        -p|--password)
            DB_PASSWORD="$2"
            shift 2
            ;;
        -g|--global-db)
            GLOBAL_DB_NAME="$2"
            shift 2
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Print configuration
echo "============================================================================"
echo "Sanketa Fabric Database Bootstrap"
echo "============================================================================"
echo "MySQL Host:     $DB_HOST"
echo "MySQL Port:     $DB_PORT"
echo "MySQL User:     $DB_USER"
echo "Global DB:      $GLOBAL_DB_NAME"
echo "============================================================================"
echo ""

# Function to check MySQL connection
check_mysql_connection() {
    echo -e "${YELLOW}Checking MySQL connection...${NC}"
    local mysql_cmd
    if [ -z "$DB_PASSWORD" ]; then
        mysql_cmd="mysql -h $DB_HOST -P $DB_PORT -u $DB_USER"
    else
        mysql_cmd="mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD"
    fi
    
    if $mysql_cmd -e "SELECT 1" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ MySQL connection successful${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed to connect to MySQL${NC}"
        echo "Please verify:"
        echo "  - MySQL server is running"
        echo "  - Host, port, username, and password are correct"
        echo "  - User has CREATE DATABASE privileges"
        return 1
    fi
}

# Function to check if SQL file exists
check_sql_file() {
    local file_path="$1"
    if [ ! -f "$file_path" ]; then
        echo -e "${RED}✗ SQL file not found: $file_path${NC}"
        return 1
    fi
    return 0
}

# Function to execute SQL file
execute_sql_file() {
    local db_name="$1"
    local sql_file="$2"
    local description="$3"
    
    echo -e "${YELLOW}Initializing $description...${NC}"
    
    local mysql_cmd
    if [ -z "$DB_PASSWORD" ]; then
        mysql_cmd="mysql -h $DB_HOST -P $DB_PORT -u $DB_USER"
    else
        mysql_cmd="mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD"
    fi
    
    if [ -z "$db_name" ]; then
        # Execute without specifying database (for CREATE DATABASE statements)
        if $mysql_cmd < "$sql_file" 2>&1; then
            echo -e "${GREEN}✓ $description initialized successfully${NC}"
            return 0
        else
            echo -e "${RED}✗ Failed to initialize $description${NC}"
            return 1
        fi
    else
        # Execute against specific database
        if $mysql_cmd "$db_name" < "$sql_file" 2>&1; then
            echo -e "${GREEN}✓ $description initialized successfully${NC}"
            return 0
        else
            echo -e "${RED}✗ Failed to initialize $description${NC}"
            return 1
        fi
    fi
}

# Main execution
main() {
    # Check MySQL connection
    if ! check_mysql_connection; then
        exit 1
    fi
    
    # Paths to SQL files
    GLOBAL_SCHEMA="$PROJECT_ROOT/database/global_db_schema.sql"
    
    # Check SQL file exists
    if ! check_sql_file "$GLOBAL_SCHEMA"; then
        exit 1
    fi
    
    # Initialize Global Database
    echo ""
    echo "============================================================================"
    echo "Initializing Global Database"
    echo "============================================================================"
    if ! execute_sql_file "" "$GLOBAL_SCHEMA" "Global database ($GLOBAL_DB_NAME)"; then
        echo -e "${RED}Failed to initialize global database${NC}"
        exit 1
    fi
    
    echo ""
    echo -e "${YELLOW}Note: Tenant databases will be created automatically during user signup.${NC}"
    
    # Success message
    echo ""
    echo "============================================================================"
    echo -e "${GREEN}Database Bootstrap Completed Successfully!${NC}"
    echo "============================================================================"
    echo ""
    echo "Next steps:"
    if [ -z "$DB_PASSWORD" ]; then
        echo "  1. Verify database: mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -e 'SHOW DATABASES;'"
    else
        echo "  1. Verify database: mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p -e 'SHOW DATABASES;'"
    fi
    echo "  2. Start the application: mvn spring-boot:run"
    echo "  3. Check health: curl http://localhost:8080/actuator/health"
    echo ""
}

# Run main function
main
