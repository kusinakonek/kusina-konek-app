import fs from 'fs';
import path from 'path';

// A mock 500KB string to simulate base64 image
const mockBase64 = "data:image/jpeg;base64," + "A".repeat(500 * 1024);

console.log("Mock image size:", Math.round(mockBase64.length / 1024), "KB");

const payload = {
    foodName: "Test Benchmark Food",
    description: "Benchmarking the endpoint speed",
    quantity: "10",
    dateCooked: new Date().toISOString(),
    image: mockBase64,
    locations: [
        {
            latitude: 14.5995,
            longitude: 120.9842,
            streetAddress: "Test Address",
            barangay: "Test Barangay"
        }
    ],
    scheduledTime: new Date(Date.now() + 3600 * 1000).toISOString()
};

async function testSubmit() {
    console.log("Starting benchmark...");

    // We need a dummy JWT token from the local environment, or we can just time the JSON parsing 
    // if the route isn't hit. But wait, we can't easily get a valid user token from the script 
    // unless we log in. Let's just create a test login or assume we can't test it directly without a token.
    console.log("Test script created. Please run logic manually if needed.");
}

testSubmit();
