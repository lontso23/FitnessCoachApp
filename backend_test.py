import requests
import sys
import json
from datetime import datetime

class LontsoFitnessAPITester:
    def __init__(self, base_url="https://macro-calculator-8.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.client_id = None
        self.food_id = None
        self.diet_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.text else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error details: {error_detail}")
                except:
                    print(f"   Response text: {response.text}")

            return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test API health check"""
        success, response = self.run_test(
            "API Health Check",
            "GET",
            "",
            200
        )
        return success

    def test_login(self, email, password):
        """Test login and get token"""
        success, response = self.run_test(
            "Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   Token received and user_id: {self.user_id}")
            return True
        return False

    def test_get_current_user(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_create_client(self):
        """Test creating a new client"""
        client_data = {
            "name": "Test Client",
            "age": 30,
            "sex": "H",
            "weight": 75.0,
            "height": 175.0,
            "activity_level": "moderada",
            "protein_percentage": 30.0,
            "carbs_percentage": 40.0,
            "fats_percentage": 30.0
        }
        success, response = self.run_test(
            "Create Client",
            "POST",
            "clients",
            200,
            data=client_data
        )
        if success and 'id' in response:
            self.client_id = response['id']
            print(f"   Client created with ID: {self.client_id}")
            print(f"   TMB: {response.get('tmb', 'N/A')}, Maintenance: {response.get('maintenance_kcal', 'N/A')}")
            return True
        return False

    def test_get_clients(self):
        """Test getting list of clients"""
        success, response = self.run_test(
            "Get Clients List",
            "GET",
            "clients",
            200
        )
        if success:
            print(f"   Found {len(response)} clients")
        return success

    def test_get_client_detail(self):
        """Test getting specific client details"""
        if not self.client_id:
            print("❌ No client_id available for test")
            return False
            
        success, response = self.run_test(
            "Get Client Detail",
            "GET",
            f"clients/{self.client_id}",
            200
        )
        return success

    def test_update_client(self):
        """Test updating client information"""
        if not self.client_id:
            print("❌ No client_id available for test")
            return False
            
        update_data = {
            "weight": 80.0,
            "activity_level": "alta"
        }
        success, response = self.run_test(
            "Update Client",
            "PUT",
            f"clients/{self.client_id}",
            200,
            data=update_data
        )
        if success:
            print(f"   Updated TMB: {response.get('tmb', 'N/A')}, Maintenance: {response.get('maintenance_kcal', 'N/A')}")
        return success

    def test_create_food(self):
        """Test creating a new food item"""
        food_data = {
            "name": "Test Food",
            "kcal_per_100g": 250.0,
            "protein_per_100g": 15.0,
            "carbs_per_100g": 30.0,
            "fats_per_100g": 10.0
        }
        success, response = self.run_test(
            "Create Food",
            "POST",
            "foods",
            200,
            data=food_data
        )
        if success and 'id' in response:
            self.food_id = response['id']
            print(f"   Food created with ID: {self.food_id}")
            return True
        return False

    def test_get_foods(self):
        """Test getting list of foods"""
        success, response = self.run_test(
            "Get Foods List",
            "GET",
            "foods",
            200
        )
        if success:
            print(f"   Found {len(response)} foods")
        return success

    def test_update_food(self):
        """Test updating food information"""
        if not self.food_id:
            print("❌ No food_id available for test")
            return False
            
        update_data = {
            "name": "Updated Test Food",
            "kcal_per_100g": 300.0,
            "protein_per_100g": 20.0,
            "carbs_per_100g": 35.0,
            "fats_per_100g": 12.0
        }
        success, response = self.run_test(
            "Update Food",
            "PUT",
            f"foods/{self.food_id}",
            200,
            data=update_data
        )
        return success

    def test_create_diet(self):
        """Test creating a diet with meals"""
        if not self.client_id or not self.food_id:
            print("❌ Missing client_id or food_id for diet test")
            return False
            
        # Create a simple diet with one meal containing our test food
        diet_data = {
            "client_id": self.client_id,
            "name": "Test Diet Plan",
            "meals": [
                {
                    "meal_number": 1,
                    "meal_name": "Desayuno",
                    "foods": [
                        {
                            "food_id": self.food_id,
                            "food_name": "Updated Test Food",
                            "quantity_g": 100.0,
                            "kcal": 300.0,
                            "protein": 20.0,
                            "carbs": 35.0,
                            "fats": 12.0
                        }
                    ],
                    "total_kcal": 300.0,
                    "total_protein": 20.0,
                    "total_carbs": 35.0,
                    "total_fats": 12.0
                }
            ]
        }
        success, response = self.run_test(
            "Create Diet",
            "POST",
            "diets",
            200,
            data=diet_data
        )
        if success and 'id' in response:
            self.diet_id = response['id']
            print(f"   Diet created with ID: {self.diet_id}")
            print(f"   Total kcal: {response.get('total_kcal', 'N/A')}")
            return True
        return False

    def test_get_diets(self):
        """Test getting list of diets"""
        success, response = self.run_test(
            "Get Diets List",
            "GET",
            "diets",
            200
        )
        if success:
            print(f"   Found {len(response)} diets")
        return success

    def test_get_diet_detail(self):
        """Test getting specific diet details"""
        if not self.diet_id:
            print("❌ No diet_id available for test")
            return False
            
        success, response = self.run_test(
            "Get Diet Detail",
            "GET",
            f"diets/{self.diet_id}",
            200
        )
        return success

    def test_export_diet_pdf(self):
        """Test exporting diet to PDF"""
        if not self.diet_id:
            print("❌ No diet_id available for test")
            return False
            
        success, response = self.run_test(
            "Export Diet PDF",
            "GET",
            f"diets/{self.diet_id}/export",
            200
        )
        return success

    def test_delete_operations(self):
        """Test delete operations (cleanup)"""
        success_count = 0
        
        # Delete diet
        if self.diet_id:
            success, _ = self.run_test(
                "Delete Diet",
                "DELETE",
                f"diets/{self.diet_id}",
                200
            )
            if success:
                success_count += 1
        
        # Delete food
        if self.food_id:
            success, _ = self.run_test(
                "Delete Food",
                "DELETE",
                f"foods/{self.food_id}",
                200
            )
            if success:
                success_count += 1
        
        # Delete client
        if self.client_id:
            success, _ = self.run_test(
                "Delete Client",
                "DELETE",
                f"clients/{self.client_id}",
                200
            )
            if success:
                success_count += 1
        
        return success_count == 3

def main():
    print("🚀 Starting Lontso Fitness API Testing...")
    
    # Initialize tester
    tester = LontsoFitnessAPITester()
    
    # Test credentials from requirements
    test_email = "trainer@lontso.com"
    test_password = "admin123"
    
    # Run all tests in sequence
    tests = [
        tester.test_health_check,
        lambda: tester.test_login(test_email, test_password),
        tester.test_get_current_user,
        tester.test_get_clients,
        tester.test_create_client,
        tester.test_get_client_detail,
        tester.test_update_client,
        tester.test_get_foods,
        tester.test_create_food,
        tester.test_update_food,
        tester.test_create_diet,
        tester.test_get_diets,
        tester.test_get_diet_detail,
        tester.test_export_diet_pdf,
        tester.test_delete_operations
    ]
    
    print(f"\n📋 Running {len(tests)} test suites...")
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
            tester.tests_run += 1

    # Print final results
    print(f"\n📊 FINAL RESULTS:")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "No tests run")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All backend tests passed!")
        return 0
    else:
        print("⚠️  Some backend tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())