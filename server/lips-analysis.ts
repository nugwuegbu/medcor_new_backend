import { Buffer } from 'buffer';

// YouCam API configuration
const YOUCAM_API_KEY = process.env.YOUCAM_API_KEY;
const YOUCAM_SECRET_KEY = process.env.YOUCAM_SECRET_KEY;

interface LipsAnalysisResult {
  lips_health: {
    overall_score: number;
    lip_condition: string;
    lip_color: string;
    lip_texture: string;
    lip_volume: string;
    hydration_level: string;
    pigmentation: string;
  };
  lips_conditions: {
    dryness: {
      severity: string;
      areas: string[];
    };
    pigmentation: {
      type: string;
      intensity: string;
    };
    texture: {
      smoothness: string;
      fine_lines: string;
    };
    volume: {
      upper_lip: string;
      lower_lip: string;
    };
  };
  recommendations: {
    daily_care: string[];
    weekly_treatments: string[];
    lifestyle_tips: string[];
    product_recommendations: string[];
  };
  avoid_practices: {
    daily_mistakes: string[];
    harmful_ingredients: string[];
    lifestyle_factors: string[];
  };
  confidence: number;
}

// Generate personalized lips recommendations based on analysis
function generateLipsRecommendations(lipsData: any): LipsAnalysisResult {
  const lipCondition = lipsData.lip_condition || 'Normal';
  const hydrationLevel = lipsData.hydration_level || 'Moderate';
  const lipColor = lipsData.lip_color || 'Natural';
  const lipTexture = lipsData.lip_texture || 'Smooth';
  const lipVolume = lipsData.lip_volume || 'Medium';
  
  // Calculate overall score based on various factors
  const overallScore = Math.round(
    (lipsData.hydration_score || 75) * 0.3 +
    (lipsData.texture_score || 80) * 0.25 +
    (lipsData.color_score || 85) * 0.25 +
    (lipsData.volume_score || 70) * 0.2
  );

  // Generate personalized recommendations based on lip condition
  const recommendations = {
    daily_care: [] as string[],
    weekly_treatments: [] as string[],
    lifestyle_tips: [] as string[],
    product_recommendations: [] as string[]
  };

  const avoid_practices = {
    daily_mistakes: [] as string[],
    harmful_ingredients: [] as string[],
    lifestyle_factors: [] as string[]
  };

  // Daily care recommendations based on hydration level
  if (hydrationLevel === 'Dry' || hydrationLevel === 'Very Dry') {
    recommendations.daily_care.push(
      'Apply lip balm with hyaluronic acid every 2-3 hours',
      'Use a humidifier in your bedroom to maintain moisture',
      'Drink at least 8 glasses of water daily for internal hydration',
      'Apply a thick layer of lip balm before bed as an overnight treatment'
    );
  } else if (hydrationLevel === 'Normal' || hydrationLevel === 'Moderate') {
    recommendations.daily_care.push(
      'Apply lip balm with SPF 15+ during the day',
      'Use a nourishing lip balm morning and night',
      'Stay hydrated by drinking plenty of water throughout the day',
      'Apply lip balm before going outdoors'
    );
  }

  // Texture-specific recommendations
  if (lipTexture === 'Rough' || lipTexture === 'Textured') {
    recommendations.weekly_treatments.push(
      'Use a gentle lip scrub 2-3 times per week',
      'Apply a honey lip mask for 10 minutes twice a week',
      'Use a lip repair treatment with ceramides weekly'
    );
  } else {
    recommendations.weekly_treatments.push(
      'Use a gentle lip scrub once a week to maintain smoothness',
      'Apply a nourishing lip mask once a week',
      'Use a vitamin E lip treatment weekly'
    );
  }

  // Color and pigmentation recommendations
  if (lipColor === 'Dark' || lipColor === 'Pigmented') {
    recommendations.product_recommendations.push(
      'Use lip balm with natural ingredients to maintain color',
      'Consider lip oils with antioxidants for natural enhancement',
      'Use tinted lip balms for a natural, healthy look'
    );
  } else {
    recommendations.product_recommendations.push(
      'Use lip balm with natural tinting agents',
      'Consider lip serums with peptides for plumping',
      'Use lip balms with natural fruit extracts for subtle color'
    );
  }

  // Volume-based recommendations
  if (lipVolume === 'Thin' || lipVolume === 'Small') {
    recommendations.lifestyle_tips.push(
      'Massage lips gently with a soft brush to stimulate circulation',
      'Use lip exercises like pursing and stretching daily',
      'Apply cinnamon-based lip balm for natural plumping effect'
    );
  } else {
    recommendations.lifestyle_tips.push(
      'Maintain lip health with regular gentle massage',
      'Protect lips from sun exposure with SPF lip balm',
      'Avoid habits that may affect lip shape'
    );
  }

  // Common lifestyle tips
  recommendations.lifestyle_tips.push(
    'Eat foods rich in vitamins A, C, and E for lip health',
    'Avoid licking lips as it can cause dryness',
    'Sleep with a humidifier to maintain overnight hydration'
  );

  // Things to avoid based on lip condition
  if (hydrationLevel === 'Dry' || hydrationLevel === 'Very Dry') {
    avoid_practices.daily_mistakes.push(
      'Licking lips frequently throughout the day',
      'Using matte lipsticks without proper lip prep',
      'Peeling or biting dry skin on lips',
      'Applying lip products with alcohol or menthol'
    );
    
    avoid_practices.harmful_ingredients.push(
      'Alcohol-based lip products',
      'Menthol and camphor in lip balms',
      'Fragrances that may cause irritation',
      'Petroleum-based products that don\'t truly moisturize'
    );
  } else {
    avoid_practices.daily_mistakes.push(
      'Forgetting to apply SPF lip protection',
      'Using expired lip products',
      'Sharing lip products with others',
      'Applying lipstick on dry, unprepped lips'
    );
    
    avoid_practices.harmful_ingredients.push(
      'Heavy fragrances in lip products',
      'Harsh exfoliants used too frequently',
      'Expired or contaminated lip products',
      'Products with synthetic dyes that may cause reactions'
    );
  }

  // Lifestyle factors to avoid
  avoid_practices.lifestyle_factors.push(
    'Smoking, which reduces blood flow to lips',
    'Excessive sun exposure without protection',
    'Dehydration from not drinking enough water',
    'Stress, which can affect overall skin health including lips'
  );

  return {
    lips_health: {
      overall_score: overallScore,
      lip_condition: lipCondition,
      lip_color: lipColor,
      lip_texture: lipTexture,
      lip_volume: lipVolume,
      hydration_level: hydrationLevel,
      pigmentation: lipsData.pigmentation || 'Even'
    },
    lips_conditions: {
      dryness: {
        severity: lipsData.dryness_severity || 'Mild',
        areas: lipsData.dry_areas || ['Corners']
      },
      pigmentation: {
        type: lipsData.pigmentation_type || 'Natural',
        intensity: lipsData.pigmentation_intensity || 'Normal'
      },
      texture: {
        smoothness: lipsData.texture_smoothness || 'Smooth',
        fine_lines: lipsData.fine_lines || 'None'
      },
      volume: {
        upper_lip: lipsData.upper_lip_volume || 'Medium',
        lower_lip: lipsData.lower_lip_volume || 'Medium'
      }
    },
    recommendations,
    avoid_practices,
    confidence: lipsData.confidence || 0.85
  };
}

// Main lips analysis function
export async function analyzeLipsWithYCE(imageBase64: string): Promise<LipsAnalysisResult> {
  console.log('💋 LIPS API: Starting YouCam lips analysis...');
  
  if (!YOUCAM_API_KEY || !YOUCAM_SECRET_KEY) {
    console.log('💋 LIPS API: YouCam credentials not found, using demo analysis');
    return generateDemoLipsAnalysis();
  }

  try {
    console.log('💋 LIPS API: Perfect Corp YCE Lips Analysis API integration');
    console.log('💋 LIPS API: YCE API credentials found, processing lips analysis...');
    
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageBase64.split(',')[1], 'base64');
    
    // Step 1: Upload image to YouCam API
    const uploadResponse = await fetch('https://yce-api-01.perfectcorp.com/s2s/v1.0/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${YOUCAM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: [{
          content_type: 'image/jpeg',
          file_name: 'lips-analysis.jpg',
          file_size: imageBuffer.length
        }]
      })
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.status}`);
    }

    const uploadData = await uploadResponse.json();
    const fileId = uploadData.result.files[0].file_id;
    const uploadUrl = uploadData.result.files[0].requests[0].url;

    // Step 2: Upload the actual image
    await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': imageBuffer.length.toString()
      },
      body: imageBuffer
    });

    // Step 3: Start face analysis task (includes lips analysis)
    const taskResponse = await fetch('https://yce-api-01.perfectcorp.com/s2s/v1.0/task/face-analysis', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${YOUCAM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        request_id: Date.now(),
        payload: {
          file_sets: {
            src_ids: [fileId]
          },
          actions: [{
            id: 0,
            params: {},
            dst_actions: ["lips_analysis", "face_shape", "lip_shape"]
          }]
        }
      })
    });

    if (!taskResponse.ok) {
      throw new Error(`Task creation failed: ${taskResponse.status}`);
    }

    const taskData = await taskResponse.json();
    const taskId = taskData.result.task_id;

    // Step 4: Poll for results
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      const statusResponse = await fetch(`https://yce-api-01.perfectcorp.com/s2s/v1.0/task/face-analysis?task_id=${encodeURIComponent(taskId)}`, {
        headers: {
          'Authorization': `Bearer ${YOUCAM_API_KEY}`
        }
      });

      if (!statusResponse.ok) {
        throw new Error(`Status check failed: ${statusResponse.status}`);
      }

      const statusData = await statusResponse.json();
      
      if (statusData.result.status === 'succeed') {
        console.log('💋 LIPS API: Lips analysis completed with YCE HD features');
        
        // Process the results and generate recommendations
        const results = statusData.result.results[0];
        const lipsAnalysisData = {
          lip_condition: results.lip_condition || 'Normal',
          hydration_level: results.hydration_level || 'Moderate',
          lip_color: results.lip_color || 'Natural',
          lip_texture: results.lip_texture || 'Smooth',
          lip_volume: results.lip_volume || 'Medium',
          confidence: results.confidence || 0.85
        };

        return generateLipsRecommendations(lipsAnalysisData);
      }
      
      if (statusData.result.status === 'failed') {
        throw new Error(`Analysis failed: ${statusData.result.error_message}`);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, statusData.result.polling_interval || 1000));
      attempts++;
    }

    throw new Error('Analysis timeout');

  } catch (error) {
    console.error('💋 LIPS API: YouCam API error:', error);
    console.log('💋 LIPS API: Falling back to demo analysis');
    return generateDemoLipsAnalysis();
  }
}

// Demo lips analysis for when API is not available
function generateDemoLipsAnalysis(): LipsAnalysisResult {
  const demoData = {
    lip_condition: 'Good',
    hydration_level: 'Moderate',
    lip_color: 'Natural',
    lip_texture: 'Smooth',
    lip_volume: 'Medium',
    confidence: 0.82,
    hydration_score: 75,
    texture_score: 80,
    color_score: 85,
    volume_score: 70
  };

  return generateLipsRecommendations(demoData);
}