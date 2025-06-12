// Script to populate individual ratings for projects
import { projectService } from './projects.js';

// Rating data from the screenshot
const ratingsData = [
  {
    "Total rating": 3.67,
    "Name": "SubPop Health",
    "Project/Revenue Potential": 3,
    "Strategic Fit": 4,
    "Insider Support": 4,
    "Stability & Clarity": 4,
    "Effort": 4,
    "Timing": 4
  },
  {
    "Total rating": 3.57,
    "Name": "WEX",
    "Project/Revenue Potential": 4,
    "Strategic Fit": 4,
    "Insider Support": 3,
    "Stability & Clarity": 3,
    "Effort": 4,
    "Timing": 3
  },
  {
    "Total rating": 3.56,
    "Name": "Black & Decker",
    "Project/Revenue Potential": 5,
    "Strategic Fit": 4,
    "Insider Support": 2,
    "Stability & Clarity": 2,
    "Effort": 3,
    "Timing": 3
  },
  {
    "Total rating": 3.46,
    "Name": "Steeltoe",
    "Project/Revenue Potential": 3,
    "Strategic Fit": 4,
    "Insider Support": 3,
    "Stability & Clarity": 4,
    "Effort": 3,
    "Timing": 4
  },
  {
    "Total rating": 3.30,
    "Name": "JLL Partners",
    "Project/Revenue Potential": 2,
    "Strategic Fit": 5,
    "Insider Support": 4,
    "Stability & Clarity": 3,
    "Effort": 3,
    "Timing": 4
  },
  {
    "Total rating": 3.29,
    "Name": "Kareem Saleh",
    "Project/Revenue Potential": 2,
    "Strategic Fit": 3,
    "Insider Support": 4,
    "Stability & Clarity": 3,
    "Effort": 4,
    "Timing": 5
  },
  {
    "Total rating": 3.29,
    "Name": "AWS for Built",
    "Project/Revenue Potential": 3,
    "Strategic Fit": 4,
    "Insider Support": 4,
    "Stability & Clarity": 3,
    "Effort": 3,
    "Timing": 3
  },
  {
    "Total rating": 3.29,
    "Name": "grace hanson contract",
    "Project/Revenue Potential": 2,
    "Strategic Fit": 5,
    "Insider Support": 4,
    "Stability & Clarity": 3,
    "Effort": 3,
    "Timing": 4
  },
  {
    "Total rating": 3.23,
    "Name": "E-card systems",
    "Project/Revenue Potential": 2,
    "Strategic Fit": 3,
    "Insider Support": 4,
    "Stability & Clarity": 5,
    "Effort": 3,
    "Timing": 4
  },
  {
    "Total rating": 3.20,
    "Name": "Healthstream",
    "Project/Revenue Potential": 3,
    "Strategic Fit": 4,
    "Insider Support": 3,
    "Stability & Clarity": 2,
    "Effort": 3,
    "Timing": 4
  },
  {
    "Total rating": 3.18,
    "Name": "LP3 solutions",
    "Project/Revenue Potential": 2,
    "Strategic Fit": 2,
    "Insider Support": 4,
    "Stability & Clarity": 4,
    "Effort": 4,
    "Timing": 5
  },
  {
    "Total rating": 2.97,
    "Name": "BackBone",
    "Project/Revenue Potential": 3,
    "Strategic Fit": 2,
    "Insider Support": 4,
    "Stability & Clarity": 3,
    "Effort": 3,
    "Timing": 3
  },
  {
    "Total rating": 2.84,
    "Name": "Next Street",
    "Project/Revenue Potential": 3,
    "Strategic Fit": 2,
    "Insider Support": 3,
    "Stability & Clarity": 3,
    "Effort": 3,
    "Timing": 3
  },
  {
    "Total rating": 2.56,
    "Name": "Brain Trust",
    "Project/Revenue Potential": 1,
    "Strategic Fit": 2,
    "Insider Support": 4,
    "Stability & Clarity": 3,
    "Effort": 4,
    "Timing": 4
  },
  {
    "Total rating": 2.51,
    "Name": "Matt Cybulsky(Tessellate)",
    "Project/Revenue Potential": 2,
    "Strategic Fit": 2,
    "Insider Support": 4,
    "Stability & Clarity": 2,
    "Effort": 3,
    "Timing": 3
  },
  {
    "Total rating": 2.48,
    "Name": "IVX",
    "Project/Revenue Potential": 1,
    "Strategic Fit": 5,
    "Insider Support": 4,
    "Stability & Clarity": 3,
    "Effort": 3,
    "Timing": 1
  },
  {
    "Total rating": 1.87,
    "Name": "Mastery Logistics",
    "Project/Revenue Potential": 2,
    "Strategic Fit": 3,
    "Insider Support": 1,
    "Stability & Clarity": 2,
    "Effort": 4,
    "Timing": 0
  },
  {
    "Total rating": 0.00,
    "Name": "Provider Trust",
    "Project/Revenue Potential": null,
    "Strategic Fit": null,
    "Insider Support": null,
    "Stability & Clarity": null,
    "Effort": null,
    "Timing": null
  },
  {
    "Total rating": 0.00,
    "Name": "George Uribe (guest booker)",
    "Project/Revenue Potential": null,
    "Strategic Fit": null,
    "Insider Support": null,
    "Stability & Clarity": null,
    "Effort": null,
    "Timing": null
  }
];

// Function to calculate similarity between two strings (for fuzzy matching)
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  // Check if one string contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Simple similarity based on common words
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  let commonWords = 0;
  for (const word1 of words1) {
    if (words2.some(word2 => word1.includes(word2) || word2.includes(word1))) {
      commonWords++;
    }
  }
  
  return commonWords / Math.max(words1.length, words2.length);
}

// Function to find best matching project
function findBestMatch(targetName, projects) {
  let bestMatch = null;
  let bestScore = 0;
  
  for (const project of projects) {
    const score = calculateSimilarity(targetName, project.name);
    if (score > bestScore && score > 0.3) { // Minimum similarity threshold
      bestScore = score;
      bestMatch = project;
    }
  }
  
  return { project: bestMatch, score: bestScore };
}

// Function to convert rating data to detailed ratings format
function convertToDetailedRatings(ratingData) {
  if (ratingData["Project/Revenue Potential"] === null) {
    return {}; // Return empty object if no ratings
  }
  
  // Map to the simplified field names that match Google Sheets exactly
  return {
    revenuePotential: ratingData["Project/Revenue Potential"] || 0,
    strategicFit: ratingData["Strategic Fit"] || 0,
    insiderSupport: ratingData["Insider Support"] || 0,
    stabilityClarity: ratingData["Stability & Clarity"] || 0,
    effort: ratingData["Effort"] || 0,
    timing: ratingData["Timing"] || 0
  };
}

// Main function to populate all ratings
async function populateAllRatings() {
  try {
    console.log('Starting to populate individual ratings...');
    
    // Get all existing projects
    const projects = await projectService.getProjects();
    console.log(`Found ${projects.length} projects in database`);
    
    const results = {
      updated: 0,
      skipped: 0,
      notFound: 0,
      errors: 0,
      details: []
    };
    
    for (const ratingData of ratingsData) {
      try {
        const targetName = ratingData.Name;
        console.log(`\nProcessing: ${targetName}`);
        
        // Find best matching project
        const match = findBestMatch(targetName, projects);
        
        if (!match.project) {
          console.log(`❌ No match found for "${targetName}"`);
          results.notFound++;
          results.details.push({
            targetName,
            status: 'not_found',
            message: 'No matching project found'
          });
          continue;
        }
        
        console.log(`✓ Found match: "${match.project.name}" (similarity: ${(match.score * 100).toFixed(1)}%)`);
        
        // Convert ratings data
        const detailedRatings = convertToDetailedRatings(ratingData);
        
        if (Object.keys(detailedRatings).length === 0) {
          console.log(`⚠️ Skipping "${targetName}" - no rating data`);
          results.skipped++;
          results.details.push({
            targetName,
            matchedName: match.project.name,
            status: 'skipped',
            message: 'No rating data provided'
          });
          continue;
        }
        
        // Update the project with detailed ratings and overall rating
        await projectService.updateProject(match.project.id, {
          detailedRatingsData: detailedRatings,
          rating: ratingData["Total rating"]
        });
        
        console.log(`✅ Updated "${match.project.name}" with detailed ratings`);
        results.updated++;
        results.details.push({
          targetName,
          matchedName: match.project.name,
          status: 'updated',
          message: `Updated with ${Object.keys(detailedRatings).length} rating criteria`
        });
        
      } catch (error) {
        console.error(`❌ Error processing "${ratingData.Name}":`, error);
        results.errors++;
        results.details.push({
          targetName: ratingData.Name,
          status: 'error',
          message: error.message
        });
      }
    }
    
    // Print summary
    console.log('\n=== SUMMARY ===');
    console.log(`✅ Updated: ${results.updated}`);
    console.log(`⚠️ Skipped: ${results.skipped}`);
    console.log(`❌ Not Found: ${results.notFound}`);
    console.log(`💥 Errors: ${results.errors}`);
    
    // Show details
    console.log('\n=== DETAILS ===');
    results.details.forEach(detail => {
      const emoji = {
        updated: '✅',
        skipped: '⚠️',
        not_found: '❌',
        error: '💥'
      }[detail.status];
      
      console.log(`${emoji} ${detail.targetName} ${detail.matchedName ? `-> ${detail.matchedName}` : ''}: ${detail.message}`);
    });
    
    return results;
    
  } catch (error) {
    console.error('Fatal error during rating population:', error);
    throw error;
  }
}

// Export the function
export { populateAllRatings };

// If running directly in browser console, make it available
if (typeof window !== 'undefined') {
  window.populateAllRatings = populateAllRatings;
} 