#!/usr/bin/env python3
"""
Requirements Management Script for MedCor Backend
This script helps maintain and update requirements.txt files for different environments.
"""

import subprocess
import sys
import os
from pathlib import Path
from typing import Dict, List, Tuple
import re

class RequirementsManager:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.requirements_files = {
            'dev': 'requirements-dev.txt',
            'prod': 'requirements-prod.txt',
            'full': 'requirements.txt'
        }
        
    def get_installed_packages(self) -> Dict[str, str]:
        """Get currently installed packages and their versions."""
        try:
            result = subprocess.run([sys.executable, '-m', 'pip', 'freeze'], 
                                  capture_output=True, text=True, check=True)
            packages = {}
            for line in result.stdout.strip().split('\n'):
                if '==' in line:
                    name, version = line.split('==', 1)
                    packages[name.lower()] = version
            return packages
        except subprocess.CalledProcessError as e:
            print(f"Error getting installed packages: {e}")
            return {}
    
    def get_package_info(self, package_name: str) -> Dict[str, str]:
        """Get detailed information about a specific package."""
        try:
            result = subprocess.run([sys.executable, '-m', 'pip', 'show', package_name], 
                                  capture_output=True, text=True, check=True)
            info = {}
            for line in result.stdout.strip().split('\n'):
                if ':' in line:
                    key, value = line.split(':', 1)
                    info[key.strip().lower()] = value.strip()
            return info
        except subprocess.CalledProcessError:
            return {}
    
    def update_requirements_file(self, file_path: str, packages: Dict[str, str], 
                               environment: str = 'full') -> None:
        """Update a requirements file with current package versions."""
        file_path = self.project_root / file_path
        
        # Define core packages for each environment
        core_packages = {
            'prod': [
                'django', 'djangorestframework', 'djangorestframework-simplejwt',
                'django-cors-headers', 'django-filter', 'whitenoise',
                'psycopg2-binary', 'bcrypt', 'pyjwt', 'drf-spectacular',
                'pillow', 'requests', 'openai', 'langchain', 'langchain-openai',
                'langchain-community', 'langchain-core', 'beautifulsoup4',
                'pypdf2', 'python-docx', 'lxml', 'gunicorn', 'python-dotenv',
                'fastmcp', 'mcp', 'celery', 'kombu', 'billiard', 'amqp',
                'redis', 'asgiref', 'sqlparse', 'pytz', 'tzdata',
                'pydantic', 'pydantic-core', 'pydantic-settings', 'numpy',
                'httpx', 'httpcore', 'orjson', 'jsonschema',
                'jsonschema-specifications', 'python-dateutil', 'urllib3',
                'certifi', 'charset-normalizer', 'idna', 'six', 'packaging',
                'tenacity', 'tiktoken', 'regex', 'typing-extensions',
                'annotated-types', 'sqlalchemy'
            ],
            'dev': [
                'pytest', 'pytest-django', 'coverage', 'black', 'flake8',
                'isort', 'bandit', 'safety', 'mypy-extensions', 'types-requests',
                'types-urllib3', 'django-extensions', 'django-debug-toolbar',
                'sphinx', 'sphinx-rtd-theme', 'django-silk', 'memory-profiler',
                'factory-boy', 'faker', 'django-test-plus'
            ],
            'full': list(packages.keys())  # All packages for full requirements
        }
        
        # Get packages to include
        if environment in core_packages:
            packages_to_include = {k: v for k, v in packages.items() 
                                 if k in core_packages[environment]}
        else:
            packages_to_include = packages
        
        # Create requirements content
        content = f"# {environment.upper()} Requirements for MedCor Backend\n"
        content += f"# Generated on {self.get_current_timestamp()}\n\n"
        
        # Group packages by category
        categories = {
            'Django and REST Framework': ['django', 'djangorestframework', 'djangorestframework-simplejwt'],
            'Django Extensions and Middleware': ['django-cors-headers', 'django-filter', 'whitenoise'],
            'Database': ['psycopg2-binary', 'sqlalchemy'],
            'Authentication and Security': ['bcrypt', 'pyjwt'],
            'API Documentation': ['drf-spectacular'],
            'Image Processing': ['pillow'],
            'HTTP Requests': ['requests', 'httpx', 'httpcore'],
            'AI and LangChain': ['openai', 'langchain', 'langchain-openai', 'langchain-community', 'langchain-core'],
            'Web Scraping and Document Processing': ['beautifulsoup4', 'pypdf2', 'python-docx', 'lxml'],
            'Web Server': ['gunicorn'],
            'Environment and Configuration': ['python-dotenv'],
            'MCP Server': ['fastmcp', 'mcp'],
            'Celery and Task Queue': ['celery', 'kombu', 'billiard', 'amqp'],
            'Redis': ['redis'],
            'Core Dependencies': ['asgiref', 'sqlparse', 'pytz', 'tzdata'],
            'Data Processing and Validation': ['pydantic', 'pydantic-core', 'pydantic-settings', 'numpy'],
            'JSON and Data Serialization': ['orjson', 'jsonschema', 'jsonschema-specifications'],
            'Utilities': ['python-dateutil', 'urllib3', 'certifi', 'charset-normalizer', 'idna', 'six', 'packaging', 'tenacity', 'tiktoken', 'regex'],
            'Type Checking and Extensions': ['typing-extensions', 'annotated-types'],
            'Testing and Development': ['pytest', 'pytest-django', 'coverage', 'black', 'flake8', 'isort', 'bandit', 'safety', 'mypy-extensions', 'types-requests', 'types-urllib3', 'django-extensions', 'django-debug-toolbar', 'sphinx', 'sphinx-rtd-theme', 'django-silk', 'memory-profiler', 'factory-boy', 'faker', 'django-test-plus']
        }
        
        # Add packages by category
        for category, package_list in categories.items():
            category_packages = {k: v for k, v in packages_to_include.items() 
                               if k in package_list}
            if category_packages:
                content += f"# {category}\n"
                for package, version in sorted(category_packages.items()):
                    content += f"{package}=={version}\n"
                content += "\n"
        
        # Add any remaining packages
        remaining_packages = {k: v for k, v in packages_to_include.items() 
                            if not any(k in cat_list for cat_list in categories.values())}
        if remaining_packages:
            content += "# Other Dependencies\n"
            for package, version in sorted(remaining_packages.items()):
                content += f"{package}=={version}\n"
        
        # Write to file
        with open(file_path, 'w') as f:
            f.write(content)
        
        print(f"✅ Updated {file_path} with {len(packages_to_include)} packages")
    
    def get_current_timestamp(self) -> str:
        """Get current timestamp for file headers."""
        from datetime import datetime
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    def update_all_requirements(self) -> None:
        """Update all requirements files."""
        print("🔄 Updating all requirements files...")
        
        # Get current packages
        packages = self.get_installed_packages()
        print(f"📦 Found {len(packages)} installed packages")
        
        # Update each requirements file
        for env, filename in self.requirements_files.items():
            self.update_requirements_file(filename, packages, env)
        
        print("✅ All requirements files updated!")
    
    def check_outdated_packages(self) -> None:
        """Check for outdated packages."""
        print("🔍 Checking for outdated packages...")
        try:
            result = subprocess.run([sys.executable, '-m', 'pip', 'list', '--outdated'], 
                                  capture_output=True, text=True, check=True)
            if result.stdout.strip():
                print("📋 Outdated packages found:")
                print(result.stdout)
            else:
                print("✅ All packages are up to date!")
        except subprocess.CalledProcessError as e:
            print(f"Error checking outdated packages: {e}")
    
    def install_requirements(self, environment: str = 'prod') -> None:
        """Install requirements for a specific environment."""
        if environment not in self.requirements_files:
            print(f"❌ Unknown environment: {environment}")
            return
        
        filename = self.requirements_files[environment]
        file_path = self.project_root / filename
        
        if not file_path.exists():
            print(f"❌ Requirements file not found: {file_path}")
            return
        
        print(f"📦 Installing requirements for {environment} environment...")
        try:
            subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', str(file_path)], 
                          check=True)
            print(f"✅ Successfully installed {environment} requirements!")
        except subprocess.CalledProcessError as e:
            print(f"❌ Error installing requirements: {e}")
    
    def generate_requirements_from_environment(self) -> None:
        """Generate requirements.txt from current environment."""
        print("🔄 Generating requirements.txt from current environment...")
        packages = self.get_installed_packages()
        self.update_requirements_file('requirements.txt', packages, 'full')
        print("✅ requirements.txt generated from current environment!")

def main():
    manager = RequirementsManager()
    
    if len(sys.argv) < 2:
        print("Usage: python manage_requirements.py <command> [environment]")
        print("Commands:")
        print("  update-all          - Update all requirements files")
        print("  update <env>        - Update specific environment (dev/prod/full)")
        print("  install <env>       - Install requirements for environment")
        print("  check-outdated      - Check for outdated packages")
        print("  generate            - Generate requirements.txt from current environment")
        return
    
    command = sys.argv[1]
    
    if command == 'update-all':
        manager.update_all_requirements()
    elif command == 'update':
        environment = sys.argv[2] if len(sys.argv) > 2 else 'full'
        packages = manager.get_installed_packages()
        manager.update_requirements_file(manager.requirements_files[environment], 
                                       packages, environment)
    elif command == 'install':
        environment = sys.argv[2] if len(sys.argv) > 2 else 'prod'
        manager.install_requirements(environment)
    elif command == 'check-outdated':
        manager.check_outdated_packages()
    elif command == 'generate':
        manager.generate_requirements_from_environment()
    else:
        print(f"❌ Unknown command: {command}")

if __name__ == '__main__':
    main()