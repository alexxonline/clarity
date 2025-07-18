#!/usr/bin/env python3
"""
Simple test script for the Audio Transcription API
"""

import requests
import time
import json
import os


def test_api():
    base_url = "http://localhost:8000"
    
    print("🚀 Testing Audio Transcription API")
    print("="*50)
    
    # Test health check
    print("\n1. Testing health check...")
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"   Response: {response.json()}")
        else:
            print("❌ Health check failed")
            return
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return
    
    # Test file upload (you'll need to provide a test audio file)
    print("\n2. Testing file upload...")
    test_file_path = "test_audio.wav"  # You'll need to provide this
    
    if not os.path.exists(test_file_path):
        print(f"⚠️  Test file {test_file_path} not found")
        print("   Please provide a test audio file to fully test the API")
        return
    
    try:
        with open(test_file_path, "rb") as f:
            files = {"file": f}
            response = requests.post(f"{base_url}/api/upload", files=files)
        
        if response.status_code == 200:
            upload_result = response.json()
            print("✅ File upload successful")
            print(f"   Transcript ID: {upload_result['transcript_id']}")
            print(f"   Status: {upload_result['status']}")
            
            transcript_id = upload_result['transcript_id']
            
            # Test transcript retrieval
            print("\n3. Testing transcript retrieval...")
            print("   Waiting for transcription to complete...")
            
            max_attempts = 30
            for attempt in range(max_attempts):
                response = requests.get(f"{base_url}/api/transcript/{transcript_id}")
                if response.status_code == 200:
                    result = response.json()
                    if result['status'] == 'completed':
                        print("✅ Transcription completed!")
                        print(f"   Transcript: {result['transcript'][:100]}...")
                        print(f"   Metadata: {json.dumps(result['metadata'], indent=2)}")
                        
                        # Test speaker renaming
                        print("\n4. Testing speaker renaming...")
                        speakers = result['metadata']['speakers']
                        if speakers:
                            rename_request = {
                                "transcript_id": transcript_id,
                                "current_name": speakers[0],
                                "new_name": "Alice"
                            }
                            response = requests.post(f"{base_url}/api/transcript/speakers", json=rename_request)
                            if response.status_code == 200:
                                print("✅ Speaker renaming successful")
                                print(f"   {response.json()['message']}")
                            else:
                                print("❌ Speaker renaming failed")
                        break
                    elif result['status'] == 'pending':
                        print(f"   Attempt {attempt + 1}/{max_attempts}: Still pending...")
                        time.sleep(2)
                    else:
                        print(f"❌ Transcription failed with status: {result['status']}")
                        break
                else:
                    print(f"❌ Error getting transcript: {response.status_code}")
                    break
            else:
                print("❌ Transcription timeout")
                
        else:
            print(f"❌ File upload failed: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Upload test failed: {e}")
    
    print("\n" + "="*50)
    print("✅ API testing completed!")


if __name__ == "__main__":
    test_api()
