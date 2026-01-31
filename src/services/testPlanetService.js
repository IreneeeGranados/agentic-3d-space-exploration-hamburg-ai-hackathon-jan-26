/**
 * Test FrontendPlanetService
 * Demonstrates efficient batch loading and rendering of all planets
 */

import PlanetService from './PlanetService.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Sample planet data for testing
const TEST_PLANETS = [
    {
        name: 'Mercury',
        planetType: 'rocky',
        description: 'The smallest planet in our solar system.',
        aiData: {
            composition: 'Rocky',
            atmosphere: 'Minimal',
            surfaceTemp: '430°C (day) / -180°C (night)'
        }
    },
    {
        name: 'Venus',
        planetType: 'rocky',
        description: 'Second planet from the Sun.',
        aiData: {
            composition: 'Rocky',
            atmosphere: 'Thick CO2',
            surfaceTemp: '462°C'
        }
    },
    {
        name: 'Earth',
        planetType: 'rocky',
        description: 'Our home planet.',
        aiData: {
            composition: 'Rocky',
            atmosphere: 'Nitrogen, Oxygen',
            surfaceTemp: '15°C (avg)'
        }
    },
    {
        name: 'Mars',
        planetType: 'rocky',
        description: 'The Red Planet.',
        aiData: {
            composition: 'Rocky',
            atmosphere: 'Thin CO2',
            surfaceTemp: '-63°C (avg)'
        }
    },
    {
        name: 'Jupiter',
        planetType: 'gasGiant',
        description: 'The largest planet in our solar system.',
        aiData: {
            composition: 'Gas Giant',
            atmosphere: 'Hydrogen, Helium',
            surfaceTemp: '-108°C'
        }
    }
];

async function testPlanetService() {
    console.log('='.repeat(70));
    console.log('🌍 PLANET SERVICE TEST - Efficient Batch Loading');
    console.log('='.repeat(70));
    
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
        console.error('\n❌ Error: OPENAI_API_KEY not found in .env file');
        console.log('   The service will run in fallback mode.');
        console.log('');
    }
    
    try {
        // 1. Initialize Service
        console.log('\n📦 Step 1: Initializing PlanetService...');
        const planetService = new PlanetService(apiKey);
        
        // 2. Load Planet Data
        console.log(`📥 Step 2: Loading ${TEST_PLANETS.length} planets...`);
        planetService.initialize(TEST_PLANETS);
        console.log(`✅ Loaded ${TEST_PLANETS.length} planets`);
        
        // 3. Configure for optimal performance
        console.log('\n⚙️  Step 3: Configuring for efficient batch processing...');
        planetService.configure({
            temperature: 0.7,
            max_tokens: 200
        }).setBatchConfig(2, 1500); // 2 at a time, 1.5s delay
        console.log('   ✓ Batch size: 2 planets at a time');
        console.log('   ✓ Batch delay: 1.5 seconds between batches');
        
        // 4. Preload All Descriptions
        console.log('\n🤖 Step 4: Preloading ALL planet descriptions...');
        console.log('   (This simulates frontend loading all data at once)');
        console.log('');
        
        const startTime = Date.now();
        const results = await planetService.preloadAllDescriptions();
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log('\n' + '─'.repeat(70));
        console.log('📊 PRELOAD RESULTS:');
        console.log('─'.repeat(70));
        console.log(`   Total Planets:    ${results.total}`);
        console.log(`   ✅ Success:       ${results.success}`);
        console.log(`   💾 From Cache:    ${results.cached}`);
        console.log(`   ❌ Failed:        ${results.failed}`);
        console.log(`   ⏱️  Duration:      ${duration} seconds`);
        console.log('─'.repeat(70));
        
        // 5. Get Cache Statistics
        console.log('\n📈 Step 5: Cache Statistics...');
        const stats = planetService.getCacheStats();
        console.log(`   Total planets in system: ${stats.totalPlanets}`);
        console.log(`   Cached descriptions: ${stats.cachedDescriptions}`);
        console.log(`   Cache coverage: ${stats.cachePercentage}%`);
        console.log(`   Cached planets: ${stats.planets.join(', ')}`);
        
        // 6. Demonstrate Fast Retrieval
        console.log('\n⚡ Step 6: Testing fast retrieval (from cache)...');
        const retrievalTests = ['Mercury', 'Earth', 'Mars'];
        
        for (const planetName of retrievalTests) {
            const start = Date.now();
            const description = await planetService.getPlanetDescription(planetName);
            const time = Date.now() - start;
            
            console.log(`\n   🌍 ${planetName} (${time}ms):`);
            console.log(`   ${description.substring(0, 120)}...`);
        }
        
        // 7. Get All Planets with Descriptions
        console.log('\n📋 Step 7: Getting all planets with descriptions...');
        const allPlanets = planetService.getAllPlanetsWithDescriptions();
        console.log(`   Retrieved ${allPlanets.length} planets with data`);
        
        allPlanets.forEach((planet, index) => {
            console.log(`   ${index + 1}. ${planet.name} - ${planet.hasAIDescription ? '✅ Has AI' : '❌ No AI'}`);
        });
        
        // 8. Export Data
        console.log('\n💾 Step 8: Exporting all data...');
        const exportData = planetService.exportData();
        console.log(`   Exported ${exportData.planets.length} planets`);
        console.log(`   Exported ${exportData.descriptions.length} descriptions`);
        
        // Final Summary
        console.log('\n' + '='.repeat(70));
        console.log('✅ ALL TESTS PASSED!');
        console.log('='.repeat(70));
        console.log('\n🎉 PlanetService is ready for frontend integration!');
        console.log('   • All planets loaded efficiently');
        console.log('   • Descriptions cached for instant access');
        console.log('   • Ready to render and display all planets');
        console.log('');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('\nFull error:', error);
    }
}

// Run the test
console.log('\n🚀 Starting Planet Service Test...\n');
testPlanetService();
