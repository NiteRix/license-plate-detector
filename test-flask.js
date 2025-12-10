// Simple test to check if Flask API is running
async function testFlaskAPI() {
  try {
    console.log("Testing Flask API health endpoint...")
    
    const healthResponse = await fetch("http://127.0.0.1:8080/health")
    console.log("Health check status:", healthResponse.status)
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json()
      console.log("Health check response:", healthData)
    } else {
      console.log("Health check failed:", healthResponse.statusText)
    }
    
  } catch (error) {
    console.error("Error connecting to Flask API:", error.message)
    console.log("\nPossible issues:")
    console.log("1. Flask server is not running")
    console.log("2. Flask server is running on a different port")
    console.log("3. CORS is not properly configured")
    console.log("\nTo start Flask server, run: python api.py")
  }
}

testFlaskAPI()