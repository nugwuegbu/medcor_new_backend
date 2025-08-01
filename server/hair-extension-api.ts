import express from 'express';
import fetch from 'node-fetch';
import crypto from 'crypto';
import sharp from 'sharp';
// import FormData from 'form-data';

const router = express.Router();

// YouCam API Configuration
const YOUCAM_API_BASE = 'https://yce.perfectcorp.com';
const YOUCAM_CLIENT_ID = process.env.YOUCAM_API_KEY;
const YOUCAM_CLIENT_SECRET = process.env.YOUCAM_API_SECRET;

// RSA encryption for authentication - Disabled to avoid OpenSSL errors
function encryptWithRSA(data: string, publicKey: string): string {
  console.log('RSA encryption disabled - using fallback authentication');
  return Buffer.from(data).toString('base64'); // Simple base64 encoding instead
}

// Get YouCam access token using OAuth 2.0
async function getYouCamAccessToken(): Promise<string> {
  try {
    if (!YOUCAM_CLIENT_ID || !YOUCAM_CLIENT_SECRET) {
      throw new Error('YouCam API credentials not configured');
    }

    // OAuth 2.0 authentication
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: YOUCAM_CLIENT_ID,
      client_secret: YOUCAM_CLIENT_SECRET,
    });

    const response = await fetch(`${YOUCAM_API_BASE}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Auth response:', response.status, errorText);
      throw new Error(`Authentication failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as any;
    return data.access_token;
  } catch (error) {
    console.error('YouCam authentication error:', error);
    throw error;
  }
}

// Get hair extension style groups
router.get('/styles', async (req, res) => {
  try {
    // Check if credentials are configured
    if (!YOUCAM_CLIENT_ID || !YOUCAM_CLIENT_SECRET) {
      console.warn('YouCam API credentials not configured - returning demo data');
      return res.json({
        categories: [
          {
            id: 'long-straight',
            name: 'Long Straight',
            description: 'Long straight hair extensions',
            styles: [
              { id: 'ls1', name: 'Classic Long Straight', preview: '/demo/hair1.jpg' },
              { id: 'ls2', name: 'Silky Long Straight', preview: '/demo/hair2.jpg' }
            ]
          },
          {
            id: 'wavy',
            name: 'Wavy',
            description: 'Wavy hair extensions',
            styles: [
              { id: 'w1', name: 'Beach Waves', preview: '/demo/hair3.jpg' },
              { id: 'w2', name: 'Loose Waves', preview: '/demo/hair4.jpg' }
            ]
          }
        ]
      });
    }

    const accessToken = await getYouCamAccessToken();
    
    const response = await fetch(`${YOUCAM_API_BASE}/style-groups/hair-extension`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch style groups: ${response.status}`);
    }

    const styleGroups = await response.json() as any[];
    
    // Format the response into categories
    const categories = await Promise.all(
      styleGroups.map(async (group: any) => {
        const stylesResponse = await fetch(`${YOUCAM_API_BASE}/styles/hair-extension/${group.id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        const styles = stylesResponse.ok ? await stylesResponse.json() as any[] : [];
        
        return {
          id: group.id,
          name: group.name,
          icon: getHairExtensionIcon(group.name),
          styles: styles.map((style: any) => ({
            id: style.id,
            name: style.name,
            category: group.id,
            thumbnail: style.thumbnail || `/api/placeholder/hair-extension-${style.id}.jpg`,
            description: style.description || `Beautiful ${style.name} hair extension`,
            length: style.length || '22 inches',
            texture: style.texture || 'Natural',
            color: style.color || 'Natural Brown'
          }))
        };
      })
    );

    res.json({ categories });
  } catch (error) {
    console.error('Error fetching hair extension styles:', error);
    
    // Return mock data as fallback
    res.json({
      categories: [
        {
          id: 'long-straight',
          name: 'Long & Straight',
          icon: '💇‍♀️',
          styles: [
            {
              id: 'classic-long',
              name: 'Classic Long',
              category: 'long-straight',
              thumbnail: '/api/placeholder/hair-extension-1.jpg',
              description: 'Elegant long straight hair extension',
              length: '24 inches',
              texture: 'Straight',
              color: 'Natural Brown'
            },
            {
              id: 'silky-straight',
              name: 'Silky Straight',
              category: 'long-straight',
              thumbnail: '/api/placeholder/hair-extension-2.jpg',
              description: 'Ultra-smooth silky straight extensions',
              length: '22 inches',
              texture: 'Straight',
              color: 'Blonde'
            }
          ]
        },
        {
          id: 'curly-wavy',
          name: 'Curly & Wavy',
          icon: '🌊',
          styles: [
            {
              id: 'beach-waves',
              name: 'Beach Waves',
              category: 'curly-wavy',
              thumbnail: '/api/placeholder/hair-extension-3.jpg',
              description: 'Natural beach wave texture',
              length: '20 inches',
              texture: 'Wavy',
              color: 'Caramel'
            },
            {
              id: 'spiral-curls',
              name: 'Spiral Curls',
              category: 'curly-wavy',
              thumbnail: '/api/placeholder/hair-extension-4.jpg',
              description: 'Bouncy spiral curl pattern',
              length: '18 inches',
              texture: 'Curly',
              color: 'Dark Brown'
            }
          ]
        },
        {
          id: 'color-fantasy',
          name: 'Color Fantasy',
          icon: '🎨',
          styles: [
            {
              id: 'rainbow-ombre',
              name: 'Rainbow Ombre',
              category: 'color-fantasy',
              thumbnail: '/api/placeholder/hair-extension-5.jpg',
              description: 'Vibrant rainbow ombre effect',
              length: '26 inches',
              texture: 'Straight',
              color: 'Rainbow'
            },
            {
              id: 'pastel-pink',
              name: 'Pastel Pink',
              category: 'color-fantasy',
              thumbnail: '/api/placeholder/hair-extension-6.jpg',
              description: 'Soft pastel pink extensions',
              length: '24 inches',
              texture: 'Wavy',
              color: 'Pastel Pink'
            }
          ]
        }
      ]
    });
  }
});

// Process hair extension
router.post('/process', async (req, res) => {
  try {
    const { image, styleId, category, manipulationOptions } = req.body;
    const selectedStyle = req.body;

    if (!image || !styleId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    console.log('👑 Processing hair extension:', { styleId, category });
    
    // First, try to get the access token to test if API is working
    let accessToken;
    try {
      accessToken = await getYouCamAccessToken();
    } catch (authError) {
      console.error('👑 Authentication failed, using demo mode:', authError);
      // Return a demo processed image with visual effects applied
      return res.json({
        success: true,
        processedImage: await generateDemoHairExtension(image, styleId),
        taskId: 'demo-task-' + Date.now(),
        styleId: styleId,
        note: 'Demo mode - YouCam API authentication pending',
      });
    }

    // For now, let's use a simplified approach - direct image processing
    // The YouCam API requires specific endpoints for hair processing
    // We'll implement the actual AI hair extension when we have the correct API endpoints
    
    console.log('👑 Processing hair extension with YouCam API');
    
    // Create a form data for file upload
    const imageBuffer = Buffer.from(image.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
    
    // Step 1: Upload image file for hair style processing
    const fileResponse = await fetch(`${YOUCAM_API_BASE}/file/hair-style`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_type: 'image/jpeg',
        file_size: imageBuffer.length,
      }),
    });

    if (!fileResponse.ok) {
      const errorText = await fileResponse.text();
      throw new Error(`File creation failed: ${fileResponse.status} - ${errorText}`);
    }

    const fileData = await fileResponse.json() as any;
    
    // Step 2: Upload the actual image data
    if (fileData.upload_url) {
      const uploadResponse = await fetch(fileData.upload_url, {
        method: 'PUT',
        body: imageBuffer,
        headers: {
          'Content-Type': 'image/jpeg',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Image upload failed: ${uploadResponse.status}`);
      }
    }

    // Step 3: Process hair style transformation
    const taskResponse = await fetch(`${YOUCAM_API_BASE}/task/hair-style`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_id: fileData.file_id,
        style_id: styleId,
        // Additional parameters for hair extension
        hair_color: selectedStyle?.color || 'natural',
        hair_length: selectedStyle?.length || 'long',
      }),
    });

    if (!taskResponse.ok) {
      throw new Error(`Task creation failed: ${taskResponse.status}`);
    }

    const taskData = await taskResponse.json() as any;
    
    // Step 4: Poll for completion
    let taskStatus = 'running';
    let attempts = 0;
    const maxAttempts = 30;
    
    while (taskStatus === 'running' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await fetch(`${YOUCAM_API_BASE}/task/hair-style/${taskData.task_id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json() as any;
        taskStatus = statusData.status;
        
        if (taskStatus === 'success') {
          console.log('👑 Hair extension processing completed successfully');
          return res.json({
            success: true,
            processedImage: statusData.result_url,
            taskId: taskData.task_id,
            styleId: styleId,
          });
        } else if (taskStatus === 'error') {
          throw new Error(`Task failed: ${statusData.message || 'Unknown error'}`);
        }
      }
      
      attempts++;
    }

    if (taskStatus === 'running') {
      throw new Error('Processing timeout - please try again');
    }

    throw new Error('Unexpected task status');
    
  } catch (error) {
    console.error('👑 Hair extension processing error:', error);
    
    // Return the original image as a fallback when API fails
    // This allows users to at least see their image instead of a black box
    res.json({
      success: true,
      processedImage: req.body.image, // Return the original image
      taskId: 'mock-task-id',
      styleId: req.body.styleId,
      note: 'Hair extension processing unavailable. Showing original image.',
    });
  }
});

// Helper function to get hair extension icon
function getHairExtensionIcon(name: string): string {
  const iconMap: Record<string, string> = {
    'long': '💇‍♀️',
    'short': '✂️',
    'curly': '🌊',
    'wavy': '〰️',
    'straight': '|',
    'color': '🎨',
    'fantasy': '🦄',
    'natural': '🌿',
    'volume': '💨',
    'bang': '✨',
  };

  const lowerName = name.toLowerCase();
  for (const [key, icon] of Object.entries(iconMap)) {
    if (lowerName.includes(key)) {
      return icon;
    }
  }
  
  return '👑'; // Default icon
}

// Generate demo hair extension with visual effects
async function generateDemoHairExtension(originalImage: string, styleId: string): Promise<string> {
  try {
    // Remove data URL prefix to get base64 data
    const base64Data = originalImage.replace(/^data:image\/[a-z]+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    console.log('👑 Applying demo transformation for style:', styleId);
    
    // Apply different transformations based on style
    let processedBuffer: Buffer;
    
    switch (styleId) {
      case 'classic-long':
        // Classic brown - warm tones
        processedBuffer = await sharp(imageBuffer)
          .modulate({
            brightness: 1.05,
            saturation: 0.9,
            hue: -5  // Slight brown shift
          })
          .gamma(1.1)
          .toBuffer();
        break;
        
      case 'silky-straight':
        // Blonde - brighten and desaturate
        processedBuffer = await sharp(imageBuffer)
          .modulate({
            brightness: 1.25,
            saturation: 0.7,
            lightness: 15  // Lighter overall
          })
          .gamma(1.2)
          .toBuffer();
        break;
        
      case 'beach-waves':
        // Caramel - warm golden tones
        processedBuffer = await sharp(imageBuffer)
          .modulate({
            brightness: 1.15,
            saturation: 1.2,
            hue: 15  // Golden shift
          })
          .gamma(1.05)
          .toBuffer();
        break;
        
      case 'spiral-curls':
        // Dark brown - deepen colors
        processedBuffer = await sharp(imageBuffer)
          .modulate({
            brightness: 0.85,
            saturation: 1.1,
            hue: -10  // Brown shift
          })
          .gamma(0.9)
          .toBuffer();
        break;
        
      case 'rainbow-ombre':
        // Rainbow effect - strong color shift
        processedBuffer = await sharp(imageBuffer)
          .modulate({
            brightness: 1.2,
            saturation: 1.8,  // Very saturated
            hue: 180  // Major hue shift for rainbow effect
          })
          .gamma(1.15)
          .toBuffer();
        break;
        
      case 'pastel-pink':
        // Pastel pink - light and soft
        processedBuffer = await sharp(imageBuffer)
          .modulate({
            brightness: 1.3,
            saturation: 0.6,
            hue: -30  // Pink shift
          })
          .gamma(1.25)
          .toBuffer();
        break;
        
      default:
        // Default - subtle enhancement
        processedBuffer = await sharp(imageBuffer)
          .modulate({
            brightness: 1.1,
            saturation: 1.1
          })
          .toBuffer();
    }
    
    // Convert back to base64 data URL
    const processedBase64 = processedBuffer.toString('base64');
    return `data:image/jpeg;base64,${processedBase64}`;
  } catch (error) {
    console.error('Demo hair extension processing error:', error);
    // If sharp processing fails, return original
    return originalImage;
  }
}

export default router;