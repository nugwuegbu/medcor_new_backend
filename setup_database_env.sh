#!/bin/bash

# Database Setup Script for MedCor Backend
# This script helps you set up environment variables for your database

echo "🏥 MedCor Backend Database Setup"
echo "=================================="

# Function to set PostgreSQL environment
setup_postgresql() {
    echo "Setting up PostgreSQL environment..."
    read -p "Database name [medcor_db]: " db_name
    db_name=${db_name:-medcor_db}
    
    read -p "Username: " db_user
    read -s -p "Password: " db_password
    echo
    
    read -p "Host [localhost]: " db_host
    db_host=${db_host:-localhost}
    
    read -p "Port [5432]: " db_port
    db_port=${db_port:-5432}
    
    export DB_ENGINE=postgresql
    export DB_NAME=$db_name
    export DB_USER=$db_user
    export DB_PASSWORD=$db_password
    export DB_HOST=$db_host
    export DB_PORT=$db_port
    
    echo "PostgreSQL environment variables set!"
    echo "Run 'source setup_database_env.sh' to load them in your current shell"
}

# Function to set MySQL environment
setup_mysql() {
    echo "Setting up MySQL environment..."
    read -p "Database name [medcor_db]: " db_name
    db_name=${db_name:-medcor_db}
    
    read -p "Username: " db_user
    read -s -p "Password: " db_password
    echo
    
    read -p "Host [localhost]: " db_host
    db_host=${db_host:-localhost}
    
    read -p "Port [3306]: " db_port
    db_port=${db_port:-3306}
    
    export DB_ENGINE=mysql
    export DB_NAME=$db_name
    export DB_USER=$db_user
    export DB_PASSWORD=$db_password
    export DB_HOST=$db_host
    export DB_PORT=$db_port
    
    echo "MySQL environment variables set!"
    echo "Run 'source setup_database_env.sh' to load them in your current shell"
}

# Function to set SQLite environment
setup_sqlite() {
    echo "Setting up SQLite environment..."
    export DB_ENGINE=sqlite
    echo "SQLite environment variables set!"
    echo "Run 'source setup_database_env.sh' to load them in your current shell"
}

# Main menu
echo "Select your database engine:"
echo "1) PostgreSQL"
echo "2) MySQL"
echo "3) SQLite (default)"
echo "4) Exit"

read -p "Enter your choice [1-4]: " choice

case $choice in
    1)
        setup_postgresql
        ;;
    2)
        setup_mysql
        ;;
    3)
        setup_sqlite
        ;;
    4)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid choice. Using SQLite as default."
        setup_sqlite
        ;;
esac

echo ""
echo "To make these changes permanent, add them to your ~/.bashrc or ~/.zshrc file"
echo "Or run this script with 'source setup_database_env.sh' in your current shell" 