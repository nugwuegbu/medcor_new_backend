"""
Test script to verify knowledge base integration with health queries
"""
import requests
import json

# Test endpoint
BASE_URL = "http://localhost:8000"

# Test hospital ID (from the example provided)
HOSPITAL_ID = "95acef1a-c4a5-4f24-a589-d46231697c1e"

def test_knowledgebase_retrieval():
    """Test retrieving knowledge base for a hospital"""
    print("Testing knowledge base retrieval...")
    
    url = f"{BASE_URL}/api/knowledgebase/hospital/{HOSPITAL_ID}/knowledge-base/"
    
    headers = {
        "accept": "application/json"
    }
    
    try:
        response = requests.get(url, headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("\nKnowledge Base Retrieved Successfully:")
            print(json.dumps(data, indent=2))
            return data
        else:
            print(f"Error: {response.text}")
            return None
    except Exception as e:
        print(f"Error retrieving knowledge base: {str(e)}")
        return None


def test_health_query_with_hospital():
    """Test health query with hospital ID"""
    print("\n\nTesting health query with hospital ID...")
    
    url = f"{BASE_URL}/api/ai/query/"
    
    payload = {
        "question": "What are the symptoms of diabetes?",
        "hospital": HOSPITAL_ID
    }
    
    headers = {
        "accept": "application/json",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("\nHealth Query Response:")
            print(f"Success: {data.get('success')}")
            print(f"Query Type: {data.get('query_type')}")
            print(f"Response: {data.get('response')}")
            print(f"\nFull Response:")
            print(json.dumps(data, indent=2))
            return data
        else:
            print(f"Error: {response.text}")
            return None
    except Exception as e:
        print(f"Error making health query: {str(e)}")
        return None


def test_health_query_without_hospital():
    """Test health query without hospital ID"""
    print("\n\nTesting health query without hospital ID...")
    
    url = f"{BASE_URL}/api/ai/query/"
    
    payload = {
        "question": "What are the symptoms of diabetes?"
    }
    
    headers = {
        "accept": "application/json",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("\nHealth Query Response:")
            print(f"Success: {data.get('success')}")
            print(f"Query Type: {data.get('query_type')}")
            print(f"Response: {data.get('response')}")
            return data
        else:
            print(f"Error: {response.text}")
            return None
    except Exception as e:
        print(f"Error making health query: {str(e)}")
        return None


if __name__ == "__main__":
    print("=" * 60)
    print("Knowledge Base Integration Test")
    print("=" * 60)
    
    # Test 1: Retrieve knowledge base
    kb_data = test_knowledgebase_retrieval()
    
    # Test 2: Health query with hospital ID
    test_health_query_with_hospital()
    
    # Test 3: Health query without hospital ID
    test_health_query_without_hospital()
    
    print("\n" + "=" * 60)
    print("Tests completed!")
    print("=" * 60)












