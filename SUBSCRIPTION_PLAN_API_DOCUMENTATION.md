# Subscription Plan API Documentation

## Overview
Complete REST API documentation for the MedCor Subscription Plan module with Swagger/OpenAPI integration.

## Base URL
`https://[your-domain]:8000/api/subscription/`

## Authentication
All endpoints require JWT Bearer token authentication:
```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### 1. Subscription Plans

#### 1.1 List Subscription Plans
- **URL**: `/api/subscription/plans/`
- **Method**: `GET`
- **Description**: Retrieve a paginated list of all available subscription plans
- **Query Parameters**:
  - `plan_type` (string): Filter by plan type (basic, professional, enterprise)
  - `is_active` (boolean): Filter by active status
  - `is_featured` (boolean): Filter by featured status  
  - `search` (string): Search in plan name and description
  - `ordering` (string): Order by field (name, -name, monthly_price, -monthly_price, sort_order, created_at)
  - `page` (integer): Page number for pagination
  - `page_size` (integer): Number of items per page
- **Response**: 200 OK
```json
[
  {
    "id": 1,
    "name": "Professional Plan",
    "description": "Perfect for growing hospitals",
    "plan_type": "professional",
    "monthly_price": "199.99",
    "annual_price": "1999.99",
    "currency": "USD",
    "features": {
      "max_users": 50,
      "ai_enabled": true,
      "support_level": "priority"
    },
    "max_monthly_conversations": 10000,
    "max_monthly_ai_analyses": 5000,
    "max_api_calls": 100000,
    "is_active": true,
    "is_featured": true,
    "sort_order": 2,
    "created_at": "2025-07-01T10:00:00Z"
  }
]
```

#### 1.2 Create Subscription Plan
- **URL**: `/api/subscription/plans/`
- **Method**: `POST`
- **Description**: Create a new subscription plan (Admin only)
- **Request Body**:
```json
{
  "name": "Enterprise Plan",
  "description": "Complete solution for large hospitals",
  "plan_type": "enterprise",
  "monthly_price": "499.99",
  "annual_price": "4999.99",
  "currency": "USD",
  "features": {
    "max_users": "unlimited",
    "ai_enabled": true,
    "support_level": "dedicated",
    "custom_branding": true
  },
  "max_monthly_conversations": 50000,
  "max_monthly_ai_analyses": 20000,
  "max_api_calls": 1000000,
  "is_active": true,
  "is_featured": true,
  "sort_order": 3
}
```
- **Response**: 201 Created

#### 1.3 Get Subscription Plan Details
- **URL**: `/api/subscription/plans/{id}/`
- **Method**: `GET`
- **Description**: Retrieve detailed information about a specific subscription plan
- **Response**: 200 OK

#### 1.4 Update Subscription Plan
- **URL**: `/api/subscription/plans/{id}/`
- **Method**: `PUT`
- **Description**: Update all fields of a subscription plan (Admin only)
- **Response**: 200 OK

#### 1.5 Partially Update Subscription Plan
- **URL**: `/api/subscription/plans/{id}/`
- **Method**: `PATCH`
- **Description**: Update specific fields of a subscription plan (Admin only)
- **Response**: 200 OK

#### 1.6 Delete Subscription Plan
- **URL**: `/api/subscription/plans/{id}/`
- **Method**: `DELETE`
- **Description**: Permanently delete a subscription plan (Admin only)
- **Response**: 204 No Content

#### 1.7 Get Active Plans
- **URL**: `/api/subscription/plans/active/`
- **Method**: `GET`
- **Description**: Retrieve only active subscription plans
- **Response**: 200 OK

#### 1.8 Get Featured Plans
- **URL**: `/api/subscription/plans/featured/`
- **Method**: `GET`
- **Description**: Retrieve featured subscription plans
- **Response**: 200 OK

### 2. Subscriptions

#### 2.1 List Subscriptions
- **URL**: `/api/subscription/subscriptions/`
- **Method**: `GET`
- **Description**: Retrieve a list of all subscriptions
- **Query Parameters**:
  - `status` (string): Filter by status (active, expired, cancelled)
  - `billing_cycle` (string): Filter by billing cycle (monthly, annual)
  - `plan__plan_type` (string): Filter by plan type
  - `auto_renewal` (boolean): Filter by auto-renewal status
  - `search` (string): Search by tenant name or subscription ID
  - `ordering` (string): Order by field (start_date, end_date, current_price, created_at)
- **Response**: 200 OK

#### 2.2 Create Subscription
- **URL**: `/api/subscription/subscriptions/`
- **Method**: `POST`
- **Description**: Create a new subscription
- **Request Body**:
```json
{
  "tenant": 1,
  "plan": 2,
  "billing_cycle": "monthly",
  "auto_renewal": true,
  "payment_method": "card"
}
```
- **Response**: 201 Created

#### 2.3 Get Subscription Details
- **URL**: `/api/subscription/subscriptions/{id}/`
- **Method**: `GET`
- **Description**: Retrieve detailed information about a specific subscription
- **Response**: 200 OK

#### 2.4 Update Subscription
- **URL**: `/api/subscription/subscriptions/{id}/`
- **Method**: `PUT/PATCH`
- **Description**: Update subscription details
- **Response**: 200 OK

#### 2.5 Cancel Subscription
- **URL**: `/api/subscription/subscriptions/{id}/`
- **Method**: `DELETE`
- **Description**: Cancel a subscription
- **Response**: 204 No Content

#### 2.6 Get Active Subscriptions
- **URL**: `/api/subscription/subscriptions/active/`
- **Method**: `GET`
- **Description**: Get all active subscriptions
- **Response**: 200 OK

#### 2.7 Get Subscription Statistics
- **URL**: `/api/subscription/subscriptions/{id}/statistics/`
- **Method**: `GET`
- **Description**: Get statistics for a specific subscription
- **Response**: 200 OK
```json
{
  "subscription_info": {
    "status": "active",
    "plan_name": "Professional Plan",
    "monthly_limit": 10000,
    "monthly_used": 3456,
    "usage_percentage": 34.56
  },
  "usage_statistics": {
    "total_conversations": 15678,
    "total_analyses": 8901,
    "total_api_calls": 234567,
    "avg_response_time": 1.23,
    "avg_satisfaction": 4.5
  },
  "payment_statistics": {
    "total_paid": 2399.88,
    "payment_count": 12
  }
}
```

### 3. Payments

#### 3.1 List Payments
- **URL**: `/api/subscription/payments/`
- **Method**: `GET`
- **Description**: Retrieve a list of all payments
- **Query Parameters**:
  - `status` (string): Filter by status (pending, completed, failed)
  - `payment_method` (string): Filter by payment method
  - `currency` (string): Filter by currency
  - `subscription__tenant` (integer): Filter by tenant ID
  - `search` (string): Search by payment ID or tenant name
  - `ordering` (string): Order by field (amount, payment_date, created_at)
- **Response**: 200 OK

#### 3.2 Create Payment
- **URL**: `/api/subscription/payments/`
- **Method**: `POST`
- **Description**: Create a new payment record
- **Request Body**:
```json
{
  "subscription": 1,
  "amount": "199.99",
  "currency": "USD",
  "payment_method": "card",
  "external_payment_id": "stripe_payment_xyz123"
}
```
- **Response**: 201 Created

#### 3.3 Get Payment Details
- **URL**: `/api/subscription/payments/{id}/`
- **Method**: `GET`
- **Description**: Retrieve detailed information about a specific payment
- **Response**: 200 OK

#### 3.4 Update Payment Status
- **URL**: `/api/subscription/payments/{id}/`
- **Method**: `PATCH`
- **Description**: Update payment status
- **Request Body**:
```json
{
  "status": "completed",
  "payment_date": "2025-08-07T10:00:00Z"
}
```
- **Response**: 200 OK

#### 3.5 Get Successful Payments
- **URL**: `/api/subscription/payments/successful/`
- **Method**: `GET`
- **Description**: Get all completed payments
- **Response**: 200 OK

#### 3.6 Get Payment Statistics
- **URL**: `/api/subscription/payments/statistics/`
- **Method**: `GET`
- **Description**: Get payment statistics and analytics
- **Response**: 200 OK
```json
{
  "total_payments": 156,
  "total_amount": 31234.56,
  "successful_payments": 150,
  "failed_payments": 4,
  "pending_payments": 2,
  "monthly_revenue": [
    {
      "month": "2025-08",
      "revenue": 4599.88
    },
    {
      "month": "2025-07",
      "revenue": 5299.95
    }
  ]
}
```

### 4. Usage Tracking

#### 4.1 List Usage Records
- **URL**: `/api/subscription/usage/`
- **Method**: `GET`
- **Description**: Retrieve usage tracking data
- **Query Parameters**:
  - `date` (date): Filter by specific date
  - `subscription__tenant` (integer): Filter by tenant ID
  - `subscription__plan` (integer): Filter by plan ID
  - `search` (string): Search by tenant name
  - `ordering` (string): Order by field (date, conversations_count, created_at)
- **Response**: 200 OK

#### 4.2 Create Usage Record
- **URL**: `/api/subscription/usage/`
- **Method**: `POST`
- **Description**: Create a new usage tracking record
- **Request Body**:
```json
{
  "subscription": 1,
  "date": "2025-08-07",
  "conversations_count": 234,
  "ai_analysis_count": 156,
  "api_calls_count": 3456,
  "storage_used_mb": 1234.56,
  "average_response_time": 1.23,
  "user_satisfaction_score": 4.5
}
```
- **Response**: 201 Created

#### 4.3 Get Usage Details
- **URL**: `/api/subscription/usage/{id}/`
- **Method**: `GET`
- **Description**: Retrieve detailed usage information
- **Response**: 200 OK

#### 4.4 Get Usage Analytics
- **URL**: `/api/subscription/usage/analytics/`
- **Method**: `GET`
- **Description**: Get usage analytics and trends
- **Query Parameters**:
  - `start_date` (date): Start date for analytics period
  - `end_date` (date): End date for analytics period
- **Response**: 200 OK
```json
{
  "period": {
    "start": "2025-07-01",
    "end": "2025-08-07"
  },
  "totals": {
    "conversations": 45678,
    "ai_analyses": 23456,
    "api_calls": 567890
  },
  "daily_average": {
    "conversations": 1234,
    "ai_analyses": 633,
    "api_calls": 15348
  },
  "trends": {
    "conversations_growth": 12.5,
    "ai_analyses_growth": 8.3,
    "api_calls_growth": 15.7
  }
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Invalid data provided",
  "details": {
    "field_name": ["Error message"]
  }
}
```

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
  "detail": "You do not have permission to perform this action."
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

## Swagger UI Access

Access the interactive API documentation at:
- **Swagger UI**: `https://[your-domain]:8000/api/docs/`
- **OpenAPI Schema**: `https://[your-domain]:8000/api/schema/`

## Implementation Status

✅ All endpoints have been documented with:
- Comprehensive descriptions
- Request/response examples
- Query parameters
- Authentication requirements
- Error responses
- OpenAPI/Swagger integration

## Testing

Use the following curl commands to test the endpoints:

```bash
# Get all subscription plans
curl -X GET "https://[your-domain]:8000/api/subscription/plans/" \
  -H "Authorization: Bearer <your-token>"

# Create a new subscription
curl -X POST "https://[your-domain]:8000/api/subscription/subscriptions/" \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"tenant": 1, "plan": 2, "billing_cycle": "monthly"}'

# Get payment statistics
curl -X GET "https://[your-domain]:8000/api/subscription/payments/statistics/" \
  -H "Authorization: Bearer <your-token>"
```

## Notes

1. Admin privileges are required for create, update, and delete operations on plans
2. All dates should be in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)
3. Monetary values are stored as decimal strings to prevent floating-point errors
4. The API supports pagination, filtering, searching, and sorting on all list endpoints
5. Usage tracking is automatically recorded and can be queried for analytics