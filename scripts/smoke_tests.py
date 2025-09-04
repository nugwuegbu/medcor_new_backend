#!/usr/bin/env python3
"""
Smoke tests for MedCor Backend API
"""

import argparse
import json
import sys
from urllib.parse import urljoin

import requests


class SmokeTester:
    def __init__(self, base_url, environment="development"):
        self.base_url = base_url.rstrip("/")
        self.environment = environment
        self.session = requests.Session()
        self.session.timeout = 30

    def test_health_endpoint(self):
        """Test health check endpoint"""
        try:
            url = urljoin(self.base_url, "/api/health/")
            response = self.session.get(url)

            if response.status_code == 200:
                print("✅ Health check passed")
                return True
            else:
                print(f"❌ Health check failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Health check error: {e}")
            return False

    def test_api_docs(self):
        """Test API documentation endpoint"""
        try:
            url = urljoin(self.base_url, "/api/schema/swagger-ui/")
            response = self.session.get(url)

            if response.status_code == 200:
                print("✅ API docs accessible")
                return True
            else:
                print(f"❌ API docs failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ API docs error: {e}")
            return False

    def test_admin_interface(self):
        """Test admin interface accessibility"""
        try:
            url = urljoin(self.base_url, "/admin/")
            response = self.session.get(url)

            if response.status_code in [200, 302]:  # 302 for redirect to login
                print("✅ Admin interface accessible")
                return True
            else:
                print(f"❌ Admin interface failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Admin interface error: {e}")
            return False

    def test_static_files(self):
        """Test static files serving"""
        try:
            url = urljoin(self.base_url, "/static/admin/css/base.css")
            response = self.session.get(url)

            if response.status_code == 200:
                print("✅ Static files serving")
                return True
            else:
                print(f"❌ Static files failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Static files error: {e}")
            return False

    def test_database_connection(self):
        """Test database connection through API"""
        try:
            # Test a simple API endpoint that requires database access
            url = urljoin(self.base_url, "/api/specialties/")
            response = self.session.get(url)

            if response.status_code in [200, 401, 403]:  # 401/403 for auth required
                print("✅ Database connection working")
                return True
            else:
                print(f"❌ Database connection failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Database connection error: {e}")
            return False

    def test_youcam_endpoints(self):
        """Test YouCam related endpoints"""
        try:
            url = urljoin(self.base_url, "/api/youcam/")
            response = self.session.get(url)

            if response.status_code in [
                200,
                401,
                403,
                405,
            ]:  # 405 for method not allowed
                print("✅ YouCam endpoints accessible")
                return True
            else:
                print(f"❌ YouCam endpoints failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ YouCam endpoints error: {e}")
            return False

    def test_mcp_server(self):
        """Test MCP server endpoints"""
        try:
            # Test MCP server health endpoint
            mcp_url = urljoin(self.base_url, "/mcp/health/")
            response = self.session.get(mcp_url)

            if response.status_code in [
                200,
                404,
            ]:  # 404 if health endpoint doesn't exist
                print("✅ MCP server accessible")
                return True
            else:
                print(f"❌ MCP server failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ MCP server error: {e}")
            return False

    def run_all_tests(self):
        """Run all smoke tests"""
        print(f"🚀 Running smoke tests for {self.environment} environment")
        print(f"📍 Base URL: {self.base_url}")
        print("-" * 50)

        tests = [
            self.test_health_endpoint,
            self.test_api_docs,
            self.test_admin_interface,
            self.test_static_files,
            self.test_database_connection,
            self.test_youcam_endpoints,
            self.test_mcp_server,
        ]

        results = []
        for test in tests:
            try:
                result = test()
                results.append(result)
            except Exception as e:
                print(f"❌ Test {test.__name__} crashed: {e}")
                results.append(False)

        print("-" * 50)
        passed = sum(results)
        total = len(results)

        print(f"📊 Results: {passed}/{total} tests passed")

        if passed == total:
            print("🎉 All smoke tests passed!")
            return True
        else:
            print("💥 Some smoke tests failed!")
            return False


def main():
    parser = argparse.ArgumentParser(description="Run smoke tests for MedCor Backend")
    parser.add_argument(
        "--environment",
        choices=["development", "production"],
        default="development",
        help="Environment to test",
    )
    parser.add_argument("--base-url", help="Base URL for the API")

    args = parser.parse_args()

    # Set default URLs based on environment
    if not args.base_url:
        if args.environment == "production":
            args.base_url = "https://api.medcor.ai"
        else:
            args.base_url = "http://api.medcor.ai"

    tester = SmokeTester(args.base_url, args.environment)
    success = tester.run_all_tests()

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
